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

/** security & parsers */
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000'
const isProd = process.env.NODE_ENV === 'production'

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true, // allow cookies
  })
)
app.use(helmet())
app.use(express.json())
app.use(cookieParser())

/** limit auth endpoints */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
    const todos = await pool.query('SELECT * FROM todos WHERE user_email = $1', [userEmail])
    res.json(todos.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// create a new todo (forces user_email from the token)
app.post('/todos', auth, async (req, res) => {
  const { title, progress, date, completed, priority } = req.body

  const t = (title ?? '').toString().trim()
  const progNum = Number(progress)
  const prioNum = Number(priority)

  if (!t) return res.status(400).json({ detail: 'Invalid title' })
  if (!Number.isFinite(progNum) || progNum < 0 || progNum > 100) {
    return res.status(400).json({ detail: 'Invalid progress' })
  }

  const id = uuidv4()
  const isoDate = date ? new Date(date).toISOString() : new Date().toISOString()
  const completedVal = typeof completed === 'boolean' ? completed : false
  const priorityVal = Number.isInteger(prioNum) ? Math.max(1, Math.min(3, prioNum)) : 2
  const user_email = req.user.email

  try {
    await pool.query(
      'INSERT INTO todos(id, user_email, title, progress, date, completed, priority) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [id, user_email, t, progNum, isoDate, completedVal, priorityVal]
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
  const { title, progress, date, completed, priority } = req.body

  try {
    const owner = await pool.query('SELECT user_email FROM todos WHERE id = $1', [id])
    if (!owner.rows.length) return res.status(404).json({ detail: 'Not found' })
    if (owner.rows[0].user_email !== req.user.email) return res.status(403).json({ detail: 'Forbidden' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ detail: 'Server error' })
  }

  const t = typeof title === 'string' ? title.trim() : null
  const progNum = progress === undefined ? null : Math.max(0, Math.min(100, Number(progress)))
  const isoDate = date ? new Date(date).toISOString() : null
  const completedVal = typeof completed === 'boolean' ? completed : null
  const prioNumRaw = priority === undefined ? null : Number(priority)
  const priorityVal =
    prioNumRaw === null
      ? null
      : Number.isInteger(prioNumRaw)
      ? Math.max(1, Math.min(3, prioNumRaw))
      : null

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
  const { email, password } = req.body
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ detail: 'Invalid email or password' })
  }

  const salt = bcrypt.genSaltSync(10)
  const hashedPassword = bcrypt.hashSync(password, salt)

  try {
    await pool.query('INSERT INTO users (email, hashed_password) VALUES($1, $2)', [email, hashedPassword])
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' })
    setAuthCookie(res, token)
    // keep token in JSON for current client compatibility; will remove later
    res.status(201).json({ email, token })
  } catch (err) {
    console.error(err)
    if (err.code === '23505') return res.status(409).json({ detail: 'User already exists' })
    res.status(500).json({ detail: 'Signup failed' })
  }
})

// login
app.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body
  try {
    const users = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (!users.rows.length) return res.status(401).json({ detail: 'User does not exist' })

    const success = await bcrypt.compare(password, users.rows[0].hashed_password)
    if (!success) return res.status(401).json({ detail: 'Login failed' })

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' })
    setAuthCookie(res, token)
    res.json({ email: users.rows[0].email, token }) // keep for now
  } catch (err) {
    console.error(err)
    res.status(500).json({ detail: 'Server error' })
  }
})

// current user
app.get('/me', auth, (req, res) => {
  res.json({ email: req.user.email })
})

// logout
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
