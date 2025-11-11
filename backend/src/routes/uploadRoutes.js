const express = require('express');
const {
  uploadSingle,
  uploadMultiple,
  uploadProfilePicture,
  uploadExamMedia,
  deleteFile,
  getUploadStatistics,
  getUserUploads,
  updateFileMetadata,
  getFileInfo,
  upload
} = require('../controllers/uploadController');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const metadataValidation = [
  body('title').optional().trim().isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

// General upload routes
router.post('/single', upload.single('file'), uploadSingle);
router.post('/multiple', upload.array('files', 10), uploadMultiple);
router.post('/profile-picture', upload.single('file'), uploadProfilePicture);
router.delete('/:publicId', deleteFile);
router.get('/user-uploads', getUserUploads);
router.put('/:publicId/metadata', metadataValidation, updateFileMetadata);
router.get('/:publicId/info', getFileInfo);

// Admin/Teacher routes
router.post('/exam-media', requireTeacher, upload.single('file'), uploadExamMedia);
router.get('/statistics', requireAdmin, getUploadStatistics);

module.exports = router;
