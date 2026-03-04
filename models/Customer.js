const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: [true, 'Please add customer name']
  },
  email: {
    type: String,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Please add phone number'],
    match: [/^[0-9]{10,12}$/, 'Please add a valid phone number']
  },
  addresses: [{
    street: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
    isDefault: { type: Boolean, default: false }
  }],
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: Date,
  averageOrderValue: {
    type: Number,
    default: 0
  },
  preferredPaymentMethod: String,
  notes: String,
  tags: [String],
  isVip: {
    type: Boolean,
    default: false
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  birthdate: Date,
  anniversary: Date
}, {
  timestamps: true
});

// Update customer stats when order is placed
customerSchema.methods.updateStats = function(orderTotal) {
  this.totalOrders += 1;
  this.totalSpent += orderTotal;
  this.lastOrderDate = new Date();
  this.averageOrderValue = this.totalSpent / this.totalOrders;
};

module.exports = mongoose.model('Customer', customerSchema);