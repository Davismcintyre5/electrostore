const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class PDFGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../../public/receipts');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // Generate receipt PDF
  async generateReceipt(order, transaction, settings = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: [226.8, 300], // 80mm width receipt paper
          margin: 10
        });

        const filename = `receipt-${order.orderNumber}-${Date.now()}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Store header
        doc.fontSize(12).font('Helvetica-Bold')
          .text(settings.shopName || 'ElectroStore', { align: 'center' })
          .fontSize(8).font('Helvetica')
          .text(settings.address || 'Nairobi, Kenya', { align: 'center' })
          .text(`Tel: ${settings.phone || '+254 700 000000'}`, { align: 'center' })
          .text(`Email: ${settings.email || 'support@electrostore.com'}`, { align: 'center' })
          .moveDown();

        // Receipt details
        doc.fontSize(8)
          .text('='.repeat(28), { align: 'center' })
          .text(`Receipt No: ${transaction.transactionNumber}`, { align: 'left' })
          .text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: 'left' })
          .text(`Order #: ${order.orderNumber}`, { align: 'left' })
          .text(`Cashier: ${order.user?.name || 'System'}`, { align: 'left' })
          .text('='.repeat(28), { align: 'center' })
          .moveDown(0.5);

        // Items
        doc.font('Helvetica-Bold')
          .text('Item', 10, doc.y)
          .text('Qty', 120, doc.y)
          .text('Price', 150, doc.y)
          .text('Total', 180, doc.y)
          .font('Helvetica');

        doc.moveDown(0.5);
        let y = doc.y;

        order.items.forEach(item => {
          doc.text(item.name.substring(0, 15), 10, y)
            .text(item.quantity.toString(), 120, y)
            .text(item.price.toLocaleString(), 150, y)
            .text(item.total.toLocaleString(), 180, y);
          y += 15;
        });

        doc.y = y;

        // Totals
        doc.moveDown();
        doc.text('='.repeat(28), { align: 'center' });
        doc.font('Helvetica-Bold')
          .text('Subtotal:', 10, doc.y)
          .text(`KES ${order.subtotal.toLocaleString()}`, { align: 'right' });
        
        doc.moveDown(0.5);
        doc.font('Helvetica')
          .text('Shipping:', 10, doc.y)
          .text(`KES ${order.shippingFee.toLocaleString()}`, { align: 'right' });
        
        doc.moveDown(0.5);
        if (order.discount > 0) {
          doc.text('Discount:', 10, doc.y)
            .text(`-KES ${order.discount.toLocaleString()}`, { align: 'right' });
          doc.moveDown(0.5);
        }
        
        doc.font('Helvetica-Bold')
          .fontSize(10)
          .text('TOTAL:', 10, doc.y)
          .text(`KES ${order.total.toLocaleString()}`, { align: 'right' })
          .fontSize(8);

        doc.moveDown();
        doc.text('='.repeat(28), { align: 'center' })
          .text(`Payment Method: ${order.paymentMethod}`, { align: 'left' });
        
        if (order.mpesaDetails?.receiptNumber) {
          doc.text(`M-PESA Receipt: ${order.mpesaDetails.receiptNumber}`, { align: 'left' });
        }

        // Footer
        doc.moveDown()
          .text('Thank you for shopping with us!', { align: 'center' })
          .text('Goods sold are not returnable', { align: 'center', fontSize: 6 })
          .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center', fontSize: 6 });

        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        logger.error('Receipt generation error:', error);
        reject(error);
      }
    });
  }

  // Generate invoice PDF
  async generateInvoice(order, settings = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `invoice-${order.orderNumber}-${Date.now()}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold')
          .text(settings.shopName || 'ElectroStore', 50, 50)
          .fontSize(10).font('Helvetica')
          .text(settings.address || 'Nairobi, Kenya', 50, 80)
          .text(`Tel: ${settings.phone || '+254 700 000000'}`, 50, 95)
          .text(`Email: ${settings.email || 'support@electrostore.com'}`, 50, 110);

        // Invoice title
        doc.fontSize(16).font('Helvetica-Bold')
          .text('INVOICE', 400, 50)
          .fontSize(10).font('Helvetica')
          .text(`Invoice #: INV-${order.orderNumber}`, 400, 80)
          .text(`Date: ${new Date().toLocaleDateString()}`, 400, 95)
          .text(`Order #: ${order.orderNumber}`, 400, 110);

        // Line
        doc.moveTo(50, 140)
          .lineTo(550, 140)
          .stroke();

        // Bill to
        doc.fontSize(12).font('Helvetica-Bold')
          .text('Bill To:', 50, 160)
          .fontSize(10).font('Helvetica')
          .text(order.customer.name, 50, 180)
          .text(order.customer.email, 50, 195)
          .text(order.customer.phone, 50, 210)
          .text(order.shippingAddress?.street || '', 50, 225)
          .text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.country || ''}`, 50, 240);

        // Items table
        const tableTop = 280;
        
        // Table headers
        doc.font('Helvetica-Bold')
          .text('Item', 50, tableTop)
          .text('Quantity', 300, tableTop)
          .text('Price', 400, tableTop)
          .text('Total', 480, tableTop);

        doc.moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Table rows
        let y = tableTop + 25;
        doc.font('Helvetica');

        order.items.forEach(item => {
          doc.text(item.name.substring(0, 30), 50, y)
            .text(item.quantity.toString(), 300, y)
            .text(`KES ${item.price.toLocaleString()}`, 400, y)
            .text(`KES ${item.total.toLocaleString()}`, 480, y);
          y += 20;
        });

        doc.moveTo(50, y)
          .lineTo(550, y)
          .stroke();

        // Totals
        y += 20;
        doc.font('Helvetica-Bold')
          .text('Subtotal:', 400, y)
          .text(`KES ${order.subtotal.toLocaleString()}`, 480, y);

        y += 20;
        doc.font('Helvetica')
          .text('Shipping:', 400, y)
          .text(`KES ${order.shippingFee.toLocaleString()}`, 480, y);

        y += 20;
        if (order.discount > 0) {
          doc.text('Discount:', 400, y)
            .text(`-KES ${order.discount.toLocaleString()}`, 480, y);
          y += 20;
        }

        doc.font('Helvetica-Bold')
          .fontSize(12)
          .text('TOTAL:', 400, y)
          .text(`KES ${order.total.toLocaleString()}`, 480, y);

        // Payment status
        y += 40;
        doc.fontSize(10)
          .text(`Payment Status: ${order.paymentStatus}`, 50, y)
          .text(`Payment Method: ${order.paymentMethod}`, 50, y + 15);

        if (order.paymentStatus === 'completed') {
          doc.text(`Paid on: ${new Date(order.updatedAt).toLocaleDateString()}`, 50, y + 30);
        }

        // Footer
        doc.fontSize(8)
          .text('This is a computer generated invoice. No signature required.', 50, 700, { align: 'center' });

        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        logger.error('Invoice generation error:', error);
        reject(error);
      }
    });
  }

  // Generate statement PDF
  async generateStatement(transactions, account, period, settings = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const filename = `statement-${Date.now()}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Header
        doc.fontSize(20).font('Helvetica-Bold')
          .text(settings.shopName || 'ElectroStore', 50, 50, { align: 'center' })
          .fontSize(12)
          .text('Account Statement', { align: 'center' })
          .moveDown();

        doc.fontSize(10).font('Helvetica')
          .text(`Period: ${period.startDate} to ${period.endDate}`, { align: 'center' })
          .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
          .moveDown(2);

        // Balance summary
        doc.font('Helvetica-Bold')
          .text('Balance Summary', 50, doc.y)
          .moveDown(0.5);

        const balanceY = doc.y;
        doc.font('Helvetica')
          .text('Opening Balance:', 70, balanceY)
          .text(`KES ${period.openingBalance.toLocaleString()}`, 250, balanceY)
          .text('Current Balance:', 70, balanceY + 20)
          .text(`KES ${account.balance.toLocaleString()}`, 250, balanceY + 20)
          .text('Total Credits:', 350, balanceY)
          .text(`KES ${account.totalIncome.toLocaleString()}`, 500, balanceY)
          .text('Total Debits:', 350, balanceY + 20)
          .text(`KES ${account.totalExpenses.toLocaleString()}`, 500, balanceY + 20);

        doc.moveDown(4);

        // Transactions table
        const tableTop = doc.y;
        
        // Table headers
        doc.font('Helvetica-Bold')
          .text('Date', 50, tableTop)
          .text('Description', 120, tableTop)
          .text('Debit', 350, tableTop)
          .text('Credit', 420, tableTop)
          .text('Balance', 490, tableTop);

        doc.moveTo(50, tableTop + 15)
          .lineTo(550, tableTop + 15)
          .stroke();

        // Table rows
        let y = tableTop + 25;
        let runningBalance = period.openingBalance;
        doc.font('Helvetica');

        transactions.forEach(t => {
          if (t.type === 'credit') {
            runningBalance += t.amount;
          } else {
            runningBalance -= t.amount;
          }

          doc.text(new Date(t.createdAt).toLocaleDateString(), 50, y)
            .text(t.description || t.purpose || '-', 120, y, { width: 200 })
            .text(t.type === 'debit' ? `KES ${t.amount.toLocaleString()}` : '-', 350, y)
            .text(t.type === 'credit' ? `KES ${t.amount.toLocaleString()}` : '-', 420, y)
            .text(`KES ${runningBalance.toLocaleString()}`, 490, y);

          y += 20;

          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        });

        doc.moveTo(50, y)
          .lineTo(550, y)
          .stroke();

        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        logger.error('Statement generation error:', error);
        reject(error);
      }
    });
  }

  // Generate product catalog PDF
  async generateCatalog(products, settings = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const filename = `catalog-${Date.now()}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Cover page
        doc.fontSize(30).font('Helvetica-Bold')
          .text(settings.shopName || 'ElectroStore', 100, 200, { align: 'center' })
          .fontSize(20)
          .text('Product Catalog', { align: 'center' })
          .fontSize(12)
          .text(`Updated: ${new Date().toLocaleDateString()}`, { align: 'center' });

        doc.addPage();

        // Group products by category
        const categories = {};
        products.forEach(p => {
          if (!categories[p.category]) {
            categories[p.category] = [];
          }
          categories[p.category].push(p);
        });

        // Products by category
        Object.entries(categories).forEach(([category, items]) => {
          doc.fontSize(16).font('Helvetica-Bold')
            .text(category, 50, 50)
            .moveDown();

          let y = 80;
          items.forEach(product => {
            if (y > 700) {
              doc.addPage();
              y = 50;
            }

            doc.fontSize(12).font('Helvetica-Bold')
              .text(product.name, 70, y)
              .fontSize(10).font('Helvetica')
              .text(product.description?.substring(0, 50) || 'No description', 70, y + 15)
              .text(`Price: KES ${product.price.toLocaleString()}`, 70, y + 30)
              .text(`Stock: ${product.stock} units`, 70, y + 45);

            y += 70;
          });

          doc.addPage();
        });

        doc.end();

        stream.on('finish', () => resolve(filepath));
        stream.on('error', reject);
      } catch (error) {
        logger.error('Catalog generation error:', error);
        reject(error);
      }
    });
  }
}

module.exports = new PDFGenerator();