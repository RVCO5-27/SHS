const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, studentsController.getAll);
router.get('/:id', authMiddleware, studentsController.getById);
router.post(
  '/',
  authMiddleware,
  [
    check('student_id').notEmpty().isString().trim().escape(),
    check('first_name').notEmpty().isString().trim().escape(),
    check('last_name').notEmpty().isString().trim().escape(),
    check('grade_level').optional().isString().trim().escape(),
    check('strand').optional().isString().trim().escape(),
    // Ensure strand is only set when grade_level is 11 or 12
    check('strand').optional().custom((value, { req }) => {
      const grade = String(req.body.grade_level || '').trim();
      if (value && !(grade === '11' || grade === '12')) {
        throw new Error('Strand may only be assigned to Grade 11 or 12');
      }
      return true;
    }),
    check('section').optional().isString().trim().escape(),
    check('school_year').optional().isString().trim().escape()
  ],
  validate,
  studentsController.create
);
router.put(
  '/:id',
  authMiddleware,
  [
    check('first_name').optional().isString().trim().escape(),
    check('last_name').optional().isString().trim().escape(),
    check('grade_level').optional().isString().trim().escape(),
    check('strand').optional().isString().trim().escape(),
    check('section').optional().isString().trim().escape(),
    check('school_year').optional().isString().trim().escape()
  ],
  validate,
  studentsController.update
);
router.delete('/:id', authMiddleware, studentsController.remove);

module.exports = router;
