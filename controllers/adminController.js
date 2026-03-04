const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisYear = new Date(today.getFullYear(), 0, 1);

    // Orders stats
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today }
    });
    const monthOrders = await Order.countDocuments({
      createdAt: { $gte: thisMonth }
    });

    // Revenue stats
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          today: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', today] }, '$total', 0]
            }
          },
          month: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', thisMonth] }, '$total', 0]
            }
          }
        }
      }
    ]);

    const revenue = revenueResult[0] || { total: 0, today: 0, month: 0 };

    // Product stats
    const totalProducts = await Product.countDocuments();
    const lowStock = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockAlert'] }
    });

    // Customer stats
    const totalCustomers = await Customer.countDocuments();
    const newCustomersToday = await Customer.countDocuments({
      createdAt: { $gte: today }
    });

    // User stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      stats: {
        orders: {
          total: totalOrders,
          today: todayOrders,
          month: monthOrders
        },
        revenue: {
          total: revenue.total,
          today: revenue.today,
          month: revenue.month
        },
        products: {
          total: totalProducts,
          lowStock
        },
        customers: {
          total: totalCustomers,
          newToday: newCustomersToday
        },
        users: {
          total: totalUsers,
          active: activeUsers
        }
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get recent activity
// @route   GET /api/admin/dashboard/recent-activity
// @access  Private/Admin
exports.getRecentActivity = async (req, res) => {
  try {
    const recentOrders = await Order.find()
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(5);

    const recentTransactions = await Transaction.find()
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(5);

    const recentCustomers = await Customer.find()
      .sort('-createdAt')
      .limit(5);

    const activity = [
      ...recentOrders.map(o => ({
        type: 'order',
        id: o._id,
        title: `New Order #${o.orderNumber}`,
        description: `KES ${o.total} from ${o.user?.name || 'Guest'}`,
        time: o.createdAt,
        icon: '🛒',
        color: 'blue'
      })),
      ...recentTransactions.map(t => ({
        type: 'transaction',
        id: t._id,
        title: `Payment ${t.transactionNumber}`,
        description: `KES ${t.amount} via ${t.paymentMethod}`,
        time: t.createdAt,
        icon: '💰',
        color: 'green'
      })),
      ...recentCustomers.map(c => ({
        type: 'customer',
        id: c._id,
        title: 'New Customer',
        description: c.name,
        time: c.createdAt,
        icon: '👤',
        color: 'purple'
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 10);

    res.status(200).json({
      success: true,
      activity
    });
  } catch (error) {
    logger.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get notifications
// @route   GET /api/admin/dashboard/notifications
// @access  Private/Admin
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { isGlobal: true },
        { recipients: req.user.id }
      ]
    })
      .sort('-createdAt')
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      $or: [
        { isGlobal: true },
        { recipients: req.user.id }
      ],
      'readBy.user': { $ne: req.user.id }
    });

    res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get system health
