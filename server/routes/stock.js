const express = require('express');
const { body, validationResult } = require('express-validator');
const { receiveStock, dispatchStock, transferStock, getStockHistory } = require('../controllers/stockController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/receive',
  auth,
  roleCheck(['Warehouse Clerk']),
  [
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('batchNumber').trim().notEmpty().withMessage('Batch number is required'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
    body('manufactureDate').isISO8601().withMessage('Valid manufactureDate required'),
    body('expiryDate').isISO8601().withMessage('Valid expiryDate required'),
    body('storageLocationCode').trim().notEmpty().withMessage('Storage location code is required'),
  ],
  validateRequest,
  receiveStock
);

router.post(
  '/dispatch',
  auth,
  roleCheck(['Warehouse Clerk']),
  [
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  dispatchStock
);

router.post(
  '/transfer',
  auth,
  roleCheck(['Warehouse Clerk']),
  [
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('sourceBatchNumber').trim().notEmpty().withMessage('Source batch number is required'),
    body('destinationBatchNumber').trim().notEmpty().withMessage('Destination batch number is required'),
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  ],
  validateRequest,
  transferStock
);

router.get('/history', auth, getStockHistory);

module.exports = router;