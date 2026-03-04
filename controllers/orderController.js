const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const { sendEmail } = require('../config/email');
const logger = require('../config/logger');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, phone, notes } = req.body;

    // Validate input
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'No items in order'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate totals and validate stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Calculate shipping (free over 50,000)
    const shippingFee = subtotal > 50000 ? 0 : 500;

    // Generate unique order number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const orderNumber = `ORD${year}${month}${day}${hours}${minutes}${seconds}${random}`;

    // Create order object
    const orderData = {
      orderNumber,
      user: req.user.id,
      customer: {
        name: user.name,
        email: user.email,
        phone: phone || user.phone
      },
      items: orderItems,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      paymentMethod,
      shippingAddress,
      notes,
      status: paymentMethod === 'M-PESA' ? 'pending_payment' : 'submitted',
      paymentStatus: 'pending',
      statusHistory: [{
        status: paymentMethod === 'M-PESA' ? 'pending_payment' : 'submitted',
        changedBy: req.user.id,
        note: 'Order created'
      }]
    };

    // Create order
    const order = new Order(orderData);
    await order.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, soldCount: item.quantity }
      });
    }

    // Add order to user
    await User.findByIdAndUpdate(req.user.id, {
      $push: { orders: order._id }
    });

    // Update customer record
    await Customer.findOneAndUpdate(
      { user: req.user.id },
      {
        $inc: { totalOrders: 1, totalSpent: order.total },
        $push: { orders: order._id },
        $set: { lastOrderDate: new Date() }
      },
      { upsert: true }
    );

    // Create notification for admin
    await Notification.create({
      type: 'order_created',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} for KES ${order.total}`,
      isGlobal: true,
      data: { orderId: order._id, orderNumber: order.orderNumber }
    });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('new-order', { orderId: order._id, orderNumber: order.orderNumber });
      }
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    // Send email confirmation
    sendEmail({
      email: user.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      message: `
        <h1>Thank you for your order!</h1>
        <p>Dear ${user.name},</p>
        <p>Your order has been received and is being processed.</p>
        <p><strong>Order #:</strong> ${order.orderNumber}</p>
        <p><strong>Total:</strong> KES ${order.total.toLocaleString()}</p>
        <p><strong>Status:</strong> ${order.status.replace('_', ' ')}</p>
        <p>We'll notify you when your order ships.</p>
        <br>
        <p>Thank you for shopping with ElectroStore!</p>
      `
    }).catch(err => logger.error('Order confirmation email error:', err));

    res.status(201).json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        items: order.items,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    logger.error('Create order error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    let query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.search) {
      query.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
        { 'customer.name': { $regex: req.query.search, $options: 'i' } },
        { 'customer.phone': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      orders
    });
  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    logger.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('items.product', 'name price images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user._id.toString() !== req.user.id && 
        !['admin', 'manager', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      note: note || `Status updated to ${status}`
    });

    order.status = status;

    if (status === 'delivered' || status === 'arrived') {
      order.deliveredAt = Date.now();
    } else if (status === 'cancelled') {
      order.cancelledAt = Date.now();
      order.cancelledBy = req.user.id;
    }

    await order.save();

    // Create notification
    await Notification.create({
      type: 'order_status_changed',
      title: 'Order Status Updated',
      message: `Order #${order.orderNumber} is now ${status.replace('_', ' ')}`,
      recipient: order.user,
      data: { orderId: order._id, status }
    });

    // Emit socket event
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`order_${order._id}`).emit('order-status-changed', {
          orderId: order._id,
          status
        });
      }
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    // Send email
    sendEmail({
      email: order.customer.email,
      subject: `Order #${order.orderNumber} Status Update`,
      message: `
        <h1>Order Status Update</h1>
        <p>Dear ${order.customer.name},</p>
        <p>Your order #${order.orderNumber} status has been updated.</p>
        <p><strong>New Status:</strong> ${status.replace('_', ' ')}</p>
        ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
        <br>
        <p>Thank you for shopping with ElectroStore!</p>
      `
    }).catch(err => logger.error('Status update email error:', err));

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Confirm order payment (admin) - WITH CONFIRMED STATUS
// @route   POST /api/orders/:id/confirm-payment
// @access  Private/Admin
exports.confirmOrderPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if payment already completed
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this order'
      });
    }

    // CRITICAL: Check if transaction already exists for this order
    const existingTransaction = await Transaction.findOne({ order: order._id });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'A transaction already exists for this order',
        transaction: {
          _id: existingTransaction._id,
          transactionNumber: existingTransaction.transactionNumber,
          amount: existingTransaction.amount
        }
      });
    }

    // Generate unique transaction number
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const transactionNumber = `TRX${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;

    // ✅ Create transaction (admin confirmation)
    const transaction = await Transaction.create({
      transactionNumber,
      type: 'sale',
      amount: order.total,
      paymentMethod: order.paymentMethod,
      order: order._id,
      user: req.user.id, // Admin who confirmed
      description: `Payment for order #${order.orderNumber}`,
      status: 'completed'
    });

    // ✅ Update order with CONFIRMED status
    order.paymentStatus = 'completed';
    order.status = 'confirmed'; // This must match the enum in Order model
    
    order.statusHistory.push({
      status: 'confirmed', // This must match the enum in Order model
      changedBy: req.user.id,
      note: 'Payment confirmed by admin'
    });
    
    await order.save();

    // Update account balance
    let account = await Account.findOne();
    if (!account) {
      account = await Account.create({ 
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalWithdrawals: 0,
        transactions: []
      });
    }
    
    account.balance += order.total;
    account.totalIncome += order.total;
    account.transactions.push(transaction._id);
    await account.save();

    // Create notification for customer
    await Notification.create({
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      message: `Your payment for order #${order.orderNumber} has been confirmed`,
      recipient: order.user,
      data: { orderId: order._id, transactionId: transaction._id }
    });

    // Send email notification
    sendEmail({
      email: order.customer.email,
      subject: `Payment Confirmed for Order #${order.orderNumber}`,
      message: `
        <h1>Payment Confirmed!</h1>
        <p>Dear ${order.customer.name},</p>
        <p>Your payment of KES ${order.total.toLocaleString()} for order #${order.orderNumber} has been confirmed.</p>
        <p>Transaction Reference: ${transaction.transactionNumber}</p>
        <p>Your order is now being processed.</p>
        <br>
        <p>Thank you for shopping with ElectroStore!</p>
      `
    }).catch(err => logger.error('Payment confirmation email error:', err));

    // Emit socket event
    try {
      const io = req.app.get('io');
      io.emit('payment-confirmed', { 
        orderId: order._id, 
        orderNumber: order.orderNumber,
        transactionId: transaction._id
      });
    } catch (socketError) {
      logger.error('Socket emission error:', socketError);
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      transaction: {
        _id: transaction._id,
        transactionNumber: transaction.transactionNumber,
        amount: transaction.amount
      }
    });
  } catch (error) {
    logger.error('Confirm payment error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A transaction already exists for this order'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment'
    });
  }
};

