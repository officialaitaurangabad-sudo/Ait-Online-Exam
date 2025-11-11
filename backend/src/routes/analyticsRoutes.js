const express = require('express');
const {
  getDashboard,
  getExamAnalytics,
  getStudentAnalytics,
  getQuestionAnalytics,
  getTrends,
  getStudentProgress,
  getQuestionDifficultyAnalysis,
  getTimeBasedAnalytics,
  exportAnalytics,
  getLeaderboard,
  getSubjectAnalytics
} = require('../controllers/analyticsController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Dashboard analytics - Temporarily allow all roles for debugging
router.get('/dashboard', authorize('admin', 'teacher', 'student'), getDashboard);

// Debug endpoint - No authentication required
router.get('/dashboard-debug', (req, res) => {
  console.log('Debug endpoint called');
  res.json({
    success: true,
    message: 'Debug endpoint working - no authentication required',
    timestamp: new Date().toISOString(),
    data: { test: 'analytics debug endpoint' }
  });
});

// Exam analytics
router.get('/exam/:examId', authorize('admin', 'teacher'), getExamAnalytics);

// Student analytics
router.get('/student/:studentId', getStudentAnalytics);
router.get('/student/:studentId/progress', getStudentProgress);

// Question analytics - Temporarily allow all roles for debugging
router.get('/questions', authorize('admin', 'teacher', 'student'), getQuestionAnalytics);
router.get('/question-difficulty', authorize('admin', 'teacher', 'student'), getQuestionDifficultyAnalysis);

// Performance trends - Temporarily allow all roles for debugging
router.get('/trends', authorize('admin', 'teacher', 'student'), getTrends);

// Time-based analytics - Temporarily allow all roles for debugging
router.get('/time-based', authorize('admin', 'teacher', 'student'), getTimeBasedAnalytics);

// Export analytics - Temporarily allow all roles for debugging
router.get('/export', authorize('admin', 'teacher', 'student'), exportAnalytics);

// Additional routes for leaderboard and subject performance - Temporarily allow all roles for debugging
router.get('/leaderboard', authorize('admin', 'teacher', 'student'), getLeaderboard);
router.get('/subjects', authorize('admin', 'teacher', 'student'), getSubjectAnalytics);

// Additional routes can be added here as more analytics functions are implemented

module.exports = router;
