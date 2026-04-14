const db = require('../config/db');

/**
 * Get all public issuances with their category names.
 * GET /api/issuances
 */
const getPublicIssuances = async (req, res, next) => {
  try {
    const { q, category_id, series_year } = req.query;
    
    let sql = `
      SELECT 
        i.id, 
        i.title, 
        i.doc_number, 
        i.series_year, 
        i.date_issued, 
        i.signatory, 
        i.file_path, 
        i.tags, 
        i.created_at,
        c.name as category_name,
        c.prefix as category_prefix
      FROM issuances i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.is_archived = FALSE
    `;
    
    const params = [];
    
    if (q) {
      sql += ` AND (i.title LIKE ? OR i.tags LIKE ? OR i.doc_number LIKE ?)`;
      const query = `%${q}%`;
      params.push(query, query, query);
    }
    
    if (category_id) {
      sql += ` AND i.category_id = ?`;
      params.push(category_id);
    }
    
    if (series_year) {
      sql += ` AND i.series_year = ?`;
      params.push(series_year);
    }
    
    sql += ` ORDER BY i.date_issued DESC, i.created_at DESC`;
    
    const [rows] = await db.execute(sql, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get categories for filtering.
 * GET /api/issuances/categories
 */
const getCategories = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT id, name, prefix FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Get unique series years for filtering.
 * GET /api/issuances/years
 */
const getYears = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT series_year FROM issuances WHERE is_archived = FALSE ORDER BY series_year DESC');
    res.json(rows.map(r => r.series_year));
  } catch (error) {
    next(error);
  }
};

/**
 * Get public folders for browsing.
 * GET /api/issuances/folders
 */
const getPublicFolders = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT id, name, parent_id FROM folders WHERE status = "active" AND visibility = "public" ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicIssuances,
  getCategories,
  getYears,
  getPublicFolders
};