// @desc    Cancel order (customer within 24 hours)
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    if (!order.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after 24 hours. Please contact support.'
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancelledBy = req.user.id;
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    
    order.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user.id,
      note: req.body.reason || 'Cancelled by customer'
    });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, soldCount: -item.quantity }
      });
    }

    await order.save();

    // Create notification
    await Notification.create({
      type: 'order_cancelled',
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} was cancelled by customer`,
      isGlobal: true,
      data: { orderId: order._id }
    });

    // Send email
    sendEmail({
      email: order.customer.email,
      subject: `Order #${order.orderNumber} Cancelled`,
      message: `
        <h1>Order Cancelled</h1>
        <p>Dear ${order.customer.name},</p>
        <p>Your order #${order.orderNumber} has been cancelled successfully.</p>
        <br>
        <p>Thank you for shopping with ElectroStore!</p>
      `
    }).catch(err => logger.error('Cancellation email error:', err));

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order. Please try again.'
    });
  }
};

// @desc    Delete order (admin only)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status !== 'cancelled' && order.status !== 'refunded') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    }

    await order.deleteOne();

    await Notification.create({
      type: 'order_deleted',
      title: 'Order Deleted',
      message: `Order #${order.orderNumber} was deleted by admin`,
      isGlobal: true,
      data: { orderId: order._id }
    });

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    logger.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Process refund (admin)
// @route   POST /api/orders/:id/refund
// @access  Private/Admin
exports.processRefund = async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order payment not completed'
      });
    }

    // Check if refund already exists
    if (order.refundDetails && order.refundDetails.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Refund already processed for this order'
      });
    }

    // Generate transaction number
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

    const transaction = await Transaction.create({
      transactionNumber,
      type: 'refund',
      amount: amount || order.total,
      paymentMethod: order.paymentMethod,
      order: order._id,
      user: req.user.id,
      description: reason || `Refund for order #${order.orderNumber}`,
      status: 'completed'
    });

    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.refundDetails = {
      amount: amount || order.total,
      transactionId: transaction._id,
      processedAt: Date.now(),
      status: 'completed'
    };

    order.statusHistory.push({
      status: 'refunded',
      changedBy: req.user.id,
      note: reason || 'Refund processed'
    });

    await order.save();

    // Update account
    const account = await Account.findOne();
    if (account) {
      account.balance -= (amount || order.total);
      account.transactions.push(transaction._id);
      await account.save();
    }

    await Notification.create({
      type: 'refund_processed',
      title: 'Refund Processed',
      message: `Refund of KES ${amount || order.total} for order #${order.orderNumber} has been processed`,
      isGlobal: true,
      data: { orderId: order._id, transactionId: transaction._id }
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      transaction
    });
  } catch (error) {
    logger.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get order stats (admin)
// @route   GET /api/orders/stats
// @access  Private/Admin
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending_payment'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['submitted', 'processing']] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedOrders: {
            $sum: { $cond: [{ $in: ['$status', ['delivered', 'completed']] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $in: ['$status', ['cancelled', 'refunded']] }, 1, 0] }
          }
        }
      }
    ]);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          paymentStatus: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        confirmedOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0
      },
      todayOrders,
      todayRevenue: todayRevenue[0]?.total || 0
    });
  } catch (error) {
    logger.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private
exports.trackOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderNumber status trackingNumber estimatedDelivery statusHistory user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user.id && 
        !['admin', 'manager', 'staff'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to track this order'
      });
    }

    const statusSteps = ['pending_payment', 'submitted', 'confirmed', 'processing', 'dispatched', 'transit', 'delivered'];
    const statusLabels = {
      'pending_payment': 'Pending Payment',
      'submitted': 'Submitted',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'dispatched': 'Dispatched',
      'transit': 'In Transit',
      'delivered': 'Delivered'
    };
    
    const currentStep = statusSteps.indexOf(order.status);

    res.status(200).json({
      success: true,
      tracking: {
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: statusLabels[order.status] || order.status.replace('_', ' '),
        currentStep: currentStep >= 0 ? currentStep : 0,
        totalSteps: statusSteps.length - 1,
        trackingNumber: order.trackingNumber || null,
        estimatedDelivery: order.estimatedDelivery || null,
        history: order.statusHistory || []
      }
    });
  } catch (error) {
    logger.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load tracking information'
    });
  }
};

