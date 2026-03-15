const db = require('../config/db');

exports.getAll = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM students ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Student not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { student_id, first_name, last_name, grade_level, strand, section, school_year } = req.body;
    // Server-side validation: strand only allowed for grade 11 or 12
    if (strand && !(String(grade_level).trim() === '11' || String(grade_level).trim() === '12')) {
      return res.status(422).json({ message: 'Strand may only be assigned to Grade 11 or 12' });
    }
    const [result] = await db.execute(
      `INSERT INTO students (student_id, first_name, last_name, grade_level, strand, section, school_year)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
       [student_id, first_name, last_name, grade_level, strand, section, school_year]
    );
    const [rows] = await db.execute('SELECT * FROM students WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    // Handle duplicate student_id
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Student with this student_id already exists' });
    }
    next(err);
  }
};



exports.update = async (req, res, next) => {
  try {
    const { first_name, last_name, grade_level, strand, section, school_year } = req.body;
    // Server-side validation: strand only allowed for grade 11 or 12
    if (strand && !(String(grade_level).trim() === '11' || String(grade_level).trim() === '12')) {
      return res.status(422).json({ message: 'Strand may only be assigned to Grade 11 or 12' });
    }
    const [result] = await db.execute(
      `UPDATE students SET first_name=?, last_name=?, grade_level=?, strand=?, section=?, school_year=? WHERE id=?`,
      [first_name, last_name, grade_level, strand, section, school_year, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    const [rows] = await db.execute('SELECT * FROM students WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM students WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Student not found' });
    res.status(204).end();
  } catch (err) { next(err); }
};

