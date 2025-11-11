const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const {
  calculateExamStatistics,
  calculateStudentPerformance,
  calculateQuestionAnalytics,
  getDashboardAnalytics,
  getPerformanceTrends,
  getSubjectWisePerformance
} = require('../utils/analyticsUtils');
const Exam = require('../models/examModel');
const Result = require('../models/resultModel');
const User = require('../models/userModel');
const Question = require('../models/questionModel');
const logger = require('../config/logger');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin/Teacher)
const getDashboard = asyncHandler(async (req, res) => {
  console.log('getDashboard - Request received');
  console.log('getDashboard - User:', req.user);
  console.log('getDashboard - User role:', req.user?.role);
  
  if (req.user.role === 'student') {
    console.log('getDashboard - Access denied for student role');
    throw new AppError('Access denied', 403);
  }

  console.log('getDashboard - Access granted, fetching analytics...');
  const analytics = await getDashboardAnalytics();
  console.log('getDashboard - Analytics fetched successfully');

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Get exam analytics
// @route   GET /api/analytics/exam/:examId
// @access  Private (Admin/Teacher)
const getExamAnalytics = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can view exam analytics
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view exam analytics', 403);
  }

  const analytics = await calculateExamStatistics(req.params.examId);

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Get student performance analytics
// @route   GET /api/analytics/student/:studentId
// @access  Private (Admin/Teacher)
const getStudentAnalytics = asyncHandler(async (req, res) => {
  console.log('getStudentAnalytics called with:', {
    studentId: req.params.studentId,
    userRole: req.user.role,
    userId: req.user._id.toString()
  });

  if (req.user.role === 'student' && req.params.studentId !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const student = await User.findById(req.params.studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  console.log('Student found:', { id: student._id, email: student.email });

  const analytics = await calculateStudentPerformance(req.params.studentId);
  console.log('Analytics calculated:', analytics);

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Get question analytics
// @route   GET /api/analytics/question/:questionId
// @access  Private (Admin/Teacher)
const getQuestionAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const question = await Question.findById(req.params.questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if user can view question analytics
  if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view question analytics', 403);
  }

  const analytics = await calculateQuestionAnalytics(req.params.questionId);

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Get performance trends
// @route   GET /api/analytics/trends
// @access  Private (Admin/Teacher)
const getTrends = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const { timeframe = '30d' } = req.query;
  const trends = await getPerformanceTrends(timeframe);

  res.json({
    success: true,
    data: { trends }
  });
});

// @desc    Get subject-wise performance
// @route   GET /api/analytics/subjects
// @access  Private (Admin/Teacher)
const getSubjectAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const subjectStats = await getSubjectWisePerformance();

  res.json({
    success: true,
    data: { subjectStats }
  });
});

// @desc    Get student leaderboard
// @route   GET /api/analytics/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
  const { examId, subject, timeframe = '30d' } = req.query;

  // Calculate date range
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const filter = {
    status: 'completed',
    createdAt: { $gte: startDate }
  };

  if (examId) {
    filter.exam = examId;
  }

  // If subject filter is provided, we need to join with exams
  let pipeline = [
    { $match: filter }
  ];

  if (subject) {
    pipeline.push({
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examData'
      }
    });
    pipeline.push({
      $match: {
        'examData.subject': new RegExp(subject, 'i')
      }
    });
  }

  pipeline.push(
    {
      $group: {
        _id: '$student',
        averageScore: { $avg: '$percentage' },
        totalExams: { $sum: 1 },
        bestScore: { $max: '$percentage' },
        totalMarks: { $sum: '$obtainedMarks' },
        totalPossibleMarks: { $sum: '$totalMarks' }
      }
    },
    { $sort: { averageScore: -1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $project: {
        'student.password': 0,
        'student.refreshTokens': 0,
        'student.email': 0
      }
    }
  );

  const leaderboard = await Result.aggregate(pipeline);

  res.json({
    success: true,
    data: { leaderboard }
  });
});

// @desc    Get exam performance comparison
// @route   GET /api/analytics/exam-comparison
// @access  Private (Admin/Teacher)
const getExamComparison = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const { examIds } = req.query;
  
  if (!examIds || !Array.isArray(examIds)) {
    throw new AppError('Exam IDs are required', 400);
  }

  const comparisons = await Promise.all(
    examIds.map(async (examId) => {
      const exam = await Exam.findById(examId);
      if (!exam) return null;

      const analytics = await calculateExamStatistics(examId);
      return {
        examId,
        examTitle: exam.title,
        subject: exam.subject,
        ...analytics
      };
    })
  );

  const validComparisons = comparisons.filter(comp => comp !== null);

  res.json({
    success: true,
    data: { comparisons: validComparisons }
  });
});

// @desc    Get student progress over time
// @route   GET /api/analytics/student-progress/:studentId
// @access  Private
const getStudentProgress = asyncHandler(async (req, res) => {
  if (req.user.role === 'student' && req.params.studentId !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const { timeframe = '30d' } = req.query;
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const progress = await Result.aggregate([
    {
      $match: {
        student: req.params.studentId,
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examData'
      }
    },
    { $unwind: '$examData' },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        averageScore: { $avg: '$percentage' },
        totalExams: { $sum: 1 },
        subjects: { $addToSet: '$examData.subject' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  res.json({
    success: true,
    data: { progress }
  });
});

// @desc    Get question difficulty analysis
// @route   GET /api/analytics/question-difficulty
// @access  Private (Admin/Teacher)
const getQuestionDifficultyAnalysis = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const analysis = await Question.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$difficulty',
        totalQuestions: { $sum: 1 },
        averageMarks: { $avg: '$marks' },
        averageSuccessRate: { $avg: '$successRate' },
        averageTime: { $avg: '$averageTime' },
        usageCount: { $sum: '$usageCount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    success: true,
    data: { analysis }
  });
});

// @desc    Get time-based analytics
// @route   GET /api/analytics/time-based
// @access  Private (Admin/Teacher)
const getTimeBasedAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const { timeframe = '7d' } = req.query;
  const days = timeframe === '1d' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const analytics = await Result.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' }
        },
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$percentage' },
        averageTime: { $avg: '$timeSpent' }
      }
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
  ]);

  res.json({
    success: true,
    data: { analytics }
  });
});

// @desc    Export analytics data
// @route   GET /api/analytics/export
// @access  Private (Admin/Teacher)
const exportAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  const { type = 'dashboard', format = 'json' } = req.query;

  let data;

  switch (type) {
    case 'dashboard':
      data = await getDashboardAnalytics();
      break;
    case 'trends':
      data = await getPerformanceTrends(req.query.timeframe || '30d');
      break;
    case 'subjects':
      data = await getSubjectWisePerformance();
      break;
    default:
      throw new AppError('Invalid export type', 400);
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics.csv"`);
    res.send(csv);
  } else {
    res.json({
      success: true,
      data
    });
  }
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  // This is a simplified CSV conversion
  // In a real application, you'd want to use a proper CSV library
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  }
  
  return JSON.stringify(data);
};

module.exports = {
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
};
