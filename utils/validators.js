class Validators {
  // Email validation
  isEmail(email) {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  // Phone number validation (Kenyan format)
  isKenyanPhone(phone) {
    const phoneRegex = /^(?:(?:\+|0{0,2})254|0)?[17]\d{8}$/;
    return phoneRegex.test(phone);
  }

  // Password strength validation
  isStrongPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  // M-Pesa number validation
  isMpesaNumber(number) {
    const mpesaRegex = /^(?:(?:\+|0{0,2})254|0)?[17]\d{8}$/;
    return mpesaRegex.test(number);
  }

  // URL validation
  isUrl(url) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return urlRegex.test(url);
  }

  // Product price validation
  isValidPrice(price) {
    const num = parseFloat(price);
    return !isNaN(num) && num > 0 && num <= 10000000;
  }

  // Quantity validation
  isValidQuantity(quantity) {
    const num = parseInt(quantity);
    return !isNaN(num) && num > 0 && num <= 1000;
  }

  // Date validation
  isValidDate(date) {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  }

  // Date range validation
  isValidDateRange(startDate, endDate, maxDays = 365) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (!this.isValidDate(start) || !this.isValidDate(end)) {
      return false;
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return start <= end && diffDays <= maxDays;
  }

  // UUID validation
  isUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  // Mongo ID validation
  isMongoId(id) {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    return mongoIdRegex.test(id);
  }

  // Order number validation (e.g., ORD202312010001)
  isOrderNumber(orderNumber) {
    const orderRegex = /^ORD\d{12}$/;
    return orderRegex.test(orderNumber);
  }

  // Credit card validation (Luhn algorithm)
  isCreditCard(cardNumber) {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }
    
    let sum = 0;
    let alternate = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let n = parseInt(cleaned.charAt(i));
      
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }
      
      sum += n;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  }

  // Amount validation
  isValidAmount(amount) {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= 0 && num <= 1000000000;
  }

  // Percentage validation
  isValidPercentage(percentage) {
    const num = parseFloat(percentage);
    return !isNaN(num) && num >= 0 && num <= 100;
  }

  // Integer validation
  isInteger(value) {
    const num = parseInt(value);
    return !isNaN(num) && num === parseFloat(value);
  }

  // Positive integer validation
  isPositiveInteger(value) {
    const num = parseInt(value);
    return this.isInteger(value) && num > 0;
  }

  // Alpha validation (only letters)
  isAlpha(value) {
    const alphaRegex = /^[a-zA-Z\s]+$/;
    return alphaRegex.test(value);
  }

  // Alphanumeric validation
  isAlphanumeric(value) {
    const alnumRegex = /^[a-zA-Z0-9\s]+$/;
    return alnumRegex.test(value);
  }

  // IP address validation
  isIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  // JSON validation
  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Base64 validation
  isBase64(str) {
    const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    return base64Regex.test(str);
  }

  // File extension validation
  hasValidExtension(filename, allowedExtensions) {
    const ext = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(ext);
  }

  // File size validation
  isValidFileSize(size, maxSize) {
    return size <= maxSize;
  }

  // Age validation (must be >= 18)
  isValidAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age >= 18;
  }

  // Future date validation
  isFutureDate(date) {
    const d = new Date(date);
    const today = new Date();
    return d > today;
  }

  // Past date validation
  isPastDate(date) {
    const d = new Date(date);
    const today = new Date();
    return d < today;
  }
}

module.exports = new Validators();