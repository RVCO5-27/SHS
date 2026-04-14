module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const safeMessage =
    isProd && status >= 500 ? 'Internal server error' : err.message || 'Internal server error';
  res.status(status).json({ message: safeMessage, error: safeMessage });
};
