class CurrencyHelpers {
  constructor() {
    this.currency = 'KES';
    this.locale = 'en-KE';
    this.rates = new Map(); // For exchange rates if needed
  }

  // Format amount as currency
  format(amount, options = {}) {
    const {
      currency = this.currency,
      locale = this.locale,
      minimumFractionDigits = 0,
      maximumFractionDigits = 2
    } = options;

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    });

    return formatter.format(amount);
  }

  // Parse currency string to number
  parse(currencyString) {
    if (typeof currencyString === 'number') return currencyString;
    
    // Remove currency symbol and commas, then parse
    const cleaned = currencyString
      .replace(/[^0-9.-]/g, '')
      .replace(/,/g, '');
    
    return parseFloat(cleaned) || 0;
  }

  // Add two amounts
  add(a, b) {
    const numA = this.parse(a);
    const numB = this.parse(b);
    return numA + numB;
  }

  // Subtract amounts
  subtract(a, b) {
    const numA = this.parse(a);
    const numB = this.parse(b);
    return numA - numB;
  }

  // Multiply amount
  multiply(amount, factor) {
    const num = this.parse(amount);
    return num * factor;
  }

  // Divide amount
  divide(amount, divisor) {
    const num = this.parse(amount);
    if (divisor === 0) return 0;
    return num / divisor;
  }

  // Calculate percentage
  percentage(amount, percent) {
    const num = this.parse(amount);
    return (num * percent) / 100;
  }

  // Calculate tax
  calculateTax(amount, taxRate) {
    const num = this.parse(amount);
    const tax = (num * taxRate) / 100;
    return {
      amount: num,
      tax,
      total: num + tax,
      rate: taxRate
    };
  }

  // Calculate discount
  calculateDiscount(amount, discountRate, isPercentage = true) {
    const num = this.parse(amount);
    
    if (isPercentage) {
      const discount = (num * discountRate) / 100;
      return {
        original: num,
        discount,
        discounted: num - discount,
        rate: discountRate
      };
    } else {
      return {
        original: num,
        discount: discountRate,
        discounted: num - discountRate
      };
    }
  }

  // Split amount
  split(amount, parts) {
    const num = this.parse(amount);
    const each = Math.floor((num * 100) / parts) / 100;
    const remainder = num - (each * (parts - 1));
    
    return Array(parts - 1).fill(each).concat(remainder);
  }

  // Round to nearest (e.g., round to nearest 100)
  roundToNearest(amount, nearest = 1) {
    const num = this.parse(amount);
    return Math.round(num / nearest) * nearest;
  }

  // Convert to words (basic implementation)
  toWords(amount) {
    const num = this.parse(amount);
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convert = (n) => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        return tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
      }
      if (n < 1000) {
        return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100);
      }
      if (n < 1000000) {
        return convert(Math.floor(n / 1000)) + ' Thousand ' + convert(n % 1000);
      }
      return 'Number too large';
    };
    
    const [whole, decimal] = num.toFixed(2).split('.');
    const words = convert(parseInt(whole)) + ' Shillings';
    
    if (parseInt(decimal) > 0) {
      return words + ' and ' + convert(parseInt(decimal)) + ' Cents';
    }
    
    return words;
  }

  // Validate amount
  isValid(amount) {
    const num = this.parse(amount);
    return !isNaN(num) && isFinite(num) && num >= 0;
  }

  // Compare amounts (for sorting)
  compare(a, b) {
    const numA = this.parse(a);
    const numB = this.parse(b);
    
    if (numA < numB) return -1;
    if (numA > numB) return 1;
    return 0;
  }

  // Format for display in table
  formatTable(amount) {
    const num = this.parse(amount);
    return num.toLocaleString(this.locale);
  }

  // Format as compact (e.g., 1.2K, 3.5M)
  formatCompact(amount) {
    const num = this.parse(amount);
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  // Set exchange rate
  setRate(fromCurrency, toCurrency, rate) {
    const key = `${fromCurrency}_${toCurrency}`;
    this.rates.set(key, rate);
  }

  // Convert currency
  convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    const key = `${fromCurrency}_${toCurrency}`;
    const rate = this.rates.get(key);
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }
    
    const num = this.parse(amount);
    return num * rate;
  }
}

module.exports = new CurrencyHelpers();