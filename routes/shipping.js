const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const shippingController = require('../controllers/shippingController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/calculate', shippingController.calculateShipping);
router.get('/rules', shippingController.getActiveRules);

// Protected routes (admin/manager only)
router.use(protect, authorize('admin', 'manager'));

router.route('/')
  .get(shippingController.getAllRules)
  .post(
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('type').isIn(['flat_rate', 'free_shipping', 'min_amount', 'weight_based', 'location_based']).withMessage('Invalid type'),
      body('cost').isNumeric().withMessage('Cost must be a number')
    ],
    shippingController.createRule
  );

router.route('/:id')
  .get(shippingController.getRule)
  .put(shippingController.updateRule)
  .delete(shippingController.deleteRule);

router.put('/:id/toggle', shippingController.toggleRule);
router.put('/:id/priority', shippingController.updatePriority);

module.exports = router;