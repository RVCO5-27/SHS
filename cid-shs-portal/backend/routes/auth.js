const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { check } = require('express-validator');
const { validate } = require('../middleware/validate');

router.post('/login', [check('username').notEmpty(), check('password').notEmpty()], validate, authController.login);

module.exports = router;
