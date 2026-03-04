const Setting = require('../models/Setting');
const logger = require('../config/logger');
const { sendEmail } = require('../config/email');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await Setting.find().sort('group key');

    // Group by group
    const grouped = {};
    settings.forEach(s => {
      if (!grouped[s.group]) {
        grouped[s.group] = [];
      }
      grouped[s.group].push({
        key: s.key,
        value: s.value,
        type: s.type,
        description: s.description
      });
    });

    res.status(200).json({
      success: true,
      grouped,
      settings
    });
  } catch (error) {
    logger.error('Get all settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get settings by group
// @route   GET /api/settings/group/:group
// @access  Private/Admin
exports.getSettingsByGroup = async (req, res) => {
  try {
    const settings = await Setting.find({ group: req.params.group });

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    logger.error('Get settings by group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single setting
// @route   GET /api/settings/:key
// @access  Private/Admin
exports.getSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.status(200).json({
      success: true,
      setting
    });
  } catch (error) {
    logger.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create setting
// @route   POST /api/settings
// @access  Private/Admin
exports.createSetting = async (req, res) => {
  try {
    const { group, key, value, type, description, isPublic } = req.body;

    // Check if setting already exists
    const existing = await Setting.findOne({ group, key });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Setting already exists'
      });
    }

    const setting = await Setting.create({
      group,
      key,
      value,
      type,
      description,
      isPublic,
      updatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      setting
    });
  } catch (error) {
    logger.error('Create setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update setting
// @route   PUT /api/settings/:key
// @access  Private/Admin
exports.updateSetting = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    setting.value = req.body.value;
    setting.updatedBy = req.user.id;
    await setting.save();

    res.status(200).json({
      success: true,
      setting
    });
  } catch (error) {
    logger.error('Update setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete setting
// @route   DELETE /api/settings/:key
// @access  Private/Admin
exports.deleteSetting = async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    await setting.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    logger.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk update settings
// @route   POST /api/settings/bulk
// @access  Private/Admin
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const operations = settings.map(s => ({
      updateOne: {
        filter: { group: s.group, key: s.key },
        update: { $set: { value: s.value, updatedBy: req.user.id } },
        upsert: true
      }
    }));

    await Setting.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    logger.error('Bulk update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get public settings
// @route   GET /api/settings/public
// @access  Public
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ isPublic: true });

    const publicSettings = {};
    settings.forEach(s => {
      publicSettings[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      settings: publicSettings
    });
  } catch (error) {
    logger.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get store info
// @route   GET /api/settings/store/info
// @access  Public
exports.getStoreInfo = async (req, res) => {
  try {
    const storeName = await Setting.findOne({ key: 'store_name' }) || { value: 'ElectroStore' };
    const storeEmail = await Setting.findOne({ key: 'store_email' }) || { value: 'support@electrostore.com' };
    const storePhone = await Setting.findOne({ key: 'store_phone' }) || { value: '+254 700 000000' };
    const storeAddress = await Setting.findOne({ key: 'store_address' }) || { value: 'Nairobi, Kenya' };

    res.status(200).json({
      success: true,
      store: {
        name: storeName.value,
        email: storeEmail.value,
        phone: storePhone.value,
        address: storeAddress.value
      }
    });
  } catch (error) {
    logger.error('Get store info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update store info
// @route   PUT /api/settings/store/info
// @access  Private/Admin
exports.updateStoreInfo = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const operations = [
      {
        updateOne: {
          filter: { key: 'store_name' },
          update: { $set: { value: name, group: 'store', type: 'string', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'store_email' },
          update: { $set: { value: email, group: 'store', type: 'string', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'store_phone' },
          update: { $set: { value: phone, group: 'store', type: 'string', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'store_address' },
          update: { $set: { value: address, group: 'store', type: 'string', updatedBy: req.user.id } },
          upsert: true
        }
      }
    ];

    await Setting.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Store info updated successfully'
    });
  } catch (error) {
    logger.error('Update store info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get shipping settings
// @route   GET /api/settings/shipping
// @access  Private/Admin
exports.getShippingSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ group: 'shipping' });

    const shippingSettings = {};
    settings.forEach(s => {
      shippingSettings[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      shippingSettings
    });
  } catch (error) {
    logger.error('Get shipping settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update shipping settings
// @route   PUT /api/settings/shipping
// @access  Private/Admin
exports.updateShippingSettings = async (req, res) => {
  try {
    const { defaultFee, freeShippingThreshold, carriers } = req.body;

    const operations = [
      {
        updateOne: {
          filter: { key: 'shipping_default_fee' },
          update: { $set: { value: defaultFee, group: 'shipping', type: 'number', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'shipping_free_threshold' },
          update: { $set: { value: freeShippingThreshold, group: 'shipping', type: 'number', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'shipping_carriers' },
          update: { $set: { value: carriers, group: 'shipping', type: 'array', updatedBy: req.user.id } },
          upsert: true
        }
      }
    ];

    await Setting.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Shipping settings updated successfully'
    });
  } catch (error) {
    logger.error('Update shipping settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get payment settings
// @route   GET /api/settings/payment
// @access  Private/Admin
exports.getPaymentSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ group: 'payment' });

    const paymentSettings = {};
    settings.forEach(s => {
      paymentSettings[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      paymentSettings
    });
  } catch (error) {
    logger.error('Get payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update payment settings
// @route   PUT /api/settings/payment
// @access  Private/Admin
exports.updatePaymentSettings = async (req, res) => {
  try {
    const { methods, mpesa, card } = req.body;

    const operations = [
      {
        updateOne: {
          filter: { key: 'payment_methods' },
          update: { $set: { value: methods, group: 'payment', type: 'array', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'payment_mpesa_config' },
          update: { $set: { value: mpesa, group: 'payment', type: 'object', updatedBy: req.user.id, isPublic: false } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'payment_card_config' },
          update: { $set: { value: card, group: 'payment', type: 'object', updatedBy: req.user.id, isPublic: false } },
          upsert: true
        }
      }
    ];

    await Setting.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Payment settings updated successfully'
    });
  } catch (error) {
    logger.error('Update payment settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get email settings
// @route   GET /api/settings/email
// @access  Private/Admin
exports.getEmailSettings = async (req, res) => {
  try {
    const settings = await Setting.find({ group: 'email' });

    const emailSettings = {};
    settings.forEach(s => {
      emailSettings[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      emailSettings
    });
  } catch (error) {
    logger.error('Get email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update email settings
// @route   PUT /api/settings/email
// @access  Private/Admin
exports.updateEmailSettings = async (req, res) => {
  try {
    const { host, port, user, pass, fromName, fromEmail } = req.body;

    const operations = [
      {
        updateOne: {
          filter: { key: 'email_host' },
          update: { $set: { value: host, group: 'email', type: 'string', updatedBy: req.user.id, isPublic: false } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'email_port' },
          update: { $set: { value: port, group: 'email', type: 'number', updatedBy: req.user.id, isPublic: false } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'email_user' },
          update: { $set: { value: user, group: 'email', type: 'string', updatedBy: req.user.id, isPublic: false } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'email_pass' },
          update: { $set: { value: pass, group: 'email', type: 'string', updatedBy: req.user.id, isPublic: false } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'email_from_name' },
          update: { $set: { value: fromName, group: 'email', type: 'string', updatedBy: req.user.id } },
          upsert: true
        }
      },
      {
        updateOne: {
          filter: { key: 'email_from_address' },
          update: { $set: { value: fromEmail, group: 'email', type: 'string', updatedBy: req.user.id } },
          upsert: true
        }
      }
    ];

    await Setting.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: 'Email settings updated successfully'
    });
  } catch (error) {
    logger.error('Update email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Test email settings
// @route   POST /api/settings/email/test
// @access  Private/Admin
exports.testEmailSettings = async (req, res) => {
  try {
    const { to } = req.body;

    await sendEmail({
      email: to,
      subject: 'Test Email from ElectroStore',
      message: `
        <h1>Email Settings Test</h1>
        <p>This is a test email to verify your email configuration.</p>
        <p>If you're reading this, your email settings are working correctly!</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    });

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    logger.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};