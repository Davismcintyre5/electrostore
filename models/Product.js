const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add product name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select category'],
    enum: ['Phones', 'Laptops', 'Accessories', 'Tablets', 'Audio', 'Wearables']
  },
  price: {
    type: Number,
    required: [true, 'Please add price'],
    min: [0, 'Price cannot be negative']
  },
  cost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  stock: {
    type: Number,
    required: [true, 'Please add stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  images: [{
    public_id: String,
    url: String
  }],
  brand: String,
  model: String,
  specifications: Map,
  features: [String],
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  barcode: String,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    date: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  },
  lowStockAlert: {
    type: Number,
    default: 5
  },
  reorderPoint: {
    type: Number,
    default: 10
  }
}, {
  timestamps: true
});

// No manual index creation - let MongoDB handle it or use migration scripts

// Update average rating when new rating added
productSchema.methods.updateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    return;
  }
  
  const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
  this.averageRating = sum / this.ratings.length;
};

module.exports = mongoose.model('Product', productSchema);