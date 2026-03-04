const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Promotion = require('../models/Promotion');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Setting = require('../models/Setting');
const ShippingRule = require('../models/ShippingRule');

// Sample data
const sampleData = {
  // Products
  products: [
    {
      name: 'iPhone 15 Pro Max',
      category: 'Phones',
      price: 179999,
      cost: 145000,
      stock: 25,
      lowStockAlert: 5,
      reorderPoint: 10,
      description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system.',
      brand: 'Apple',
      model: 'iPhone 15 Pro Max',
      sku: 'SKU-IP15PM-001',
      isFeatured: true,
      specifications: {
        screen: '6.7-inch Super Retina XDR',
        processor: 'A17 Pro',
        camera: '48MP Main | 12MP Ultrawide | 12MP Telephoto',
        battery: '4422 mAh'
      }
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      category: 'Phones',
      price: 168870,
      cost: 130000,
      stock: 18,
      lowStockAlert: 5,
      reorderPoint: 10,
      description: 'Flagship Android phone with AI features, S Pen, and 200MP camera.',
      brand: 'Samsung',
      model: 'Galaxy S24 Ultra',
      sku: 'SKU-SGS24-001',
      isFeatured: true,
      specifications: {
        screen: '6.8-inch Dynamic AMOLED 2X',
        processor: 'Snapdragon 8 Gen 3',
        camera: '200MP Main | 12MP Ultrawide | 50MP Telephoto x2',
        battery: '5000 mAh'
      }
    },
    {
      name: 'MacBook Pro 16"',
      category: 'Laptops',
      price: 324870,
      cost: 260000,
      stock: 8,
      lowStockAlert: 3,
      reorderPoint: 5,
      description: 'Powerful laptop with M3 Pro chip, 36GB RAM, 1TB SSD, perfect for professionals.',
      brand: 'Apple',
      model: 'MacBook Pro 16"',
      sku: 'SKU-MBP16-001',
      isFeatured: true
    },
    {
      name: 'Dell XPS 15',
      category: 'Laptops',
      price: 287870,
      cost: 220000,
      stock: 5,
      lowStockAlert: 3,
      reorderPoint: 5,
      description: 'Premium Windows laptop with InfinityEdge display and powerful performance.',
      brand: 'Dell',
      model: 'XPS 15',
      sku: 'SKU-DXPS15-001'
    },
    {
      name: 'AirPods Pro (2nd Gen)',
      category: 'Accessories',
      price: 45870,
      cost: 32000,
      stock: 30,
      lowStockAlert: 10,
      reorderPoint: 15,
      description: 'Wireless earbuds with active noise cancellation, transparency mode, and spatial audio.',
      brand: 'Apple',
      model: 'AirPods Pro 2',
      sku: 'SKU-APP2-001',
      isFeatured: true
    },
    {
      name: 'Samsung Galaxy Watch6',
      category: 'Wearables',
      price: 45870,
      cost: 32000,
      stock: 15,
      lowStockAlert: 5,
      reorderPoint: 8,
      description: 'Smartwatch with health tracking, fitness features, and long battery life.',
      brand: 'Samsung',
      model: 'Galaxy Watch6',
      sku: 'SKU-SGW6-001'
    },
    {
      name: 'iPad Air',
      category: 'Tablets',
      price: 124870,
      cost: 90000,
      stock: 12,
      lowStockAlert: 5,
      reorderPoint: 8,
      description: 'Versatile tablet with M1 chip, 10.9" Liquid Retina display, perfect for work and entertainment.',
      brand: 'Apple',
      model: 'iPad Air',
      sku: 'SKU-IPA-001',
      isFeatured: true
    },
    {
      name: 'Sony WH-1000XM5',
      category: 'Audio',
      price: 58770,
      cost: 42000,
      stock: 10,
      lowStockAlert: 3,
      reorderPoint: 5,
      description: 'Industry-leading noise cancelling headphones with exceptional sound quality.',
      brand: 'Sony',
      model: 'WH-1000XM5',
      sku: 'SKU-SONY-XM5-001'
    },
    {
      name: 'Google Pixel 8 Pro',
      category: 'Phones',
      price: 148870,
      cost: 115000,
      stock: 14,
      lowStockAlert: 5,
      reorderPoint: 8,
      description: 'Pure Android experience with amazing camera and AI features.',
      brand: 'Google',
      model: 'Pixel 8 Pro',
      sku: 'SKU-GP8P-001'
    },
    {
      name: 'Logitech MX Master 3S',
      category: 'Accessories',
      price: 15870,
      cost: 10000,
      stock: 22,
      lowStockAlert: 8,
      reorderPoint: 12,
      description: 'Advanced wireless mouse with ergonomic design and customizable buttons.',
      brand: 'Logitech',
      model: 'MX Master 3S',
      sku: 'SKU-LOG-MX3-001'
    }
  ],

  // Customers
  customers: [
    {
      name: 'John Mwangi',
      email: 'john.mwangi@example.com',
      phone: '254712345678',
      totalOrders: 3,
      totalSpent: 489610,
      isVip: true,
      addresses: [
        {
          street: '123 Kenyatta Ave',
          city: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya',
          phone: '254712345678',
          isDefault: true
        }
      ]
    },
    {
      name: 'Mary Akinyi',
      email: 'mary.akinyi@example.com',
      phone: '254723456789',
      totalOrders: 2,
      totalSpent: 453740,
      addresses: [
        {
          street: '456 Moi Road',
          city: 'Mombasa',
          postalCode: '80100',
          country: 'Kenya',
          phone: '254723456789',
          isDefault: true
        }
      ]
    },
    {
      name: 'Peter Odhiambo',
      email: 'peter.odhiambo@example.com',
      phone: '254734567890',
      totalOrders: 1,
      totalSpent: 168870,
      addresses: [
        {
          street: '789 Oginga Odinga St',
          city: 'Kisumu',
          postalCode: '40100',
          country: 'Kenya',
          phone: '254734567890',
          isDefault: true
        }
      ]
    },
    {
      name: 'Sarah Wanjiku',
      email: 'sarah.wanjiku@example.com',
      phone: '254745678901',
      totalOrders: 2,
      totalSpent: 258740,
      addresses: [
        {
          street: '321 University Way',
          city: 'Nairobi',
          postalCode: '00100',
          country: 'Kenya',
          phone: '254745678901',
          isDefault: true
        }
      ]
    },
    {
      name: 'David Kimani',
      email: 'david.kimani@example.com',
      phone: '254756789012',
      totalOrders: 1,
      totalSpent: 58770,
      addresses: [
        {
          street: '654 Kenyatta Ave',
          city: 'Nakuru',
          postalCode: '20100',
          country: 'Kenya',
          phone: '254756789012',
          isDefault: true
        }
      ]
    }
  ],

  // Orders
  orders: [
    {
      orderNumber: 'ORD202503010001',
      status: 'completed',
      paymentMethod: 'M-PESA',
      paymentStatus: 'completed',
      subtotal: 324870,
      shippingFee: 0,
      total: 324870,
      items: [
        {
          name: 'MacBook Pro 16"',
          price: 324870,
          quantity: 1,
          total: 324870
        }
      ],
      shippingAddress: {
        street: '123 Kenyatta Ave',
        city: 'Nairobi',
        postalCode: '00100',
        country: 'Kenya',
        phone: '254712345678'
      },
      createdAt: new Date('2025-03-01'),
      mpesaDetails: {
        receiptNumber: 'MPR123456789'
      }
    },
    {
      orderNumber: 'ORD202502250002',
      status: 'processing',
      paymentMethod: 'Card',
      paymentStatus: 'completed',
      subtotal: 168870,
      shippingFee: 500,
      total: 169370,
      items: [
        {
          name: 'Samsung Galaxy S24 Ultra',
          price: 168870,
          quantity: 1,
          total: 168870
        }
      ],
      shippingAddress: {
        street: '456 Moi Road',
        city: 'Mombasa',
        postalCode: '80100',
        country: 'Kenya',
        phone: '254723456789'
      },
      createdAt: new Date('2025-02-25')
    },
    {
      orderNumber: 'ORD202503020003',
      status: 'transit',
      paymentMethod: 'M-PESA',
      paymentStatus: 'completed',
      subtotal: 91740,
      shippingFee: 0,
      total: 91740,
      items: [
        {
          name: 'AirPods Pro (2nd Gen)',
          price: 45870,
          quantity: 2,
          total: 91740
        }
      ],
      shippingAddress: {
        street: '789 Oginga Odinga St',
        city: 'Kisumu',
        postalCode: '40100',
        country: 'Kenya',
        phone: '254734567890'
      },
      createdAt: new Date('2025-03-02'),
      trackingNumber: 'TRK123456789',
      estimatedDelivery: new Date('2025-03-09')
    },
    {
      orderNumber: 'ORD202503030004',
      status: 'submitted',
      paymentMethod: 'M-PESA',
      paymentStatus: 'pending',
      subtotal: 179999,
      shippingFee: 0,
      total: 179999,
      items: [
        {
          name: 'iPhone 15 Pro Max',
          price: 179999,
          quantity: 1,
          total: 179999
        }
      ],
      shippingAddress: {
        street: '321 University Way',
        city: 'Nairobi',
        postalCode: '00100',
        country: 'Kenya',
        phone: '254745678901'
      },
      createdAt: new Date('2025-03-03')
    },
    {
      orderNumber: 'ORD202502280005',
      status: 'delivered',
      paymentMethod: 'Cash',
      paymentStatus: 'completed',
      subtotal: 148870,
      shippingFee: 500,
      total: 149370,
      items: [
        {
          name: 'Google Pixel 8 Pro',
          price: 148870,
          quantity: 1,
          total: 148870
        }
      ],
      shippingAddress: {
        street: '654 Kenyatta Ave',
        city: 'Nakuru',
        postalCode: '20100',
        country: 'Kenya',
        phone: '254756789012'
      },
      createdAt: new Date('2025-02-28'),
      deliveredAt: new Date('2025-03-02')
    }
  ],

  // Promotions
  promotions: [
    {
      title: 'Summer Sale',
      description: 'Get up to 20% off on selected smartphones and accessories',
      type: 'percentage',
      value: 20,
      minPurchase: 50000,
      maxDiscount: 20000,
      code: 'SUMMER20',
      icon: '🌞',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-08-31'),
      isActive: true,
      priority: 1
    },
    {
      title: 'Free Shipping',
      description: 'Free shipping on orders over KES 50,000',
      type: 'shipping',
      value: 0,
      minPurchase: 50000,
      code: 'FREESHIP',
      icon: '🚚',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      priority: 2
    },
    {
      title: 'Student Discount',
      description: '10% off with valid student ID',
      type: 'percentage',
      value: 10,
      maxDiscount: 15000,
      code: 'STUDENT10',
      icon: '🎓',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      priority: 3
    },
    {
      title: 'Weekend Flash Sale',
      description: '15% off on all audio products',
      type: 'percentage',
      value: 15,
      applicableCategories: ['Audio'],
      code: 'AUDIO15',
      icon: '🎧',
      startDate: new Date('2025-03-07'),
      endDate: new Date('2025-03-09'),
      isActive: true,
      priority: 4
    },
    {
      title: 'New Customer',
      description: '5% off on first purchase',
      type: 'percentage',
      value: 5,
      code: 'WELCOME5',
      icon: '🎁',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
      priority: 5,
      perUserLimit: 1
    }
  ],

  // Transactions
  transactions: [
    {
      transactionNumber: 'TRX20250301001',
      type: 'sale',
      amount: 324870,
      paymentMethod: 'M-PESA',
      status: 'completed',
      description: 'Sale of MacBook Pro 16"',
      mpesaDetails: {
        receiptNumber: 'MPR123456789',
        phoneNumber: '254712345678'
      },
      createdAt: new Date('2025-03-01')
    },
    {
      transactionNumber: 'TRX20250225002',
      type: 'sale',
      amount: 169370,
      paymentMethod: 'Card',
      status: 'completed',
      description: 'Sale of Samsung Galaxy S24 Ultra',
      createdAt: new Date('2025-02-25')
    },
    {
      transactionNumber: 'TRX20250302003',
      type: 'sale',
      amount: 91740,
      paymentMethod: 'M-PESA',
      status: 'completed',
      description: 'Sale of AirPods Pro x2',
      mpesaDetails: {
        receiptNumber: 'MPR987654321',
        phoneNumber: '254734567890'
      },
      createdAt: new Date('2025-03-02')
    },
    {
      transactionNumber: 'TRX20250220004',
      type: 'withdrawal',
      amount: 50000,
      paymentMethod: 'Bank Transfer',
      status: 'completed',
      description: 'Rent payment',
      category: 'Rent',
      createdAt: new Date('2025-02-20')
    },
    {
      transactionNumber: 'TRX20250215005',
      type: 'withdrawal',
      amount: 25000,
      paymentMethod: 'M-PESA',
      status: 'completed',
      description: 'Utilities - Electricity and Water',
      category: 'Utilities',
      createdAt: new Date('2025-02-15')
    },
    {
      transactionNumber: 'TRX20250210006',
      type: 'withdrawal',
      amount: 15000,
      paymentMethod: 'Cash',
      status: 'completed',
      description: 'Office supplies',
      category: 'Supplies',
      createdAt: new Date('2025-02-10')
    }
  ],

  // Shipping rules
  shippingRules: [
    {
      name: 'Free Shipping Over 50k',
      description: 'Free shipping for orders above KES 50,000',
      type: 'min_amount',
      conditions: {
        minAmount: 50000
      },
      cost: 0,
      isFree: true,
      priority: 1,
      isActive: true,
      estimatedDays: { min: 2, max: 5 }
    },
    {
      name: 'Standard Shipping',
      description: 'Standard shipping fee for all orders',
      type: 'flat_rate',
      cost: 500,
      isFree: false,
      priority: 10,
      isActive: true,
      estimatedDays: { min: 3, max: 7 }
    },
    {
      name: 'Nairobi Express',
      description: 'Express delivery within Nairobi',
      type: 'location_based',
      conditions: {
        locations: ['Nairobi']
      },
      cost: 300,
      isFree: false,
      priority: 5,
      isActive: true,
      estimatedDays: { min: 1, max: 2 }
    },
    {
      name: 'Heavy Items Surcharge',
      description: 'Additional fee for heavy items',
      type: 'weight_based',
      conditions: {
        minWeight: 5
      },
      cost: 1000,
      isFree: false,
      priority: 15,
      isActive: true
    }
  ],

  // Settings
  settings: [
    {
      group: 'store',
      key: 'store_name',
      value: 'ElectroStore',
      type: 'string',
      isPublic: true
    },
    {
      group: 'store',
      key: 'store_email',
      value: 'support@electrostore.com',
      type: 'string',
      isPublic: true
    },
    {
      group: 'store',
      key: 'store_phone',
      value: '+254 700 000000',
      type: 'string',
      isPublic: true
    },
    {
      group: 'store',
      key: 'store_address',
      value: 'Nairobi, Kenya',
      type: 'string',
      isPublic: true
    },
    {
      group: 'shipping',
      key: 'shipping_default_fee',
      value: 500,
      type: 'number',
      isPublic: true
    },
    {
      group: 'shipping',
      key: 'shipping_free_threshold',
      value: 50000,
      type: 'number',
      isPublic: true
    },
    {
      group: 'payment',
      key: 'payment_methods',
      value: ['Cash', 'Card', 'M-PESA'],
      type: 'array',
      isPublic: true
    },
    {
      group: 'tax',
      key: 'tax_rate',
      value: 16,
      type: 'number',
      isPublic: true
    }
  ]
};

