const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authLoginLimiter } = require('../middleware/authRateLimiter');
const { authMiddleware } = require('../middleware/auth');

router.post(
  '/login',
  authLoginLimiter,
  [
    check('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ max: 50 })
      .withMessage('Username is too long'),
    check('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ max: 72 })
      .withMessage('Password is too long'),
  ],
  validate,
  authController.login
);

router.post(
  '/recovery/consume',
  [check('token').trim().notEmpty().matches(/^[a-fA-F0-9]{64}$/)],
  validate,
  authController.consumeRecovery
);

router.post(
  '/change-password',
  authMiddleware,
  [
    check('newPassword').notEmpty().isLength({ min: 1, max: 72 }),
    check('currentPassword').optional().isLength({ max: 72 }),
  ],
  validate,
  authController.changePassword
);

router.post('/logout', authController.logout);

router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
