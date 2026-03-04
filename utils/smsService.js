const axios = require('axios');
const logger = require('../config/logger');

class SmsService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'africastalking';
    this.apiKey = process.env.SMS_API_KEY;
    this.username = process.env.SMS_USERNAME;
    this.senderId = process.env.SMS_SENDER_ID || 'ElectroStore';
  }

  // Format phone number to international format
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.slice(1);
    }
    
    return cleaned;
  }

  // Send SMS via Africa's Talking
  async sendViaAfricaTalking(to, message) {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username: this.username,
          to: formattedNumber,
          message: message,
          from: this.senderId
        }),
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Africa's Talking SMS error:', error);
      throw error;
    }
  }

  // Send SMS via Twilio
  async sendViaTwilio(to, message) {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const client = require('twilio')(accountSid, authToken);

      const response = await client.messages.create({
        body: message,
        from: this.senderId,
        to: this.formatPhoneNumber(to)
      });

      return response;
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      throw error;
    }
  }

  // Send SMS (auto-select provider)
  async sendSms(to, message, options = {}) {
    try {
      let response;
      
      switch (this.provider) {
        case 'africastalking':
          response = await this.sendViaAfricaTalking(to, message);
          break;
        case 'twilio':
          response = await this.sendViaTwilio(to, message);
          break;
        default:
          throw new Error(`Unknown SMS provider: ${this.provider}`);
      }

      logger.info(`SMS sent to ${to}: ${message.substring(0, 50)}...`);
      return response;
    } catch (error) {
      logger.error('SMS send error:', error);
      throw error;
    }
  }

  // Send order status update
  async sendOrderStatusUpdate(phone, orderNumber, status) {
    const statusMessages = {
      'submitted': 'has been received and is being processed',
      'processing': 'is now being prepared',
      'dispatched': 'has been dispatched from our store',
      'transit': 'is on its way to you',
      'arrived': 'has arrived at our collection point',
      'collection': 'is ready for collection',
      'completed': 'has been delivered',
      'cancelled': 'has been cancelled'
    };

    const message = `Your order #${orderNumber} ${statusMessages[status] || 'status has been updated'}. Track at: ${process.env.CLIENT_URL}/orders/${orderNumber}`;
    
    return this.sendSms(phone, message);
  }

  // Send OTP for verification
  async sendOtp(phone, otp) {
    const message = `Your verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
    return this.sendSms(phone, message);
  }

  // Send delivery notification
  async sendDeliveryNotification(phone, orderNumber, estimatedTime) {
    const message = `Your order #${orderNumber} will be delivered within ${estimatedTime}. Please ensure someone is available.`;
    return this.sendSms(phone, message);
  }

  // Send payment confirmation
  async sendPaymentConfirmation(phone, orderNumber, amount) {
    const message = `Payment of KES ${amount} for order #${orderNumber} has been received successfully. Thank you for shopping with us!`;
    return this.sendSms(phone, message);
  }

  // Send bulk SMS
  async sendBulkSms(recipients, message) {
    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await this.sendSms(recipient.phone, message);
        results.push({ ...recipient, status: 'success', result });
      } catch (error) {
        results.push({ ...recipient, status: 'failed', error: error.message });
      }
    }
    return results;
  }

  // Check SMS balance
  async checkBalance() {
    try {
      const response = await axios.get(
        `https://api.africastalking.com/version1/user?username=${this.username}`,
        {
          headers: {
            'Accept': 'application/json',
            'apiKey': this.apiKey
          }
        }
      );

      return {
        balance: response.data.UserData.balance,
        currency: 'KES'
      };
    } catch (error) {
      logger.error('Check balance error:', error);
      throw error;
    }
  }
}

module.exports = new SmsService();