// Seed database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }), // Keep admin users
      Product.deleteMany(),
      Customer.deleteMany(),
      Order.deleteMany(),
      Promotion.deleteMany(),
      Transaction.deleteMany(),
      ShippingRule.deleteMany(),
      Setting.deleteMany()
    ]);
    console.log('Existing data cleared (admins kept)...');

    // Create admin user if not exists
    let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        isAdmin: true
      });
      console.log('Admin user created...');
    } else {
      console.log('Admin user already exists...');
    }

    // Create customers
    const customers = await Customer.insertMany(sampleData.customers);
    console.log(`${customers.length} customers created...`);

    // Create products
    const products = await Product.insertMany(sampleData.products);
    console.log(`${products.length} products created...`);

    // Create users for customers (optional - for login)
    const customerUsers = [];
    for (const customer of customers) {
      const userExists = await User.findOne({ email: customer.email });
      if (!userExists) {
        const user = await User.create({
          name: customer.name,
          email: customer.email,
          password: 'Password123', // Default password
          phone: customer.phone,
          role: 'customer',
          isActive: true
        });
        customerUsers.push(user);
        
        // Update customer with user reference
        customer.user = user._id;
        await customer.save();
      }
    }
    console.log(`${customerUsers.length} customer users created...`);

    // Create orders with user references
    const ordersWithRefs = [];
    for (let i = 0; i < sampleData.orders.length; i++) {
      const orderData = sampleData.orders[i];
      const customer = customers[i % customers.length];
      const user = await User.findOne({ email: customer.email });
      
      const orderItems = orderData.items.map(item => ({
        ...item,
        product: products.find(p => p.name === item.name)?._id
      }));

      const order = await Order.create({
        ...orderData,
        user: user ? user._id : adminUser._id, // Assign user ID
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        items: orderItems
      });
      ordersWithRefs.push(order);
    }
    console.log(`${ordersWithRefs.length} orders created...`);

    // Create promotions
    const promotions = await Promotion.insertMany(sampleData.promotions);
    console.log(`${promotions.length} promotions created...`);

    // Create transactions with order references
    const transactionsWithRefs = [];
    for (let i = 0; i < sampleData.transactions.length; i++) {
      const transactionData = sampleData.transactions[i];
      const order = ordersWithRefs[i % ordersWithRefs.length];
      
      const transaction = await Transaction.create({
        ...transactionData,
        order: order._id,
        user: adminUser._id
      });
      transactionsWithRefs.push(transaction);
    }
    console.log(`${transactionsWithRefs.length} transactions created...`);

    // Create shipping rules
    const shippingRules = await ShippingRule.insertMany(sampleData.shippingRules);
    console.log(`${shippingRules.length} shipping rules created...`);

    // Create settings
    const settings = await Setting.insertMany(sampleData.settings);
    console.log(`${settings.length} settings created...`);

    // Create or update account
    let account = await Account.findOne();
    if (!account) {
      account = await Account.create({
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalWithdrawals: 0
      });
    }

    // Update account with transactions
    const totalIncome = transactionsWithRefs
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactionsWithRefs
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    account.balance = totalIncome - totalExpenses;
    account.totalIncome = totalIncome;
    account.totalExpenses = totalExpenses;
    account.totalWithdrawals = totalExpenses;
    account.transactions = transactionsWithRefs.map(t => t._id);
    await account.save();
    console.log('Account updated...');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nSummary:');
    console.log(`- Products: ${products.length}`);
    console.log(`- Customers: ${customers.length}`);
    console.log(`- Customer Users: ${customerUsers.length}`);
    console.log(`- Orders: ${ordersWithRefs.length}`);
    console.log(`- Promotions: ${promotions.length}`);
    console.log(`- Transactions: ${transactionsWithRefs.length}`);
    console.log(`- Shipping Rules: ${shippingRules.length}`);
    console.log(`- Settings: ${settings.length}`);

    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();