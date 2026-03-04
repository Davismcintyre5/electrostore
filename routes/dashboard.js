const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Admin/manager dashboard
router.get('/admin',
  authorize('admin', 'manager'),
  dashboardController.getAdminDashboard
);

// Staff dashboard
router.get('/staff',
  authorize('staff'),
  dashboardController.getStaffDashboard
);

// Customer dashboard
router.get('/customer', dashboardController.getCustomerDashboard);

// Charts data
router.get('/charts/sales', dashboardController.getSalesChartData);
router.get('/charts/orders', dashboardController.getOrdersChartData);
router.get('/charts/products', dashboardController.getProductsChartData);
router.get('/charts/customers', dashboardController.getCustomersChartData);

// Widgets
router.get('/widgets/top-products', dashboardController.getTopProducts);
router.get('/widgets/recent-orders', dashboardController.getRecentOrders);
router.get('/widgets/upcoming-deliveries', dashboardController.getUpcomingDeliveries);
router.get('/widgets/low-stock-alerts', dashboardController.getLowStockAlerts);

module.exports = router;