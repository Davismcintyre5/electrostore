const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Promotion = require('../models/Promotion');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Withdrawal = require('../models/Withdrawal');
const Report = require('../models/Report');
const Setting = require('../models/Setting');
const ShippingRule = require('../models/ShippingRule');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const backupData = async () => {
  try {
    console.log('💾 Database Backup Tool');
    console.log('======================');

    // Create backup directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, `../backups/backup-${timestamp}`);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Backup directory: ${backupDir}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Fetch all data
    console.log('\nFetching data...');
    
    const data = {
      users: await User.find().select('-password'),
      products: await Product.find(),
      orders: await Order.find(),
      customers: await Customer.find(),
      promotions: await Promotion.find(),
      transactions: await Transaction.find(),
      account: await Account.find(),
      withdrawals: await Withdrawal.find(),
      reports: await Report.find(),
      settings: await Setting.find(),
      shippingRules: await ShippingRule.find(),
      notifications: await Notification.find(),
      auditLogs: await AuditLog.find(),
      timestamp: new Date(),
      version: '1.0.0'
    };

    // Save to JSON file
    const jsonFile = path.join(backupDir, 'backup.json');
    fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2));
    console.log(`✅ Data saved to: ${jsonFile}`);

    // Create individual collection files
    const collectionsDir = path.join(backupDir, 'collections');
    fs.mkdirSync(collectionsDir);

    Object.entries(data).forEach(([name, items]) => {
      if (Array.isArray(items)) {
        const file = path.join(collectionsDir, `${name}.json`);
        fs.writeFileSync(file, JSON.stringify(items, null, 2));
      }
    });
    console.log(`✅ Collection files saved to: ${collectionsDir}`);

    // Try to create MongoDB dump if mongodump is available
    try {
      console.log('\nAttempting to create MongoDB dump...');
      const dbName = process.env.MONGODB_URI.split('/').pop().split('?')[0];
      const dumpDir = path.join(backupDir, 'dump');
      
      await execPromise(`mongodump --uri="${process.env.MONGODB_URI}" --out="${dumpDir}"`);
      console.log(`✅ MongoDB dump created at: ${dumpDir}`);
    } catch (error) {
      console.log('⚠️  MongoDB dump not created (mongodump may not be installed)');
    }

    // Create metadata file
    const metadata = {
      timestamp: new Date(),
      database: mongoose.connection.name,
      collections: Object.keys(data).filter(k => Array.isArray(data[k])),
      counts: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : 1])
      ),
      version: '1.0.0'
    };

    fs.writeFileSync(
      path.join(backupDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log('\n📊 Backup Summary:');
    Object.entries(metadata.counts).forEach(([key, count]) => {
      console.log(`- ${key}: ${count}`);
    });

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`Backup location: ${backupDir}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating backup:', error);
    process.exit(1);
  }
};

backupData();