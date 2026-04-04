const express = require('express');
const { getUsers, updateUserRole } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', auth, roleCheck(['Warehouse Manager']), getUsers);
router.patch('/:id', auth, roleCheck(['Warehouse Manager']), updateUserRole);

module.exports = router;