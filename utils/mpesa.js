const axios = require('axios');
const crypto = require('crypto');
const logger = require('../config/logger');

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortCode = process.env.MPESA_SHORTCODE;
    this.callbackURL = process.env.MPESA_CALLBACK_URL;
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  // Get OAuth token
  async getAccessToken() {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );
      return response.data.access_token;
    } catch (error) {
      logger.error('Error getting M-Pesa access token:', error);
      throw error;
    }
  }

  // Generate timestamp in format YYYYMMDDHHmmss
  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  // Generate password for STK push
  generatePassword(timestamp) {
    const data = this.shortCode + this.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  // Format phone number to international format
  formatPhoneNumber(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // Convert to 254 format
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.slice(1);
    }
    
    return cleaned;
  }

  // Initiate STK Push
  async stkPush(phone, amount, accountReference, transactionDesc) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);
      const formattedPhone = this.formatPhoneNumber(phone);

      const data = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: this.shortCode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.callbackURL,
        AccountReference: accountReference.substring(0, 12),
        TransactionDesc: transactionDesc.substring(0, 13)
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('STK Push error:', error);
      throw error;
    }
  }

  // Query STK Push status
  async queryStatus(checkoutRequestId) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      const data = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpushquery/v1/query`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Query status error:', error);
      throw error;
    }
  }

  // Simulate C2B transaction (sandbox only)
  async simulateC2B(phone, amount, billRefNumber) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('C2B simulation only available in sandbox');
    }

    try {
      const token = await this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(phone);

      const data = {
        ShortCode: this.shortCode,
        CommandID: 'CustomerPayBillOnline',
        Amount: amount,
        Msisdn: formattedPhone,
        BillRefNumber: billRefNumber
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/c2b/v1/simulate`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('C2B simulation error:', error);
      throw error;
    }
  }

  // Register C2B URLs
  async registerUrls() {
    try {
      const token = await this.getAccessToken();

      const data = {
        ShortCode: this.shortCode,
        ResponseType: 'Completed',
        ConfirmationURL: `${process.env.BASE_URL}/api/webhooks/mpesa/confirmation`,
        ValidationURL: `${process.env.BASE_URL}/api/webhooks/mpesa/validation`
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/c2b/v1/registerurl`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Register URLs error:', error);
      throw error;
    }
  }

  // B2C payment (business to customer)
  async b2c(phone, amount, commandId = 'BusinessPayment') {
    try {
      const token = await this.getAccessToken();
      const formattedPhone = this.formatPhoneNumber(phone);

      const data = {
        InitiatorName: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: commandId,
        Amount: amount,
        PartyA: this.shortCode,
        PartyB: formattedPhone,
        Remarks: 'Payment',
        QueueTimeOutURL: `${process.env.BASE_URL}/api/webhooks/mpesa/timeout`,
        ResultURL: `${process.env.BASE_URL}/api/webhooks/mpesa/result`,
        Occasion: ''
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/b2c/v1/paymentrequest`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('B2C error:', error);
      throw error;
    }
  }

  // Reverse transaction
  async reverseTransaction(transactionId, amount) {
    try {
      const token = await this.getAccessToken();

      const data = {
        Initiator: process.env.MPESA_INITIATOR_NAME,
        SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
        CommandID: 'TransactionReversal',
        TransactionID: transactionId,
        Amount: amount,
        ReceiverParty: this.shortCode,
        RecieverIdentifierType: '11',
        ResultURL: `${process.env.BASE_URL}/api/webhooks/mpesa/result`,
        QueueTimeOutURL: `${process.env.BASE_URL}/api/webhooks/mpesa/timeout`,
        Remarks: 'Reversal',
        Occasion: ''
      };

      const response = await axios.post(
        `${this.baseURL}/mpesa/reversal/v1/request`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Reverse transaction error:', error);
      throw error;
    }
  }
}

module.exports = new MpesaService();