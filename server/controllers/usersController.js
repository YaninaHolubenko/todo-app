// server/controllers/usersController.js
const pool = require('../db');

const isEmail = (v) => typeof v === 'string' && /\S+@\S+\.\S+/.test(v);

const updateMe = async (req, res) => {
  const currentEmail = req.user.email;
  const nextEmail = (req.body?.email || '').toLowerCase().trim();

  if (!isEmail(nextEmail)) {
    return res.status(400).json({ detail: 'Invalid email' });
  }

  const result = await pool.query(
    'UPDATE users SET email = $1 WHERE email = $2 RETURNING email',
    [nextEmail, currentEmail]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ detail: 'User not found' });
  }

  res.json({ email: result.rows[0].email });
};

const deleteMe = async (req, res) => {
  const email = req.user.email;
  await pool.query('DELETE FROM todos WHERE user_email = $1', [email]);
  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  res.status(204).end();
};

module.exports = { updateMe, deleteMe };
