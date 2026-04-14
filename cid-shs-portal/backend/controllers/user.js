// controllers/user.js
const db = require('../config/db');

const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM admins');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUsers };

