const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const accountController = require('../controllers/accountController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Customer can view their account
router.get('/balance', accountController.getBalance);
router.get('/transactions', accountController.getTransactions);

// Admin/manager/accountant routes
router.use(authorize('admin', 'manager', 'accountant'));

router.get('/summary', accountController.getAccountSummary);
router.get('/daily-summary', accountController.getDailySummary);
router.get('/monthly-summary', accountController.getMonthlySummary);

// Withdrawals
router.post('/withdrawals',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('purpose').notEmpty().withMessage('Purpose is required'),
    body('category').isIn(['Rent', 'Salaries', 'Supplies', 'Utilities', 'Marketing', 'Other']).withMessage('Invalid category')
  ],
  accountController.requestWithdrawal
);

router.get('/withdrawals', accountController.getWithdrawals);
router.put('/withdrawals/:id/approve', authorize('admin'), accountController.approveWithdrawal);
router.put('/withdrawals/:id/complete', accountController.completeWithdrawal);
router.put('/withdrawals/:id/cancel', accountController.cancelWithdrawal);

module.exports = router;