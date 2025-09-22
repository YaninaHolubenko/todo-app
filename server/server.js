/* server/server.js */
require('dotenv').config()

const PORT = process.env.PORT ?? 8000
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const app = express()
const pool = require('./db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// > validation helpers
const {
  normalizeEmail,
  strongPassword,
  parseBoolean,
  validateTodoPayload,
} = require('./validation')

/** security & parsers */
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
const isProd = process.env.NODE_ENV === 'production'

// trust reverse proxy so secure cookies work on Render/Heroku
app.set('trust proxy', 1)

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true, // allow cookies
  })
)
app.use(helmet())
app.use(express.json({ limit: '32kb' }))
app.use(cookieParser())

/** limit auth endpoints */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
})

/** auth middleware */
const auth = (req, res, next) => {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ detail: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload // { email }
    next()
  } catch {
    return res.status(401).json({ detail: 'Unauthorized' })
  }
}

/** helpers */
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd, // in dev over http, in prod over https
    maxAge: 60 * 60 * 1000, // 1 hour
    path: '/',
  })
}

/* ===================== TODOS ===================== */

// get all todos for a user (protected + same-user check)
app.get('/todos/:userEmail', auth, async (req, res) => {
  const { userEmail } = req.params
  if (req.user.email !== userEmail) {
    return res.status(403).json({ detail: 'Forbidden' })
  }
  try {
    const todos = await pool.query(
      'SELECT * FROM todos WHERE user_email = $1 ORDER BY date DESC',
      [userEmail]
    )
    res.json(todos.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// create a new todo (forces user_email from the token)
app.post('/todos', auth, async (req, res) => {
  const v = validateTodoPayload(req.body)
  if (!v.ok) return res.status(400).json({ detail: v.detail })

  const id = uuidv4()
  const user_email = req.user.email
  const title = v.data.title
  const progress = v.data.progress
  const priority = v.data.priority
  const isoDate = v.data.date || new Date().toISOString()
  const completedVal = parseBoolean(v.data.completed, false)

  try {
    await pool.query(
      'INSERT INTO todos(id, user_email, title, progress, date, completed, priority) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [id, user_email, title, progress, isoDate, completedVal, priority]
    )
    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// edit a todo (only owner can edit; partial update)
app.put('/todos/:id', auth, async (req, res) => {
  const { id } = req.params

  try {
    const owner = await pool.query('SELECT user_email FROM todos WHERE id = $1', [id])
    if (!owner.rows.length) return res.status(404).json({ detail: 'Not found' })
    if (owner.rows[0].user_email !== req.user.email) return res.status(403).json({ detail: 'Forbidden' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ detail: 'Server error' })
  }

  // validate partial update via aggregator
  const v = validateTodoPayload(req.body, { partial: true })
  if (!v.ok) return res.status(400).json({ detail: v.detail })

  // map validated fields to current COALESCE pattern
  const t = v.data.title ?? null
  const progNum = v.data.progress ?? null
  const isoDate = v.data.date ?? null
  const completedVal =
    v.data.completed !== undefined ? parseBoolean(v.data.completed, false) : null
  const priorityVal = v.data.priority ?? null

  try {
    const result = await pool.query(
      `
      UPDATE todos
      SET
        title      = COALESCE($1, title),
        progress   = COALESCE($2, progress),
        date       = COALESCE($3, date),
        completed  = COALESCE($4, completed),
        priority   = COALESCE($5, priority)
      WHERE id = $6
      `,
      [t, progNum, isoDate, completedVal, priorityVal, id]
    )
    if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' })
    res.json({ updated: result.rowCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// delete a todo (only owner can delete)
app.delete('/todos/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const owner = await pool.query('SELECT user_email FROM todos WHERE id = $1', [id])
    if (!owner.rows.length) return res.status(404).json({ detail: 'Not found' })
    if (owner.rows[0].user_email !== req.user.email) return res.status(403).json({ detail: 'Forbidden' })

    await pool.query('DELETE FROM todos WHERE id = $1', [id])
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

/* ===================== AUTH ===================== */

// signup
app.post('/signup', authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (!email || !strongPassword(password)) {
    return res.status(400).json({ detail: 'Invalid email or password' })
  }

  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(password, salt)

  try {
    await pool.query('INSERT INTO users (email, hashed_password) VALUES($1, $2)', [email, hashedPassword])
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' })
    setAuthCookie(res, token)
    // No JSON body; client relies on httpOnly cookie + /me
    res.status(204).end()
  } catch (err) {
    console.error(err)
    if (err.code === '23505') return res.status(409).json({ detail: 'User already exists' })
    res.status(500).json({ detail: 'Signup failed' })
  }
})

// login
app.post('/login', authLimiter, async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = req.body?.password

  if (!email || typeof password !== 'string') {
    return res.status(400).json({ detail: 'Invalid email or password' })
  }

  try {
    const users = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (!users.rows.length) return res.status(401).json({ detail: 'Invalid email or password' })

    const success = await bcrypt.compare(password, users.rows[0].hashed_password)
    if (!success) return res.status(401).json({ detail: 'Invalid email or password' })

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' })
    setAuthCookie(res, token)
    // No JSON body; client relies on httpOnly cookie + /me
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// current user
app.get('/me', auth, (req, res) => {
  res.json({ email: req.user.email })
})

/* ============== USER PROFILE (NEW) ============== */
/**
 * PATCH /users/me
 * Allows changing email and/or password.
 */
app.patch('/users/me', auth, async (req, res) => {
  const currentPassword = req.body?.currentPassword
  const newPasswordRaw = req.body?.newPassword
  const newEmailRaw = req.body?.newEmail

  const wantEmail = typeof newEmailRaw === 'string' && newEmailRaw.trim() !== ''
  const wantPassword = typeof newPasswordRaw === 'string' && newPasswordRaw.trim() !== ''

  if ((wantEmail || wantPassword) && !currentPassword) {
    return res.status(400).json({ detail: 'Current password is required' })
  }

  let newEmail = null
  if (wantEmail) {
    newEmail = normalizeEmail(newEmailRaw)
    if (!newEmail) return res.status(400).json({ detail: 'Invalid email' })
  }

  let newPassword = null
  if (wantPassword) {
    if (!strongPassword(newPasswordRaw)) {
      return res.status(400).json({ detail: 'New password is too short' })
    }
    newPassword = newPasswordRaw
  }

  try {
    const userQ = await pool.query('SELECT * FROM users WHERE email = $1', [req.user.email])
    if (!userQ.rows.length) return res.status(404).json({ detail: 'User not found' })

    // verify current password (only if changing something)
    if (wantEmail || wantPassword) {
      const ok = await bcrypt.compare(currentPassword || '', userQ.rows[0].hashed_password)
      if (!ok) return res.status(401).json({ detail: 'Current password is incorrect' })
    }

    let updatedEmail = req.user.email
    let updatedHash = null

    if (newEmail && newEmail !== req.user.email) {
      const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [newEmail])
      if (exists.rows.length) return res.status(409).json({ detail: 'Email already in use' })
      updatedEmail = newEmail
    }
    if (newPassword) {
      const salt = bcrypt.genSaltSync(10)
      updatedHash = bcrypt.hashSync(newPassword, salt)
    }

    // transaction: update user, and todos' user_email if email changed
    await pool.query('BEGIN')
    if (updatedEmail !== req.user.email) {
      await pool.query('UPDATE users SET email = $1 WHERE email = $2', [updatedEmail, req.user.email])
      await pool.query('UPDATE todos SET user_email = $1 WHERE user_email = $2', [updatedEmail, req.user.email])
    }
    if (updatedHash) {
      await pool.query('UPDATE users SET hashed_password = $1 WHERE email = $2', [updatedHash, updatedEmail])
    }
    await pool.query('COMMIT')

    // issue a fresh token if email changed
    const newToken = jwt.sign({ email: updatedEmail }, process.env.JWT_SECRET, { expiresIn: '1h' })
    setAuthCookie(res, newToken)

    res.json({ email: updatedEmail })
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {})
    console.error(err)
    res.status(500).json({ detail: 'Update failed' })
  }
})

/**
 * DELETE /users/me
 * Deletes user account and all owned todos.
 * Clears auth cookie.
 */
app.delete('/users/me', auth, async (req, res) => {
  try {
    await pool.query('BEGIN')
    await pool.query('DELETE FROM todos WHERE user_email = $1', [req.user.email])
    const delUser = await pool.query('DELETE FROM users WHERE email = $1', [req.user.email])
    await pool.query('COMMIT')

    if (delUser.rowCount === 0) return res.status(404).json({ detail: 'User not found' })

    res.clearCookie('token', {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
    })
    res.status(204).end()
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {})
    console.error(err)
    res.status(500).json({ detail: 'Delete failed' })
  }
})

/* ===================== LOGOUT ===================== */

app.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/',
  })
  res.status(204).end()
})

app.listen(PORT, () => console.log(`Server running on PORT ${PORT}`))
