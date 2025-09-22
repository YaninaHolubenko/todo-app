// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: 60 * 60 * 1000, // 1h
    path: '/',
  });
};

const auth = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ detail: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { email }
    next();
  } catch {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
};

module.exports = { auth, setAuthCookie };
