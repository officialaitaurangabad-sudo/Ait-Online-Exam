const mongoose = require('mongoose');
const Exam = require('../models/examModel');
const Result = require('../models/resultModel');
const Question = require('../models/questionModel');
const User = require('../models/userModel');
const logger = require('../config/logger');

// Calculate exam statistics
const calculateExamStatistics = async (examId) => {
  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    const results = await Result.find({ exam: examId, status: 'completed' });
    
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        averagePercentage: 0,
        passRate: 0,
        averageTime: 0,
        gradeDistribution: {},
        scoreDistribution: {},
        timeDistribution: {}
      };
    }

    const totalAttempts = results.length;
    const totalMarks = results.reduce((sum, result) => sum + result.obtainedMarks, 0);
    const averageScore = totalMarks / totalAttempts;
    const averagePercentage = results.reduce((sum, result) => sum + result.percentage, 0) / totalAttempts;
    const passedCount = results.filter(result => result.isPassed).length;
    const passRate = (passedCount / totalAttempts) * 100;
    const averageTime = results.reduce((sum, result) => sum + result.timeSpent, 0) / totalAttempts;

    // Grade distribution
    const gradeDistribution = results.reduce((acc, result) => {
      acc[result.grade] = (acc[result.grade] || 0) + 1;
      return acc;
    }, {});

    // Score distribution (ranges)
    const scoreRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    results.forEach(result => {
      const percentage = result.percentage;
      if (percentage <= 20) scoreRanges['0-20']++;
      else if (percentage <= 40) scoreRanges['21-40']++;
      else if (percentage <= 60) scoreRanges['41-60']++;
      else if (percentage <= 80) scoreRanges['61-80']++;
      else scoreRanges['81-100']++;
    });

    // Time distribution
    const timeRanges = {
      '0-30min': 0,
      '30-60min': 0,
      '60-90min': 0,
      '90min+': 0
    };

    results.forEach(result => {
      const timeSpent = result.timeSpent;
      if (timeSpent <= 30) timeRanges['0-30min']++;
      else if (timeSpent <= 60) timeRanges['30-60min']++;
      else if (timeSpent <= 90) timeRanges['60-90min']++;
      else timeRanges['90min+']++;
    });

    return {
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      averageTime: Math.round(averageTime * 100) / 100,
      gradeDistribution,
      scoreDistribution: scoreRanges,
      timeDistribution: timeRanges
    };
  } catch (error) {
    logger.error('Error calculating exam statistics:', error);
    throw error;
  }
};

// Calculate student performance analytics
const calculateStudentPerformance = async (studentId) => {
  try {
    console.log('calculateStudentPerformance - Looking for results for student:', studentId);
    
    // First, let's see all results for this student (not just completed)
    const allResults = await Result.find({ student: studentId })
      .populate('exam', 'title subject category')
      .sort({ createdAt: -1 });
    
    console.log('calculateStudentPerformance - All results found:', allResults.length);
    console.log('calculateStudentPerformance - Results statuses:', allResults.map(r => ({ id: r._id, status: r.status, exam: r.exam?.title })));
    
    // Look for results with various completion statuses
    const results = await Result.find({ 
      student: studentId, 
      status: { $in: ['completed', 'submitted', 'auto-submitted'] }
    })
      .populate('exam', 'title subject category')
      .sort({ createdAt: -1 });

    console.log('calculateStudentPerformance - Completed results found:', results.length);

    if (results.length === 0) {
      console.log('calculateStudentPerformance - No completed results, returning empty analytics');
      return {
        totalExams: 0,
        averageScore: 0,
        averagePercentage: 0,
        passRate: 0,
        improvement: 0,
        subjectPerformance: {},
        recentPerformance: [],
        strengths: [],
        weaknesses: []
      };
    }

    const totalExams = results.length;
    const totalMarks = results.reduce((sum, result) => sum + result.obtainedMarks, 0);
    const totalPossibleMarks = results.reduce((sum, result) => sum + result.totalMarks, 0);
    const averageScore = totalMarks / totalExams;
    const averagePercentage = results.reduce((sum, result) => sum + result.percentage, 0) / totalExams;
    const passedCount = results.filter(result => result.isPassed).length;
    const passRate = (passedCount / totalExams) * 100;

    // Calculate improvement over time
    const recentResults = results.slice(0, Math.min(5, results.length));
    const olderResults = results.slice(-Math.min(5, results.length));
    const recentAvg = recentResults.reduce((sum, result) => sum + result.percentage, 0) / recentResults.length;
    const olderAvg = olderResults.reduce((sum, result) => sum + result.percentage, 0) / olderResults.length;
    const improvement = recentAvg - olderAvg;

    // Subject performance
    const subjectPerformance = {};
    results.forEach(result => {
      const subject = result.exam.subject;
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = {
          totalExams: 0,
          totalMarks: 0,
          totalPossibleMarks: 0,
          passedCount: 0
        };
      }
      subjectPerformance[subject].totalExams++;
      subjectPerformance[subject].totalMarks += result.obtainedMarks;
      subjectPerformance[subject].totalPossibleMarks += result.totalMarks;
      if (result.isPassed) subjectPerformance[subject].passedCount++;
    });

    // Calculate subject averages
    Object.keys(subjectPerformance).forEach(subject => {
      const perf = subjectPerformance[subject];
      perf.averagePercentage = (perf.totalMarks / perf.totalPossibleMarks) * 100;
      perf.passRate = (perf.passedCount / perf.totalExams) * 100;
    });

    // Recent performance (last 10 exams)
    const recentPerformance = results.slice(0, 10).map(result => ({
      examTitle: result.exam.title,
      subject: result.exam.subject,
      percentage: result.percentage,
      grade: result.grade,
      date: result.createdAt
    }));

    // Identify strengths and weaknesses
    const strengths = [];
    const weaknesses = [];
    
    Object.keys(subjectPerformance).forEach(subject => {
      const perf = subjectPerformance[subject];
      if (perf.averagePercentage >= 80) {
        strengths.push(subject);
      } else if (perf.averagePercentage < 60) {
        weaknesses.push(subject);
      }
    });

    return {
      totalExams,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averagePercentage * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      improvement: Math.round(improvement * 100) / 100,
      subjectPerformance,
      recentPerformance,
      strengths,
      weaknesses
    };
  } catch (error) {
    logger.error('Error calculating student performance:', error);
    throw error;
  }
};

