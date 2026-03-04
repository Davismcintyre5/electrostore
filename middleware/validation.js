const { validationResult } = require('express-validator');

// Validation result checker
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Custom validators
const validators = {
  // Phone number validation (Kenyan format)
  isKenyanPhone: (value) => {
    const phoneRegex = /^(?:(?:\+|0{0,2})254|0)?[17]\d{8}$/;
    return phoneRegex.test(value);
  },

  // Password strength
  isStrongPassword: (value) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(value);
  },

  // M-Pesa number format
  isMpesaNumber: (value) => {
    const mpesaRegex = /^(?:(?:\+|0{0,2})254|0)?[17]\d{8}$/;
    return mpesaRegex.test(value);
  },

  // Email validation
  isEmail: (value) => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(value);
  },

  // Product price
  isValidPrice: (value) => {
    return value > 0 && value <= 10000000; // Max 10 million
  },

  // Order quantity
  isValidQuantity: (value) => {
    return value > 0 && value <= 1000; // Max 1000 units per item
  },

  // Date range
  isValidDateRange: (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end && (end - start) <= 365 * 24 * 60 * 60 * 1000; // Max 1 year
  }
};

// Sanitizers
const sanitizers = {
  // Trim and lowercase email
  normalizeEmail: (value) => {
    return value ? value.trim().toLowerCase() : value;
  },

  // Format phone number to international format
  formatPhoneNumber: (value) => {
    if (!value) return value;
    
    // Remove all non-digits
    let cleaned = value.replace(/\D/g, '');
    
    // Convert to 254 format
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.slice(1);
    }
    
    return cleaned;
  },

  // Convert to number
  toNumber: (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  },

  // Trim whitespace
  trim: (value) => {
    return typeof value === 'string' ? value.trim() : value;
  },

  // Convert empty strings to null
  emptyToNull: (value) => {
    return value === '' ? null : value;
  }
};

module.exports = {
  validate,
  validators,
  sanitizers
};