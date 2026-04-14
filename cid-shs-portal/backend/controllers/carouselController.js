const db = require('../config/db');

const getAllCarouselSlides = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM carousel_slides ORDER BY sort_order ASC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const createCarouselSlide = async (req, res, next) => {
  try {
    const { title, description, image_path, cta_text, cta_link, category, sort_order } = req.body;
    
    if (!image_path) {
      return res.status(400).json({ message: 'Image path is required' });
    }

    const [result] = await db.execute(
      'INSERT INTO carousel_slides (title, description, image_path, cta_text, cta_link, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title || '', description || '', image_path, cta_text || '', cta_link || '', category || '', sort_order || 0]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    next(err);
  }
};

const updateCarouselSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, image_path, cta_text, cta_link, category, sort_order } = req.body;
    
    if (!image_path) {
      return res.status(400).json({ message: 'Image path is required' });
    }

    await db.execute(
      'UPDATE carousel_slides SET title = ?, description = ?, image_path = ?, cta_text = ?, cta_link = ?, category = ?, sort_order = ? WHERE id = ?',
      [title || '', description || '', image_path, cta_text || '', cta_link || '', category || '', sort_order || 0, id]
    );
    res.json({ id, ...req.body });
  } catch (err) {
    next(err);
  }
};

const deleteCarouselSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM carousel_slides WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCarouselSlides,
  createCarouselSlide,
  updateCarouselSlide,
  deleteCarouselSlide,
};
