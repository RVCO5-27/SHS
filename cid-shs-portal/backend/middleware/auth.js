const jwt = require('jsonwebtoken');
const { getJwtSecret, ADMIN_ROLES } = require('../config/security');

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing auth token' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }
  let secret;
  try {
    secret = getJwtSecret();
  } catch (configErr) {
    console.error(configErr);
    return res.status(500).json({ message: 'Server configuration error' });
  }
  try {
    const payload = jwt.verify(token, secret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Requires a valid admin JWT including role (re-login if token predates role claim).
 */
exports.requireAdminRole = (req, res, next) => {
  const role = req.user && req.user.role;
  if (!role || !ADMIN_ROLES.has(role)) {
    return res.status(403).json({ message: 'Admin access required. Please sign in again.' });
  }
  next();
};
