const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { getInventory, getInventoryBySku, createInventory, updateInventory, deleteInventory } = require('../controllers/inventoryController');
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

router.get('/', auth, getInventory);
router.get('/:sku', auth, param('sku').notEmpty().withMessage('SKU is required'), validateRequest, getInventoryBySku);
router.post(
  '/',
  auth,
  roleCheck(['Warehouse Manager']),
  [
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('productName').trim().notEmpty().withMessage('Product name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('reorderLevel').isInt({ min: 0 }).withMessage('Reorder level must be >= 0'),
    body('batches').isArray().withMessage('Batches must be an array'),
    body('batches.*.batchNumber').trim().notEmpty().withMessage('Batch number is required'),
    body('batches.*.quantity').isInt({ min: 0 }).withMessage('Batch quantity must be >= 0'),
    body('batches.*.manufactureDate').isISO8601().toDate().withMessage('Valid manufactureDate required'),
    body('batches.*.expiryDate').isISO8601().toDate().withMessage('Valid expiryDate required'),
    body('batches.*.storageLocationCode').trim().notEmpty().withMessage('Storage location code is required'),
  ],
  validateRequest,
  createInventory
);
router.patch(
  '/:sku',
  auth,
  canManageInventory,
  [
    param('sku').notEmpty().withMessage('SKU is required'),
    body('reorderLevel').optional().isInt({ min: 0 }).withMessage('Reorder level must be >= 0'),
    body('batches').optional().isArray().withMessage('Batches must be an array'),
  ],
  validateRequest,
  updateInventory
);
router.delete('/:sku', auth, roleCheck(['Warehouse Manager']), param('sku').notEmpty().withMessage('SKU is required'), validateRequest, deleteInventory);

module.exports = router;