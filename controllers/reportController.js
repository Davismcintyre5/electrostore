const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Report = require('../models/Report');
const { generatePDF } = require('../utils/pdfGenerator');
const { generateExcel } = require('../utils/excelGenerator');
const logger = require('../config/logger');

// @desc    Get daily sales report
// @route   GET /api/reports/sales/daily
// @access  Private/Admin/Manager
exports.getDailySalesReport = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: queryDate, $lt: nextDate },
      paymentStatus: 'completed'
    }).populate('items.product');

    const transactions = await Transaction.find({
      createdAt: { $gte: queryDate, $lt: nextDate },
      type: 'sale'
    });

    // Calculate summary
    const summary = {
      totalSales: orders.reduce((sum, o) => sum + o.total, 0),
      totalOrders: orders.length,
      averageOrderValue: orders.length ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
      totalTransactions: transactions.length
    };

    // Sales by payment method
    const byPaymentMethod = {};
    orders.forEach(o => {
      byPaymentMethod[o.paymentMethod] = (byPaymentMethod[o.paymentMethod] || 0) + o.total;
    });

    // Top products
    const productSales = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.total;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      date: queryDate,
      summary,
      byPaymentMethod,
      topProducts,
      orders
    });
  } catch (error) {
    logger.error('Get daily sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get monthly sales report
// @route   GET /api/reports/sales/monthly
// @access  Private/Admin/Manager
exports.getMonthlySalesReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    const queryYear = year || new Date().getFullYear();
    const queryMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startDate = new Date(queryYear, queryMonth, 1);
    const endDate = new Date(queryYear, queryMonth + 1, 1);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      paymentStatus: 'completed'
    });

    // Daily breakdown
    const daily = {};
    let totalRevenue = 0;
    let totalOrders = 0;

    orders.forEach(o => {
      const day = o.createdAt.getDate();
      if (!daily[day]) {
        daily[day] = { revenue: 0, orders: 0 };
      }
      daily[day].revenue += o.total;
      daily[day].orders += 1;
      totalRevenue += o.total;
      totalOrders += 1;
    });

    res.status(200).json({
      success: true,
      month: queryMonth + 1,
      year: queryYear,
      summary: {
        totalRevenue,
        totalOrders,
        averageDaily: totalRevenue / Object.keys(daily).length || 0
      },
      daily
    });
  } catch (error) {
    logger.error('Get monthly sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get yearly sales report
// @route   GET /api/reports/sales/yearly
// @access  Private/Admin/Manager
exports.getYearlySalesReport = async (req, res) => {
  try {
    const { year } = req.query;
    const queryYear = year || new Date().getFullYear();

    const startDate = new Date(queryYear, 0, 1);
    const endDate = new Date(queryYear + 1, 0, 1);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lt: endDate },
      paymentStatus: 'completed'
    });

    // Monthly breakdown
    const monthly = Array(12).fill(null).map(() => ({ revenue: 0, orders: 0 }));

    orders.forEach(o => {
      const month = o.createdAt.getMonth();
      monthly[month].revenue += o.total;
      monthly[month].orders += 1;
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    res.status(200).json({
      success: true,
      year: queryYear,
      summary: {
        totalRevenue,
        totalOrders,
        averageMonthly: totalRevenue / 12,
        bestMonth: monthly.reduce((best, m, i) => m.revenue > (best?.revenue || 0) ? { month: i + 1, ...m } : best, null)
      },
      monthly
    });
  } catch (error) {
    logger.error('Get yearly sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get custom sales report
// @route   POST /api/reports/sales/custom
// @access  Private/Admin/Manager
exports.getCustomSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy, filters } = req.body;

    const query = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      paymentStatus: 'completed'
    };

    // Apply additional filters
    if (filters) {
      if (filters.paymentMethod) {
        query.paymentMethod = filters.paymentMethod;
      }
      if (filters.minAmount) {
        query.total = { $gte: filters.minAmount };
      }
    }

    const orders = await Order.find(query).populate('items.product');

    // Group data
    let groupedData = {};
    
    if (groupBy === 'day') {
      orders.forEach(o => {
        const key = o.createdAt.toISOString().split('T')[0];
        if (!groupedData[key]) {
          groupedData[key] = { revenue: 0, orders: 0, items: 0 };
        }
        groupedData[key].revenue += o.total;
        groupedData[key].orders += 1;
        groupedData[key].items += o.items.reduce((sum, i) => sum + i.quantity, 0);
      });
    } else if (groupBy === 'category') {
      orders.forEach(o => {
        o.items.forEach(item => {
          const category = item.product?.category || 'Uncategorized';
          if (!groupedData[category]) {
            groupedData[category] = { revenue: 0, quantity: 0 };
          }
          groupedData[category].revenue += item.total;
          groupedData[category].quantity += item.quantity;
        });
      });
    }

    const summary = {
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      totalOrders: orders.length,
      totalItems: orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)
    };

    res.status(200).json({
      success: true,
      period: { startDate, endDate },
      summary,
      groupedData,
      orders
    });
  } catch (error) {
    logger.error('Get custom sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get best selling products
// @route   GET /api/reports/products/best-selling
// @access  Private/Admin/Manager
exports.getBestSellingProducts = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bestSelling = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.status(200).json({
      success: true,
      bestSelling
    });
  } catch (error) {
    logger.error('Get best selling products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get low stock report
// @route   GET /api/reports/products/low-stock
// @access  Private/Admin/Manager
exports.getLowStockReport = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockAlert'] }
    });

    const summary = {
      totalLowStock: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      categories: {}
    };

    products.forEach(p => {
      if (!summary.categories[p.category]) {
        summary.categories[p.category] = { count: 0, value: 0 };
      }
      summary.categories[p.category].count += 1;
      summary.categories[p.category].value += p.price * p.stock;
    });

    res.status(200).json({
      success: true,
      summary,
      products
    });
  } catch (error) {
    logger.error('Get low stock report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get inventory report
// @route   GET /api/reports/products/inventory
// @access  Private/Admin/Manager
exports.getInventoryReport = async (req, res) => {
  try {
    const products = await Product.find().sort('category name');

    const summary = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
      totalCost: products.reduce((sum, p) => sum + ((p.cost || p.price) * p.stock), 0),
      totalStock: products.reduce((sum, p) => sum + p.stock, 0)
    };

    // By category
    const byCategory = {};
    products.forEach(p => {
      if (!byCategory[p.category]) {
        byCategory[p.category] = {
          count: 0,
          stock: 0,
          value: 0
        };
      }
      byCategory[p.category].count += 1;
      byCategory[p.category].stock += p.stock;
      byCategory[p.category].value += p.price * p.stock;
    });

    res.status(200).json({
      success: true,
      summary,
      byCategory,
      products
    });
  } catch (error) {
    logger.error('Get inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get top customers
// @route   GET /api/reports/customers/top
// @access  Private/Admin/Manager
exports.getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const customers = await Customer.find()
      .sort('-totalSpent')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      customers
    });
  } catch (error) {
    logger.error('Get top customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get customer acquisition report
// @route   GET /api/reports/customers/acquisition
// @access  Private/Admin/Manager
exports.getCustomerAcquisitionReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const acquisition = await Customer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const total = await Customer.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      total,
      acquisition
    });
  } catch (error) {
    logger.error('Get customer acquisition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get profit & loss report
// @route   GET /api/reports/financial/profit-loss
// @access  Private/Admin/Accountant
exports.getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate && endDate) {
      dateRange.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get all transactions
    const transactions = await Transaction.find(dateRange);

    // Calculate revenue
    const revenue = transactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate cost of goods sold
    const orders = await Order.find({
      ...dateRange,
      paymentStatus: 'completed'
    }).populate('items.product');

    let cogs = 0;
    orders.forEach(o => {
      o.items.forEach(item => {
        const cost = item.product?.cost || item.price * 0.7; // Estimate if no cost
        cogs += cost * item.quantity;
      });
    });

    // Calculate expenses
    const expenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    res.status(200).json({
      success: true,
      period: { startDate, endDate },
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      margin: revenue ? (netProfit / revenue) * 100 : 0
    });
  } catch (error) {
    logger.error('Get profit loss error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get expenses report
// @route   GET /api/reports/financial/expenses
// @access  Private/Admin/Accountant
exports.getExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const query = {
      type: { $in: ['expense', 'withdrawal'] }
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (category) {
      query.category = category;
    }

    const transactions = await Transaction.find(query);

    // Group by category
    const byCategory = {};
    let total = 0;

    transactions.forEach(t => {
      const cat = t.category || 'Other';
      if (!byCategory[cat]) {
        byCategory[cat] = 0;
      }
      byCategory[cat] += t.amount;
      total += t.amount;
    });

    res.status(200).json({
      success: true,
      total,
      byCategory,
      transactions
    });
  } catch (error) {
    logger.error('Get expenses report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Save report
// @route   POST /api/reports/saved
// @access  Private/Admin/Manager
exports.saveReport = async (req, res) => {
  try {
    const report = await Report.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Save report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get saved reports
// @route   GET /api/reports/saved
// @access  Private/Admin/Manager
exports.getSavedReports = async (req, res) => {
  try {
    const reports = await Report.find({ createdBy: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    logger.error('Get saved reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get saved report
// @route   GET /api/reports/saved/:id
// @access  Private/Admin/Manager
exports.getSavedReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Get saved report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update saved report
// @route   PUT /api/reports/saved/:id
// @access  Private/Admin/Manager
exports.updateSavedReport = async (req, res) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Update saved report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete saved report
// @route   DELETE /api/reports/saved/:id
// @access  Private/Admin/Manager
exports.deleteSavedReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    logger.error('Delete saved report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate saved report
// @route   POST /api/reports/saved/:id/generate
// @access  Private/Admin/Manager
exports.generateSavedReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Generate report data based on saved configuration
    let data;
    switch (report.type) {
      case 'sales':
        // Fetch sales data
        break;
      case 'products':
        // Fetch products data
        break;
      // ... other cases
    }

    // Generate file based on format
    if (report.format === 'pdf') {
      const pdf = await generatePDF(report.type, data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${report.name}.pdf`);
      res.send(pdf);
    } else if (report.format === 'excel') {
      const excel = await generateExcel(report.type, data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${report.name}.xlsx`);
      res.send(excel);
    }
  } catch (error) {
    logger.error('Generate saved report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create scheduled report
// @route   POST /api/reports/scheduled
// @access  Private/Admin/Manager
exports.createScheduledReport = async (req, res) => {
  try {
    const { name, type, format, frequency, recipients, filters } = req.body;

    const report = await Report.create({
      name,
      type,
      format,
      filters,
      createdBy: req.user.id,
      scheduled: {
        isScheduled: true,
        frequency,
        recipients,
        nextRun: calculateNextRun(frequency)
      }
    });

    res.status(201).json({
      success: true,
      report
    });
  } catch (error) {
    logger.error('Create scheduled report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper function to calculate next run date
const calculateNextRun = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1));
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7));
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));
    default:
      return new Date(now.setDate(now.getDate() + 1));
  }
};