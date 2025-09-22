// server/controllers/todosController.js
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));
const toPriorityNum = (v) => {
  if (typeof v === 'string') {
    const s = v.toLowerCase();
    if (s === 'low') return 1;
    if (s === 'medium') return 2;
    if (s === 'high') return 3;
    const n = Number(v);
    return Number.isFinite(n) ? clamp(n, 1, 3) : 2;
  }
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, 1, 3) : 2;
};

const normalizeCreate = (body = {}) => {
  const title = String(body.title || '').trim();
  const progress = clamp(body.progress, 0, 100);
  const date = body.date ? String(body.date) : new Date().toISOString();
  const completed = Boolean(body.completed);
  const priority = toPriorityNum(body.priority);

  if (!title) return { ok: false, detail: 'Title is required' };
  return { ok: true, data: { title, progress, date, completed, priority } };
};

const listForUser = async (req, res) => {
  const emailParam = String(req.params.userEmail || '').toLowerCase();
  if (req.user.email !== emailParam) {
    return res.status(403).json({ detail: 'Forbidden' });
  }
  const result = await pool.query(
    'SELECT * FROM todos WHERE user_email = $1 ORDER BY date DESC',
    [emailParam]
  );
  res.json(result.rows);
};

const create = async (req, res) => {
  const v = normalizeCreate(req.body);
  if (!v.ok) return res.status(400).json({ detail: v.detail });

  const id = uuidv4();
  const user_email = req.user.email;
  const { title, progress, date, completed, priority } = v.data;

  const result = await pool.query(
    'INSERT INTO todos (id, user_email, title, progress, date, completed, priority) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [id, user_email, title, progress, date, completed, priority]
  );
  res.status(201).json(result.rows[0]);
};

/**
 * Partial update:
 * - Reads current row
 * - Merges with provided fields
 * - Validates and returns full updated row
 */
const update = async (req, res) => {
  const id = req.params.id;

  // Load existing
  const existing = await pool.query(
    'SELECT * FROM todos WHERE id = $1 AND user_email = $2',
    [id, req.user.email]
  );
  if (existing.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
  const row = existing.rows[0];

  // Merge with incoming
  const body = req.body || {};
  const next = {
    title: body.title !== undefined ? String(body.title).trim() : row.title,
    progress: body.progress !== undefined ? clamp(body.progress, 0, 100) : row.progress,
    date: body.date !== undefined ? String(body.date) : row.date,
    completed: body.completed !== undefined ? Boolean(body.completed) : row.completed,
    priority: body.priority !== undefined ? toPriorityNum(body.priority) : row.priority,
  };

  if (!next.title) return res.status(400).json({ detail: 'Title is required' });

  const result = await pool.query(
    'UPDATE todos SET title=$1, progress=$2, date=$3, completed=$4, priority=$5 WHERE id=$6 AND user_email=$7 RETURNING *',
    [next.title, next.progress, next.date, next.completed, next.priority, id, req.user.email]
  );

  if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
  res.status(200).json(result.rows[0]);
};

const remove = async (req, res) => {
  const id = req.params.id;
  const result = await pool.query(
    'DELETE FROM todos WHERE id = $1 AND user_email = $2',
    [id, req.user.email]
  );
  if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
  res.status(204).end();
};

module.exports = { listForUser, create, update, remove };
