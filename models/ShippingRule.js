const mongoose = require('mongoose');

const shippingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: [
      'flat_rate',
      'free_shipping',
      'min_amount',
      'weight_based',
      'location_based',
      'category_based',
      'product_based'
    ],
    required: true
  },
  conditions: {
    minAmount: Number,
    maxAmount: Number,
    minWeight: Number,
    maxWeight: Number,
    locations: [String],
    categories: [String],
    products: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }]
  },
  cost: {
    type: Number,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  estimatedDays: {
    min: Number,
    max: Number
  },
  carrier: String,
  trackingRequired: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Check if rule applies to order
shippingRuleSchema.methods.appliesTo = function(orderTotal, weight, location, items) {
  if (!this.isActive) return false;
  
  switch(this.type) {
    case 'min_amount':
      return this.conditions.minAmount && orderTotal >= this.conditions.minAmount;
    
    case 'weight_based':
      if (this.conditions.minWeight && weight < this.conditions.minWeight) return false;
      if (this.conditions.maxWeight && weight > this.conditions.maxWeight) return false;
      return true;
    
    case 'location_based':
      return this.conditions.locations && 
             this.conditions.locations.includes(location);
    
    case 'category_based':
      const itemCategories = items.map(item => item.category);
      return this.conditions.categories.some(cat => itemCategories.includes(cat));
    
    default:
      return true;
  }
};

module.exports = mongoose.model('ShippingRule', shippingRuleSchema);