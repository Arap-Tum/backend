const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  getPicklist,
  getAssignedPicks,
  assignOrderToPicker,
  markItemsAsPicked,
  updatePickingStatus,
} = require('../controllers/pickingController');
const auth = require('../middleware/auth');
const { roleCheck, isPicker } = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get picklist (all pending orders)
router.get(
  '/list/pending',
  auth,
  roleCheck(['Warehouse Manager', 'Picker']),
  getPicklist
);

// Get assigned picks for current picker
router.get(
  '/assigned',
  auth,
  isPicker,
  getAssignedPicks
);

// Assign order to picker (Warehouse Manager only)
router.post(
  '/assign',
  auth,
  roleCheck(['Warehouse Manager']),
  [
    body('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('pickerId').isMongoId().withMessage('Valid Picker ID required'),
  ],
  validateRequest,
  assignOrderToPicker
);

// Mark items as picked
router.patch(
  '/:orderId/mark-picked',
  auth,
  isPicker,
  [
    param('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('pickedItems').isArray({ min: 1 }).withMessage('At least one picked item required'),
    body('pickedItems.*.sku').notEmpty().withMessage('SKU is required'),
    body('pickedItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be >= 1'),
  ],
  validateRequest,
  markItemsAsPicked
);

// Update picking status for items
router.patch(
  '/:orderId/status',
  auth,
  roleCheck(['Warehouse Manager', 'Picker']),
  [
    param('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('skus').isArray({ min: 1 }).withMessage('At least one SKU required'),
    body('pickingStatus')
      .isIn(['pending', 'picked', 'not_picked'])
      .withMessage('Invalid picking status'),
  ],
  validateRequest,
  updatePickingStatus
);

module.exports = router;
