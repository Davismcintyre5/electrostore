module.exports = {
  // User roles
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    STAFF: 'staff',
    CUSTOMER: 'customer'
  },

  // Order statuses
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    SUBMITTED: 'submitted',
    PROCESSING: 'processing',
    DISPATCHED: 'dispatched',
    TRANSIT: 'transit',
    ARRIVED: 'arrived',
    COLLECTION: 'collection',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'Cash',
    CARD: 'Card',
    MPESA: 'M-PESA',
    BANK_TRANSFER: 'Bank Transfer'
  },

  // Payment statuses
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },

  // Transaction types
  TRANSACTION_TYPES: {
    SALE: 'sale',
    WITHDRAWAL: 'withdrawal',
    REFUND: 'refund',
    DEPOSIT: 'deposit',
    EXPENSE: 'expense'
  },

  // Product categories
  PRODUCT_CATEGORIES: [
    'Phones',
    'Laptops',
    'Accessories',
    'Tablets',
    'Audio',
    'Wearables',
    'Gaming',
    'Cameras',
    'Networking',
    'Storage'
  ],

  // Promotion types
  PROMOTION_TYPES: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    BOGO: 'bogo',
    SHIPPING: 'shipping'
  },

  // Shipping rule types
  SHIPPING_RULE_TYPES: {
    FLAT_RATE: 'flat_rate',
    FREE_SHIPPING: 'free_shipping',
    MIN_AMOUNT: 'min_amount',
    WEIGHT_BASED: 'weight_based',
    LOCATION_BASED: 'location_based',
    CATEGORY_BASED: 'category_based',
    PRODUCT_BASED: 'product_based'
  },

  // Notification types
  NOTIFICATION_TYPES: {
    ORDER_CREATED: 'order_created',
    ORDER_STATUS_CHANGED: 'order_status_changed',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_FAILED: 'payment_failed',
    REFUND_PROCESSED: 'refund_processed',
    LOW_STOCK: 'low_stock',
    CUSTOMER_REGISTERED: 'customer_registered',
    WITHDRAWAL_REQUESTED: 'withdrawal_requested',
    WITHDRAWAL_PROCESSED: 'withdrawal_processed',
    SYSTEM_ALERT: 'system_alert'
  },

  // Report types
  REPORT_TYPES: {
    SALES: 'sales',
    PRODUCTS: 'products',
    CUSTOMERS: 'customers',
    ORDERS: 'orders',
    INVENTORY: 'inventory',
    FINANCIAL: 'financial',
    PERFORMANCE: 'performance',
    CUSTOM: 'custom'
  },

  // Report formats
  REPORT_FORMATS: {
    PDF: 'pdf',
    EXCEL: 'excel',
    CSV: 'csv',
    HTML: 'html'
  },

  // Withdrawal categories
  WITHDRAWAL_CATEGORIES: [
    'Rent',
    'Salaries',
    'Supplies',
    'Utilities',
    'Marketing',
    'Maintenance',
    'Transport',
    'Taxes',
    'Other'
  ],

  // Settings groups
  SETTINGS_GROUPS: {
    GENERAL: 'general',
    STORE: 'store',
    SHIPPING: 'shipping',
    PAYMENT: 'payment',
    TAX: 'tax',
    EMAIL: 'email',
    NOTIFICATIONS: 'notifications',
    SECURITY: 'security',
    APPEARANCE: 'appearance'
  },

  // Time constants (in milliseconds)
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000
  },

  // Cancellation time limit (1 hour in milliseconds)
  CANCELLATION_TIME_LIMIT: 60 * 60 * 1000,

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // File upload limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },

  // Cache durations (in seconds)
  CACHE_DURATIONS: {
    DEFAULT: 60,
    PRODUCTS: 300,
    STATS: 1800,
    USER: 600
  },

  // API rate limits
  RATE_LIMITS: {
    GENERAL: 100, // requests per 15 minutes
    AUTH: 10, // requests per hour
    ORDERS: 20, // orders per hour per user
    PAYMENTS: 10 // payment attempts per hour
  },

  // Currency
  CURRENCY: {
    CODE: 'KES',
    SYMBOL: 'KES',
    LOCALE: 'en-KE'
  },

  // Tax rates
  TAX_RATES: {
    VAT: 16, // 16% VAT
    NONE: 0
  },

  // Default shipping fee
  DEFAULT_SHIPPING_FEE: 500,

  // Minimum stock alert
  DEFAULT_LOW_STOCK_ALERT: 5,

  // Reorder point
  DEFAULT_REORDER_POINT: 10,

  // Order number prefix
  ORDER_NUMBER_PREFIX: 'ORD',

  // Transaction number prefix
  TRANSACTION_NUMBER_PREFIX: 'TRX',

  // Withdrawal number prefix
  WITHDRAWAL_NUMBER_PREFIX: 'WD',

  // Customer number prefix
  CUSTOMER_NUMBER_PREFIX: 'CUST',

  // Product SKU prefix
  PRODUCT_SKU_PREFIX: 'SKU',

  // Promotion code prefix
  PROMO_CODE_PREFIX: 'PROMO',

  // System
  SYSTEM: {
    NAME: 'ElectroStore',
    VERSION: '1.0.0',
    API_VERSION: 'v1'
  }
};