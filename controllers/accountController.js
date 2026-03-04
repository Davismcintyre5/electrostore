const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Notification = require('../models/Notification');
const logger = require('../config/logger');

// @desc    Get account balance
// @route   GET /api/account/balance
// @access  Private
exports.getBalance = async (req, res) => {
  try {
    let account = await Account.findOne();
    
    if (!account) {
      account = await Account.create({});
    }

    res.status(200).json({
      success: true,
      balance: account.balance,
      currency: account.currency,
      lastUpdated: account.lastUpdated
    });
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get account transactions
// @route   GET /api/account/transactions
// @access  Private
exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    const account = await Account.findOne();
    
    if (!account) {
      return res.status(200).json({
        success: true,
        transactions: [],
        total: 0
      });
    }

    const total = account.transactions.length;
    const transactions = await Transaction.find({
      _id: { $in: account.transactions }
    })
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
    logger.error('Get account transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get account summary
// @route   GET /api/account/summary
// @access  Private/Admin/Accountant
exports.getAccountSummary = async (req, res) => {
  try {
    const account = await Account.findOne();
    
    if (!account) {
      return res.status(200).json({
        success: true,
        summary: {
          balance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          totalWithdrawals: 0
        }
      });
    }

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await Transaction.find({
      createdAt: { $gte: today }
    });

    const todayIncome = todayTransactions
      .filter(t => t.type === 'sale' || t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayExpenses = todayTransactions
      .filter(t => t.type === 'expense' || t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        balance: account.balance,
        totalIncome: account.totalIncome,
        totalExpenses: account.totalExpenses,
        totalWithdrawals: account.totalWithdrawals,
        todayIncome,
        todayExpenses,
        netToday: todayIncome - todayExpenses
      }
    });
  } catch (error) {
    logger.error('Get account summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get daily summary
// @route   GET /api/account/daily-summary
// @access  Private/Admin/Accountant
exports.getDailySummary = async (req, res) => {
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
    });

    const income = transactions
      .filter(t => t.type === 'sale' || t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense' || t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      date: queryDate,
      summary: {
        income,
        expenses,
        net: income - expenses,
        transactionCount: transactions.length
      },
      transactions
    });
  } catch (error) {
    logger.error('Get daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get monthly summary
// @route   GET /api/account/monthly-summary
// @access  Private/Admin/Accountant
exports.getMonthlySummary = async (req, res) => {
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
    });

    // Group by day
    const daily = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      const day = t.createdAt.getDate();
      if (!daily[day]) {
        daily[day] = { income: 0, expenses: 0, count: 0 };
      }
      
      if (t.type === 'sale' || t.type === 'deposit') {
        daily[day].income += t.amount;
        totalIncome += t.amount;
      } else {
        daily[day].expenses += t.amount;
        totalExpenses += t.amount;
      }
      daily[day].count += 1;
    });

    res.status(200).json({
      success: true,
      month: queryMonth + 1,
      year: queryYear,
      summary: {
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
        transactionCount: transactions.length
      },
      daily
    });
  } catch (error) {
    logger.error('Get monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Request withdrawal
// @route   POST /api/account/withdrawals
// @access  Private/Admin/Manager
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, purpose, category, paymentMethod, paymentDetails, notes } = req.body;

    // Check if sufficient balance
    const account = await Account.findOne();
    if (!account || account.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient funds'
      });
    }

    const withdrawal = await Withdrawal.create({
      amount,
      purpose,
      category,
      paymentMethod,
      paymentDetails,
      notes,
      requestedBy: req.user.id,
      status: 'pending'
    });

    // Notify admin
    await Notification.create({
      type: 'withdrawal_requested',
      title: 'New Withdrawal Request',
      message: `KES ${amount} requested by ${req.user.name}`,
      isGlobal: true,
      data: { withdrawalId: withdrawal._id }
    });

    res.status(201).json({
      success: true,
      withdrawal
    });
  } catch (error) {
    logger.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get withdrawals
// @route   GET /api/account/withdrawals
// @access  Private/Admin/Accountant
exports.getWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query)
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      withdrawals
    });
  } catch (error) {
    logger.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Approve withdrawal
// @route   PUT /api/account/withdrawals/:id/approve
// @access  Private/Admin
exports.approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}`
      });
    }

    withdrawal.status = 'approved';
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = Date.now();
    await withdrawal.save();

    // Notify requester
    await Notification.create({
      type: 'withdrawal_approved',
      title: 'Withdrawal Approved',
      message: `Your withdrawal of KES ${withdrawal.amount} has been approved`,
      recipient: withdrawal.requestedBy,
      data: { withdrawalId: withdrawal._id }
    });

    res.status(200).json({
      success: true,
      withdrawal
    });
  } catch (error) {
    logger.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Complete withdrawal
// @route   PUT /api/account/withdrawals/:id/complete
// @access  Private/Admin/Accountant
exports.completeWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    if (withdrawal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal must be approved first'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      type: 'withdrawal',
      amount: withdrawal.amount,
      paymentMethod: withdrawal.paymentMethod,
      user: req.user.id,
      description: withdrawal.purpose,
      category: withdrawal.category,
      status: 'completed'
    });

    // Update withdrawal
    withdrawal.status = 'completed';
    withdrawal.completedAt = Date.now();
    withdrawal.transaction = transaction._id;
    await withdrawal.save();

    // Update account
    const account = await Account.findOne();
    if (account) {
      account.updateBalance(withdrawal.amount, 'debit');
      account.totalWithdrawals += withdrawal.amount;
      account.transactions.push(transaction._id);
      await account.save();
    }

    // Notify requester
    await Notification.create({
      type: 'withdrawal_completed',
      title: 'Withdrawal Completed',
      message: `Your withdrawal of KES ${withdrawal.amount} has been processed`,
      recipient: withdrawal.requestedBy,
      data: { withdrawalId: withdrawal._id }
    });

    res.status(200).json({
      success: true,
      withdrawal,
      transaction
    });
  } catch (error) {
    logger.error('Complete withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel withdrawal
// @route   PUT /api/account/withdrawals/:id/cancel
// @access  Private
exports.cancelWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    // Check if user owns the request or is admin
    if (withdrawal.requestedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel processed withdrawal'
      });
    }

    withdrawal.status = 'cancelled';
    await withdrawal.save();

    res.status(200).json({
      success: true,
      message: 'Withdrawal cancelled successfully'
    });
  } catch (error) {
    logger.error('Cancel withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};