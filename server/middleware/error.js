// server/middleware/error.js
// Centralized error handler
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[error]', err);
  const status = err.statusCode || 500;
  const detail = err.expose ? err.message : 'Internal Server Error';
  res.status(status).json({ detail });
};

module.exports = { errorHandler };
