// server/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { setAuthCookie } = require('../middleware/auth');

// simple validators
const isEmail = (v) => typeof v === 'string' && /\S+@\S+\.\S+/.test(v);
const strongPassword = (v) => typeof v === 'string' && v.length >= 6;

// cookie options used for clearing (must match how cookies are set)
const isProd = process.env.NODE_ENV === 'production';
const cookieClearOpts = {
  httpOnly: true,
  path: '/',
  sameSite: isProd ? 'None' : 'Lax',
  secure: isProd,
};

const signup = async (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  const password = req.body?.password;

  if (!isEmail(email) || !strongPassword(password)) {
    return res.status(400).json({ detail: 'Invalid email or password' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    await pool.query(
      'INSERT INTO users (email, hashed_password) VALUES ($1, $2)',
      [email, hashedPassword]
    );
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    setAuthCookie(res, token);
    res.status(204).end();
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ detail: 'User already exists' });
    console.error(err);
    res.status(500).json({ detail: 'Signup failed' });
  }
};

const login = async (req, res) => {
  const email = (req.body?.email || '').toLowerCase().trim();
  const password = req.body?.password;

  if (!isEmail(email) || typeof password !== 'string') {
    return res.status(400).json({ detail: 'Invalid email or password' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ detail: 'Invalid credentials' });

    const success = bcrypt.compareSync(password, result.rows[0].hashed_password);
    if (!success) return res.status(401).json({ detail: 'Invalid credentials' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    setAuthCookie(res, token);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: 'Login failed' });
  }
};

const me = async (req, res) => {
  res.json({ email: req.user.email });
};

const logout = async (_req, res) => {
  // clear the current cookie and possible legacy names with matching attributes
  res.clearCookie('token', { ...cookieClearOpts, maxAge: 0 });
  res.clearCookie('AuthToken', { ...cookieClearOpts, maxAge: 0 });
  res.status(204).end();
};

module.exports = { signup, login, me, logout };
