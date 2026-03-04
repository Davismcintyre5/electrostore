const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const promotionController = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/active', promotionController.getActivePromotions);
router.post('/validate', promotionController.validatePromoCode);

// Protected routes (admin/manager only)
router.use(protect, authorize('admin', 'manager'));

router.route('/')
  .get(promotionController.getAllPromotions)
  .post(
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('type').isIn(['percentage', 'fixed', 'bogo', 'shipping']).withMessage('Invalid type'),
      body('value').isNumeric().withMessage('Value must be a number'),
      body('startDate').isDate().withMessage('Valid start date required'),
      body('endDate').isDate().withMessage('Valid end date required')
    ],
    promotionController.createPromotion
  );

router.route('/:id')
  .get(promotionController.getPromotion)
  .put(promotionController.updatePromotion)
  .delete(promotionController.deletePromotion);

router.put('/:id/toggle', promotionController.togglePromotion);
router.get('/:id/analytics', promotionController.getPromotionAnalytics);

module.exports = router;