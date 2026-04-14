const db = require('../config/db');

/**
 * Get global statistics for dashboard and homepage
 */
exports.getSummary = async (req, res, next) => {
  try {
    const [[{ count: schoolCount }]] = await db.execute('SELECT COUNT(*) as count FROM schools');
    const [[{ count: issuanceCount }]] = await db.execute('SELECT COUNT(*) as count FROM issuances WHERE is_archived = FALSE');
    const [[{ count: userCount }]] = await db.execute('SELECT COUNT(*) as count FROM admins');
    const [[{ count: categoryCount }]] = await db.execute('SELECT COUNT(*) as count FROM categories');

    res.json({
      schools: schoolCount,
      issuances: issuanceCount,
      users: userCount,
      categories: categoryCount,
      // Placeholders for data not yet in DB
      students: '10K+',
      teachers: '500+'
    });
  } catch (err) {
    next(err);
  }
};
