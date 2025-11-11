const Question = require('../models/questionModel');
const Exam = require('../models/examModel');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { processBulkQuestions, exportQuestionsToExcel, getFileType, validateFileSize } = require('../utils/csvUtils');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, Excel, and JSON files are allowed.'));
    }
  }
});

// @desc    Get all questions
// @route   GET /api/questions
// @access  Private
const getQuestions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    subject,
    topic,
    difficulty,
    questionType,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = { isActive: true };

  // Role-based filtering
  if (req.user.role === 'student') {
    filter.isPublic = true;
  }

  if (subject) filter.subject = new RegExp(subject, 'i');
  if (topic) filter.topic = new RegExp(topic, 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (questionType) filter.questionType = questionType;
  if (search) {
    filter.$or = [
      { questionText: new RegExp(search, 'i') },
      { subject: new RegExp(search, 'i') },
      { topic: new RegExp(search, 'i') }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const questions = await Question.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Question.countDocuments(filter);

  res.json({
    success: true,
    data: {
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Private
const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email');

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if user can access this question
  if (req.user.role === 'student' && !question.isPublic) {
    throw new AppError('Question not available', 403);
  }

  res.json({
    success: true,
    data: { question }
  });
});

// @desc    Create new question
// @route   POST /api/questions
// @access  Private (Admin/Teacher)
const createQuestion = asyncHandler(async (req, res) => {
  const {
    questionText,
    questionType,
    options,
    correctAnswer,
    explanation,
    marks,
    negativeMarks,
    difficulty,
    subject,
    topic,
    subtopic,
    tags,
    language
  } = req.body;

  const question = await Question.create({
    questionText,
    questionType,
    options,
    correctAnswer,
    explanation,
    marks,
    negativeMarks,
    difficulty,
    subject,
    topic,
    subtopic,
    tags,
    language,
    createdBy: req.user._id
  });

  await question.populate('createdBy', 'firstName lastName email');

  logger.info(`Question created: ${question._id} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: { question }
  });
});

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private (Admin/Teacher)
const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if user can update this question
  if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this question', 403);
  }

  // Check if question is being used in any exams
  const isUsedInExams = await Exam.exists({ questions: question._id });
  if (isUsedInExams) {
    // Create new version instead of updating
    await question.createNewVersion(req.body);
  } else {
    // Update directly if not used
    Object.assign(question, req.body);
    await question.save();
  }

  await question.populate('createdBy', 'firstName lastName email');

  logger.info(`Question updated: ${question._id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Question updated successfully',
    data: { question }
  });
});

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private (Admin/Teacher)
const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if user can delete this question
  if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this question', 403);
  }

  // Check if question is being used in any exams
  const isUsedInExams = await Exam.exists({ questions: question._id });
  if (isUsedInExams) {
    // Soft delete - just deactivate
    question.isActive = false;
    await question.save();
  } else {
    // Hard delete if not used
    await question.deleteOne();
  }

  logger.info(`Question deleted: ${question._id} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Question deleted successfully'
  });
});

// @desc    Bulk upload questions
// @route   POST /api/questions/bulk-upload
// @access  Private (Admin/Teacher)
const bulkUploadQuestions = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  try {
    // Validate file size
    validateFileSize(req.file.path);

    // Get file type
    const fileType = getFileType(req.file.originalname);

    // Process the file
    const result = await processBulkQuestions(req.file.path, fileType);

    if (result.errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some questions have validation errors',
        data: {
          validQuestions: result.validQuestions,
          errors: result.errors,
          totalRows: result.totalRows
        }
      });
    }

    // Create questions in database
    const createdQuestions = [];
    for (const questionData of result.questions) {
      const question = await Question.create({
        ...questionData,
        createdBy: req.user._id
      });
      createdQuestions.push(question);
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    logger.info(`Bulk upload completed: ${createdQuestions.length} questions by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `${createdQuestions.length} questions uploaded successfully`,
      data: {
        questions: createdQuestions,
        totalProcessed: result.totalRows
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Export questions
// @route   GET /api/questions/export
// @access  Private (Admin/Teacher)
const exportQuestions = asyncHandler(async (req, res) => {
  const { format = 'excel', subject, difficulty, questionType } = req.query;

  // Build filter
  const filter = { isActive: true };
  if (subject) filter.subject = new RegExp(subject, 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (questionType) filter.questionType = questionType;

  const questions = await Question.find(filter)
    .populate('createdBy', 'firstName lastName email');

  if (format === 'excel') {
    const filePath = path.join(__dirname, '../../temp/exported-questions.xlsx');
    
    // Create temp directory if it doesn't exist
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    exportQuestionsToExcel(questions, filePath);

    res.download(filePath, 'questions.xlsx', (err) => {
      if (err) {
        logger.error('Error downloading file:', err);
      }
      // Clean up file after download
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  } else {
    // Return JSON format
    res.json({
      success: true,
      data: { questions }
    });
  }
});

// @desc    Get question statistics
// @route   GET /api/questions/statistics
// @access  Private (Admin/Teacher)
const getQuestionStatistics = asyncHandler(async (req, res) => {
  const statistics = await Question.getStatistics();

  res.json({
    success: true,
    data: { statistics: statistics[0] || {} }
  });
});

// @desc    Get random questions
// @route   GET /api/questions/random
// @access  Private
const getRandomQuestions = asyncHandler(async (req, res) => {
  const { count = 10, subject, difficulty, questionType } = req.query;

  const criteria = { isActive: true };
  if (req.user.role === 'student') {
    criteria.isPublic = true;
  }
  if (subject) criteria.subject = new RegExp(subject, 'i');
  if (difficulty) criteria.difficulty = difficulty;
  if (questionType) criteria.questionType = questionType;

  const questions = await Question.findRandom(criteria, parseInt(count));

  res.json({
    success: true,
    data: { questions }
  });
});

// @desc    Upload question media
// @route   POST /api/questions/:id/media
// @access  Private (Admin/Teacher)
const uploadQuestionMedia = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if user can update this question
  if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this question', 403);
  }

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  try {
    // Upload to Cloudinary
    const result = await uploadImage(req.file, 'question-media');

    // Add media to question
    const mediaType = req.body.type || 'images';
    if (!question.media[mediaType]) {
      question.media[mediaType] = [];
    }

    question.media[mediaType].push({
      publicId: result.public_id,
      url: result.secure_url,
      alt: req.body.alt || '',
      title: req.body.title || ''
    });

    await question.save();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Media uploaded successfully',
      data: { media: result }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Delete question media
// @route   DELETE /api/questions/:id/media/:mediaId
// @access  Private (Admin/Teacher)
const deleteQuestionMedia = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    throw new AppError('Question not found', 404);
  }

  // Check if user can update this question
  if (req.user.role !== 'admin' && question.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this question', 403);
  }

  const { mediaId } = req.params;
  const { type } = req.body;

  if (!question.media[type]) {
    throw new AppError('Media type not found', 404);
  }

  const mediaIndex = question.media[type].findIndex(media => media._id.toString() === mediaId);
  if (mediaIndex === -1) {
    throw new AppError('Media not found', 404);
  }

  const media = question.media[type][mediaIndex];

  // Delete from Cloudinary
  try {
    await deleteImage(media.publicId);
  } catch (error) {
    logger.error('Error deleting media from Cloudinary:', error);
  }

  // Remove from question
  question.media[type].splice(mediaIndex, 1);
  await question.save();

  res.json({
    success: true,
    message: 'Media deleted successfully'
  });
});

module.exports = {
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
};
