const express = require('express');
const router = express.Router();

router.use('/students', require('./students'));
router.use('/results', require('./results'));
router.use('/upload', require('./upload'));
router.use('/auth', require('./auth'));
router.use('/documents', require('./documents'));

module.exports = router;
