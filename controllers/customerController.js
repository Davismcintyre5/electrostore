const Customer = require('../models/Customer');
const User = require('../models/User');
const Order = require('../models/Order');
const logger = require('../config/logger');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin/Manager
exports.getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by VIP status
    if (req.query.vip === 'true') {
      query.isVip = true;
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .populate('user', 'email')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      customers
    });
  } catch (error) {
    logger.error('Get all customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private/Admin/Manager
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('user', 'email lastLogin')
      .populate('orders');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    logger.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private/Admin/Manager
exports.createCustomer = async (req, res) => {
  try {
    const { name, email, phone, addresses, notes } = req.body;

    // Check if customer exists
    let customer = await Customer.findOne({ email });
    if (customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists'
      });
    }

    // Create customer
    customer = await Customer.create({
      name,
      email,
      phone,
      addresses: addresses || [],
      notes,
      totalOrders: 0,
      totalSpent: 0
    });

    res.status(201).json({
      success: true,
      customer
    });
  } catch (error) {
    logger.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private/Admin/Manager
exports.updateCustomer = async (req, res) => {
  try {
    let customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      customer
    });
  } catch (error) {
    logger.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    logger.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer orders
// @route   GET /api/customers/:id/orders
// @access  Private/Admin/Manager
exports.getCustomerOrders = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const orders = await Order.find({ user: customer.user })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    logger.error('Get customer orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add customer note
// @route   POST /api/customers/:id/notes
// @access  Private/Admin/Manager
exports.addCustomerNote = async (req, res) => {
  try {
    const { note } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.notes = customer.notes 
      ? `${customer.notes}\n\n${new Date().toLocaleDateString()}: ${note}`
      : `${new Date().toLocaleDateString()}: ${note}`;
    
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      notes: customer.notes
    });
  } catch (error) {
    logger.error('Add customer note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update loyalty points
// @route   PUT /api/customers/:id/loyalty-points
// @access  Private/Admin/Manager
exports.updateLoyaltyPoints = async (req, res) => {
  try {
    const { points } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    customer.loyaltyPoints += parseInt(points);
    await customer.save();

    res.status(200).json({
      success: true,
      loyaltyPoints: customer.loyaltyPoints
    });
  } catch (error) {
    logger.error('Update loyalty points error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer stats
// @route   GET /api/customers/stats
// @access  Private/Admin/Manager
exports.getCustomerStats = async (req, res) => {
  try {
    const total = await Customer.countDocuments();
    const vip = await Customer.countDocuments({ isVip: true });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newToday = await Customer.countDocuments({
      createdAt: { $gte: today }
    });

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const newThisMonth = await Customer.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    // Average order value per customer
    const avgStats = await Customer.aggregate([
      {
        $group: {
          _id: null,
          avgOrders: { $avg: '$totalOrders' },
          avgSpent: { $avg: '$totalSpent' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        vip,
        newToday,
        newThisMonth,
        averageOrders: avgStats[0]?.avgOrders || 0,
        averageSpent: avgStats[0]?.avgSpent || 0
      }
    });
  } catch (error) {
    logger.error('Get customer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get VIP customers
// @route   GET /api/customers/vip
// @access  Private/Admin/Manager
exports.getVipCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ isVip: true })
      .sort('-totalSpent')
      .limit(20);

    res.status(200).json({
      success: true,
      count: customers.length,
      customers
    });
  } catch (error) {
    logger.error('Get VIP customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get recent customers
// @route   GET /api/customers/recent
// @access  Private/Admin/Manager
exports.getRecentCustomers = async (req, res) => {
  try {
    const customers = await Customer.find()
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    logger.error('Get recent customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};