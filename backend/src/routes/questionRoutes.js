const express = require('express');
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUploadQuestions,
  exportQuestions,
  getQuestionStatistics,
  getRandomQuestions,
  uploadQuestionMedia,
  deleteQuestionMedia,
  upload
} = require('../controllers/questionController');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const questionValidation = [
  body('questionText').trim().notEmpty().withMessage('Question text is required'),
  body('questionType').isIn(['multiple-choice', 'true-false', 'fill-in-blank', 'essay', 'matching', 'ordering']).withMessage('Invalid question type'),
  body('marks').isFloat({ min: 0.5 }).withMessage('Marks must be at least 0.5'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('subject').trim().notEmpty().withMessage('Subject is required')
];

// Public routes (authenticated users)
router.get('/', getQuestions);
router.get('/random', getRandomQuestions);
router.get('/:id', getQuestion);

// Admin/Teacher routes
router.post('/', requireTeacher, questionValidation, createQuestion);
router.put('/:id', requireTeacher, updateQuestion);
router.delete('/:id', requireTeacher, deleteQuestion);
router.post('/bulk-upload', requireTeacher, upload.single('file'), bulkUploadQuestions);
router.get('/export', requireTeacher, exportQuestions);
router.get('/statistics', requireTeacher, getQuestionStatistics);
router.post('/:id/media', requireTeacher, upload.single('file'), uploadQuestionMedia);
router.delete('/:id/media/:mediaId', requireTeacher, deleteQuestionMedia);

module.exports = router;
