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
    SUBMITTED: 'submitted',
    PROCESSING: 'processing',
    DISPATCHED: 'dispatched',
    TRANSIT: 'transit',
    ARRIVED: 'arrived',
    COLLECTION: 'collection',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
  },

  // Payment methods
  PAYMENT_METHODS: {
    CASH: 'Cash',
    CARD: 'Card',
    MPESA: 'M-PESA'
  },

  // Transaction types
  TRANSACTION_TYPES: {
    SALE: 'sale',
    WITHDRAWAL: 'withdrawal',
    REFUND: 'refund',
    DEPOSIT: 'deposit'
  },

  // Cancellation time limit (1 hour in milliseconds)
  CANCELLATION_TIME_LIMIT: 60 * 60 * 1000,

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Notification types
  NOTIFICATION_TYPES: {
    ORDER_CREATED: 'order_created',
    ORDER_STATUS_CHANGED: 'order_status_changed',
    PAYMENT_RECEIVED: 'payment_received',
    REFUND_PROCESSED: 'refund_processed',
    LOW_STOCK: 'low_stock'
  }
};