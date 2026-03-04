const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// M-Pesa STK Push
router.post('/mpesa/stk-push',
  protect,
  [
    body('phone').matches(/^[0-9]{10,12}$/).withMessage('Valid phone number required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('orderId').notEmpty().withMessage('Order ID required')
  ],
  paymentController.initiateSTKPush
);

// M-Pesa Callback (public - Safaricom calls this)
router.post('/mpesa/callback', paymentController.mpesaCallback);

// M-Pesa Query
router.post('/mpesa/query/:checkoutRequestId', protect, paymentController.queryPaymentStatus);

// Payment verification
router.get('/verify/:transactionId', protect, paymentController.verifyPayment);

// Refund
router.post('/refund/:transactionId',
  protect,
  [
    body('amount').isNumeric().withMessage('Amount must be a number')
  ],
  paymentController.processRefund
);

module.exports = router;