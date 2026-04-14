const db = require('../config/db');
const { clientIp } = require('../services/authAudit');

/**
 * Log a school management action to the audit logs
 */
async function logSchoolAction(userId, actionType, recordId, oldValue, newValue, req) {
  try {
    const ip = clientIp(req);
    await db.execute(
      'INSERT INTO school_audit_logs (user_id, action_type, record_id, old_value, new_value, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, actionType, recordId, JSON.stringify(oldValue), JSON.stringify(newValue), ip]
    );
  } catch (err) {
    console.error('[logSchoolAction] Failed to log action:', err.message);
  }
}

/**
 * Get all schools with optional search and filtering
 */
exports.getAllSchools = async (req, res, next) => {
  try {
    const { search, type, sortBy = 'school_name', order = 'ASC', page, limit } = req.query;
    let sql = 'SELECT * FROM schools';
    let countSql = 'SELECT COUNT(*) as total FROM schools';
    let params = [];
    let whereClauses = [];

    if (search) {
      whereClauses.push('(school_id LIKE ? OR school_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (type) {
      whereClauses.push('school_type = ?');
      params.push(type);
    }

    if (whereClauses.length > 0) {
      const wherePart = ' WHERE ' + whereClauses.join(' AND ');
      sql += wherePart;
      countSql += wherePart;
    }

    // Get total count for pagination
    const [countRows] = await db.execute(countSql, params);
    const total = countRows[0].total;

    // Basic sanitization for sort columns
    const allowedSort = ['school_id', 'school_name', 'principal_name', 'year_started'];
    const sort = allowedSort.includes(sortBy) ? sortBy : 'school_name';
    const direction = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${sort} ${direction}`;

    // Apply pagination if page and limit are provided
    if (page && limit) {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      sql += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
    }

    const [rows] = await db.execute(sql, params);
    
    if (page && limit) {
      res.json({
        data: rows,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      res.json(rows);
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single school by ID
 */
exports.getSchoolById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'School not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new school record
 */
exports.createSchool = async (req, res, next) => {
  try {
    const { school_id, school_name, principal_name, designation, year_started, school_type } = req.body;
    const userId = req.user.id;

    if (!school_id || !school_name || !principal_name || !designation || !year_started) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check for unique school_id
    const [existing] = await db.execute('SELECT id FROM schools WHERE school_id = ?', [school_id]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'School ID already exists' });
    }

    const [result] = await db.execute(
      'INSERT INTO schools (school_id, school_name, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [school_id, school_name, principal_name, designation, year_started, school_type || 'Public', userId]
    );

    const newId = result.insertId;
    const newRecord = { id: newId, school_id, school_name, principal_name, designation, year_started, school_type: school_type || 'Public' };
    
    await logSchoolAction(userId, 'CREATE', newId, null, newRecord, req);

    res.status(201).json({ message: 'School record created successfully', id: newId });
  } catch (err) {
    next(err);
  }
};

/**
 * Update a school record
 */
exports.updateSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { school_id, school_name, principal_name, designation, year_started, school_type } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existingRows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ message: 'School not found' });
    
    const oldRecord = existingRows[0];

    // Access control: Sub admins can only edit their own entries
    if (userRole !== 'SuperAdmin' && oldRecord.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own entries' });
    }

    // Check school_id uniqueness if changed
    if (school_id && school_id !== oldRecord.school_id) {
      const [dup] = await db.execute('SELECT id FROM schools WHERE school_id = ?', [school_id]);
      if (dup.length > 0) return res.status(409).json({ message: 'School ID already exists' });
    }

    await db.execute(
      'UPDATE schools SET school_id = ?, school_name = ?, principal_name = ?, designation = ?, year_started = ?, school_type = ? WHERE id = ?',
      [school_id || oldRecord.school_id, school_name || oldRecord.school_name, principal_name || oldRecord.principal_name, designation || oldRecord.designation, year_started || oldRecord.year_started, school_type || oldRecord.school_type, id]
    );

    const updatedRecord = { ...oldRecord, ...req.body };
    await logSchoolAction(userId, 'UPDATE', id, oldRecord, updatedRecord, req);

    res.json({ message: 'School record updated successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a school record
 */
exports.deleteSchool = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Access denied: Only main admins can delete records' });
    }

    const [existingRows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ message: 'School not found' });
    
    const oldRecord = existingRows[0];

    await db.execute('DELETE FROM schools WHERE id = ?', [id]);
    
    await logSchoolAction(userId, 'DELETE', id, oldRecord, null, req);

    res.json({ message: 'School record deleted successfully' });
  } catch (err) {
    next(err);
  }
};
