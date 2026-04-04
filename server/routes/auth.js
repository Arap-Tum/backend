const express = require('express');
const { body, validationResult } = require('express-validator');
const { register, login, getProfile, logout } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register new user
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn([
      'Warehouse Manager',
      'Inventory Manager',
      'Picker',
      'Packer',
      'Dispatch Officer',
      'Receiving Officer',
      'Sales Staff'
    ]).withMessage('Invalid role'),
    body('department').isIn(['Warehouse', 'Sales', 'Logistics']).withMessage('Invalid department'),
  ],
  validateRequest,
  register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  login
);

// Get current user profile
router.get('/profile', auth, getProfile);

// Logout
router.post('/logout', auth, logout);

module.exports = router;