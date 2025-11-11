const Result = require('../models/resultModel');
const Exam = require('../models/examModel');
const Question = require('../models/questionModel');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { sendExamResultEmail } = require('../utils/emailUtils');
const logger = require('../config/logger');

// @desc    Start exam
// @route   POST /api/results/start
// @access  Private (Student)
const startExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if exam is available
  if (exam.status !== 'published' || !exam.isActive) {
    throw new AppError('Exam is not available', 403);
  }

  const now = new Date();
  if (exam.startDate > now || exam.endDate < now) {
    throw new AppError('Exam is not currently available', 403);
  }

  // Check if user has already attempted this exam
  const existingResult = await Result.findOne({
    exam: examId,
    student: req.user._id,
    status: { $in: ['in-progress', 'completed', 'submitted'] }
  });

  let attemptNumber = 1;

  if (existingResult) {
    if (existingResult.status === 'in-progress') {
      // Return existing in-progress result
      return res.json({
        success: true,
        message: 'Exam already in progress',
        data: { result: existingResult }
      });
    } else {
      // Check if user can retake - count completed/submitted attempts
      const completedAttempts = await Result.countDocuments({
        exam: examId,
        student: req.user._id,
        status: { $in: ['completed', 'submitted', 'auto-submitted'] }
      });

      if (completedAttempts >= exam.allowedAttempts) {
        throw new AppError('Maximum attempts reached for this exam', 403);
      }
    }
  }

  // Find the highest attempt number for this exam and student
  const lastResult = await Result.findOne({
    exam: examId,
    student: req.user._id
  }).sort({ attemptNumber: -1 });

  if (lastResult) {
    attemptNumber = lastResult.attemptNumber + 1;
    console.log(`Found last result with attempt number: ${lastResult.attemptNumber}, setting new attempt to: ${attemptNumber}`);
  } else {
    console.log('No previous results found, setting attempt number to: 1');
  }

  // Create new result
  const result = await Result.create({
    exam: examId,
    student: req.user._id,
    answers: exam.questions.map(questionId => ({
      question: questionId,
      selectedAnswer: null,
      isCorrect: false,
      marksObtained: 0,
      timeSpent: 0,
      isAnswered: false,
      isMarkedForReview: false
    })),
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    attemptNumber: attemptNumber,
    status: 'in-progress'
  });

  await result.populate('exam', 'title subject duration totalQuestions');

  logger.info(`Exam started: ${exam.title} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Exam started successfully',
    data: { result }
  });
});

// @desc    Submit answer
// @route   PUT /api/results/:id/answer
// @access  Private (Student)
const submitAnswer = asyncHandler(async (req, res) => {
  const { questionId, selectedAnswer, timeSpent, isMarkedForReview } = req.body;

  const result = await Result.findById(req.params.id);
  if (!result) {
    throw new AppError('Result not found', 404);
  }

  // Check if user owns this result
  if (result.student.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this result', 403);
  }

  // Check if exam is still in progress
  if (result.status !== 'in-progress') {
    throw new AppError('Exam is not in progress', 403);
  }

  // Find the answer in the result
  const answerIndex = result.answers.findIndex(
    answer => answer.question.toString() === questionId
  );

  if (answerIndex === -1) {
    throw new AppError('Question not found in this exam', 404);
  }

  // Get question details for validation
  const question = await Question.findById(questionId);
  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Update answer
  const answer = result.answers[answerIndex];
  answer.selectedAnswer = selectedAnswer;
  answer.isAnswered = true;
  answer.timeSpent = timeSpent || 0;
  answer.isMarkedForReview = isMarkedForReview || false;

  // Check if answer is correct
  let isCorrect = false;
  let marksObtained = 0;

  console.log('Answer validation debug:', {
    questionId: questionId,
    questionType: question.questionType,
    selectedAnswer: selectedAnswer,
    correctAnswer: question.correctAnswer,
    options: question.options
  });

  if (question.questionType === 'multiple-choice') {
    // For multiple choice, find the correct option and compare
    const correctOption = question.options.find(option => option.isCorrect);
    console.log('Multiple choice validation:', {
      correctOption: correctOption,
      selectedAnswer: selectedAnswer,
      questionOptions: question.options
    });
    
    if (correctOption) {
      // Check if selectedAnswer is an ID or text
      if (selectedAnswer.match(/^[0-9a-fA-F]{24}$/)) {
        // selectedAnswer is an ID, find the corresponding option
        const selectedOption = question.options.find(option => 
          option._id.toString() === selectedAnswer || option.id === selectedAnswer
        );
        console.log('Selected option by ID:', selectedOption);
        isCorrect = selectedOption && selectedOption.isCorrect;
      } else {
        // selectedAnswer is text, compare directly
        console.log('Comparing text:', selectedAnswer, 'with correct text:', correctOption.text);
        isCorrect = selectedAnswer === correctOption.text;
      }
    }
    
    console.log('Final validation result:', isCorrect);
  } else if (question.questionType === 'true-false') {
    isCorrect = selectedAnswer === question.correctAnswer;
    console.log('True/False validation:', {
      selectedAnswer: selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect
    });
  } else if (question.questionType === 'fill-in-blank') {
    isCorrect = selectedAnswer?.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
    console.log('Fill-in-blank validation:', {
      selectedAnswer: selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect
    });
  } else if (question.questionType === 'essay') {
    // Essay questions need manual grading
    marksObtained = 0;
  } else {
    // For other types, compare directly
    isCorrect = JSON.stringify(selectedAnswer) === JSON.stringify(question.correctAnswer);
    console.log('Other type validation:', {
      selectedAnswer: selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect: isCorrect
    });
  }

  if (isCorrect) {
    marksObtained = question.marks;
  } else if (question.negativeMarks > 0) {
    marksObtained = -question.negativeMarks;
  }

  answer.isCorrect = isCorrect;
  answer.marksObtained = marksObtained;

  // Update result totals
  result.obtainedMarks = result.answers.reduce((sum, ans) => sum + ans.marksObtained, 0);

  await result.save();

  res.json({
    success: true,
    message: 'Answer submitted successfully',
    data: { 
      answer,
      result: result // Include the complete result object
    }
  });
});

// @desc    Submit exam
// @route   POST /api/results/:id/submit
// @access  Private (Student)
const submitExam = asyncHandler(async (req, res) => {
  console.log('Submit exam called with result ID:', req.params.id);
  console.log('User ID:', req.user._id);
  
  const result = await Result.findById(req.params.id);
  if (!result) {
    console.log('Result not found for ID:', req.params.id);
    throw new AppError('Result not found', 404);
  }

  console.log('Found result:', {
    id: result._id,
    student: result.student,
    status: result.status,
    exam: result.exam
  });

  // Check if user owns this result
  if (result.student.toString() !== req.user._id.toString()) {
    console.log('User not authorized to submit this result');
    throw new AppError('Not authorized to submit this result', 403);
  }

  // Check if exam is still in progress
  if (result.status !== 'in-progress') {
    console.log('Exam is not in progress, current status:', result.status);
    throw new AppError('Exam is not in progress', 403);
  }

  // Submit the result
  await result.submitResult();

  // Get exam details for email
  const exam = await Exam.findById(result.exam);

  // Send result email if enabled
  if (exam.showResultsImmediately) {
    try {
      await sendExamResultEmail(req.user, exam, result);
    } catch (error) {
      logger.error('Failed to send result email:', error);
    }
  }

  // Populate result with exam details and question details
  await result.populate({
    path: 'exam',
    select: 'title subject category'
  });

  // Populate answers with question details
  await result.populate({
    path: 'answers.question',
    select: 'questionText questionType options correctAnswer explanation marks'
  });

  logger.info(`Exam submitted: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Exam submitted successfully',
    data: { result }
  });
});

