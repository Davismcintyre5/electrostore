const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// All order routes require authentication
router.use(protect);

// ========== CUSTOMER ROUTES ==========
router.get('/my-orders', orderController.getMyOrders);
router.post('/', orderController.createOrder);
router.get('/:id', orderController.getOrder);
router.put('/:id/cancel', orderController.cancelOrder);
router.get('/:id/track', orderController.trackOrder);

// ========== ADMIN/MANAGER ROUTES ==========
router.use(authorize('admin', 'manager'));

// Order management
router.get('/', orderController.getAllOrders);
router.get('/stats/overview', orderController.getOrderStats);
router.put('/:id/status', orderController.updateOrderStatus);
router.put('/:id/assign-tracking', orderController.assignTrackingNumber);
router.post('/:id/confirm-payment', orderController.confirmOrderPayment); // CRITICAL - This must exist
router.post('/:id/refund', orderController.processRefund);
router.get('/:id/history', orderController.getOrderHistory);
router.delete('/:id', orderController.deleteOrder);

// Report routes
router.get('/daily', orderController.getDailyOrders);
router.get('/monthly', orderController.getMonthlyOrders);
router.get('/export', orderController.exportOrders);

module.exports = router;