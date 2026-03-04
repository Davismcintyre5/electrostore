const ShippingRule = require('../models/ShippingRule');
const Setting = require('../models/Setting');
const logger = require('../config/logger');

// @desc    Calculate shipping
// @route   GET /api/shipping/calculate
// @access  Public
exports.calculateShipping = async (req, res) => {
  try {
    const { amount, weight, location, items } = req.query;

    const rules = await ShippingRule.find({ isActive: true }).sort('priority');

    // Get default shipping fee
    const defaultFeeSetting = await Setting.findOne({ key: 'shipping_default_fee' });
    const defaultFee = defaultFeeSetting ? defaultFeeSetting.value : 500;

    // Find applicable rule
    let applicableRule = null;
    for (const rule of rules) {
      if (rule.appliesTo(parseFloat(amount), parseFloat(weight), location, JSON.parse(items || '[]'))) {
        applicableRule = rule;
        break;
      }
    }

    const shippingFee = applicableRule ? applicableRule.cost : defaultFee;
    const isFree = applicableRule ? applicableRule.isFree : false;

    res.status(200).json({
      success: true,
      shipping: {
        fee: shippingFee,
        isFree,
        rule: applicableRule ? {
          name: applicableRule.name,
          description: applicableRule.description,
          estimatedDays: applicableRule.estimatedDays
        } : null
      }
    });
  } catch (error) {
    logger.error('Calculate shipping error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get active rules
// @route   GET /api/shipping/rules
// @access  Public
exports.getActiveRules = async (req, res) => {
  try {
    const rules = await ShippingRule.find({ isActive: true })
      .select('name description type conditions estimatedDays')
      .sort('priority');

    res.status(200).json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Get active rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all rules
// @route   GET /api/shipping
// @access  Private/Admin/Manager
exports.getAllRules = async (req, res) => {
  try {
    const rules = await ShippingRule.find().sort('priority');

    res.status(200).json({
      success: true,
      rules
    });
  } catch (error) {
    logger.error('Get all rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single rule
// @route   GET /api/shipping/:id
// @access  Private/Admin/Manager
exports.getRule = async (req, res) => {
  try {
    const rule = await ShippingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Shipping rule not found'
      });
    }

    res.status(200).json({
      success: true,
      rule
    });
  } catch (error) {
    logger.error('Get rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create shipping rule
// @route   POST /api/shipping
// @access  Private/Admin/Manager
exports.createRule = async (req, res) => {
  try {
    const rule = await ShippingRule.create(req.body);

    res.status(201).json({
      success: true,
      rule
    });
  } catch (error) {
    logger.error('Create rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update shipping rule
// @route   PUT /api/shipping/:id
// @access  Private/Admin/Manager
exports.updateRule = async (req, res) => {
  try {
    let rule = await ShippingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Shipping rule not found'
      });
    }

    rule = await ShippingRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      rule
    });
  } catch (error) {
    logger.error('Update rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete shipping rule
// @route   DELETE /api/shipping/:id
// @access  Private/Admin
exports.deleteRule = async (req, res) => {
  try {
    const rule = await ShippingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Shipping rule not found'
      });
    }

    await rule.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Shipping rule deleted successfully'
    });
  } catch (error) {
    logger.error('Delete rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Toggle rule status
// @route   PUT /api/shipping/:id/toggle
// @access  Private/Admin/Manager
exports.toggleRule = async (req, res) => {
  try {
    const rule = await ShippingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Shipping rule not found'
      });
    }

    rule.isActive = !rule.isActive;
    await rule.save();

    res.status(200).json({
      success: true,
      isActive: rule.isActive
    });
  } catch (error) {
    logger.error('Toggle rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update rule priority
// @route   PUT /api/shipping/:id/priority
// @access  Private/Admin/Manager
exports.updatePriority = async (req, res) => {
  try {
    const { priority } = req.body;

    const rule = await ShippingRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Shipping rule not found'
      });
    }

    rule.priority = priority;
    await rule.save();

    res.status(200).json({
      success: true,
      rule
    });
  } catch (error) {
    logger.error('Update priority error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};