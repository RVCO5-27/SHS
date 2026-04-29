const db = require('../config/db');
const { clientIp } = require('../services/authAudit');
const { logCreate, logUpdate, logDelete, calculateDiff, getClientIp, getUserAgent } = require('../services/auditService');

function isSixDigitSchoolId(value) {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

let logoColumnAvailable = true;
let displayOrderColumnAvailable = true;

async function probeLogoColumn() {
  try {
    const [rows] = await db.execute("SHOW COLUMNS FROM schools LIKE 'logo_url'");
    logoColumnAvailable = rows.length > 0;
    if (!logoColumnAvailable) {
      // Try to self-heal in dev/single-db deployments where the app user has ALTER privileges.
      // This avoids breaking logo upload routes with a 500 when the column is missing.
      try {
        await db.query("ALTER TABLE `schools` ADD COLUMN `logo_url` varchar(255) DEFAULT NULL AFTER `school_name`");
        logoColumnAvailable = true;
        console.log('[schools] Added missing schools.logo_url column automatically');
      } catch (alterErr) {
        console.warn('[schools] logo_url column missing — run migration 005_add_school_logo_url.sql');
        console.warn('[schools] Auto-migration failed:', alterErr.code || alterErr.message);
      }
    }
  } catch (e) {
    logoColumnAvailable = false;
    console.warn('[schools] Could not probe schools.logo_url:', e.code || e.message);
  }
}
probeLogoColumn();

async function probeDisplayOrderColumn() {
  try {
    const [rows] = await db.execute("SHOW COLUMNS FROM schools LIKE 'display_order'");
    displayOrderColumnAvailable = rows.length > 0;
    if (!displayOrderColumnAvailable) {
      try {
        // Legacy column kept for backward compatibility; app ordering is alphabetical by school_name.
        await db.query("ALTER TABLE `schools` ADD COLUMN `display_order` int(11) DEFAULT NULL AFTER `school_name`");

        displayOrderColumnAvailable = true;
        console.log('[schools] Added missing schools.display_order column automatically');
      } catch (alterErr) {
        console.warn('[schools] display_order column missing — run migration 006_add_school_display_order.sql');
        console.warn('[schools] Auto-migration failed:', alterErr.code || alterErr.message);
      }
    }
  } catch (e) {
    displayOrderColumnAvailable = false;
    console.warn('[schools] Could not probe schools.display_order:', e.code || e.message);
  }
}
probeDisplayOrderColumn();

function requireLogoColumn(res) {
  if (logoColumnAvailable) return true;
  res.status(500).json({
    message:
      'School logos are not enabled in the database yet. Please run migration: backend/database/migrations/005_add_school_logo_url.sql',
  });
  return false;
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
    const allowedSort = ['display_order', 'school_id', 'school_name', 'principal_name', 'year_started'];
    const requestedSort = allowedSort.includes(sortBy) ? sortBy : 'school_name';
    const sort =
      requestedSort === 'display_order' && !displayOrderColumnAvailable ? 'school_name' : requestedSort;
    const direction = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Secondary sort keeps ordering stable for identical primary sort values.
    const secondarySort = sort === 'school_name' ? 'id ASC' : 'school_name ASC';
    sql += ` ORDER BY ${sort} ${direction}, ${secondarySort}`;

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
    const normalizedSchoolId = String(school_id).trim();
    if (!isSixDigitSchoolId(normalizedSchoolId)) {
      return res.status(422).json({ message: 'School ID must be exactly 6 digits.' });
    }

    // Check for unique school_id
    const [existing] = await db.execute('SELECT id FROM schools WHERE school_id = ?', [normalizedSchoolId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'School ID already exists' });
    }

    const nextType = (school_type || 'Public').trim();

    const [result] = await db.execute(
      logoColumnAvailable
        ? displayOrderColumnAvailable
          ? 'INSERT INTO schools (school_id, school_name, display_order, logo_url, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
          : 'INSERT INTO schools (school_id, school_name, logo_url, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        : displayOrderColumnAvailable
          ? 'INSERT INTO schools (school_id, school_name, display_order, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          : 'INSERT INTO schools (school_id, school_name, principal_name, designation, year_started, school_type, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      logoColumnAvailable
        ? displayOrderColumnAvailable
          ? [normalizedSchoolId, school_name, null, null, principal_name, designation, year_started, nextType, userId]
          : [normalizedSchoolId, school_name, null, principal_name, designation, year_started, nextType, userId]
        : displayOrderColumnAvailable
          ? [normalizedSchoolId, school_name, null, principal_name, designation, year_started, nextType, userId]
          : [normalizedSchoolId, school_name, principal_name, designation, year_started, nextType, userId]
    );

    const newId = result.insertId;
    const newRecord = {
      id: newId,
      school_id: normalizedSchoolId,
      school_name,
      ...(displayOrderColumnAvailable ? { display_order: null } : {}),
      principal_name,
      designation,
      year_started,
      school_type: nextType,
      ...(logoColumnAvailable ? { logo_url: null } : {}),
    };
    
    await logCreate(
      userId,
      'schools',
      newRecord,
      newId,
      'school',
      `Created school: ${school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

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
    const { school_id, school_name, principal_name, designation, year_started, school_type, logo_url } = req.body;
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
    const normalizedSchoolId = school_id != null ? String(school_id).trim() : null;
    if (normalizedSchoolId && normalizedSchoolId !== oldRecord.school_id) {
      if (!isSixDigitSchoolId(normalizedSchoolId)) {
        return res.status(422).json({ message: 'School ID must be exactly 6 digits.' });
      }
      const [dup] = await db.execute('SELECT id FROM schools WHERE school_id = ?', [normalizedSchoolId]);
      if (dup.length > 0) return res.status(409).json({ message: 'School ID already exists' });
    }

    const nextType = school_type != null ? String(school_type).trim() : oldRecord.school_type;

    await db.execute(
      logoColumnAvailable
        ? 'UPDATE schools SET school_id = ?, school_name = ?, principal_name = ?, designation = ?, year_started = ?, school_type = ?, logo_url = ? WHERE id = ?'
        : 'UPDATE schools SET school_id = ?, school_name = ?, principal_name = ?, designation = ?, year_started = ?, school_type = ? WHERE id = ?',
      logoColumnAvailable
        ? [
            normalizedSchoolId || oldRecord.school_id,
            school_name || oldRecord.school_name,
            principal_name || oldRecord.principal_name,
            designation || oldRecord.designation,
            year_started || oldRecord.year_started,
            nextType,
            logo_url !== undefined ? logo_url : oldRecord.logo_url,
            id,
          ]
        : [
            normalizedSchoolId || oldRecord.school_id,
            school_name || oldRecord.school_name,
            principal_name || oldRecord.principal_name,
            designation || oldRecord.designation,
            year_started || oldRecord.year_started,
            nextType,
            id,
          ]
    );

    const updatedRecord = { ...oldRecord, ...req.body };
    const diff = calculateDiff(oldRecord, req.body);
    
    await logUpdate(
      userId,
      'schools',
      oldRecord,
      updatedRecord,
      id,
      'school',
      diff,
      `Updated school: ${school_name || oldRecord.school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

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
    
    await logDelete(
      userId,
      'schools',
      oldRecord,
      id,
      'school',
      `Deleted school: ${oldRecord.school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.json({ message: 'School record deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload a school logo (staff-only).
 * Expects `req.file` from multer.
 */
exports.uploadSchoolLogo = async (req, res, next) => {
  try {
    if (!requireLogoColumn(res)) return;
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const [existingRows] = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
    if (existingRows.length === 0) return res.status(404).json({ message: 'School not found' });
    const oldRecord = existingRows[0];

    // Access control: Sub admins can only edit their own entries
    if (userRole !== 'SuperAdmin' && oldRecord.created_by !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only edit your own entries' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const logoUrl = `/uploads/schools/${req.file.filename}`;
    await db.execute('UPDATE schools SET logo_url = ? WHERE id = ?', [logoUrl, id]);

    const updated = { ...oldRecord, logo_url: logoUrl };
    const diff = calculateDiff(oldRecord, { logo_url: logoUrl });
    await logUpdate(
      userId,
      'schools',
      oldRecord,
      updated,
      id,
      'school',
      diff,
      `Updated school logo: ${oldRecord.school_name}`,
      getClientIp(req),
      getUserAgent(req)
    );

    res.json({ message: 'School logo updated', logoUrl });
  } catch (err) {
    next(err);
  }
};
