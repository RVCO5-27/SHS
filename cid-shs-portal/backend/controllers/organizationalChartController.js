const db = require('../config/db');

const getOrganizationalChart = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM organizational_chart');
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateOrganizationalChart = async (req, res, next) => {
  try {
    const { title, image_path, caption } = req.body;
    const [result] = await db.execute('SELECT * FROM organizational_chart');
    if (result.length > 0) {
      await db.execute(
        'UPDATE organizational_chart SET title = ?, image_path = ?, caption = ? WHERE id = ?',
        [title, image_path, caption, result[0].id]
      );
      res.json({ id: result[0].id, ...req.body });
    } else {
      const [insertResult] = await db.execute(
        'INSERT INTO organizational_chart (title, image_path, caption) VALUES (?, ?, ?)',
        [title, image_path, caption]
      );
      res.status(201).json({ id: insertResult.insertId, ...req.body });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrganizationalChart,
  updateOrganizationalChart,
};
