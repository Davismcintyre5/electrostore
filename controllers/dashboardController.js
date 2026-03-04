const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const logger = require('../config/logger');

// @desc    Get admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private/Admin/Manager
exports.getAdminDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Key metrics
    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      totalProducts,
      lowStockProducts,
      totalCustomers,
      newCustomers
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending_payment' }),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Product.countDocuments(),
      Product.countDocuments({ $expr: { $lte: ['$stock', '$lowStockAlert'] } }),
      Customer.countDocuments(),
      Customer.countDocuments({ createdAt: { $gte: today } })
    ]);

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(5);

    // Top products
    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    // Sales chart data (last 7 days)
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dailySales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
            paymentStatus: 'completed'
          }
        },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      salesChart.push({
        date: date.toISOString().split('T')[0],
        sales: dailySales[0]?.total || 0
      });
    }

    res.status(200).json({
      success: true,
      metrics: {
        orders: {
          total: totalOrders,
          pending: pendingOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          today: todayRevenue[0]?.total || 0
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        customers: {
          total: totalCustomers,
          newToday: newCustomers
        }
      },
      recentOrders,
      topProducts,
      salesChart
    });
  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get staff dashboard
// @route   GET /api/dashboard/staff
// @access  Private/Staff
exports.getStaffDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's tasks
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['pending_payment', 'submitted', 'processing'] }
    });

    const ordersToProcess = await Order.find({
      status: { $in: ['submitted', 'processing'] }
    })
      .sort('createdAt')
      .limit(10);

    const lowStockItems = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockAlert'] }
    });

    const todaySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          paymentStatus: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        pendingOrders,
        lowStockItems,
        todaySales: todaySales[0]?.total || 0
      },
      ordersToProcess
    });
  } catch (error) {
    logger.error('Get staff dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer dashboard
// @route   GET /api/dashboard/customer
// @access  Private
exports.getCustomerDashboard = async (req, res) => {
  try {
    const customer = await Customer.findOne({ user: req.user.id });

    const recentOrders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .limit(5);

    const orderStats = await Order.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    const wishlist = await Product.find({
      _id: { $in: req.user.wishlist || [] }
    });

    res.status(200).json({
      success: true,
      customer: customer || null,
      stats: {
        totalOrders: recentOrders.length,
        totalSpent: customer?.totalSpent || 0,
        orderStats
      },
      recentOrders,
      wishlist
    });
  } catch (error) {
    logger.error('Get customer dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get sales chart data
// @route   GET /api/dashboard/charts/sales
// @access  Private/Admin/Manager
exports.getSalesChartData = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let startDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      paymentStatus: 'completed'
    }).sort('createdAt');

    // Group by date
    const data = {};
    orders.forEach(o => {
      const date = o.createdAt.toISOString().split('T')[0];
      if (!data[date]) {
        data[date] = { sales: 0, orders: 0 };
      }
      data[date].sales += o.total;
      data[date].orders += 1;
    });

    const chartData = Object.entries(data).map(([date, values]) => ({
      date,
      ...values
    }));

    res.status(200).json({
      success: true,
      period,
      data: chartData
    });
  } catch (error) {
    logger.error('Get sales chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get orders chart data
// @route   GET /api/dashboard/charts/orders
// @access  Private/Admin/Manager
exports.getOrdersChartData = async (req, res) => {
  try {
    const statuses = ['pending_payment', 'submitted', 'processing', 'dispatched', 'transit', 'arrived', 'collection', 'completed', 'cancelled'];
    
    const data = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$total' }
        }
      }
    ]);

    const chartData = statuses.map(status => {
      const found = data.find(d => d._id === status);
      return {
        status,
        count: found?.count || 0,
        total: found?.total || 0
      };
    });

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    logger.error('Get orders chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get products chart data
// @route   GET /api/dashboard/charts/products
// @access  Private/Admin/Manager
exports.getProductsChartData = async (req, res) => {
  try {
    const products = await Product.find();
    
    const byCategory = {};
    products.forEach(p => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = { count: 0, stock: 0, value: 0 };
      }
      byCategory[p.category].count += 1;
      byCategory[p.category].stock += p.stock;
      byCategory[p.category].value += p.price * p.stock;
    });

    const chartData = Object.entries(byCategory).map(([category, data]) => ({
      category,
      ...data
    }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    logger.error('Get products chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customers chart data
// @route   GET /api/dashboard/charts/customers
// @access  Private/Admin/Manager
exports.getCustomersChartData = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const chartData = customers.map(c => ({
      period: `${c._id.year}-${c._id.month.toString().padStart(2, '0')}`,
      newCustomers: c.count
    }));

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    logger.error('Get customers chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get top products widget
// @route   GET /api/dashboard/widgets/top-products
// @access  Private/Admin/Manager
exports.getTopProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.total' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      products: topProducts
    });
  } catch (error) {
    logger.error('Get top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get recent orders widget
// @route   GET /api/dashboard/widgets/recent-orders
// @access  Private
exports.getRecentOrders = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const orders = await Order.find()
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      orders
    });
  } catch (error) {
    logger.error('Get recent orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get upcoming deliveries widget
// @route   GET /api/dashboard/widgets/upcoming-deliveries
// @access  Private/Admin/Staff
exports.getUpcomingDeliveries = async (req, res) => {
  try {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const deliveries = await Order.find({
      status: { $in: ['dispatched', 'transit'] },
      estimatedDelivery: { $gte: today, $lte: nextWeek }
    })
      .populate('user', 'name phone')
      .sort('estimatedDelivery');

    res.status(200).json({
      success: true,
      deliveries
    });
  } catch (error) {
    logger.error('Get upcoming deliveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get low stock alerts widget
// @route   GET /api/dashboard/widgets/low-stock-alerts
// @access  Private/Admin/Manager
exports.getLowStockAlerts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockAlert'] }
    }).select('name stock lowStockAlert category');

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    logger.error('Get low stock alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};