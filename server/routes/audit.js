const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const {
  getStockMovementHistory,
  getMovementBySku,
  conductStockAudit,
  submitAuditResults,
  getInventoryAccuracyReport,
  getAuditHistory,
  getExpiredAndLowStockItems,
} = require('../controllers/auditController');
const auth = require('../middleware/auth');
const { roleCheck, canManageInventory } = require('../middleware/roleCheck');

const router = express.Router();

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get stock movement history
router.get(
  '/history/movements',
  auth,
  canManageInventory,
  [
    query('sku').optional().trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('movementType').optional().isIn(['RECEIVE', 'DISPATCH', 'TRANSFER']),
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  getStockMovementHistory
);

// Get stock movement for specific SKU
router.get(
  '/history/:sku',
  auth,
  canManageInventory,
  [
    param('sku').notEmpty().withMessage('SKU is required'),
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  getMovementBySku
);

// Conduct stock audit
router.post(
  '/audit/conduct',
  auth,
  canManageInventory,
  [
    body('skus').isArray({ min: 1 }).withMessage('SKUs array is required'),
    body('skus.*').trim().notEmpty().withMessage('Each SKU is required'),
  ],
  validateRequest,
  conductStockAudit
);

// Submit audit results
router.post(
  '/audit/submit-results',
  auth,
  canManageInventory,
  [
    body('auditResults').isArray({ min: 1 }).withMessage('Audit results array is required'),
    body('auditResults.*.sku').notEmpty().withMessage('SKU is required'),
    body('auditResults.*.physicalCount').isInt({ min: 0 }).withMessage('Physical count is required'),
  ],
  validateRequest,
  submitAuditResults
);

// Get inventory accuracy report
router.get(
  '/reports/accuracy',
  auth,
  canManageInventory,
  getInventoryAccuracyReport
);

// Get audit history
router.get(
  '/reports/audit-history',
  auth,
  canManageInventory,
  [
    query('limit').optional().isInt({ min: 1, max: 500 }),
    query('skip').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  getAuditHistory
);

// Get expired and low stock items
router.get(
  '/reports/critical-items',
  auth,
  canManageInventory,
  getExpiredAndLowStockItems
);

module.exports = router;
