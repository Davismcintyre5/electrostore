const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

class ExcelGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../../public/exports');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // Generate products export
  async exportProducts(products, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Products');

      // Add title
      worksheet.mergeCells('A1', 'G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = options.title || 'Products List';
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Add generation info
      worksheet.mergeCells('A2', 'G2');
      const infoCell = worksheet.getCell('A2');
      infoCell.value = `Generated: ${new Date().toLocaleString()}`;
      infoCell.alignment = { horizontal: 'center' };

      // Headers
      const headers = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Last Updated', key: 'updatedAt', width: 20 }
      ];

      worksheet.columns = headers;

      // Add rows
      products.forEach(product => {
        worksheet.addRow({
          id: product.sku || product._id.toString().slice(-6),
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          status: product.stock <= product.lowStockAlert ? 'Low Stock' : 'In Stock',
          updatedAt: new Date(product.updatedAt).toLocaleDateString()
        });
      });

      // Style header row
      const headerRow = worksheet.getRow(3);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });

      // Add summary
      const lastRow = worksheet.rowCount + 2;
      worksheet.mergeCells(`A${lastRow}`, `C${lastRow}`);
      worksheet.getCell(`A${lastRow}`).value = 'Total Products:';
      worksheet.getCell(`A${lastRow}`).font = { bold: true };
      worksheet.getCell(`D${lastRow}`).value = products.length;

      worksheet.mergeCells(`A${lastRow + 1}`, `C${lastRow + 1}`);
      worksheet.getCell(`A${lastRow + 1}`).value = 'Total Value:';
      worksheet.getCell(`A${lastRow + 1}`).font = { bold: true };
      
      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      worksheet.getCell(`D${lastRow + 1}`).value = totalValue;
      worksheet.getCell(`D${lastRow + 1}`).numFmt = '#,##0';

      // Format numbers
      worksheet.getColumn('price').numFmt = '#,##0';
      worksheet.getColumn('stock').numFmt = '0';

      // Save file
      const filename = `products-export-${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return filepath;
    } catch (error) {
      logger.error('Products export error:', error);
      throw error;
    }
  }

  // Generate orders export
  async exportOrders(orders, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Orders');

      // Add title
      worksheet.mergeCells('A1', 'H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = options.title || 'Orders Report';
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center' };

      // Add date range
      if (options.startDate && options.endDate) {
        worksheet.mergeCells('A2', 'H2');
        const dateCell = worksheet.getCell('A2');
        dateCell.value = `Period: ${new Date(options.startDate).toLocaleDateString()} - ${new Date(options.endDate).toLocaleDateString()}`;
        dateCell.alignment = { horizontal: 'center' };
      }

      // Headers
      const headers = [
        { header: 'Order #', key: 'orderNumber', width: 15 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Items', key: 'items', width: 25 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment', key: 'payment', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 }
      ];

      worksheet.columns = headers;

      // Add rows
      orders.forEach(order => {
        const items = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
        
        worksheet.addRow({
          orderNumber: order.orderNumber,
          date: new Date(order.createdAt).toLocaleDateString(),
          customer: order.customer?.name || 'Guest',
          items: items.substring(0, 50) + (items.length > 50 ? '...' : ''),
          total: order.total,
          status: order.status,
          payment: order.paymentMethod,
          paymentStatus: order.paymentStatus
        });
      });

      // Style header row
      const headerRow = worksheet.getRow(4);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });

      // Add summary
      const lastRow = worksheet.rowCount + 2;
      
      worksheet.mergeCells(`A${lastRow}`, `C${lastRow}`);
      worksheet.getCell(`A${lastRow}`).value = 'Total Orders:';
      worksheet.getCell(`A${lastRow}`).font = { bold: true };
      worksheet.getCell(`D${lastRow}`).value = orders.length;

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      worksheet.mergeCells(`A${lastRow + 1}`, `C${lastRow + 1}`);
      worksheet.getCell(`A${lastRow + 1}`).value = 'Total Revenue:';
      worksheet.getCell(`A${lastRow + 1}`).font = { bold: true };
      worksheet.getCell(`D${lastRow + 1}`).value = totalRevenue;
      worksheet.getCell(`D${lastRow + 1}`).numFmt = '#,##0';

      // Status breakdown
      const statusCounts = {};
      orders.forEach(o => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      let rowNum = lastRow + 3;
      worksheet.getCell(`A${rowNum}`).value = 'Status Breakdown:';
      worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
      rowNum++;

      Object.entries(statusCounts).forEach(([status, count]) => {
        worksheet.getCell(`A${rowNum}`).value = status;
        worksheet.getCell(`B${rowNum}`).value = count;
        rowNum++;
      });

      // Format numbers
      worksheet.getColumn('total').numFmt = '#,##0';

      // Save file
      const filename = `orders-export-${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return filepath;
    } catch (error) {
      logger.error('Orders export error:', error);
      throw error;
    }
  }

  // Generate customers export
  async exportCustomers(customers, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Customers');

      // Headers
      const headers = [
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Orders', key: 'orders', width: 10 },
        { header: 'Total Spent', key: 'totalSpent', width: 15 },
        { header: 'Joined', key: 'joined', width: 15 },
        { header: 'VIP', key: 'vip', width: 8 }
      ];

      worksheet.columns = headers;

      // Add rows
      customers.forEach(customer => {
        worksheet.addRow({
          name: customer.name,
          email: customer.email || '-',
          phone: customer.phone,
          orders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          joined: new Date(customer.createdAt).toLocaleDateString(),
          vip: customer.isVip ? 'Yes' : 'No'
        });
      });

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
        cell.alignment = { horizontal: 'center' };
      });

      // Format numbers
      worksheet.getColumn('totalSpent').numFmt = '#,##0';

      // Save file
      const filename = `customers-export-${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return filepath;
    } catch (error) {
      logger.error('Customers export error:', error);
      throw error;
    }
  }

  // Generate sales report
  async generateSalesReport(data, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary');
      
      summarySheet.getCell('A1').value = 'Sales Report';
      summarySheet.getCell('A1').font = { size: 16, bold: true };
      
      summarySheet.getCell('A3').value = 'Period:';
      summarySheet.getCell('B3').value = `${options.startDate} to ${options.endDate}`;
      
      summarySheet.getCell('A4').value = 'Total Revenue:';
      summarySheet.getCell('B4').value = data.totalRevenue;
      summarySheet.getCell('B4').numFmt = '#,##0';
      
      summarySheet.getCell('A5').value = 'Total Orders:';
      summarySheet.getCell('B5').value = data.totalOrders;
      
      summarySheet.getCell('A6').value = 'Average Order Value:';
      summarySheet.getCell('B6').value = data.averageOrderValue;
      summarySheet.getCell('B6').numFmt = '#,##0';

      // Daily breakdown sheet
      const dailySheet = workbook.addWorksheet('Daily Breakdown');
      
      dailySheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Orders', key: 'orders', width: 10 },
        { header: 'Revenue', key: 'revenue', width: 15 },
        { header: 'Average', key: 'average', width: 15 }
      ];

      data.daily.forEach(day => {
        dailySheet.addRow({
          date: day.date,
          orders: day.orders,
          revenue: day.revenue,
          average: day.orders > 0 ? day.revenue / day.orders : 0
        });
      });

      // Style headers
      [summarySheet, dailySheet].forEach(sheet => {
        const headerRow = sheet.getRow(1);
        if (headerRow) {
          headerRow.font = { bold: true };
          headerRow.eachCell(cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF2563EB' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
          });
        }
      });

      // Save file
      const filename = `sales-report-${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return filepath;
    } catch (error) {
      logger.error('Sales report generation error:', error);
      throw error;
    }
  }

  // Generate inventory report
  async generateInventoryReport(products, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventory');

      // Headers
      const headers = [
        { header: 'Product', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Low Stock Alert', key: 'alert', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Value', key: 'value', width: 15 }
      ];

      worksheet.columns = headers;

      // Add rows
      products.forEach(product => {
        const value = product.price * product.stock;
        const status = product.stock <= product.lowStockAlert ? 'Low Stock' : 'OK';

        worksheet.addRow({
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          alert: product.lowStockAlert,
          status,
          value
        });
      });

      // Conditional formatting for low stock
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const status = row.getCell('status').value;
          if (status === 'Low Stock') {
            row.eachCell(cell => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFEE2E2' }
              };
            });
          }
        }
      });

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2563EB' }
        };
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
      });

      // Format numbers
      worksheet.getColumn('price').numFmt = '#,##0';
      worksheet.getColumn('value').numFmt = '#,##0';
      worksheet.getColumn('stock').numFmt = '0';

      // Summary
      const summarySheet = workbook.addWorksheet('Summary');
      
      summarySheet.getCell('A1').value = 'Inventory Summary';
      summarySheet.getCell('A1').font = { size: 14, bold: true };

      const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
      const totalProducts = products.length;
      const lowStockCount = products.filter(p => p.stock <= p.lowStockAlert).length;

      summarySheet.getCell('A3').value = 'Total Products:';
      summarySheet.getCell('B3').value = totalProducts;

      summarySheet.getCell('A4').value = 'Total Inventory Value:';
      summarySheet.getCell('B4').value = totalValue;
      summarySheet.getCell('B4').numFmt = '#,##0';

      summarySheet.getCell('A5').value = 'Low Stock Items:';
      summarySheet.getCell('B5').value = lowStockCount;

      // Save file
      const filename = `inventory-report-${Date.now()}.xlsx`;
      const filepath = path.join(this.outputDir, filename);
      await workbook.xlsx.writeFile(filepath);

      return filepath;
    } catch (error) {
      logger.error('Inventory report generation error:', error);
      throw error;
    }
  }
}

module.exports = new ExcelGenerator();