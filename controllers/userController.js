const User = require('../models/User');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');
const { sendEmail } = require('../config/email');
const crypto = require('crypto');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};

    // Filter by role
    if (req.query.role) {
      const roles = req.query.role.split(',');
      query.role = { $in: roles };
    }

    // Filter by status
    if (req.query.isActive) {
      query.isActive = req.query.isActive === 'true';
    }

    // Search
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(limit)
      .skip(startIndex);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      users
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('orders');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, isAdmin } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      isAdmin: isAdmin || false,
      isActive: true
    });

    // If role is customer, create customer profile
    if (role === 'customer') {
      await Customer.create({
        user: user._id,
        name,
        email: email.toLowerCase(),
        phone,
        addresses: [],
        totalOrders: 0,
        totalSpent: 0
      });
    }

    // Log action
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_user',
      resource: 'users',
      resourceId: user._id,
      changes: {
        after: { name, email, role }
      },
      status: 'success'
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const before = {
      name: user.name,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      phone: user.phone,
      isActive: user.isActive
    };

    // Update fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.role) user.role = req.body.role;
    if (req.body.isAdmin !== undefined) user.isAdmin = req.body.isAdmin;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

    await user.save();

    // Update customer profile if role is customer
    if (user.role === 'customer') {
      await Customer.findOneAndUpdate(
        { user: user._id },
        { 
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      );
    }

    // Log action
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'update_user',
      resource: 'users',
      resourceId: user._id,
      changes: {
        before,
        after: {
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin,
          phone: user.phone,
          isActive: user.isActive
        }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        phone: user.phone,
        isActive: user.isActive
      }
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete customer profile if exists
    await Customer.findOneAndDelete({ user: user._id });

    // Delete user
    await user.deleteOne();

    // Log action
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'delete_user',
      resource: 'users',
      resourceId: user._id,
      changes: {
        before: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
  try {
    const { role, isAdmin } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = user.role;
    const oldIsAdmin = user.isAdmin;

    user.role = role;
    user.isAdmin = isAdmin || false;
    await user.save();

    // If role changed to customer, ensure customer profile exists
    if (role === 'customer') {
      const customerExists = await Customer.findOne({ user: user._id });
      if (!customerExists) {
        await Customer.create({
          user: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          addresses: user.addresses || []
        });
      }
    }

    // Log action
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'update_user_role',
      resource: 'users',
      resourceId: user._id,
      changes: {
        before: { role: oldRole, isAdmin: oldIsAdmin },
        after: { role, isAdmin }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        role: user.role,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle user status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deactivating yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // Log action
    await AuditLog.create({
      user: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: user.isActive ? 'activate_user' : 'deactivate_user',
      resource: 'users',
      resourceId: user._id,
      changes: {
        before: { isActive: !user.isActive },
        after: { isActive: user.isActive }
      },
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get user activity
// @route   GET /api/users/:id/activity
// @access  Private/Admin
exports.getUserActivity = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const logs = await AuditLog.find({ user: user._id })
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      activity: logs
    });
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========== CUSTOMER PROFILE ROUTES ==========

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const phoneRegex = /^[0-9]{10,12}$/;
      if (!phoneRegex.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid phone number'
        });
      }
      user.phone = cleanPhone;
    }

    await user.save();

    // Update customer profile
    await Customer.findOneAndUpdate(
      { user: user._id },
      { 
        name: user.name,
        phone: user.phone
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || []
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Add address to user
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res) => {
  try {
    const { street, city, postalCode, country, phone } = req.body;

    // Validation
    if (!street || !city || !country || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // Check address limit (max 3)
    if (user.addresses.length >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 3 addresses allowed'
      });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');

    const newAddress = {
      street,
      city,
      postalCode: postalCode || '',
      country,
      phone: cleanPhone,
      isDefault: user.addresses.length === 0 // First address is default
    };

    user.addresses.push(newAddress);
    await user.save();

    // Update customer profile
    await Customer.findOneAndUpdate(
      { user: user._id },
      { 
        $push: { addresses: newAddress },
        $set: { phone: cleanPhone }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses
      }
    });
  } catch (error) {
    logger.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update address
// @route   PUT /api/users/addresses/:index
// @access  Private
exports.updateAddress = async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const { street, city, postalCode, country, phone, isDefault } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.addresses || index >= user.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update address
    if (street) user.addresses[index].street = street;
    if (city) user.addresses[index].city = city;
    if (postalCode !== undefined) user.addresses[index].postalCode = postalCode;
    if (country) user.addresses[index].country = country;
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      user.addresses[index].phone = cleanPhone;
    }

    // Handle default address
    if (isDefault) {
      user.addresses.forEach((addr, i) => {
        addr.isDefault = i === index;
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses
      }
    });
  } catch (error) {
    logger.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:index
// @access  Private
exports.deleteAddress = async (req, res) => {
  try {
    const index = parseInt(req.params.index);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.addresses || index >= user.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Remove address
    user.addresses.splice(index, 1);

    // If we removed the default address and there are other addresses, make the first one default
    if (user.addresses.length > 0 && !user.addresses.some(addr => addr.isDefault)) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses
      }
    });
  } catch (error) {
    logger.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Set default address
// @route   PUT /api/users/addresses/:index/default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
  try {
    const index = parseInt(req.params.index);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.addresses || index >= user.addresses.length) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Set all addresses to not default, then set the selected one as default
    user.addresses.forEach((addr, i) => {
      addr.isDefault = i === index;
    });

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses
      }
    });
  } catch (error) {
    logger.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset user password (admin)
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 characters

    // Set temporary password
    user.password = tempPassword;
    await user.save();

    // Send email with temporary password
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset',
        message: `
          <h1>Password Reset</h1>
          <p>Your password has been reset by an administrator.</p>
          <p>Your temporary password is: <strong>${tempPassword}</strong></p>
          <p>Please login and change your password immediately.</p>
        `
      });
    } catch (emailError) {
      logger.error('Password reset email error:', emailError);
      // Still return success even if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};