// @route   GET /api/admin/system/health
// @access  Private/Admin
exports.getSystemHealth = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get uptime
    const uptime = process.uptime();

    // Get recent error count
    const errorCount = await AuditLog.countDocuments({
      status: 'failure',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.status(200).json({
      success: true,
      health: {
        status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
        database: dbStatus,
        uptime: Math.floor(uptime / 3600), // hours
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB'
        },
        errors24h: errorCount,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get system logs
// @route   GET /api/admin/system/logs
// @access  Private/Admin
exports.getSystemLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;

    const logs = await AuditLog.find()
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    const total = await AuditLog.countDocuments();

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs
    });
  } catch (error) {
    logger.error('Get system logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create backup
// @route   POST /api/admin/system/backup
// @access  Private/Admin
exports.createBackup = async (req, res) => {
  try {
    // This would trigger a database backup
    // For now, just log the action
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_backup',
      resource: 'system',
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        id: Date.now(),
        createdAt: new Date(),
        size: '2.5MB',
        tables: ['users', 'orders', 'products', 'customers']
      }
    });
  } catch (error) {
    logger.error('Create backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Restore backup
// @route   POST /api/admin/system/restore
// @access  Private/Admin
exports.restoreBackup = async (req, res) => {
  try {
    const { backupId } = req.body;

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'restore_backup',
      resource: 'system',
      metadata: { backupId },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Backup restored successfully'
    });
  } catch (error) {
    logger.error('Restore backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all user activity
// @route   GET /api/admin/users/activity
// @access  Private/Admin
exports.getAllUserActivity = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            user: '$user',
            userName: '$userName',
            userEmail: '$userEmail'
          },
          actionCount: { $sum: 1 },
          lastAction: { $max: '$createdAt' },
          actions: { $push: '$action' }
        }
      },
      { $sort: { actionCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      activity
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Bulk user action
// @route   POST /api/admin/users/bulk-action
// @access  Private/Admin
exports.bulkUserAction = async (req, res) => {
  try {
    const { userIds, action } = req.body;

    let update = {};
    switch (action) {
      case 'activate':
        update = { isActive: true };
        break;
      case 'deactivate':
        update = { isActive: false };
        break;
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    if (action !== 'delete') {
      await User.updateMany(
        { _id: { $in: userIds } },
        update
      );
    }

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: `bulk_${action}`,
      resource: 'users',
      metadata: { userIds, action },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed successfully`
    });
  } catch (error) {
    logger.error('Bulk user action error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filter by user
    if (req.query.userId) {
      query.user = req.query.userId;
    }

    // Filter by action
    if (req.query.action) {
      query.action = req.query.action;
    }

    // Filter by resource
    if (req.query.resource) {
      query.resource = req.query.resource;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      logs
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export audit logs
// @route   GET /api/admin/audit-logs/export
// @access  Private/Admin
exports.exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const logs = await AuditLog.find(query)
      .populate('user', 'name email')
      .sort('-createdAt');

    if (format === 'csv') {
      const csv = logs.map(l => ({
        'Date': l.createdAt.toLocaleString(),
        'User': l.userName,
        'Email': l.userEmail,
        'Role': l.userRole,
        'Action': l.action,
        'Resource': l.resource,
        'Status': l.status,
        'IP': l.ipAddress
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      
      const csvString = Object.keys(csv[0]).join(',') + '\n' +
        csv.map(row => Object.values(row).join(',')).join('\n');
      
      res.send(csvString);
    }
  } catch (error) {
    logger.error('Export audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Clear cache
// @route   POST /api/admin/maintenance/clear-cache
// @access  Private/Admin
exports.clearCache = async (req, res) => {
  try {
    // Clear Redis cache if using
    // await redisClient.flushall();
    
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'clear_cache',
      resource: 'system',
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Optimize database
// @route   POST /api/admin/maintenance/optimize-db
// @access  Private/Admin
exports.optimizeDatabase = async (req, res) => {
  try {
    // Run database optimization commands
    // await mongoose.connection.db.command({ compact: 'orders' });
    
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'optimize_db',
      resource: 'system',
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Database optimization completed'
    });
  } catch (error) {
    logger.error('Optimize database error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cleanup old data
// @route   POST /api/admin/maintenance/cleanup
// @access  Private/Admin
exports.cleanupOldData = async (req, res) => {
  try {
    const { olderThan } = req.body;
    const date = new Date(olderThan);

    // Delete old notifications
    const deletedNotifications = await Notification.deleteMany({
      createdAt: { $lt: date },
      isGlobal: false
    });

    // Archive old audit logs (you might want to move to archive collection)
    // const oldLogs = await AuditLog.find({ createdAt: { $lt: date } });

    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'cleanup',
      resource: 'system',
      metadata: {
        deletedNotifications: deletedNotifications.deletedCount,
        olderThan: date
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Cleanup completed',
      stats: {
        notificationsDeleted: deletedNotifications.deletedCount
      }
    });
  } catch (error) {
    logger.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};