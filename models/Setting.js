const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  group: {
    type: String,
    required: true,
    enum: [
      'general',
      'store',
      'shipping',
      'payment',
      'tax',
      'email',
      'notifications',
      'security',
      'appearance'
    ]
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object'],
    default: 'string'
  },
  description: String,
  isPublic: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure unique combination of group and key
settingSchema.index({ group: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Setting', settingSchema);