// @desc    Auto submit exam (when time expires)
// @route   POST /api/results/:id/auto-submit
// @access  Private (Student)
const autoSubmitExam = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id);
  if (!result) {
    throw new AppError('Result not found', 404);
  }

  // Check if user owns this result
  if (result.student.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to submit this result', 403);
  }

  // Check if exam is still in progress
  if (result.status !== 'in-progress') {
    throw new AppError('Exam is not in progress', 403);
  }

  // Auto submit the result
  await result.autoSubmitResult();

  // Get exam details for email
  const exam = await Exam.findById(result.exam);

  // Send result email if enabled
  if (exam.showResultsImmediately) {
    try {
      await sendExamResultEmail(req.user, exam, result);
    } catch (error) {
      logger.error('Failed to send result email:', error);
    }
  }

  await result.populate('exam', 'title subject');

  logger.info(`Exam auto-submitted: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Exam auto-submitted successfully',
    data: { result }
  });
});

// @desc    Get user results
// @route   GET /api/results
// @access  Private
const getUserResults = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    examId,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter
  const filter = { student: req.user._id };
  if (examId) filter.exam = examId;
  if (status) filter.status = status;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const results = await Result.find(filter)
    .populate('exam', 'title subject category')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Result.countDocuments(filter);

  res.json({
    success: true,
    data: {
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get single result
// @route   GET /api/results/:id
// @access  Private
const getResult = asyncHandler(async (req, res) => {
  const result = await Result.findById(req.params.id)
    .populate('exam', 'title subject category instructions showCorrectAnswers allowReview')
    .populate('student', 'firstName lastName email');

  if (!result) {
    throw new AppError('Result not found', 404);
  }

  // Check if user can view this result
  if (req.user.role === 'student' && result.student._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view this result', 403);
  }

  // Populate question details if allowed
  if (result.exam.showCorrectAnswers || req.user.role !== 'student') {
    await result.populate({
      path: 'answers.question',
      select: 'questionText questionType options correctAnswer explanation marks'
    });
  } else {
    await result.populate({
      path: 'answers.question',
      select: 'questionText questionType options marks'
    });
  }

  res.json({
    success: true,
    data: { result }
  });
});

// @desc    Get exam results (Admin/Teacher)
// @route   GET /api/results/exam/:examId
// @access  Private (Admin/Teacher)
const getExamResults = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'obtainedMarks',
    sortOrder = 'desc'
  } = req.query;

  const exam = await Exam.findById(req.params.examId);
  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can view exam results
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view exam results', 403);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const results = await Result.find({ exam: req.params.examId })
    .populate('student', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Result.countDocuments({ exam: req.params.examId });

  res.json({
    success: true,
    data: {
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get top performers
// @route   GET /api/results/top-performers
// @access  Private
const getTopPerformers = asyncHandler(async (req, res) => {
  const { examId, limit = 10 } = req.query;

  const filter = { status: 'completed' };
  if (examId) filter.exam = examId;

  const topPerformers = await Result.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$student',
        averageScore: { $avg: '$percentage' },
        totalExams: { $sum: 1 },
        bestScore: { $max: '$percentage' }
      }
    },
    { $sort: { averageScore: -1 } },
    { $limit: parseInt(limit) },
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
        'student.refreshTokens': 0
      }
    }
  ]);

  res.json({
    success: true,
    data: { topPerformers }
  });
});

// @desc    Get result statistics
// @route   GET /api/results/statistics
// @access  Private
const getResultStatistics = asyncHandler(async (req, res) => {
  const { examId, studentId } = req.query;

  const filter = { status: 'completed' };
  if (examId) filter.exam = examId;
  if (studentId) filter.student = studentId;

  const statistics = await Result.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$obtainedMarks' },
        averagePercentage: { $avg: '$percentage' },
        passRate: {
          $avg: {
            $cond: [{ $gte: ['$obtainedMarks', '$passingMarks'] }, 1, 0]
          }
        },
        averageTime: { $avg: '$timeSpent' },
        gradeDistribution: {
          $push: '$grade'
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: { statistics: statistics[0] || {} }
  });
});

// @desc    Review result (Admin/Teacher)
// @route   PUT /api/results/:id/review
// @access  Private (Admin/Teacher)
const reviewResult = asyncHandler(async (req, res) => {
  const { isDisqualified, disqualificationReason, reviewComments } = req.body;

  const result = await Result.findById(req.params.id);
  if (!result) {
    throw new AppError('Result not found', 404);
  }

  // Check if user can review this result
  const exam = await Exam.findById(result.exam);
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to review this result', 403);
  }

  result.isReviewed = true;
  result.reviewedBy = req.user._id;
  result.reviewedAt = new Date();
  result.reviewComments = reviewComments;

  if (isDisqualified) {
    result.isDisqualified = true;
    result.disqualificationReason = disqualificationReason;
  }

  await result.save();

  logger.info(`Result reviewed: ${result._id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Result reviewed successfully',
    data: { result }
  });
});

// @desc    Get all results for a specific student
// @route   GET /api/results/student/:studentId
// @access  Private (Admin/Teacher)
const getStudentResults = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { page = 1, limit = 50, sortBy = 'endTime', sortOrder = 'desc' } = req.query;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get student results with exam details
  const [results, total] = await Promise.all([
    Result.find({ student: studentId })
      .populate('exam', 'title subject category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Result.countDocuments({ student: studentId })
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  res.json({
    success: true,
    data: {
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage,
        hasPrevPage
      }
    }
  });
});

module.exports = {
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
};
