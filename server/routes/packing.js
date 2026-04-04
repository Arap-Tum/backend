const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  getOrdersReadyForPacking,
  getAssignedPackingOrders,
  assignOrderToPacker,
  confirmPackedItems,
  updatePackingStatus,
  getOrderDetails,
} = require('../controllers/packingController');
const auth = require('../middleware/auth');
const { roleCheck, isPacker } = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get orders ready for packing
router.get(
  '/list/ready',
  auth,
  roleCheck(['Warehouse Manager', 'Packer']),
  getOrdersReadyForPacking
);

// Get assigned packing orders for current packer
router.get(
  '/assigned',
  auth,
  isPacker,
  getAssignedPackingOrders
);

// Get order details for packing
router.get(
  '/:orderId/details',
  auth,
  roleCheck(['Warehouse Manager', 'Packer']),
  [param('orderId').isMongoId().withMessage('Valid Order ID required')],
  validateRequest,
  getOrderDetails
);

// Assign order to packer (Warehouse Manager only)
router.post(
  '/assign',
  auth,
  roleCheck(['Warehouse Manager']),
  [
    body('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('packerId').isMongoId().withMessage('Valid Packer ID required'),
  ],
  validateRequest,
  assignOrderToPacker
);

// Confirm items as packed
router.patch(
  '/:orderId/confirm-packed',
  auth,
  isPacker,
  [
    param('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('packedItems').isArray({ min: 1 }).withMessage('At least one packed item required'),
    body('packedItems.*.sku').notEmpty().withMessage('SKU is required'),
  ],
  validateRequest,
  confirmPackedItems
);

// Update packing status for specific items
router.patch(
  '/:orderId/status',
  auth,
  roleCheck(['Warehouse Manager', 'Packer']),
  [
    param('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('skus').isArray({ min: 1 }).withMessage('At least one SKU required'),
    body('packingStatus')
      .isIn(['pending', 'packed', 'not_packed'])
      .withMessage('Invalid packing status'),
  ],
  validateRequest,
  updatePackingStatus
);

module.exports = router;
