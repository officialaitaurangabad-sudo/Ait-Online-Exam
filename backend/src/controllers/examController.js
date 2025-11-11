const Exam = require('../models/examModel');
const Question = require('../models/questionModel');
const Result = require('../models/resultModel');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { calculateExamStatistics } = require('../utils/analyticsUtils');
const logger = require('../config/logger');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subject,
    category,
    status,
    difficulty,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  // Role-based filtering
  if (req.user.role === 'student') {
    filter.status = 'published';
    filter.startDate = { $lte: new Date() };
    filter.endDate = { $gte: new Date() };
  }

  if (subject) filter.subject = new RegExp(subject, 'i');
  if (category) filter.category = new RegExp(category, 'i');
  if (status) filter.status = status;
  if (difficulty) filter.difficulty = difficulty;
  if (search) {
    filter.$or = [
      { title: new RegExp(search, 'i') },
      { description: new RegExp(search, 'i') },
      { subject: new RegExp(search, 'i') }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const exams = await Exam.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Exam.countDocuments(filter);

  res.json({
    success: true,
    data: {
      exams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email')
    .populate('questions');

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can access this exam
  if (req.user.role === 'student') {
    if (exam.status !== 'published' || !exam.isActive) {
      throw new AppError('Exam not available', 403);
    }

    if (exam.startDate > new Date() || exam.endDate < new Date()) {
      throw new AppError('Exam is not currently available', 403);
    }
  }

  res.json({
    success: true,
    data: { exam }
  });
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin/Teacher)
const createExam = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    instructions,
    subject,
    category,
    duration,
    totalQuestions,
    totalMarks,
    passingMarks,
    questions,
    startDate,
    endDate,
    allowedAttempts,
    timeLimit,
    shuffleQuestions,
    shuffleOptions,
    showCorrectAnswers,
    showResultsImmediately,
    allowReview,
    negativeMarking,
    proctoring,
    accessControl,
    tags,
    difficulty,
    language
  } = req.body;

  // Validate questions if provided
  if (questions && questions.length > 0) {
    const questionIds = await Question.find({
      _id: { $in: questions },
      isActive: true
    }).select('_id');

    if (questionIds.length !== questions.length) {
      throw new AppError('Some questions are invalid or inactive', 400);
    }
  }

  const exam = await Exam.create({
    title,
    description,
    instructions,
    subject,
    category,
    duration,
    totalQuestions,
    totalMarks,
    passingMarks,
    questions: questions || [],
    createdBy: req.user._id,
    startDate,
    endDate,
    allowedAttempts,
    timeLimit,
    shuffleQuestions,
    shuffleOptions,
    showCorrectAnswers,
    showResultsImmediately,
    allowReview,
    negativeMarking,
    proctoring,
    accessControl,
    tags,
    difficulty,
    language
  });

  await exam.populate('createdBy', 'firstName lastName email');

  logger.info(`Exam created: ${exam.title} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    data: { exam }
  });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin/Teacher)
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can update this exam
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this exam', 403);
  }

  // Check if exam has any results (prevent major changes)
  const hasResults = await Result.exists({ exam: exam._id });
  console.log('updateExam - Exam has results:', hasResults);
  console.log('updateExam - Request body:', req.body);
  
  if (hasResults) {
    // Only allow certain fields to be updated
    const allowedUpdates = [
      'title',
      'description',
      'instructions',
      'endDate',
      'allowedAttempts',
      'duration',
      'totalQuestions',
      'totalMarks',
      'passingMarks',
      'showCorrectAnswers',
      'showResultsImmediately',
      'allowReview',
      'accessControl',
      'tags'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
        console.log(`updateExam - Allowing update for field: ${key} = ${req.body[key]}`);
      } else {
        console.log(`updateExam - Blocking update for field: ${key} = ${req.body[key]}`);
      }
    });
    
    console.log('updateExam - Final updates object:', updates);
    Object.assign(exam, updates);
  } else {
    // Allow all updates if no results exist
    console.log('updateExam - No results found, allowing all updates');
    Object.assign(exam, req.body);
  }

  await exam.save();
  await exam.populate('createdBy', 'firstName lastName email');

  console.log('updateExam - Exam after save:', {
    _id: exam._id,
    title: exam.title,
    allowedAttempts: exam.allowedAttempts,
    status: exam.status,
    isActive: exam.isActive,
    startDate: exam.startDate,
    endDate: exam.endDate
  });

  logger.info(`Exam updated: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Exam updated successfully',
    data: { exam }
  });
});

