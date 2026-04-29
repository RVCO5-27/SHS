const db = require('../config/db');
const { logAuditEvent, getClientIp, getUserAgent } = require('../services/auditService');

/**
 * Get all audit logs with filtering, search, and pagination
 */
exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const { 
      actionType, 
      userId, 
      category, 
      status, 
      search, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20,
      sortBy = 'timestamp',
      sortOrder = 'DESC'
    } = req.query;

    let sql = `
      SELECT al.*, a.username, a.full_name 
      FROM audit_logs al 
      LEFT JOIN admins a ON al.user_id = a.id
      WHERE 1=1
    `;
    let params = [];

    // Filters
    if (actionType) {
      sql += ' AND al.action_type = ?';
      params.push(actionType);
    }

    if (category) {
      sql += ' AND al.category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND al.status = ?';
      params.push(status);
    }

    if (userId) {
      sql += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (startDate && endDate) {
      sql += ' AND al.timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      sql += ' AND DATE(al.timestamp) >= DATE(?)';
      params.push(startDate);
    }

    // Search across multiple fields
    if (search) {
      sql += ` AND (al.old_value LIKE ? OR al.new_value LIKE ? 
               OR a.username LIKE ? OR a.full_name LIKE ? 
               OR al.description LIKE ? OR al.record_id LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term, term, term);
    }

    // Get total count before pagination
    const countSql = sql.replace(/SELECT al\.\*, a\.username, a\.full_name/, 'SELECT COUNT(*) as total');
    const [[{ total }]] = await db.execute(countSql, params);

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Validate sortBy to prevent SQL injection
    const validSortBy = ['timestamp', 'id', 'action_type', 'status', 'user_id'];
    const sortField = validSortBy.includes(sortBy) ? sortBy : 'timestamp';
    const validSort = ['ASC', 'DESC'];
    const sortDir = validSort.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    sql += ` ORDER BY al.${sortField} ${sortDir} LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);

    const [rows] = await db.execute(sql, params);

    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit log by ID with full details
 */
exports.getAuditLogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await db.execute(
      `SELECT al.*, a.username, a.full_name 
       FROM audit_logs al 
       LEFT JOIN admins a ON al.user_id = a.id
       WHERE al.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Audit log not found' });
    }

    const log = rows[0];
    if (log.diff_snapshot) {
      try {
        log.diff_snapshot = JSON.parse(log.diff_snapshot);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }
    if (log.details) {
      try {
        log.details = JSON.parse(log.details);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit statistics and summary
 */
exports.getAuditStatistics = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    // Total logs in period
    const [[{ totalLogs }]] = await db.execute(
      `SELECT COUNT(*) as totalLogs FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Logs by action type
    const [byActionType] = await db.execute(
      `SELECT action_type, COUNT(*) as count 
       FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY action_type`,
      [days]
    );

    // Logs by category
    const [byCategory] = await db.execute(
      `SELECT category, COUNT(*) as count 
       FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY category`,
      [days]
    );

    // Logs by status
    const [byStatus] = await db.execute(
      `SELECT status, COUNT(*) as count 
       FROM audit_logs 
       WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY status`,
      [days]
    );

    // Top users
    const [topUsers] = await db.execute(
      `SELECT al.user_id, a.username, a.full_name, COUNT(*) as count 
       FROM audit_logs al
       LEFT JOIN admins a ON al.user_id = a.id
       WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY al.user_id
       ORDER BY count DESC
       LIMIT 10`,
      [days]
    );

    // Recent logs
    const [recentLogs] = await db.execute(
      `SELECT al.*, a.username, a.full_name 
       FROM audit_logs al
       LEFT JOIN admins a ON al.user_id = a.id
       WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY al.timestamp DESC
       LIMIT 10`,
      [days]
    );

    res.json({
      summary: {
        totalLogs,
        period: `${days} days`,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      },
      breakdown: {
        byActionType,
        byCategory,
        byStatus,
        topUsers,
        recentLogs
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export audit logs as CSV (POST + confirm body — no public GET download).
 */
exports.exportAuditLogs = async (req, res, next) => {
  try {
    if (!req.body || req.body.confirm !== true) {
      return res.status(400).json({
        message: 'Please confirm the download on the Activity Log screen first.',
      });
    }

    const { startDate, endDate, actionType, category, status } = req.query;

    let sql = `
      SELECT al.id, al.user_id, a.username, al.action_type, 
             al.module, al.record_id, al.status, al.ip_address, al.timestamp,
             al.description, al.old_value, al.new_value
      FROM audit_logs al 
      LEFT JOIN admins a ON al.user_id = a.id
      WHERE 1=1
    `;
    let params = [];

    if (startDate && endDate) {
      sql += ' AND al.timestamp BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    if (actionType) {
      sql += ' AND al.action_type = ?';
      params.push(actionType);
    }

    if (category) {
      sql += ' AND al.category = ?';
      params.push(category);
    }

    if (status) {
      sql += ' AND al.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY al.timestamp DESC';

    const [logs] = await db.execute(sql, params);

    await logAuditEvent({
      userId: req.user.id,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      module: 'audit',
      description: `Downloaded activity log (spreadsheet, ${logs.length} rows)`,
      recordId: 'csv_export',
      resourceType: 'audit_export',
      newValue: { rowCount: logs.length, filters: { startDate, endDate, actionType, status } },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    const headers = [
      'ID',
      'User ID',
      'Username',
      'Action Type',
      'Module',
      'Record ID',
      'Status',
      'IP Address',
      'Timestamp',
      'Description',
    ];
    const csv = [headers.join(',')];

    logs.forEach((log) => {
      const row = [
        log.id,
        log.user_id,
        log.username,
        log.action_type,
        log.module,
        log.record_id,
        log.status,
        log.ip_address,
        log.timestamp,
        `"${(log.description || '').replace(/"/g, '""')}"`,
      ];
      csv.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=activity_log_export.csv');
    res.send(csv.join('\n'));
  } catch (err) {
    next(err);
  }
};

/**
 * Get audit log categories
 */
exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await db.execute(
      'SELECT * FROM audit_log_categories ORDER BY label ASC'
    );
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

/**
 * Get alerts for security events
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const { severity, acknowledged, page = 1, limit = 20 } = req.query;

    let sql = 'SELECT * FROM audit_log_alerts WHERE 1=1';
    let params = [];

    if (severity) {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    if (acknowledged !== undefined) {
      sql += ' AND is_acknowledged = ?';
      params.push(acknowledged === 'true' ? 1 : 0);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Get total
    const countSql = sql.replace(/SELECT \*/, 'SELECT COUNT(*) as total');
    const [[{ total }]] = await db.execute(countSql, params);

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [alerts] = await db.execute(sql, params);

    res.json({
      data: alerts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Acknowledge an alert
 */
exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.execute(
      `UPDATE audit_log_alerts 
       SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = NOW()
       WHERE id = ?`,
      [userId, id]
    );

    res.json({ message: 'Alert acknowledged' });
  } catch (err) {
    next(err);
  }
};
