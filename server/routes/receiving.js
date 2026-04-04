const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  createReceiving,
  getAllReceiving,
  getReceivingById,
  updateReceivedQuantities,
  inspectReceivedGoods,
  acceptReceiving,
  rejectReceiving,
} = require('../controllers/receivingController');
const auth = require('../middleware/auth');
const { roleCheck, canReceive } = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all receiving documents
router.get(
  '/',
  auth,
  roleCheck(['Warehouse Manager', 'Receiving Officer', 'Inventory Manager']),
  getAllReceiving
);

// Get receiving document by ID
router.get(
  '/:id',
  auth,
  roleCheck(['Warehouse Manager', 'Receiving Officer', 'Inventory Manager']),
  [param('id').isMongoId().withMessage('Invalid receiving ID')],
  validateRequest,
  getReceivingById
);

// Create new receiving document
router.post(
  '/',
  auth,
  canReceive,
  [
    body('receivingNumber').trim().notEmpty().withMessage('Receiving number is required'),
    body('supplier').isObject().withMessage('Supplier details required'),
    body('supplier.name').trim().notEmpty().withMessage('Supplier name is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.sku').notEmpty().withMessage('Item SKU is required'),
    body('items.*.expectedQuantity').isInt({ min: 1 }).withMessage('Expected quantity must be >= 1'),
    body('items.*.batchNumber').notEmpty().withMessage('Batch number is required'),
  ],
  validateRequest,
  createReceiving
);

// Update received quantities
router.patch(
  '/:id/update-quantities',
  auth,
  canReceive,
  [
    param('id').isMongoId().withMessage('Invalid receiving ID'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  ],
  validateRequest,
  updateReceivedQuantities
);

// Inspect received goods
router.patch(
  '/:id/inspect',
  auth,
  roleCheck(['Warehouse Manager', 'Receiving Officer']),
  [
    param('id').isMongoId().withMessage('Invalid receiving ID'),
    body('inspectionNotes').optional().isString(),
  ],
  validateRequest,
  inspectReceivedGoods
);

// Accept receiving and update inventory
router.patch(
  '/:id/accept',
  auth,
  canReceive,
  [param('id').isMongoId().withMessage('Invalid receiving ID')],
  validateRequest,
  acceptReceiving
);

// Reject receiving
router.patch(
  '/:id/reject',
  auth,
  canReceive,
  [
    param('id').isMongoId().withMessage('Invalid receiving ID'),
    body('rejectionReason').optional().isString(),
  ],
  validateRequest,
  rejectReceiving
);

module.exports = router;
