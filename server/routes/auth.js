// server/routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { signup, login, me, logout } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);

module.exports = router;
