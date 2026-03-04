const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const Account = require('../models/Account');
const { generatePDF } = require('../utils/pdfGenerator');
const logger = require('../config/logger');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private/Admin/Accountant
exports.getAllTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Filter by payment method
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('user', 'name')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      transactions
    });
  } catch (error) {
    logger.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private/Admin/Accountant
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email')
      .populate('order')
      .populate('customer', 'name email phone');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private/Admin/Accountant
exports.createTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      user: req.user.id
    });

    // Update account balance
    let account = await Account.findOne();
    if (!account) {
      account = await Account.create({});
    }

    if (transaction.type === 'sale' || transaction.type === 'deposit') {
      account.updateBalance(transaction.amount, 'credit');
    } else if (transaction.type === 'withdrawal' || transaction.type === 'expense') {
      account.updateBalance(transaction.amount, 'debit');
    }

    account.transactions.push(transaction._id);
    await account.save();

    res.status(201).json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private/Admin
exports.updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      transaction
    });
  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    logger.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get transaction stats
// @route   GET /api/transactions/stats
// @access  Private/Admin/Accountant
exports.getTransactionStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          sales: {
            $sum: { $cond: [{ $eq: ['$type', 'sale'] }, '$amount', 0] }
          },
          withdrawals: {
            $sum: { $cond: [{ $eq: ['$type', 'withdrawal'] }, '$amount', 0] }
          },
          expenses: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
          }
        }
      }
    ]);

    // Today's transactions
    const todayStats = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // By payment method
    const byMethod = await Transaction.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        avgAmount: 0,
        sales: 0,
        withdrawals: 0,
        expenses: 0
      },
      today: {
        count: todayStats[0]?.count || 0,
        amount: todayStats[0]?.amount || 0
      },
      byMethod
    });
  } catch (error) {
    logger.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get daily transactions
// @route   GET /api/transactions/daily
// @access  Private/Admin/Accountant
exports.getDailyTransactions = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const transactions = await Transaction.find({
      createdAt: {
        $gte: queryDate,
        $lt: nextDate
      }
    }).sort('-createdAt');

    const summary = transactions.reduce((acc, t) => {
      acc.total += t.amount;
      acc.count += 1;
      if (t.type === 'sale') acc.sales += t.amount;
      if (t.type === 'withdrawal') acc.withdrawals += t.amount;
      if (t.type === 'expense') acc.expenses += t.amount;
      return acc;
    }, { total: 0, count: 0, sales: 0, withdrawals: 0, expenses: 0 });

    res.status(200).json({
      success: true,
      date: queryDate,
      summary,
      transactions
    });
  } catch (error) {
    logger.error('Get daily transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get monthly transactions
// @route   GET /api/transactions/monthly
// @access  Private/Admin/Accountant
exports.getMonthlyTransactions = async (req, res) => {
  try {
    const { year, month } = req.query;
    const queryYear = year || new Date().getFullYear();
    const queryMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startDate = new Date(queryYear, queryMonth, 1);
    const endDate = new Date(queryYear, queryMonth + 1, 1);

    const transactions = await Transaction.find({
      createdAt: {
        $gte: startDate,
        $lt: endDate
      }
    }).sort('-createdAt');

    // Group by day
    const daily = {};
    transactions.forEach(t => {
      const day = t.createdAt.getDate();
      if (!daily[day]) {
        daily[day] = { total: 0, count: 0, sales: 0, withdrawals: 0 };
      }
      daily[day].total += t.amount;
      daily[day].count += 1;
      if (t.type === 'sale') daily[day].sales += t.amount;
      if (t.type === 'withdrawal') daily[day].withdrawals += t.amount;
    });

    res.status(200).json({
      success: true,
      month: queryMonth + 1,
      year: queryYear,
      daily,
      total: transactions.reduce((sum, t) => sum + t.amount, 0),
      count: transactions.length
    });
  } catch (error) {
    logger.error('Get monthly transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Export transactions
// @route   GET /api/transactions/export
// @access  Private/Admin/Accountant
exports.exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await Transaction.find(query)
      .populate('user', 'name')
      .populate('order', 'orderNumber')
      .sort('-createdAt');

    if (format === 'csv') {
      // Generate CSV
      const csv = transactions.map(t => ({
        'Transaction #': t.transactionNumber,
        'Date': t.createdAt.toLocaleDateString(),
        'Type': t.type,
        'Amount': t.amount,
        'Payment Method': t.paymentMethod,
        'Status': t.status,
        'Description': t.description,
        'Processed By': t.user?.name || 'System'
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      
      // Convert to CSV string (simplified)
      const csvString = Object.keys(csv[0]).join(',') + '\n' +
        csv.map(row => Object.values(row).join(',')).join('\n');
      
      res.send(csvString);
    } else if (format === 'pdf') {
      // Generate PDF
      const pdf = await generatePDF('transactions', { transactions });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.pdf');
      res.send(pdf);
    }
  } catch (error) {
    logger.error('Export transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Generate receipt
// @route   POST /api/transactions/:id/receipt
// @access  Private
exports.generateReceipt = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('order')
      .populate('user', 'name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Generate receipt PDF
    const receipt = await generatePDF('receipt', { transaction });

    // Save receipt URL
    transaction.receipt = {
      url: `/receipts/${transaction.transactionNumber}.pdf`,
      generated: true
    };
    await transaction.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${transaction.transactionNumber}.pdf`);
    res.send(receipt);
  } catch (error) {
    logger.error('Generate receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Void transaction
// @route   POST /api/transactions/:id/void
// @access  Private/Admin
exports.voidTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    transaction.status = 'cancelled';
    await transaction.save();

    // Reverse account balance
    const account = await Account.findOne();
    if (account) {
      if (transaction.type === 'sale') {
        account.updateBalance(transaction.amount, 'debit');
      } else if (transaction.type === 'withdrawal') {
        account.updateBalance(transaction.amount, 'credit');
      }
      await account.save();
    }

    res.status(200).json({
      success: true,
      message: 'Transaction voided successfully'
    });
  } catch (error) {
    logger.error('Void transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};