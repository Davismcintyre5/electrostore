const axios = require('axios');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mpesaConfig = require('../config/mpesa');
const logger = require('../config/logger');
const { getIO } = require('../config/socket');
const { sendEmail } = require('../config/email');

// @desc    Initiate M-Pesa STK Push
// @route   POST /api/payments/mpesa/stk-push
// @access  Private
exports.initiateSTKPush = async (req, res) => {
  try {
    const { phone, amount, orderId } = req.body;

    // Validate input
    if (!phone || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Phone, amount and orderId are required'
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order already has payment completed
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order already paid'
      });
    }

    // Format phone number (remove 0 or +254)
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('254')) {
      formattedPhone = formattedPhone;
    } else {
      formattedPhone = '254' + formattedPhone;
    }

    // Get access token
    const token = await mpesaConfig.getAccessToken();

    // Generate timestamp and password
    const timestamp = mpesaConfig.getTimestamp();
    const password = mpesaConfig.generatePassword(timestamp);

    // Prepare STK push request
    const stkPushData = {
      BusinessShortCode: mpesaConfig.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: mpesaConfig.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://yourdomain.com/api/payments/mpesa/callback',
      AccountReference: order.orderNumber.substring(0, 12),
      TransactionDesc: `Payment for order ${order.orderNumber}`
    };

    logger.info('STK Push Request:', stkPushData);

    // Make STK push request
    const response = await axios.post(
      `${mpesaConfig.baseURL}/mpesa/stkpush/v1/processrequest`,
      stkPushData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    logger.info('STK Push Response:', response.data);

    if (response.data.ResponseCode === '0') {
      // Update order with M-Pesa details - NO TRANSACTION CREATED
      order.mpesaDetails = {
        phoneNumber: formattedPhone,
        amount: order.total,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID
      };
      order.paymentStatus = 'pending';
      await order.save();

      res.status(200).json({
        success: true,
        message: 'STK push sent successfully',
        data: {
          checkoutRequestId: response.data.CheckoutRequestID,
          merchantRequestId: response.data.MerchantRequestID
        }
      });
    } else {
      throw new Error(response.data.ResponseDescription || 'STK push failed');
    }
  } catch (error) {
    logger.error('STK Push error:', error);
    
    let errorMessage = 'Payment initiation failed';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Payment request timeout. Please try again.';
    } else if (error.response) {
      errorMessage = error.response.data.errorMessage || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};

// @desc    M-Pesa Callback - Just update order status, NO transaction
// @route   POST /api/payments/mpesa/callback
// @access  Public
exports.mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    logger.info('M-Pesa Callback received:', JSON.stringify(callbackData));

    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success'
      });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
    
    // Find order by checkoutRequestId
    const order = await Order.findOne({ 'mpesaDetails.checkoutRequestId': CheckoutRequestID });

    if (!order) {
      logger.error('Order not found for CheckoutRequestID:', CheckoutRequestID);
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: 'Success'
      });
    }

    if (ResultCode === 0) {
      // Payment successful
      logger.info('✅ Payment successful for order:', order.orderNumber);
      
      // Extract metadata
      const metadata = {};
      if (CallbackMetadata && CallbackMetadata.Item) {
        CallbackMetadata.Item.forEach(item => {
          metadata[item.Name] = item.Value;
        });
      }

      // Update order - but DON'T create transaction yet
      // Admin will confirm payment later
      order.mpesaDetails = {
        ...order.mpesaDetails,
        receiptNumber: metadata.MpesaReceiptNumber,
        transactionDate: metadata.TransactionDate
      };
      // Status remains 'pending' - admin will confirm
      await order.save();

      // Notify admin that payment is received and ready for confirmation
      await Notification.create({
        type: 'payment_received',
        title: 'Payment Received - Ready for Confirmation',
        message: `Payment for order #${order.orderNumber} received. Click Confirm to complete.`,
        isGlobal: true,
        data: { orderId: order._id }
      });

      // Emit socket event for real-time notification
      try {
        const io = getIO();
        io.emit('payment-ready', { 
          orderId: order._id, 
          orderNumber: order.orderNumber 
        });
      } catch (socketError) {
        logger.error('Socket emission error:', socketError);
      }

    } else {
      // Payment failed
      logger.error('❌ M-Pesa payment failed:', ResultDesc);
      
      order.paymentStatus = 'failed';
      order.mpesaDetails = {
        ...order.mpesaDetails,
        failureReason: ResultDesc
      };
      await order.save();
    }

    // Always respond with success to Safaricom
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    logger.error('M-Pesa callback error:', error);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  }
};

// @desc    Query payment status
// @route   POST /api/payments/mpesa/query/:checkoutRequestId
// @access  Private
exports.queryPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: 'CheckoutRequestId is required'
      });
    }

    // Get access token
    const token = await mpesaConfig.getAccessToken();

    // Generate timestamp and password
    const timestamp = mpesaConfig.getTimestamp();
    const password = mpesaConfig.generatePassword(timestamp);

    // Prepare query request
    const queryData = {
      BusinessShortCode: mpesaConfig.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    // Make query request
    const response = await axios.post(
      `${mpesaConfig.baseURL}/mpesa/stkpushquery/v1/query`,
      queryData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    logger.error('Payment query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query payment status'
    });
  }
};

// @desc    Verify payment
// @route   GET /api/payments/verify/:transactionId
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId)
      .populate('order');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/refund/:transactionId
// @access  Private/Admin
exports.processRefund = async (req, res) => {
  try {
    const { amount } = req.body;
    const originalTransaction = await Transaction.findById(req.params.transactionId)
      .populate('order');

    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate unique transaction number for refund
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const transactionNumber = `REF${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      transactionNumber,
      type: 'refund',
      amount: amount || originalTransaction.amount,
      paymentMethod: originalTransaction.paymentMethod,
      order: originalTransaction.order._id,
      user: req.user.id,
      description: `Refund for transaction ${originalTransaction.transactionNumber}`,
      status: 'completed'
    });

    // Update order
    const order = originalTransaction.order;
    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.refundDetails = {
      amount: amount || originalTransaction.amount,
      transactionId: refundTransaction._id,
      processedAt: Date.now(),
      status: 'completed'
    };
    
    order.statusHistory.push({
      status: 'refunded',
      changedBy: req.user.id,
      note: `Refund of KES ${amount || originalTransaction.amount} processed`
    });
    
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      transaction: refundTransaction
    });
  } catch (error) {
    logger.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Refund failed'
    });
  }
};