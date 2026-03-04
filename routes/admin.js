const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes - admin only
router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/dashboard/recent-activity', adminController.getRecentActivity);
router.get('/dashboard/notifications', adminController.getNotifications);

// System
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/logs', adminController.getSystemLogs);
router.post('/system/backup', adminController.createBackup);
router.post('/system/restore', adminController.restoreBackup);

// Users
router.get('/users/activity', adminController.getAllUserActivity);
router.post('/users/bulk-action', adminController.bulkUserAction);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/audit-logs/export', adminController.exportAuditLogs);

// Maintenance
router.post('/maintenance/clear-cache', adminController.clearCache);
router.post('/maintenance/optimize-db', adminController.optimizeDatabase);
router.post('/maintenance/cleanup', adminController.cleanupOldData);

module.exports = router;