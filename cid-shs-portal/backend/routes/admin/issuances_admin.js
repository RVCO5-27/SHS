const express = require('express');
const router = express.Router();
const multer = require('multer');
const folderAdminController = require('../../controllers/folderAdminController');
const issuanceAdminController = require('../../controllers/issuanceAdminController');
const uploadRateLimiter = require('../../middleware/uploadRateLimiter');

// Multer config for multi-file upload
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * Folder Management Routes
 */
router.get('/folders', folderAdminController.getFolderTree);
router.get('/folders/check-name', folderAdminController.checkFolderName);
router.get('/categories', folderAdminController.getCategories);
router.post('/folders', folderAdminController.createFolder);
router.put('/folders/bulk-move', folderAdminController.bulkMoveFolders);
router.put('/folders/:id', folderAdminController.updateFolder);
router.delete('/folders/:id', folderAdminController.deleteFolder);

/**
 * Issuance Management Routes
 */
router.get('/issuances', issuanceAdminController.listIssuances);
router.post('/issuances', uploadRateLimiter, upload.array('files', 10), issuanceAdminController.createIssuance);
router.put('/issuances/:id', uploadRateLimiter, upload.array('files', 10), issuanceAdminController.updateIssuance);
router.delete('/issuances/:id', issuanceAdminController.deleteIssuance);
router.post('/issuances/bulk', issuanceAdminController.bulkUpdate);

module.exports = router;
