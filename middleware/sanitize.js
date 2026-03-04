const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');

// MongoDB sanitization - prevents injection attacks
const sanitizeMongo = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Attempted MongoDB injection: ${key}`, { 
      url: req.originalUrl,
      ip: req.ip 
    });
  }
});

// XSS sanitization - prevents cross-site scripting
const sanitizeXSS = xss();

// HTTP Parameter Pollution protection
const sanitizeHPP = hpp({
  whitelist: [
    'sort',
    'fields',
    'page',
    'limit',
    'category',
    'status',
    'minPrice',
    'maxPrice'
  ]
});

// Custom sanitization for request body
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    // Remove any $ or . from keys (MongoDB operators)
    Object.keys(req.body).forEach(key => {
      if (key.includes('$') || key.includes('.')) {
        delete req.body[key];
      }
    });

    // Sanitize string values
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove HTML tags
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
        // Escape special characters
        req.body[key] = req.body[key]
          .replace(/[&<>"]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
          });
      }
    });
  }
  next();
};

// Custom sanitization for query parameters
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Convert numeric strings to numbers
        if (!isNaN(req.query[key]) && req.query[key] !== '') {
          req.query[key] = Number(req.query[key]);
        }
        // Convert 'true'/'false' to boolean
        if (req.query[key] === 'true') req.query[key] = true;
        if (req.query[key] === 'false') req.query[key] = false;
      }
    });
  }
  next();
};

// HTML sanitization for rich text fields
const sanitizeHTML = (fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          // Allow basic HTML but remove dangerous tags
          req.body[field] = req.body[field]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/g, '')
            .replace(/javascript:/gi, '');
        }
      });
    }
    next();
  };
};

// Apply all security middleware
const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", 'https://api.safaricom.co.ke']
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }),
  sanitizeMongo,
  sanitizeXSS,
  sanitizeHPP,
  sanitizeBody,
  sanitizeQuery
];

module.exports = {
  sanitizeMongo,
  sanitizeXSS,
  sanitizeHPP,
  sanitizeBody,
  sanitizeQuery,
  sanitizeHTML,
  securityMiddleware
};