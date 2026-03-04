const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect, authorize('admin', 'manager', 'staff'));

router.route('/')
  .get(customerController.getAllCustomers)
  .post(customerController.createCustomer);

router.get('/stats', customerController.getCustomerStats);
router.get('/vip', customerController.getVipCustomers);
router.get('/recent', customerController.getRecentCustomers);

router.route('/:id')
  .get(customerController.getCustomer)
  .put(customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

router.get('/:id/orders', customerController.getCustomerOrders);
router.post('/:id/notes', customerController.addCustomerNote);
router.put('/:id/loyalty-points', customerController.updateLoyaltyPoints);

module.exports = router;