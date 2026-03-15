const express = require('express');
const router = express.Router();
const resultsController = require('../controllers/results');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, resultsController.getAll);
router.get('/:id', authMiddleware, resultsController.getById);
router.post(
  '/',
  authMiddleware,
  [
    check('student_id').notEmpty(),
    check('subject').notEmpty(),
    check('score').isNumeric()
  ],
  validate,
  resultsController.create
);

router.put(
  '/:id',
  authMiddleware,
  [
    check('student_id').optional().notEmpty(),
    check('subject').optional().notEmpty(),
    check('score').optional().isNumeric()
  ],
  validate,
  resultsController.update
);

router.delete('/:id', authMiddleware, resultsController.remove);

module.exports = router;
