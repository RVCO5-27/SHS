const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.execute('SELECT * FROM admins WHERE username = ?', [username]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const admin = rows[0];
    // DB column is `password` (bcrypt hash). Adjust if your schema uses a different name.
    const ok = await bcrypt.compare(password, admin.password || admin.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET || 'change-me', { expiresIn: '8h' });
    res.json({ token });
  } catch (err) { next(err); }
};
