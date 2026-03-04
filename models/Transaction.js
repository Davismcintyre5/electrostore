const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['sale', 'withdrawal', 'refund', 'deposit', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'M-PESA', 'Bank Transfer'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mpesaDetails: {
    merchantRequestId: String,
    checkoutRequestId: String,
    receiptNumber: String,
    phoneNumber: String,
    transactionDate: Date,
    failureReason: String
  },
  description: String,
  category: String,
  reference: String,
  notes: String,
  receipt: {
    url: String,
    generated: { type: Boolean, default: false }
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Generate transaction number before saving - ULTIMATE FIX
transactionSchema.pre('save', function(next) {
  try {
    if (!this.transactionNumber) {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      // Use multiple sources to guarantee uniqueness
      this.transactionNumber = `TRX${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
      
      console.log('✅ Transaction number generated:', this.transactionNumber);
    }
    next();
  } catch (error) {
    console.error('❌ Error generating transaction number:', error);
    // Ultimate fallback - use timestamp
    this.transactionNumber = `TRX${Date.now()}${Math.floor(Math.random() * 100000)}`;
    next();
  }
});

// Ensure transactionNumber exists before validation
transactionSchema.pre('validate', function(next) {
  if (!this.transactionNumber) {
    this.transactionNumber = `TRX${Date.now()}${Math.floor(Math.random() * 100000)}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);