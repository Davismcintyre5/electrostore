const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customer: {
    name: String,
    email: String,
    phone: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    total: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending_payment',
      'submitted',
      'confirmed',      // ✅ ADD THIS - Payment confirmed by admin
      'processing',
      'dispatched',
      'transit',
      'arrived',
      'collection',
      'completed',
      'cancelled',
      'refunded'
    ],
    default: 'pending_payment'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'M-PESA'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  mpesaDetails: {
    transactionId: String,
    receiptNumber: String,
    phoneNumber: String,
    amount: Number,
    transactionDate: Date,
    checkoutRequestId: String,
    merchantRequestId: String,
    failureReason: String
  },
  shippingAddress: {
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String
  },
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelReason: String,
  refundDetails: {
    amount: Number,
    transactionId: String,
    processedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    }
  },
  notes: String,
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    note: String
  }]
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    this.orderNumber = `ORD${year}${month}${day}${random}`;
  }
  next();
});

// Check if order can be cancelled (within 24 hours)
orderSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const orderTime = this.createdAt;
  const timeDiff = now - orderTime;
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return timeDiff <= twentyFourHours && 
         (this.status === 'pending_payment' || this.status === 'submitted' || this.status === 'processing');
};

module.exports = mongoose.model('Order', orderSchema);