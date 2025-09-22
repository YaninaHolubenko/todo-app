/* server/server.js */
require('dotenv').config();

const PORT = process.env.PORT ?? 8000;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
require('./db'); // ensure DB pool is initialized

const { errorHandler } = require('./middleware/error');

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

app.set('trust proxy', 1);

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.use('/', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/todos', require('./routes/todos'));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

/**
 * Export the app for tests.
 * Only start the HTTP server when this file is executed directly.
 */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] listening on ${PORT}`);
  });
}

module.exports = app;
