// server/routes/users.js
const express = require('express');
const { updateMe, deleteMe } = require('../controllers/usersController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.patch('/me', auth, updateMe);
router.delete('/me', auth, deleteMe);

module.exports = router;
