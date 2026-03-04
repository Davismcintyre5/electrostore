const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');

// Reset database (clear and seed)
const resetDatabase = async () => {
  try {
    console.log('🔄 Database Reset Tool');
    console.log('======================');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Get admin count
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    if (adminCount === 0) {
      console.log('⚠️  No admin users found. They will be created during seed.');
    } else {
      console.log(`Found ${adminCount} admin user(s) that will be preserved.`);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB\n');

    // Run clear script
    console.log('Step 1: Clearing database...');
    await execPromise('node scripts/clearData.js', {
      stdio: 'inherit'
    });

    // Run seed script
    console.log('\nStep 2: Seeding database...');
    await execPromise('node scripts/seedData.js', {
      stdio: 'inherit'
    });

    console.log('\n✅ Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();