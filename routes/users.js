const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Protect all routes - require authentication
router.use(protect);

// Profile routes (for all authenticated users)
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:index', userController.updateAddress);
router.delete('/addresses/:index', userController.deleteAddress);
router.put('/addresses/:index/default', userController.setDefaultAddress);

// Admin only routes
router.use(authorize('admin', 'manager'));

router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.put('/:id/role', userController.updateUserRole);
router.put('/:id/status', userController.toggleUserStatus);
router.post('/:id/reset-password', userController.resetUserPassword);
router.get('/:id/activity', userController.getUserActivity);

module.exports = router;