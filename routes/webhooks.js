const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// M-Pesa webhooks (public - called by Safaricom)
router.post('/mpesa/confirmation', webhookController.mpesaConfirmation);
router.post('/mpesa/validation', webhookController.mpesaValidation);
router.post('/mpesa/timeout', webhookController.mpesaTimeout);
router.post('/mpesa/result', webhookController.mpesaResult);

// Payment gateways
router.post('/stripe', webhookController.stripeWebhook);
router.post('/paypal', webhookController.paypalWebhook);

// SMS delivery reports
router.post('/sms/status', webhookController.smsStatusCallback);

// Email delivery reports
router.post('/email/status', webhookController.emailStatusCallback);

module.exports = router;