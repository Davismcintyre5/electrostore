const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Load email templates
    this.templates = {};
    this.loadTemplates();
  }

  // Load email templates from files
  loadTemplates() {
    const templateDir = path.join(__dirname, '../templates/emails');
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
      this.createDefaultTemplates(templateDir);
    }

    // Read template files
    const files = fs.readdirSync(templateDir);
    files.forEach(file => {
      if (file.endsWith('.html')) {
        const name = file.replace('.html', '');
        const content = fs.readFileSync(path.join(templateDir, file), 'utf8');
        this.templates[name] = handlebars.compile(content);
      }
    });
  }

  // Create default templates if they don't exist
  createDefaultTemplates(templateDir) {
    const templates = {
      'welcome.html': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{shopName}}!</h1>
            </div>
            <div class="content">
              <h2>Hello {{name}},</h2>
              <p>Thank you for creating an account with us. We're excited to have you on board!</p>
              <p>With your account, you can:</p>
              <ul>
                <li>Track your orders in real-time</li>
                <li>Save your favorite products</li>
                <li>Get exclusive offers and discounts</li>
                <li>Fast checkout with saved addresses</li>
              </ul>
              <p style="text-align: center;">
                <a href="{{shopUrl}}" class="button">Start Shopping</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; {{year}} {{shopName}}. All rights reserved.</p>
              <p>{{shopAddress}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'order-confirmation.html': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .order-item { padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #2563eb; text-align: right; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <h2>Thank you for your order, {{name}}!</h2>
              <p>Your order #{{orderNumber}} has been received and is being processed.</p>
              
              <div class="order-details">
                <h3>Order Details</h3>
                {{#each items}}
                <div class="order-item">
                  <strong>{{name}}</strong> x {{quantity}} - KES {{total}}
                </div>
                {{/each}}
                
                <div class="total">
                  Total: KES {{total}}
                </div>
              </div>
              
              <h3>Shipping Address</h3>
              <p>{{shippingAddress}}</p>
              
              <p style="text-align: center;">
                <a href="{{trackingUrl}}" class="button">Track Order</a>
              </p>
            </div>
            <div class="footer">
              <p>&copy; {{year}} {{shopName}}. All rights reserved.</p>
              <p>{{shopAddress}}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      'password-reset.html': `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
            .warning { color: #dc2626; font-size: 14px; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello {{name}},</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <p style="text-align: center;">
                <a href="{{resetUrl}}" class="button">Reset Password</a>
              </p>
              
              <p>This link will expire in 1 hour.</p>
              
              <p class="warning">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>&copy; {{year}} {{shopName}}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    Object.entries(templates).forEach(([filename, content]) => {
      fs.writeFileSync(path.join(templateDir, filename), content);
    });
  }

  // Send email
  async sendEmail(options) {
    try {
      const { to, subject, template, context, attachments } = options;

      // Use template if provided, otherwise use html
      let html = options.html;
      if (template && this.templates[template]) {
        html = this.templates[template]({
          ...context,
          shopName: process.env.SHOP_NAME || 'ElectroStore',
          shopUrl: process.env.CLIENT_URL,
          shopAddress: process.env.SHOP_ADDRESS || 'Nairobi, Kenya',
          year: new Date().getFullYear()
        });
      }

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'ElectroStore'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email send error:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: `Welcome to ${process.env.SHOP_NAME || 'ElectroStore'}!`,
      template: 'welcome',
      context: {
        name: user.name,
        email: user.email
      }
    });
  }

  // Send order confirmation
  async sendOrderConfirmation(order, user) {
    return this.sendEmail({
      to: user.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      template: 'order-confirmation',
      context: {
        name: user.name,
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.total,
        shippingAddress: order.shippingAddress
      }
    });
  }

  // Send password reset
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name: user.name,
        resetUrl
      }
    });
  }

  // Send invoice
  async sendInvoice(order, user, pdfBuffer) {
    return this.sendEmail({
      to: user.email,
      subject: `Invoice for Order #${order.orderNumber}`,
      template: 'order-confirmation',
      context: {
        name: user.name,
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.total,
        shippingAddress: order.shippingAddress
      },
      attachments: [{
        filename: `invoice-${order.orderNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
  }

  // Send low stock alert
  async sendLowStockAlert(products, adminEmails) {
    const productList = products.map(p => 
      `- ${p.name}: ${p.stock} units left (Alert at: ${p.lowStockAlert})`
    ).join('\n');

    return this.sendEmail({
      to: adminEmails.join(','),
      subject: '⚠️ Low Stock Alert',
      html: `
        <h2>Low Stock Alert</h2>
        <p>The following products are running low on stock:</p>
        <pre>${productList}</pre>
        <p>Please restock as soon as possible.</p>
      `
    });
  }
}

module.exports = new EmailService();