// @desc    Add questions to exam
// @route   PUT /api/exams/:id/questions
// @access  Private (Admin/Teacher)
const addQuestionsToExam = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;

  if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
    throw new AppError('Question IDs array is required', 400);
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to modify this exam', 403);
  }

  // Check if exam has any results (prevent adding questions after exam has been taken)
  const hasResults = await Result.exists({ exam: exam._id });
  if (hasResults) {
    throw new AppError('Cannot add questions to exam that has been taken by students', 400);
  }

  // Validate that all question IDs exist
  const questions = await Question.find({ _id: { $in: questionIds } });
  if (questions.length !== questionIds.length) {
    throw new AppError('One or more questions not found', 400);
  }

  // Add questions to exam (avoid duplicates)
  const existingQuestionIds = exam.questions.map(id => id.toString());
  const newQuestionIds = questionIds.filter(id => !existingQuestionIds.includes(id.toString()));
  
  if (newQuestionIds.length === 0) {
    throw new AppError('All selected questions are already in this exam', 400);
  }

  exam.questions.push(...newQuestionIds);
  exam.totalQuestions = exam.questions.length;
  
  await exam.save();
  await exam.populate('createdBy', 'firstName lastName email');

  logger.info(`Added ${newQuestionIds.length} questions to exam: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: `Added ${newQuestionIds.length} questions to exam successfully`,
    data: { 
      exam,
      addedQuestions: newQuestionIds.length,
      totalQuestions: exam.questions.length
    }
  });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin/Teacher)
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can delete this exam
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this exam', 403);
  }

  // Check if exam has any results
  const hasResults = await Result.exists({ exam: exam._id });
  if (hasResults) {
    // Soft delete - just deactivate
    exam.isActive = false;
    await exam.save();
  } else {
    // Hard delete if no results
    await exam.deleteOne();
  }

  logger.info(`Exam deleted: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

// @desc    Publish exam
// @route   PUT /api/exams/:id/publish
// @access  Private (Admin/Teacher)
const publishExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can publish this exam
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to publish this exam', 403);
  }

  // Validate exam before publishing
  if (exam.questions.length === 0) {
    throw new AppError('Cannot publish exam without questions', 400);
  }

  if (exam.questions.length !== exam.totalQuestions) {
    throw new AppError('Number of questions does not match total questions', 400);
  }

  exam.status = 'published';
  await exam.save();

  logger.info(`Exam published: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Exam published successfully',
    data: { exam }
  });
});

// @desc    Archive exam
// @route   PUT /api/exams/:id/archive
// @access  Private (Admin/Teacher)
const archiveExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can archive this exam
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to archive this exam', 403);
  }

  exam.status = 'archived';
  await exam.save();

  logger.info(`Exam archived: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Exam archived successfully',
    data: { exam }
  });
});

// @desc    Remove questions from exam
// @route   DELETE /api/exams/:id/questions
// @access  Private (Admin/Teacher)
const removeQuestionsFromExam = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;

  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can modify this exam
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to modify this exam', 403);
  }

  // Check if exam has results
  const hasResults = await Result.exists({ exam: exam._id });
  if (hasResults) {
    throw new AppError('Cannot modify exam that has results', 400);
  }

  // Remove questions from exam
  exam.questions = exam.questions.filter(id => !questionIds.includes(id.toString()));
  exam.totalQuestions = exam.questions.length;

  // Recalculate total marks
  const remainingQuestions = await Question.find({
    _id: { $in: exam.questions }
  });
  const totalMarks = remainingQuestions.reduce((sum, question) => sum + question.marks, 0);
  exam.totalMarks = totalMarks;

  await exam.save();

  logger.info(`Questions removed from exam: ${exam.title} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Questions removed successfully',
    data: { exam }
  });
});

// @desc    Get exam statistics
// @route   GET /api/exams/:id/statistics
// @access  Private (Admin/Teacher)
const getExamStatistics = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can view statistics
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view exam statistics', 403);
  }

  const statistics = await calculateExamStatistics(exam._id);

  res.json({
    success: true,
    data: { statistics }
  });
});

// @desc    Get exam results
// @route   GET /api/exams/:id/results
// @access  Private (Admin/Teacher)
const getExamResults = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'obtainedMarks',
    sortOrder = 'desc'
  } = req.query;

  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    throw new AppError('Exam not found', 404);
  }

  // Check if user can view results
  if (req.user.role !== 'admin' && exam.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to view exam results', 403);
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const results = await Result.find({ exam: exam._id })
    .populate('student', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Result.countDocuments({ exam: exam._id });

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

// @desc    Get live exams
// @route   GET /api/exams/live
// @access  Private
const getLiveExams = asyncHandler(async (req, res) => {
  const exams = await Exam.findLiveExams()
    .populate('createdBy', 'firstName lastName email')
    .sort({ startDate: 1 });

  res.json({
    success: true,
    data: { exams }
  });
});

// @desc    Get upcoming exams
// @route   GET /api/exams/upcoming
// @access  Private
const getUpcomingExams = asyncHandler(async (req, res) => {
  const exams = await Exam.findUpcomingExams()
    .populate('createdBy', 'firstName lastName email')
    .sort({ startDate: 1 });

  res.json({
    success: true,
    data: { exams }
  });
});

module.exports = {
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
};
