const Promotion = require('../models/Promotion');
const Product = require('../models/Product');
const logger = require('../config/logger');

// @desc    Get all promotions
// @route   GET /api/promotions
// @access  Private/Admin
exports.getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().sort('-createdAt');

    res.status(200).json({
      success: true,
      count: promotions.length,
      promotions
    });
  } catch (error) {
    logger.error('Get all promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get active promotions
// @route   GET /api/promotions/active
// @access  Public
exports.getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    res.status(200).json({
      success: true,
      promotions
    });
  } catch (error) {
    logger.error('Get active promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single promotion
// @route   GET /api/promotions/:id
// @access  Private/Admin
exports.getPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    res.status(200).json({
      success: true,
      promotion
    });
  } catch (error) {
    logger.error('Get promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create promotion
// @route   POST /api/promotions
// @access  Private/Admin
exports.createPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.create(req.body);

    res.status(201).json({
      success: true,
      promotion
    });
  } catch (error) {
    logger.error('Create promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update promotion
// @route   PUT /api/promotions/:id
// @access  Private/Admin
exports.updatePromotion = async (req, res) => {
  try {
    let promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    promotion = await Promotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      promotion
    });
  } catch (error) {
    logger.error('Update promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
exports.deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    await promotion.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    logger.error('Delete promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Toggle promotion status
// @route   PUT /api/promotions/:id/toggle
// @access  Private/Admin
exports.togglePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    promotion.isActive = !promotion.isActive;
    await promotion.save();

    res.status(200).json({
      success: true,
      isActive: promotion.isActive
    });
  } catch (error) {
    logger.error('Toggle promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Validate promo code
// @route   POST /api/promotions/validate
// @access  Public
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, amount, products } = req.body;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!promotion) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired promo code'
      });
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return res.status(400).json({
        success: false,
        message: 'Promo code usage limit exceeded'
      });
    }

    // Check minimum purchase
    if (promotion.minPurchase && amount < promotion.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase of KES ${promotion.minPurchase} required`
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promotion.type === 'percentage') {
      discountAmount = (amount * promotion.value) / 100;
      if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
        discountAmount = promotion.maxDiscount;
      }
    } else if (promotion.type === 'fixed') {
      discountAmount = promotion.value;
    }

    res.status(200).json({
      success: true,
      promotion,
      discountAmount,
      finalAmount: amount - discountAmount
    });
  } catch (error) {
    logger.error('Validate promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get promotion analytics
// @route   GET /api/promotions/:id/analytics
// @access  Private/Admin
exports.getPromotionAnalytics = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }

    // Get usage analytics
    // This would typically query orders collection
    // For now, return basic info

    res.status(200).json({
      success: true,
      analytics: {
        usageCount: promotion.usageCount,
        usageLimit: promotion.usageLimit,
        remainingUses: promotion.usageLimit ? promotion.usageLimit - promotion.usageCount : 'Unlimited',
        isActive: promotion.isActive,
        timeRemaining: promotion.endDate ? Math.max(0, promotion.endDate - new Date()) : null
      }
    });
  } catch (error) {
    logger.error('Get promotion analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};