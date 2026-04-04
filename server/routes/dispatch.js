const express = require('express');
const { body, param, validationResult } = require('express-validator');
const {
  getPackedOrders,
  getDispatchedOrders,
  confirmShipment,
  approveAndDispatchOrders,
  getOrderDispatchDetails,
  markAsDelivered,
} = require('../controllers/dispatchController');
const auth = require('../middleware/auth');
const { roleCheck, canDispatch } = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get packed orders ready for dispatch
router.get(
  '/list/ready',
  auth,
  canDispatch,
  getPackedOrders
);

// Get orders dispatched by current dispatcher
router.get(
  '/dispatched',
  auth,
  canDispatch,
  getDispatchedOrders
);

// Get order dispatch details
router.get(
  '/:orderId/details',
  auth,
  canDispatch,
  [param('orderId').isMongoId().withMessage('Valid Order ID required')],
  validateRequest,
  getOrderDispatchDetails
);

// Confirm shipment of single order
router.patch(
  '/:orderId/confirm-shipment',
  auth,
  canDispatch,
  [
    param('orderId').isMongoId().withMessage('Valid Order ID required'),
    body('trackingNumber').optional().isString(),
  ],
  validateRequest,
  confirmShipment
);

// Approve and dispatch multiple orders at once
router.post(
  '/bulk/approve-dispatch',
  auth,
  canDispatch,
  [
    body('orderIds').isArray({ min: 1 }).withMessage('At least one Order ID required'),
    body('orderIds.*').isMongoId().withMessage('Invalid Order ID'),
    body('trackingNumbers').optional().isArray(),
  ],
  validateRequest,
  approveAndDispatchOrders
);

// Mark order as delivered
router.patch(
  '/:orderId/mark-delivered',
  auth,
  canDispatch,
  [param('orderId').isMongoId().withMessage('Valid Order ID required')],
  validateRequest,
  markAsDelivered
);

module.exports = router;
