const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'sales',
      'products',
      'customers',
      'orders',
      'inventory',
      'financial',
      'performance',
      'custom'
    ],
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv', 'html'],
    default: 'pdf'
  },
  dateRange: {
    start: Date,
    end: Date
  },
  filters: {
    type: Map,
    of: String
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  summary: {
    totalRevenue: Number,
    totalOrders: Number,
    totalCustomers: Number,
    averageOrderValue: Number,
    topProducts: [mongoose.Schema.Types.Mixed],
    orderStatusBreakdown: mongoose.Schema.Types.Mixed
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: String,
  fileSize: Number,
  scheduled: {
    isScheduled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    nextRun: Date,
    recipients: [String]
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);