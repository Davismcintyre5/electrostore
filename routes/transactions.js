const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect, authorize('admin', 'manager', 'accountant'));

router.route('/')
  .get(transactionController.getAllTransactions)
  .post(transactionController.createTransaction);

router.get('/stats', transactionController.getTransactionStats);
router.get('/daily', transactionController.getDailyTransactions);
router.get('/monthly', transactionController.getMonthlyTransactions);
router.get('/export', transactionController.exportTransactions);

router.route('/:id')
  .get(transactionController.getTransaction)
  .put(transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

router.post('/:id/receipt', transactionController.generateReceipt);
router.post('/:id/void', transactionController.voidTransaction);

module.exports = router;