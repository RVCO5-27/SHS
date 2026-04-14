const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');

/**
 * Audit Log Management Routes
 * Only SuperAdmins can view all logs
 */

router.use(authMiddleware);
router.use(requireAdminRole);

router.get('/', async (req, res, next) => {
  if (req.user.role !== 'SuperAdmin') {
    return res.status(403).json({ message: 'Access denied: Only SuperAdmins can view audit logs' });
  }
  next();
}, auditLogController.getAllAuditLogs);

module.exports = router;
