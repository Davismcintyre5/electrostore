const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
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

// Clear all data except admin users
const clearAllData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing database...');

    // Delete in correct order (respecting references)
    const results = {};

    results.orders = await Order.deleteMany({});
    console.log(`   📦 Orders: ${results.orders.deletedCount} deleted`);

    results.transactions = await Transaction.deleteMany({});
    console.log(`   💰 Transactions: ${results.transactions.deletedCount} deleted`);

    results.withdrawals = await Withdrawal.deleteMany({});
    console.log(`   💸 Withdrawals: ${results.withdrawals.deletedCount} deleted`);

    results.products = await Product.deleteMany({});
    console.log(`   📱 Products: ${results.products.deletedCount} deleted`);

    results.customers = await Customer.deleteMany({});
    console.log(`   👥 Customers: ${results.customers.deletedCount} deleted`);

    results.promotions = await Promotion.deleteMany({});
    console.log(`   🎯 Promotions: ${results.promotions.deletedCount} deleted`);

    results.reports = await Report.deleteMany({});
    console.log(`   📊 Reports: ${results.reports.deletedCount} deleted`);

    results.settings = await Setting.deleteMany({});
    console.log(`   ⚙️ Settings: ${results.settings.deletedCount} deleted`);

    results.shippingRules = await ShippingRule.deleteMany({});
    console.log(`   🚚 Shipping Rules: ${results.shippingRules.deletedCount} deleted`);

    results.notifications = await Notification.deleteMany({});
    console.log(`   🔔 Notifications: ${results.notifications.deletedCount} deleted`);

    results.auditLogs = await AuditLog.deleteMany({});
    console.log(`   📋 Audit Logs: ${results.auditLogs.deletedCount} deleted`);

    // Delete non-admin users only
    results.users = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`   👤 Non-admin users: ${results.users.deletedCount} deleted`);

    // Count remaining admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`   👑 Admin users kept: ${adminCount}`);

    // Reset account
    await Account.deleteMany({});
    await Account.create({
      balance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalWithdrawals: 0
    });
    console.log('   💳 Account reset to zero');

    console.log('\n✅ Database cleared successfully!');
    console.log(`   Admin email: ${process.env.ADMIN_EMAIL}`);
    console.log(`   Admin password: ${process.env.ADMIN_PASSWORD}`);

    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    process.exit(1);
  }
};

// Run the script
clearAllData();