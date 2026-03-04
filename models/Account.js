const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'KES'
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpenses: {
    type: Number,
    default: 0
  },
  totalWithdrawals: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dailyTotals: [{
    date: Date,
    income: Number,
    expenses: Number,
    balance: Number
  }],
  monthlyTotals: [{
    month: String,
    income: Number,
    expenses: Number,
    balance: Number
  }]
}, {
  timestamps: true
});

// Update account balance
accountSchema.methods.updateBalance = function(amount, type) {
  if (type === 'credit') {
    this.balance += amount;
    this.totalIncome += amount;
  } else if (type === 'debit') {
    this.balance -= amount;
    this.totalExpenses += amount;
  }
  this.lastUpdated = new Date();
};

module.exports = mongoose.model('Account', accountSchema);