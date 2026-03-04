const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const dropIndexes = async () => {
  try {
    console.log('\n' + '='.repeat(50));
    console.log('🗑️  DROP DATABASE INDEXES');
    console.log('='.repeat(50) + '\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('📊 Found collections:');
    collections.forEach(col => console.log(`   • ${col.name}`));
    console.log('');

    // Drop indexes for each collection
    for (const collection of collections) {
      const colName = collection.name;
      const indexes = await db.collection(colName).indexes();
      
      // Filter out default _id index
      const userIndexes = indexes.filter(idx => idx.name !== '_id_');
      
      if (userIndexes.length > 0) {
        console.log(`🔄 Dropping indexes from ${colName}...`);
        
        for (const idx of userIndexes) {
          try {
            await db.collection(colName).dropIndex(idx.name);
            console.log(`   ✅ Dropped: ${idx.name}`);
          } catch (err) {
            console.log(`   ❌ Failed: ${idx.name} - ${err.message}`);
          }
        }
        console.log('');
      } else {
        console.log(`⏭️  No indexes to drop in ${colName}\n`);
      }
    }

    console.log('='.repeat(50));
    console.log('✅ All indexes dropped successfully');
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error dropping indexes:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Run the script
dropIndexes();