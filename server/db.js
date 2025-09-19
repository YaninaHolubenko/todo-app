/* server/db.js */
const { Pool } = require('pg')
require('dotenv').config()

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required by most managed Postgres (e.g., Neon)
    })
  : new Pool({
      user: process.env.PGUSER || process.env.USERNAME,
      password: process.env.PGPASSWORD || process.env.PASSWORD,
      host: process.env.PGHOST || process.env.HOST || 'localhost',
      port: Number(process.env.PGPORT || process.env.DBPORT || 5432),
      database: process.env.PGDATABASE || 'todoapp',
    })

module.exports = pool
