const db = require('../config/db');

exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    const filename = req.file.filename;
    const originalname = req.file.originalname;
    const filePath = `/uploads/${req.file.filename}`;
    const uploadedBy = req.user ? req.user.id : null;

    // Store metadata in files table
    try {
      const [result] = await db.execute(
        'INSERT INTO files (filename, originalname, path, uploaded_by) VALUES (?, ?, ?, ?)',
        [filename, originalname, filePath, uploadedBy]
      );
      const [rows] = await db.execute('SELECT * FROM files WHERE id = ?', [result.insertId]);
      return res.status(201).json(rows[0]);
    } catch (dbErr) {
      // If DB fails, still return file info but log the error
      console.error('Failed to save file metadata:', dbErr.message);
      return res.status(201).json({ filename, originalname, path: filePath });
    }
  } catch (err) { next(err); }
};
