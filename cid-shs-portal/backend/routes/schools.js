const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { authMiddleware, requireAdminRole } = require('../middleware/auth');

/**
 * School Management Routes
 * Protected by admin authentication
 */

router.use(authMiddleware);
router.use(requireAdminRole);

router.get('/', schoolController.getAllSchools);
router.get('/:id', schoolController.getSchoolById);
router.post('/', schoolController.createSchool);
router.put('/:id', schoolController.updateSchool);
router.delete('/:id', schoolController.deleteSchool);

module.exports = router;