// @desc    Assign tracking number
// @route   PUT /api/orders/:id/assign-tracking
// @access  Private/Admin
exports.assignTrackingNumber = async (req, res) => {
  try {
    const { trackingNumber, carrier, estimatedDelivery } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.trackingNumber = trackingNumber;
    order.estimatedDelivery = estimatedDelivery;
    order.status = 'dispatched';

    order.statusHistory.push({
      status: 'dispatched',
      changedBy: req.user.id,
      note: `Tracking number assigned: ${trackingNumber}${carrier ? ` (${carrier})` : ''}`
    });

    await order.save();

    await Notification.create({
      type: 'order_status_changed',
      title: 'Order Dispatched',
      message: `Order #${order.orderNumber} has been dispatched`,
      recipient: order.user,
      data: { orderId: order._id, trackingNumber }
    });

    sendEmail({
      email: order.customer.email,
      subject: `Order #${order.orderNumber} Dispatched`,
      message: `
        <h1>Your Order Has Been Dispatched!</h1>
        <p>Dear ${order.customer.name},</p>
        <p>Your order #${order.orderNumber} has been dispatched.</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        ${carrier ? `<p><strong>Carrier:</strong> ${carrier}</p>` : ''}
        ${estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(estimatedDelivery).toLocaleDateString()}</p>` : ''}
        <p>You can track your order on our website.</p>
        <br>
        <p>Thank you for shopping with ElectroStore!</p>
      `
    }).catch(err => logger.error('Tracking email error:', err));

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('Assign tracking error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get order history
// @route   GET /api/orders/:id/history
// @access  Private/Admin
exports.getOrderHistory = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('statusHistory.changedBy', 'name')
      .select('orderNumber statusHistory');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      history: order.statusHistory
    });
  } catch (error) {
    logger.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get daily orders (for reports)
// @route   GET /api/orders/daily
// @access  Private/Admin
exports.getDailyOrders = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const orders = await Order.find({
      createdAt: {
        $gte: queryDate,
        $lt: nextDate
      }
    }).populate('user', 'name email');

    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      byStatus: {},
      byPaymentMethod: {}
    };

    orders.forEach(order => {
      summary.byStatus[order.status] = (summary.byStatus[order.status] || 0) + 1;
      summary.byPaymentMethod[order.paymentMethod] = (summary.byPaymentMethod[order.paymentMethod] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      date: queryDate,
      summary,
      orders
    });
  } catch (error) {
    logger.error('Get daily orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get monthly orders (for reports)
// @route   GET /api/orders/monthly
// @access  Private/Admin
exports.getMonthlyOrders = async (req, res) => {
  try {
    const { year, month } = req.query;
    const queryYear = year || new Date().getFullYear();
    const queryMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startDate = new Date(queryYear, queryMonth, 1);
    const endDate = new Date(queryYear, queryMonth + 1, 1);

    const orders = await Order.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    });

    const daily = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      const day = order.createdAt.getDate();
      if (!daily[day]) {
        daily[day] = { orders: 0, revenue: 0 };
      }
      daily[day].orders += 1;
      daily[day].revenue += order.total;
      totalRevenue += order.total;
    });

    res.status(200).json({
      success: true,
      month: queryMonth + 1,
      year: queryYear,
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length ? totalRevenue / orders.length : 0
      },
      daily
    });
  } catch (error) {
    logger.error('Get monthly orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Export orders (for reports)
// @route   GET /api/orders/export
// @access  Private/Admin
exports.exportOrders = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt');

    if (format === 'csv') {
      const csvRows = [];
      
      csvRows.push([
        'Order #',
        'Date',
        'Customer Name',
        'Customer Email',
        'Customer Phone',
        'Items',
        'Subtotal',
        'Shipping',
        'Total',
        'Status',
        'Payment Method',
        'Payment Status'
      ].join(','));

      orders.forEach(order => {
        const items = order.items.map(i => `${i.name} (x${i.quantity})`).join('; ');
        csvRows.push([
          order.orderNumber,
          new Date(order.createdAt).toLocaleDateString(),
          order.customer?.name || '',
          order.customer?.email || '',
          order.customer?.phone || '',
          `"${items}"`,
          order.subtotal,
          order.shippingFee,
          order.total,
          order.status,
          order.paymentMethod,
          order.paymentStatus
        ].join(','));
      });

      const csvString = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=orders-${startDate || 'all'}-to-${endDate || 'all'}.csv`);
      res.send(csvString);
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported format'
      });
    }
  } catch (error) {
    logger.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};