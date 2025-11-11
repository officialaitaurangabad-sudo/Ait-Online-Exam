const express = require('express');
const {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  archiveExam,
  addQuestionsToExam,
  removeQuestionsFromExam,
  getExamStatistics,
  getExamResults,
  getLiveExams,
  getUpcomingExams
} = require('../controllers/examController');
const { authenticateToken, requireAdmin, requireTeacher } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const examValidation = [
  body('title').trim().notEmpty().withMessage('Exam title is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('totalQuestions').isInt({ min: 1 }).withMessage('Total questions must be a positive integer'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be a positive integer'),
  body('passingMarks').isInt({ min: 0 }).withMessage('Passing marks must be a non-negative integer'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
];

const questionsValidation = [
  body('questionIds').isArray({ min: 1 }).withMessage('At least one question ID is required'),
  body('questionIds.*').isMongoId().withMessage('Invalid question ID format')
];

// Public routes (authenticated users)
router.get('/', getExams);
router.get('/live', getLiveExams);
router.get('/upcoming', getUpcomingExams);
router.get('/:id', getExam);

// Admin/Teacher routes
router.post('/', requireTeacher, examValidation, createExam);
router.put('/:id', requireTeacher, updateExam);
router.delete('/:id', requireTeacher, deleteExam);
router.put('/:id/publish', requireTeacher, publishExam);
router.put('/:id/archive', requireTeacher, archiveExam);
router.put('/:id/questions', requireTeacher, questionsValidation, addQuestionsToExam);
router.delete('/:id/questions', requireTeacher, questionsValidation, removeQuestionsFromExam);
router.get('/:id/statistics', requireTeacher, getExamStatistics);
router.get('/:id/results', requireTeacher, getExamResults);

module.exports = router;
