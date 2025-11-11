const express = require('express');
const {
  startExam,
  submitAnswer,
  submitExam,
  autoSubmitExam,
  getUserResults,
  getResult,
  getExamResults,
  getTopPerformers,
  getResultStatistics,
  reviewResult,
  getStudentResults
} = require('../controllers/resultController');
const { authenticateToken, requireAdmin, requireTeacher, requireStudent } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation middleware
const startExamValidation = [
  body('examId').isMongoId().withMessage('Valid exam ID is required')
];

const submitAnswerValidation = [
  body('questionId').isMongoId().withMessage('Valid question ID is required'),
  body('selectedAnswer').notEmpty().withMessage('Selected answer is required'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be a non-negative integer')
];

const reviewValidation = [
  body('reviewComments').optional().trim().isLength({ max: 1000 }).withMessage('Review comments cannot exceed 1000 characters'),
  body('isDisqualified').optional().isBoolean().withMessage('Disqualification status must be boolean'),
  body('disqualificationReason').optional().trim().isLength({ max: 500 }).withMessage('Disqualification reason cannot exceed 500 characters')
];

// Student routes
router.post('/start', requireStudent, startExamValidation, startExam);
router.put('/:id/answer', requireStudent, submitAnswerValidation, submitAnswer);
router.post('/:id/submit', requireStudent, submitExam);
router.post('/:id/auto-submit', requireStudent, autoSubmitExam);

// General routes (all authenticated users)
router.get('/', getUserResults);
router.get('/top-performers', getTopPerformers);
router.get('/statistics', getResultStatistics);
router.get('/:id', getResult);

// Admin/Teacher routes
router.get('/exam/:examId', requireTeacher, getExamResults);
router.get('/student/:studentId', requireTeacher, getStudentResults);
router.put('/:id/review', requireTeacher, reviewValidation, reviewResult);

module.exports = router;
