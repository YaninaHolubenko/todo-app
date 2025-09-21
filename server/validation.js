// server/validation.js
const MAX_TITLE = 120

const normalizeEmail = (input) => {
  if (typeof input !== 'string') return null
  const email = input.trim().toLowerCase()
  if (email.length > 254) return null
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
  return re.test(email) ? email : null
}

const strongPassword = (pw) =>
  typeof pw === 'string' && pw.length >= 6 && pw.length <= 128

const sanitizeTitle = (input) => {
  if (typeof input !== 'string') return null
  const t = input.replace(/\s+/g, ' ').trim()
  if (!t || t.length > MAX_TITLE) return null
  return t
}

const numberInRange = (v, min, max) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  if (n < min || n > max) return null
  return n
}

const intInRange = (v, min, max) => {
  const n = Number(v)
  if (!Number.isInteger(n)) return null
  if (n < min || n > max) return null
  return n
}

const parseDateISO = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

module.exports = {
  MAX_TITLE,
  normalizeEmail,
  strongPassword,
  sanitizeTitle,
  numberInRange,
  intInRange,
  parseDateISO,
}
