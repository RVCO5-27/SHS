const rateLimit = require('express-rate-limit');

/**
 * Upload Rate Limiter - Enforces 10 requests per minute per user/IP
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 upload requests per minute
  message: { message: 'Upload rate limit exceeded. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise fallback to IP
    return req.user ? req.user.id : req.ip;
  }
});

module.exports = uploadLimiter;
