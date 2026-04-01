const express = require('express');
const { getUsers, updateUserRole } = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', auth, roleCheck(['Admin']), getUsers);
router.patch('/:id', auth, roleCheck(['Admin']), updateUserRole);

module.exports = router;