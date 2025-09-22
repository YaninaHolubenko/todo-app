// server/validation.js
const MAX_TITLE = 120;

const normalizeEmail = (input) => {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  if (email.length === 0 || email.length > 254) return null;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(email) ? email : null;
};

const strongPassword = (pw) =>
  typeof pw === 'string' && pw.length >= 6 && pw.length <= 128;

const sanitizeTitle = (input) => {
  if (typeof input !== 'string') return null;
  const v = input
    .replace(/[\u0000-\u001F\u007F]/g, ' ') // strip control chars
    .replace(/<[^>]*>/g, '')                // strip HTML tags
    .replace(/&[^;]{1,10};/g, '')           // strip stray entities
    .trim()
    .replace(/\s+/g, ' ');
  if (!v || v.length > MAX_TITLE) return null;
  return v;
};

const numberInRange = (v, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
};

const intInRange = (v, min, max) => {
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < min || n > max) return null;
  return n;
};

const parseDateISO = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
  }
  return fallback;
};

// Aggregate validator for create/update todo payloads
const validateTodoPayload = (payload, { partial = false } = {}) => {
  const errors = [];
  const out = {};

  if (payload.title !== undefined || !partial) {
    const title = sanitizeTitle(payload.title ?? '');
    if (!title) errors.push('Title is required and must be <= 120 chars.');
    else out.title = title;
  }

  if (payload.progress !== undefined || !partial) {
    const progress = intInRange(payload.progress ?? 0, 0, 100);
    if (progress == null) errors.push('Progress must be an integer 0–100.');
    else out.progress = progress;
  }

  if (payload.priority !== undefined || !partial) {
    const priority = intInRange(payload.priority ?? 2, 1, 3);
    if (priority == null) errors.push('Priority must be 1, 2, or 3.');
    else out.priority = priority;
  }

  if (payload.date !== undefined) {
    const dateISO = parseDateISO(payload.date);
    if (!dateISO) errors.push('Invalid date.');
    else out.date = dateISO;
  }

  if (payload.completed !== undefined) {
    out.completed = parseBoolean(payload.completed);
  }

  if (errors.length) return { ok: false, detail: errors.join(' ') };
  return { ok: true, data: out };
};

module.exports = {
  MAX_TITLE,
  normalizeEmail,
  strongPassword,
  sanitizeTitle,
  numberInRange,
  intInRange,
  parseDateISO,
  parseBoolean,
  validateTodoPayload,
};
