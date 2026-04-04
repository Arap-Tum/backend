const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getSalesStaffOrders,
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { roleCheck, canManageOrders } = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all orders (Warehouse Manager, Sales Staff)
router.get(
  '/',
  auth,
  roleCheck(['Warehouse Manager', 'Sales Staff']),
  getAllOrders
);

// Get orders for current sales staff
router.get(
  '/my-orders',
  auth,
  roleCheck(['Sales Staff']),
  getSalesStaffOrders
);

// Get order by ID
router.get(
  '/:id',
  auth,
  [param('id').isMongoId().withMessage('Invalid order ID')],
  validateRequest,
  getOrderById
);

// Create new order (Sales Staff only)
router.post(
  '/',
  auth,
  roleCheck(['Warehouse Manager', 'Sales Staff']),
  [
    body('orderNumber').trim().notEmpty().withMessage('Order number is required'),
    body('customer').isObject().withMessage('Customer details are required'),
    body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.sku').trim().notEmpty().withMessage('Item SKU is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be >= 1'),
    body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be >= 0'),
  ],
  validateRequest,
  createOrder
);

// Update order (Sales Staff, Warehouse Manager)
router.patch(
  '/:id',
  auth,
  roleCheck(['Warehouse Manager', 'Sales Staff']),
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('customer').optional().isObject(),
    body('items').optional().isArray(),
    body('totalAmount').optional().isFloat({ min: 0 }),
  ],
  validateRequest,
  updateOrder
);

// Cancel order
router.delete(
  '/:id',
  auth,
  roleCheck(['Warehouse Manager', 'Sales Staff']),
  [param('id').isMongoId().withMessage('Invalid order ID')],
  validateRequest,
  cancelOrder
);

module.exports = router;
