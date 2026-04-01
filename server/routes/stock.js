const express = require('express');
const { receiveStock, dispatchStock, getStockHistory } = require('../controllers/stockController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.post('/receive', auth, roleCheck(['Warehouse Clerk']), receiveStock);
router.post('/dispatch', auth, roleCheck(['Warehouse Clerk']), dispatchStock);
router.get('/history', auth, getStockHistory);

module.exports = router;