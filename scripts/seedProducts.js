const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const Product = require('../models/Product');

// Sample products (only 5)
const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max',
    category: 'Phones',
    price: 179999,
    cost: 145000,
    stock: 25,
    lowStockAlert: 5,
    reorderPoint: 10,
    description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    sku: 'SKU-IP15PM-001',
    isFeatured: true,
    isActive: true,
    specifications: {
      screen: '6.7-inch Super Retina XDR',
      processor: 'A17 Pro',
      camera: '48MP Main | 12MP Ultrawide | 12MP Telephoto',
      battery: '4422 mAh'
    }
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    category: 'Phones',
    price: 168870,
    cost: 130000,
    stock: 18,
    lowStockAlert: 5,
    reorderPoint: 10,
    description: 'Flagship Android phone with AI features, S Pen, and 200MP camera.',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    sku: 'SKU-SGS24-001',
    isFeatured: true,
    isActive: true,
    specifications: {
      screen: '6.8-inch Dynamic AMOLED 2X',
      processor: 'Snapdragon 8 Gen 3',
      camera: '200MP Main | 12MP Ultrawide | 50MP Telephoto x2',
      battery: '5000 mAh'
    }
  },
  {
    name: 'MacBook Pro 16"',
    category: 'Laptops',
    price: 324870,
    cost: 260000,
    stock: 8,
    lowStockAlert: 3,
    reorderPoint: 5,
    description: 'Powerful laptop with M3 Pro chip, 36GB RAM, 1TB SSD, perfect for professionals.',
    brand: 'Apple',
    model: 'MacBook Pro 16"',
    sku: 'SKU-MBP16-001',
    isFeatured: true,
    isActive: true
  },
  {
    name: 'AirPods Pro (2nd Gen)',
    category: 'Accessories',
    price: 45870,
    cost: 32000,
    stock: 30,
    lowStockAlert: 10,
    reorderPoint: 15,
    description: 'Wireless earbuds with active noise cancellation, transparency mode, and spatial audio.',
    brand: 'Apple',
    model: 'AirPods Pro 2',
    sku: 'SKU-APP2-001',
    isFeatured: true,
    isActive: true
  },
  {
    name: 'iPad Air',
    category: 'Tablets',
    price: 124870,
    cost: 90000,
    stock: 12,
    lowStockAlert: 5,
    reorderPoint: 8,
    description: 'Versatile tablet with M1 chip, 10.9" Liquid Retina display, perfect for work and entertainment.',
    brand: 'Apple',
    model: 'iPad Air',
    sku: 'SKU-IPA-001',
    isFeatured: true,
    isActive: true
  }
];

// Seed products
const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🌱 Seeding 5 sample products...');

    // Clear existing products first
    const deleted = await Product.deleteMany({});
    console.log(`   🗑️  Cleared ${deleted.deletedCount} existing products`);

    // Insert new products
    const products = await Product.insertMany(sampleProducts);
    
    console.log(`\n✅ Successfully seeded ${products.length} products:`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - KES ${product.price.toLocaleString()} (${product.stock} in stock)`);
    });

    console.log('\n📊 Product Summary:');
    console.log(`   Total Products: ${products.length}`);
    console.log(`   Total Value: KES ${products.reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}`);
    console.log(`   Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);

    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run the script
seedProducts();