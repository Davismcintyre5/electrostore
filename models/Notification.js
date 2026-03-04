const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'order_created',
      'order_status_changed',
      'payment_received',
      'payment_failed',
      'refund_processed',
      'low_stock',
      'customer_registered',
      'withdrawal_requested',
      'withdrawal_processed',
      'system_alert',
      'order_cancelled',
      'order_deleted',
      'payment_confirmed'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isGlobal: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  data: {
    type: Map,
    of: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  actionUrl: String,
  expiresAt: Date,
  sentVia: [{
    type: String,
    enum: ['in_app', 'email', 'sms', 'push']
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);