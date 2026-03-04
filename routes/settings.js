const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const settingController = require('../controllers/settingController');
const { protect, authorize } = require('../middleware/auth');

// Public settings (store info, etc)
router.get('/public', settingController.getPublicSettings);

// Protect all routes
router.use(protect, authorize('admin'));

// General settings
router.get('/', settingController.getAllSettings);
router.get('/group/:group', settingController.getSettingsByGroup);
router.get('/:key', settingController.getSetting);

router.post('/',
  [
    body('group').notEmpty().withMessage('Group is required'),
    body('key').notEmpty().withMessage('Key is required'),
    body('value').notEmpty().withMessage('Value is required')
  ],
  settingController.createSetting
);

router.put('/:key',
  [
    body('value').notEmpty().withMessage('Value is required')
  ],
  settingController.updateSetting
);

router.delete('/:key', settingController.deleteSetting);

// Bulk operations
router.post('/bulk', settingController.bulkUpdateSettings);

// Store settings
router.get('/store/info', settingController.getStoreInfo);
router.put('/store/info', settingController.updateStoreInfo);

// Shipping settings
router.get('/shipping', settingController.getShippingSettings);
router.put('/shipping', settingController.updateShippingSettings);

// Payment settings
router.get('/payment', settingController.getPaymentSettings);
router.put('/payment', settingController.updatePaymentSettings);

// Email settings
router.get('/email', settingController.getEmailSettings);
router.put('/email', settingController.updateEmailSettings);
router.post('/email/test', settingController.testEmailSettings);

module.exports = router;