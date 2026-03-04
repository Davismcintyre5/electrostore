const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const dropAndCreateIndexes = async () => {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('🔄 RESET DATABASE INDEXES');
    console.log('='.repeat(50) + '\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // ===========================================
    // STEP 1: Drop all existing indexes
    // ===========================================
    console.log('📌 STEP 1: Dropping existing indexes...\n');
    
    const collections = ['users', 'products', 'orders', 'customers', 'promotions', 'transactions'];
    
    for (const colName of collections) {
      try {
        const indexes = await db.collection(colName).indexes();
        const userIndexes = indexes.filter(idx => idx.name !== '_id_');
        
        if (userIndexes.length > 0) {
          console.log(`   📍 ${colName}: ${userIndexes.length} index(es) found`);
          for (const idx of userIndexes) {
            await db.collection(colName).dropIndex(idx.name);
            console.log(`      ✅ Dropped: ${idx.name}`);
          }
        } else {
          console.log(`   📍 ${colName}: No indexes to drop`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${colName}: Collection may not exist yet`);
      }
    }

    console.log('\n✅ All indexes dropped\n');

    // ===========================================
    // STEP 2: Create new indexes
    // ===========================================
    console.log('📌 STEP 2: Creating new indexes...\n');

    // Users collection indexes
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true });
      console.log('   ✅ users: email index created');
    } catch (err) {}

    // Products collection indexes
    try {
      await db.collection('products').createIndex({ name: 'text', description: 'text' });
      console.log('   ✅ products: text search index created');
      
      await db.collection('products').createIndex({ category: 1 });
      console.log('   ✅ products: category index created');
      
      await db.collection('products').createIndex({ price: 1 });
      console.log('   ✅ products: price index created');
      
      await db.collection('products').createIndex({ isFeatured: 1 });
      console.log('   ✅ products: featured index created');
      
      await db.collection('products').createIndex({ stock: 1 });
      console.log('   ✅ products: stock index created');
    } catch (err) {}

    // Orders collection indexes
    try {
      await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
      console.log('   ✅ orders: orderNumber unique index created');
      
      await db.collection('orders').createIndex({ user: 1 });
      console.log('   ✅ orders: user index created');
      
      await db.collection('orders').createIndex({ status: 1 });
      console.log('   ✅ orders: status index created');
      
      await db.collection('orders').createIndex({ createdAt: -1 });
      console.log('   ✅ orders: date index created');
      
      await db.collection('orders').createIndex({ paymentStatus: 1 });
      console.log('   ✅ orders: payment status index created');
    } catch (err) {}

    // Customers collection indexes
    try {
      await db.collection('customers').createIndex({ email: 1 });
      console.log('   ✅ customers: email index created');
      
      await db.collection('customers').createIndex({ phone: 1 });
      console.log('   ✅ customers: phone index created');
      
      await db.collection('customers').createIndex({ totalSpent: -1 });
      console.log('   ✅ customers: spending index created');
    } catch (err) {}

    // Promotions collection indexes
    try {
      await db.collection('promotions').createIndex({ code: 1 }, { unique: true, sparse: true });
      console.log('   ✅ promotions: code index created');
      
      await db.collection('promotions').createIndex({ startDate: 1, endDate: 1 });
      console.log('   ✅ promotions: date range index created');
      
      await db.collection('promotions').createIndex({ isActive: 1 });
      console.log('   ✅ promotions: active status index created');
    } catch (err) {}

    // Transactions collection indexes
    try {
      await db.collection('transactions').createIndex({ transactionNumber: 1 }, { unique: true });
      console.log('   ✅ transactions: transactionNumber index created');
      
      await db.collection('transactions').createIndex({ order: 1 });
      console.log('   ✅ transactions: order index created');
      
      await db.collection('transactions').createIndex({ user: 1 });
      console.log('   ✅ transactions: user index created');
      
      await db.collection('transactions').createIndex({ type: 1 });
      console.log('   ✅ transactions: type index created');
      
      await db.collection('transactions').createIndex({ createdAt: -1 });
      console.log('   ✅ transactions: date index created');
    } catch (err) {}

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL INDEXES CREATED SUCCESSFULLY');
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
dropAndCreateIndexes();