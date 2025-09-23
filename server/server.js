/* server/server.js */
require('dotenv').config();

const path = require('path');
const PORT = process.env.PORT ?? 8000;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
require('./db'); // init DB pool

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

// API routes
app.use('/', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/todos', require('./routes/todos'));

app.get('/health', (req, res) => res.json({ ok: true }));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.resolve(__dirname, '../client/build');
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// error handler (keep last)
app.use(errorHandler);

/* Export the app for tests. Only start HTTP server when executed directly. */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[server] listening on ${PORT}`);
  });
}

module.exports = app;
