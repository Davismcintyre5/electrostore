const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const logger = require('../config/logger');
const { getIO } = require('../config/socket');

// @desc    M-Pesa confirmation webhook
// @route   POST /api/webhooks/mpesa/confirmation
// @access  Public
exports.mpesaConfirmation = async (req, res) => {
  try {
    const data = req.body;
    logger.info('M-Pesa confirmation received:', data);

    // Process the confirmation
    // This is called after successful payment

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    logger.error('M-Pesa confirmation error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal Server Error'
    });
  }
};

// @desc    M-Pesa validation webhook
// @route   POST /api/webhooks/mpesa/validation
// @access  Public
exports.mpesaValidation = async (req, res) => {
  try {
    const data = req.body;
    logger.info('M-Pesa validation received:', data);

    // Validate the transaction
    // Return 0 to accept, 1 to reject

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    logger.error('M-Pesa validation error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal Server Error'
    });
  }
};

// @desc    M-Pesa timeout webhook
// @route   POST /api/webhooks/mpesa/timeout
// @access  Public
exports.mpesaTimeout = async (req, res) => {
  try {
    const data = req.body;
    logger.info('M-Pesa timeout received:', data);

    const { CheckoutRequestID } = data;

    // Find and update transaction
    const transaction = await Transaction.findOne({
      'mpesaDetails.checkoutRequestId': CheckoutRequestID
    });

    if (transaction) {
      transaction.status = 'failed';
      await transaction.save();

      // Update order
      const order = await Order.findById(transaction.order);
      if (order) {
        order.paymentStatus = 'failed';
        await order.save();

        // Emit socket event
        getIO().to(`order_${order._id}`).emit('payment-timeout', {
          orderId: order._id
        });
      }
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    logger.error('M-Pesa timeout error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal Server Error'
    });
  }
};

// @desc    M-Pesa result webhook
// @route   POST /api/webhooks/mpesa/result
// @access  Public
exports.mpesaResult = async (req, res) => {
  try {
    const data = req.body;
    logger.info('M-Pesa result received:', data);

    const { ResultCode, ResultDesc, CheckoutRequestID } = data;

    const transaction = await Transaction.findOne({
      'mpesaDetails.checkoutRequestId': CheckoutRequestID
    });

    if (transaction) {
      if (ResultCode === 0) {
        // Success
        transaction.status = 'completed';
        
        // Extract metadata if available
        if (data.CallbackMetadata) {
          const metadata = {};
          data.CallbackMetadata.Item.forEach(item => {
            metadata[item.Name] = item.Value;
          });
          
          transaction.mpesaDetails = {
            ...transaction.mpesaDetails,
            receiptNumber: metadata.MpesaReceiptNumber,
            transactionDate: metadata.TransactionDate,
            amount: metadata.Amount
          };
        }

        await transaction.save();

        // Update order
        const order = await Order.findById(transaction.order);
        if (order) {
          order.paymentStatus = 'completed';
          order.status = 'submitted';
          await order.save();

          // Emit socket event
          getIO().to(`order_${order._id}`).emit('payment-completed', {
            orderId: order._id,
            transactionId: transaction._id
          });
        }
      } else {
        // Failure
        transaction.status = 'failed';
        transaction.metadata = { ...transaction.metadata, failureReason: ResultDesc };
        await transaction.save();

        const order = await Order.findById(transaction.order);
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
        }
      }
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Success'
    });
  } catch (error) {
    logger.error('M-Pesa result error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal Server Error'
    });
  }
};

// @desc    Stripe webhook
// @route   POST /api/webhooks/stripe
// @access  Public
exports.stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = req.body;

    logger.info('Stripe webhook received:', event.type);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Handle successful payment
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// @desc    PayPal webhook
// @route   POST /api/webhooks/paypal
// @access  Public
exports.paypalWebhook = async (req, res) => {
  try {
    const event = req.body;
    logger.info('PayPal webhook received:', event.event_type);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Handle completed payment
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        // Handle denied payment
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        // Handle refund
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('PayPal webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook error',
      error: error.message
    });
  }
};

// @desc    SMS status callback
// @route   POST /api/webhooks/sms/status
// @access  Public
exports.smsStatusCallback = async (req, res) => {
  try {
    const { messageId, status, to } = req.body;
    logger.info(`SMS status update: ${messageId} - ${status}`);

    // Update SMS delivery status in database if tracking

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('SMS status callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook error',
      error: error.message
    });
  }
};

// @desc    Email status callback
// @route   POST /api/webhooks/email/status
// @access  Public
exports.emailStatusCallback = async (req, res) => {
  try {
    const { messageId, event, email } = req.body;
    logger.info(`Email status update: ${messageId} - ${event}`);

    // Update email delivery status in database if tracking

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Email status callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook error',
      error: error.message
    });
  }
};