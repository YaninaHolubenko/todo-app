/* server/db.js */
const { Pool } = require('pg');
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const toInt = (v, def) => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : def;
};

const basePoolOpts = {
  // Pool sizing & timeouts
  max: toInt(process.env.PGPOOL_MAX, 10),                     // total connections
  idleTimeoutMillis: toInt(process.env.PG_IDLE_TIMEOUT, 30000), // 30s
  connectionTimeoutMillis: toInt(process.env.PG_CONNECT_TIMEOUT, 10000), // 10s
  keepAlive: true,

  // Optional server-side timeouts (supported by node-postgres)
  statement_timeout: toInt(process.env.PG_STATEMENT_TIMEOUT, 0),                  // 0 = no timeout
  query_timeout: toInt(process.env.PG_QUERY_TIMEOUT, 0),                          // client-side
  idle_in_transaction_session_timeout: toInt(process.env.PG_IDLE_TX_TIMEOUT, 0),  // 0 = no timeout
};

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false, // managed Postgres typically requires SSL
      ...basePoolOpts,
    })
  : new Pool({
      user: process.env.PGUSER || process.env.USERNAME,
      password: process.env.PGPASSWORD || process.env.PASSWORD,
      host: process.env.PGHOST || process.env.HOST || 'localhost',
      port: toInt(process.env.PGPORT || process.env.DBPORT, 5432),
      database: process.env.PGDATABASE || 'todoapp',
      ssl: false,
      ...basePoolOpts,
    });

// Helpful safety net: log unexpected client errors to avoid silent crashes
pool.on('error', (err) => {
  console.error('[pg:pool:error]', err);
});

module.exports = pool;
