const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT r.*, s.first_name, s.last_name FROM results r LEFT JOIN students s ON r.student_id = s.student_id ORDER BY exam_date DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { student_id, subject, score, remarks, exam_date } = req.body;
    const [result] = await db.execute(
      `INSERT INTO results (student_id, subject, score, remarks, exam_date) VALUES (?, ?, ?, ?, ?)`,
      [student_id, subject, score, remarks, exam_date]
    );
    const [rows] = await db.execute('SELECT * FROM results WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM results WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Result not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { student_id, subject, score, remarks, exam_date } = req.body;
    const [result] = await db.execute(
      `UPDATE results SET student_id = COALESCE(?, student_id), subject = COALESCE(?, subject), score = COALESCE(?, score), remarks = COALESCE(?, remarks), exam_date = COALESCE(?, exam_date) WHERE id = ?`,
      [student_id, subject, score, remarks, exam_date, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Result not found' });
    const [rows] = await db.execute('SELECT * FROM results WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM results WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Result not found' });
    res.status(204).end();
  } catch (err) { next(err); }
};
