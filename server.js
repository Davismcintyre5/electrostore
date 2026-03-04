const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');

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

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');
const { securityMiddleware } = require('./middleware/sanitize');
// Rate limiter removed - not needed for Pxxl App

// Initialize express app
const app = express();
const server = http.createServer(app);

// ===========================================
// E - COMMERCE SERVER
// ===========================================
console.log('\n' + '='.repeat(43));
console.log('E - COMMERCE SERVER');
console.log('='.repeat(43) + '\n');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: corsOrigin.split(','),
  credentials: true
}));

// Request logging
app.use(requestLogger);

// Apply security middleware (sanitization only - no rate limiting)
app.use(securityMiddleware);

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
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Debug endpoint (remove in production)
app.get('/debug', (req, res) => {
  res.json({
    node_version: process.version,
    environment: process.env.NODE_ENV,
    mongodb_uri_set: !!process.env.MONGODB_URI,
    port: process.env.PORT,
    cors_origin: process.env.CORS_ORIGIN,
    memory: process.memoryUsage(),
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
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.set('strictQuery', false);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default admin
    await initializeAdmin();
    
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('⏳ Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
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
      console.log('👑 Default admin created successfully');
    } else {
      console.log('👑 Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Admin initialization error:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server started successfully!`);
      console.log(`📌 Port: ${PORT}`);
      console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💰 M-Pesa: ${process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'}`);
      console.log(`\n📍 Customer Portal: http://localhost:${PORT}`);
      console.log(`📍 Admin Dashboard: http://localhost:${PORT}/admin`);
      console.log(`📍 Health Check: http://localhost:${PORT}/health`);
      console.log('\n' + '='.repeat(43) + '\n');
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error(`❌ Server startup error: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('⏳ Retrying server start in 5 seconds...');
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n\n📴 Received shutdown signal, closing connections...');
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      console.log('👋 Goodbye!');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    // Don't exit in production, just log
    console.error(err);
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  if (process.env.NODE_ENV === 'production') {
    // Don't exit in production, just log
    console.error(err);
  } else {
    process.exit(1);
  }
});

// Start the server only if not in Vercel environment
if (process.env.VERCEL !== '1') {
  startServer();
}

module.exports = { app, server };