function errorMiddleware(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -`, err.message);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = errorMiddleware;
