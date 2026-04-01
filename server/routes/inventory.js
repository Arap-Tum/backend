const express = require('express');
const { getInventory, createInventory, updateInventory } = require('../controllers/inventoryController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', auth, getInventory);
router.post('/', auth, roleCheck(['Admin']), createInventory);
router.patch('/:sku', auth, roleCheck(['Admin', 'Warehouse Clerk']), updateInventory);

module.exports = router;