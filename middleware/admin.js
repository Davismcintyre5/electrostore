const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

// Check if user is admin (simpler version)
exports.isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Check if user is manager or admin
exports.isManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
  }

  if (!['admin', 'manager'].includes(req.user.role) && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Manager access required'
    });
  }

  next();
};

// Log admin actions
exports.logAdminAction = (action) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const startTime = Date.now();

    res.json = function(data) {
      const duration = Date.now() - startTime;

      // Log after response is sent
      if (data.success !== false) {
        AuditLog.create({
          user: req.user?._id,
          userName: req.user?.name,
          userEmail: req.user?.email,
          userRole: req.user?.role,
          action: action || `${req.method} ${req.originalUrl}`,
          resource: req.baseUrl.split('/').pop(),
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          status: 'success',
          duration,
          metadata: {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined
          }
        }).catch(err => logger.error('Audit log error:', err));
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

// Rate limiting for admin routes
const adminRateLimit = new Map();

exports.adminRateLimiter = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 30; // 30 requests per minute

  if (!adminRateLimit.has(ip)) {
    adminRateLimit.set(ip, []);
  }

  const timestamps = adminRateLimit.get(ip).filter(t => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }

  timestamps.push(now);
  adminRateLimit.set(ip, timestamps);
  next();
};