const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect, authorize('admin', 'manager'));

// Sales reports
router.get('/sales/daily', reportController.getDailySalesReport);
router.get('/sales/monthly', reportController.getMonthlySalesReport);
router.get('/sales/yearly', reportController.getYearlySalesReport);
router.post('/sales/custom', reportController.getCustomSalesReport);

// Product reports
router.get('/products/best-selling', reportController.getBestSellingProducts);
router.get('/products/low-stock', reportController.getLowStockReport);
router.get('/products/inventory', reportController.getInventoryReport);

// Customer reports
router.get('/customers/top', reportController.getTopCustomers);
router.get('/customers/acquistion', reportController.getCustomerAcquisitionReport);

// Financial reports
router.get('/financial/profit-loss', reportController.getProfitLossReport);
router.get('/financial/expenses', reportController.getExpensesReport);

// Saved reports
router.route('/saved')
  .get(reportController.getSavedReports)
  .post(reportController.saveReport);

router.route('/saved/:id')
  .get(reportController.getSavedReport)
  .put(reportController.updateSavedReport)
  .delete(reportController.deleteSavedReport);

router.post('/saved/:id/generate', reportController.generateSavedReport);
router.post('/scheduled', reportController.createScheduledReport);

module.exports = router;