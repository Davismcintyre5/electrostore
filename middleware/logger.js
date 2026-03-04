const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const logger = require('../config/logger');

// Create logs directory if it doesn't exist
const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a rotating write stream for access logs
const accessLogStream = rfs.createStream('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory,
  maxFiles: 30, // keep 30 days of logs
  compress: 'gzip' // compress rotated files
});

// Custom token for response time
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1000 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user._id : 'guest';
});

// Custom token for request body (for debugging)
morgan.token('request-body', (req) => {
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }
  return '';
});

// Development format
const devFormat = ':method :url :status :response-time-ms ms - :res[content-length] :user-id';

// Production format (JSON)
const prodFormat = (tokens, req, res) => {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time-ms'](req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    userId: tokens['user-id'](req, res),
    ip: req.ip,
    userAgent: tokens['user-agent'](req, res),
    referrer: tokens.referrer(req, res)
  });
};

// Console logger (development)
const consoleLogger = morgan(devFormat, {
  skip: (req, res) => process.env.NODE_ENV === 'production' || res.statusCode < 400,
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

// File logger (all requests)
const fileLogger = morgan(prodFormat, {
  stream: accessLogStream,
  skip: (req) => req.path === '/health' || req.path === '/'
});

// Error logger (only errors)
const errorLogger = morgan(devFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      logger.error(message.trim());
    }
  }
});

// Request logger middleware
const requestLogger = (req, res, next) => {
  // Add timestamp
  req._startAt = process.hrtime();

  // Log request for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`${req.method} ${req.originalUrl}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip
    });
  }

  next();
};

module.exports = {
  consoleLogger,
  fileLogger,
  errorLogger,
  requestLogger
};