const db = require('../config/db');

/**
 * Get all audit logs with optional filtering
 */
exports.getAllAuditLogs = async (req, res, next) => {
  try {
    const { actionType, userId, search } = req.query;
    let sql = `
      SELECT al.*, a.username, a.full_name 
      FROM school_audit_logs al 
      LEFT JOIN admins a ON al.user_id = a.id
      WHERE 1=1
    `;
    let params = [];

    if (actionType) {
      sql += ' AND al.action_type = ?';
      params.push(actionType);
    }

    if (userId) {
      sql += ' AND al.user_id = ?';
      params.push(userId);
    }

    if (search) {
      sql += ' AND (al.old_value LIKE ? OR al.new_value LIKE ? OR a.username LIKE ? OR a.full_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY al.timestamp DESC';

    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};
