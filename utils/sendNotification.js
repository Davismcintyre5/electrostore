const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const emailService = require('./emailService');
const smsService = require('./smsService');
const logger = require('../config/logger');

class NotificationService {
  constructor() {
    this.providers = {
      in_app: this.sendInApp.bind(this),
      email: this.sendEmail.bind(this),
      sms: this.sendSms.bind(this),
      push: this.sendPush.bind(this)
    };
  }

  // Send notification through specified channels
  async send(notification, channels = ['in_app']) {
    try {
      const results = {};

      for (const channel of channels) {
        if (this.providers[channel]) {
          try {
            results[channel] = await this.providers[channel](notification);
          } catch (error) {
            logger.error(`Notification error (${channel}):`, error);
            results[channel] = { success: false, error: error.message };
          }
        }
      }

      return results;
    } catch (error) {
      logger.error('Notification service error:', error);
      throw error;
    }
  }

  // Send in-app notification
  async sendInApp(notification) {
    try {
      const savedNotification = await Notification.create({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        recipient: notification.recipient,
        recipients: notification.recipients,
        isGlobal: notification.isGlobal || false,
        data: notification.data,
        priority: notification.priority || 'medium',
        actionUrl: notification.actionUrl,
        expiresAt: notification.expiresAt
      });

      // Emit socket event
      const io = getIO();
      if (notification.isGlobal) {
        io.emit('notification', savedNotification);
      } else if (notification.recipients) {
        notification.recipients.forEach(userId => {
          io.to(`user_${userId}`).emit('notification', savedNotification);
        });
      } else if (notification.recipient) {
        io.to(`user_${notification.recipient}`).emit('notification', savedNotification);
      }

      return { success: true, notification: savedNotification };
    } catch (error) {
      logger.error('In-app notification error:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmail(notification) {
    try {
      const result = await emailService.sendEmail({
        to: notification.email || notification.recipientEmail,
        subject: notification.title,
        template: notification.template,
        context: notification.context || notification.data,
        html: notification.html
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error('Email notification error:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSms(notification) {
    try {
      const result = await smsService.sendSms(
        notification.phone,
        notification.message
      );

      return { success: true, result };
    } catch (error) {
      logger.error('SMS notification error:', error);
      throw error;
    }
  }

  // Send push notification (web push)
  async sendPush(notification) {
    try {
      // Web push implementation would go here
      // This requires web-push library and subscription management
      
      return { success: true, message: 'Push notification sent' };
    } catch (error) {
      logger.error('Push notification error:', error);
      throw error;
    }
  }

  // Order created notification
  async orderCreated(order, user) {
    const notification = {
      type: 'order_created',
      title: 'New Order Received',
      message: `Order #${order.orderNumber} for KES ${order.total}`,
      data: { orderId: order._id, orderNumber: order.orderNumber },
      isGlobal: true,
      priority: 'high'
    };

    // Send to admin panel
    await this.send(notification, ['in_app']);

    // Send email to customer
    if (user?.email) {
      await this.send({
        ...notification,
        recipientEmail: user.email,
        template: 'order-confirmation',
        context: { order, user }
      }, ['email']);
    }

    // Send SMS to customer
    if (user?.phone) {
      await this.send({
        ...notification,
        phone: user.phone,
        message: `Your order #${order.orderNumber} has been received. Total: KES ${order.total}`
      }, ['sms']);
    }
  }

  // Order status updated notification
  async orderStatusUpdated(order, user, oldStatus) {
    const notification = {
      type: 'order_status_changed',
      title: 'Order Status Updated',
      message: `Your order #${order.orderNumber} is now ${order.status}`,
      data: { 
        orderId: order._id, 
        orderNumber: order.orderNumber,
        oldStatus,
        newStatus: order.status
      },
      recipient: user?._id
    };

    // Send in-app
    if (user) {
      await this.send(notification, ['in_app']);
    }

    // Send email
    if (user?.email) {
      await this.send({
        ...notification,
        recipientEmail: user.email,
        html: `
          <h2>Order Status Update</h2>
          <p>Your order #${order.orderNumber} has been updated.</p>
          <p>Status: <strong>${order.status}</strong></p>
          ${order.trackingNumber ? `<p>Tracking Number: ${order.trackingNumber}</p>` : ''}
        `
      }, ['email']);
    }

    // Send SMS
    if (user?.phone) {
      await this.send({
        ...notification,
        phone: user.phone,
        message: `Order #${order.orderNumber} is now ${order.status}`
      }, ['sms']);
    }
  }

  // Payment received notification
  async paymentReceived(transaction, order, user) {
    const notification = {
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of KES ${transaction.amount} received for order #${order.orderNumber}`,
      data: { 
        transactionId: transaction._id,
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: transaction.amount
      }
    };

    // Admin notification
    await this.send({
      ...notification,
      isGlobal: true
    }, ['in_app']);

    // Customer notification
    if (user) {
      await this.send({
        ...notification,
        recipient: user._id,
        message: `Thank you! Your payment of KES ${transaction.amount} for order #${order.orderNumber} has been received.`
      }, ['in_app']);

      if (user.email) {
        await this.send({
          ...notification,
          recipientEmail: user.email,
          html: `
            <h2>Payment Confirmed</h2>
            <p>Your payment of KES ${transaction.amount} for order #${order.orderNumber} has been received successfully.</p>
          `
        }, ['email']);
      }
    }
  }

  // Low stock alert
  async lowStockAlert(products) {
    const productList = products.map(p => p.name).join(', ');
    
    await this.send({
      type: 'low_stock',
      title: '⚠️ Low Stock Alert',
      message: `The following products are running low: ${productList}`,
      data: { products: products.map(p => p._id) },
      isGlobal: true,
      priority: 'high'
    }, ['in_app', 'email']);
  }

  // Withdrawal requested
  async withdrawalRequested(withdrawal, user) {
    await this.send({
      type: 'withdrawal_requested',
      title: 'Withdrawal Request',
      message: `KES ${withdrawal.amount} requested by ${user.name}`,
      data: { withdrawalId: withdrawal._id },
      isGlobal: true,
      priority: 'high'
    }, ['in_app']);
  }

  // Withdrawal processed
  async withdrawalProcessed(withdrawal, user) {
    const notification = {
      type: 'withdrawal_processed',
      title: 'Withdrawal Processed',
      message: `Your withdrawal of KES ${withdrawal.amount} has been ${withdrawal.status}`,
      data: { withdrawalId: withdrawal._id },
      recipient: user._id
    };

    await this.send(notification, ['in_app']);

    if (user.email) {
      await this.send({
        ...notification,
        recipientEmail: user.email,
        html: `
          <h2>Withdrawal ${withdrawal.status}</h2>
          <p>Amount: KES ${withdrawal.amount}</p>
          <p>Status: ${withdrawal.status}</p>
          <p>Purpose: ${withdrawal.purpose}</p>
        `
      }, ['email']);
    }
  }

  // Welcome new customer
  async welcomeCustomer(user) {
    await this.send({
      type: 'customer_registered',
      title: 'Welcome to ElectroStore!',
      message: `Welcome ${user.name}! Thank you for joining us.`,
      recipient: user._id,
      data: { userId: user._id }
    }, ['in_app']);

    if (user.email) {
      await this.send({
        type: 'customer_registered',
        title: 'Welcome to ElectroStore!',
        recipientEmail: user.email,
        template: 'welcome',
        context: { user }
      }, ['email']);
    }

    if (user.phone) {
      await this.send({
        type: 'customer_registered',
        phone: user.phone,
        message: `Welcome ${user.name}! Thank you for joining ElectroStore. Start shopping today!`
      }, ['sms']);
    }
  }

  // System alert
  async systemAlert(message, data = {}) {
    await this.send({
      type: 'system_alert',
      title: '⚠️ System Alert',
      message,
      data,
      isGlobal: true,
      priority: 'urgent'
    }, ['in_app', 'email']);
  }
}

module.exports = new NotificationService();