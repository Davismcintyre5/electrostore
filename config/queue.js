const Queue = require('bull');

// Email queue
const emailQueue = new Queue('email', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

// SMS queue
const smsQueue = new Queue('sms', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

// Refund queue
const refundQueue = new Queue('refund', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});

module.exports = {
  emailQueue,
  smsQueue,
  refundQueue
};