// Calculate question analytics
const calculateQuestionAnalytics = async (questionId) => {
  try {
    const question = await Question.findById(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Get all results that include this question
    const results = await Result.find({
      'answers.question': questionId
    });

    if (results.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        averageTime: 0,
        difficulty: question.difficulty,
        usageCount: 0
      };
    }

    let correctAttempts = 0;
    let totalTime = 0;
    let timeCount = 0;

    results.forEach(result => {
      const answer = result.answers.find(a => a.question.toString() === questionId.toString());
      if (answer) {
        if (answer.isCorrect) correctAttempts++;
        if (answer.timeSpent > 0) {
          totalTime += answer.timeSpent;
          timeCount++;
        }
      }
    });

    const accuracy = (correctAttempts / results.length) * 100;
    const averageTime = timeCount > 0 ? totalTime / timeCount : 0;

    return {
      totalAttempts: results.length,
      correctAttempts,
      accuracy: Math.round(accuracy * 100) / 100,
      averageTime: Math.round(averageTime * 100) / 100,
      difficulty: question.difficulty,
      usageCount: question.usageCount
    };
  } catch (error) {
    logger.error('Error calculating question analytics:', error);
    throw error;
  }
};

// Get dashboard analytics for admin
const getDashboardAnalytics = async () => {
  try {
    const [
      totalUsers,
      studentCount,
      teacherCount,
      adminCount,
      totalExams,
      totalQuestions,
      totalResults,
      recentResults,
      topPerformers,
      examStats
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true, role: 'student' }),
      User.countDocuments({ isActive: true, role: 'teacher' }),
      User.countDocuments({ isActive: true, role: 'admin' }),
      Exam.countDocuments({ isActive: true }),
      Question.countDocuments({ isActive: true }),
      Result.countDocuments({ status: 'completed' }),
      Result.find({ status: 'completed' })
        .populate('student', 'firstName lastName')
        .populate('exam', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      Result.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$student',
            averageScore: { $avg: '$percentage' },
            totalExams: { $sum: 1 }
          }
        },
        { $sort: { averageScore: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' }
      ]),
      Exam.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$subject',
            count: { $sum: 1 },
            averageDuration: { $avg: '$duration' }
          }
        }
      ])
    ]);

    // Calculate pass rate
    const passedResults = await Result.countDocuments({ 
      status: 'completed',
      isPassed: true 
    });
    const passRate = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;

    // Calculate average score
    const avgScoreResult = await Result.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, averageScore: { $avg: '$percentage' } } }
    ]);
    const averageScore = avgScoreResult.length > 0 ? avgScoreResult[0].averageScore : 0;

    return {
      overview: {
        totalUsers,
        studentCount,
        teacherCount,
        adminCount,
        totalExams,
        totalQuestions,
        totalResults,
        passRate: Math.round(passRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100
      },
      recentActivity: recentResults,
      topPerformers: topPerformers.map(performer => ({
        student: performer.student,
        averageScore: Math.round(performer.averageScore * 100) / 100,
        totalExams: performer.totalExams
      })),
      examStats: examStats.map(stat => ({
        subject: stat._id,
        count: stat.count,
        averageDuration: Math.round(stat.averageDuration * 100) / 100
      }))
    };
  } catch (error) {
    logger.error('Error getting dashboard analytics:', error);
    throw error;
  }
};

// Get performance trends over time
const getPerformanceTrends = async (timeframe = '30d') => {
  try {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Result.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          passRate: {
            $avg: {
              $cond: [{ $gte: ['$obtainedMarks', '$passingMarks'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    return trends.map(trend => ({
      date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
      totalAttempts: trend.totalAttempts,
      averageScore: Math.round(trend.averageScore * 100) / 100,
      passRate: Math.round(trend.passRate * 100 * 100) / 100
    }));
  } catch (error) {
    logger.error('Error getting performance trends:', error);
    throw error;
  }
};

// Get subject-wise performance
const getSubjectWisePerformance = async () => {
  try {
    const subjectStats = await Result.aggregate([
      { $match: { status: 'completed' } },
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
          _id: '$examData.subject',
          totalAttempts: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          passRate: {
            $avg: {
              $cond: [{ $gte: ['$obtainedMarks', '$passingMarks'] }, 1, 0]
            }
          },
          averageTime: { $avg: '$timeSpent' }
        }
      },
      { $sort: { totalAttempts: -1 } }
    ]);

    return subjectStats.map(stat => ({
      subject: stat._id,
      totalAttempts: stat.totalAttempts,
      averageScore: Math.round(stat.averageScore * 100) / 100,
      passRate: Math.round(stat.passRate * 100 * 100) / 100,
      averageTime: Math.round(stat.averageTime * 100) / 100
    }));
  } catch (error) {
    logger.error('Error getting subject-wise performance:', error);
    throw error;
  }
};

module.exports = {
  calculateExamStatistics,
  calculateStudentPerformance,
  calculateQuestionAnalytics,
  getDashboardAnalytics,
  getPerformanceTrends,
  getSubjectWisePerformance
};
