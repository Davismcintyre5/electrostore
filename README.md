# ⚡ ElectroStore - Complete E-commerce Platform with M-Pesa Integration

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

A fully-featured e-commerce platform built with Node.js, Express, MongoDB, and integrated with M-Pesa STK push for seamless mobile payments in Kenya.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Scripts](#-database-scripts)
- [M-Pesa Integration](#-mpesa-integration)
- [Features Overview](#-features-overview)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## ✨ Features

### Customer Portal
- 🛍️ **Product Browsing** - View products by category, search, filter
- 🔐 **User Authentication** - Register, login, password reset
- 🛒 **Shopping Cart** - Add/remove items, update quantities
- 💳 **M-Pesa STK Push** - Pay directly via M-Pesa on your phone
- 📦 **Order Management** - View order history, track status
- ❤️ **Wishlist** - Save favorite products
- 🚚 **Order Tracking** - Real-time order status updates
- ⏱️ **1-Hour Cancellation** - Cancel orders within 1 hour with auto-refund
- 📱 **Mobile Responsive** - Works on all devices

### Admin Dashboard
- 📊 **Dashboard Analytics** - Sales, orders, revenue charts
- 📦 **Product Management** - CRUD operations, stock tracking
- 🚚 **Order Management** - Update status, assign tracking
- 👥 **Customer Management** - View customer details, order history
- 🎯 **Promotions** - Create and manage discounts
- 💰 **Account Management** - Track income, withdrawals, balance
- 📈 **Reports** - Generate sales, inventory, customer reports
- ⚙️ **Settings** - Configure store, shipping, payment options
- 👤 **User Management** - Add/edit staff users with roles
- 📋 **Audit Logs** - Track all admin actions

### Key Features
- **M-Pesa Integration** - STK push, payment confirmation, refunds
- **Real-time Updates** - Socket.io for live order status
- **Email Notifications** - Order confirmations, status updates
- **SMS Alerts** - Order updates via SMS (Africa's Talking)
- **PDF Generation** - Receipts, invoices, statements
- **Excel Exports** - Reports, customer lists, inventory
- **Backup & Restore** - Database backup scripts
- **Rate Limiting** - Prevent API abuse
- **Security** - JWT, helmet, sanitization, XSS protection

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Payments**: M-Pesa API (STK Push)
- **File Upload**: Multer with Sharp image processing
- **Email**: Nodemailer with Handlebars templates
- **SMS**: Africa's Talking API
- **PDF**: PDFKit
- **Excel**: ExcelJS
- **Caching**: Memory-cache / Redis
- **Logging**: Winston + Morgan
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting, XSS-clean

### Frontend (Static HTML)
- HTML5, CSS3, Vanilla JavaScript
- Responsive design with Flexbox/Grid
- No frameworks - lightweight and fast

## 📁 Project Structure
