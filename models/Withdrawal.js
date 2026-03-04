const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  withdrawalNumber: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add withdrawal amount']
  },
  purpose: {
    type: String,
    required: [true, 'Please add withdrawal purpose']
  },
  category: {
    type: String,
    enum: ['Rent', 'Salaries', 'Supplies', 'Utilities', 'Marketing', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  completedAt: Date,
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'M-PESA', 'Cheque']
  },
  paymentDetails: {
    accountNumber: String,
    bankName: String,
    phoneNumber: String
  },
  notes: String,
  attachments: [String],
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
}, {
  timestamps: true
});

// Generate withdrawal number before saving
withdrawalSchema.pre('save', async function(next) {
  if (!this.withdrawalNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await mongoose.model('Withdrawal').countDocuments();
    this.withdrawalNumber = `WD${year}${month}${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);