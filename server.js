const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./config/socket');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const promotionRoutes = require('./routes/promotions');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const accountRoutes = require('./routes/account');
const reportRoutes = require('./routes/reports');
const settingRoutes = require('./routes/settings');
const shippingRoutes = require('./routes/shipping');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');
const dashboardRoutes = require('./routes/dashboard');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
app.set('io', io);

// ===========================================
// E - COMMERCE SERVER
// ===========================================
console.log('\n' + '='.repeat(43));
console.log('E - COMMERCE SERVER');
console.log('='.repeat(43) + '\n');

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Admin route - serve admin dashboard
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Catch-all route - serve customer portal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    mongoose.set('strictQuery', false);
    console.log('DB: Connected');
    
    // Initialize default admin
    await initializeAdmin();
    
    return true;
  } catch (error) {
    console.error(`DB: Connection Failed - ${error.message}`);
    process.exit(1);
  }
};

// Initialize default admin
const initializeAdmin = async () => {
  try {
    const User = require('./models/User');
    
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        isAdmin: true,
        isActive: true
      });
      console.log('👑 Default admin created');
    }
  } catch (error) {
    console.error('Admin initialization error:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Port: ${PORT}`);
      console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`M-Pesa: ${process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'}`);
      console.log('='.repeat(43) + '\n');
      console.log('✅ MongoDB Connected');
      console.log(`📍 Customer Portal: http://localhost:${PORT}`);
      console.log(`📍 Admin Dashboard: http://localhost:${PORT}/admin`);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n\nReceived shutdown signal, closing connections...');
  
  try {
    // Close socket connections
    const io = app.get('io');
    if (io) {
      io.close(() => {
        console.log('Socket.IO server closed');
      });
    }
    
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start the server
startServer();

module.exports = { app, server };