const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStatistics,
  exportUsers,
  bulkCreateUsers,
  getUserActivity,
  getUserExams,
  getUserResults,
  getStudents,
  assignExamsToStudent,
  toggleStudentAnswerViewing,
  getStudentExamAssignments
} = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Debug middleware to check user role
router.use((req, res, next) => {
  console.log('User routes - User role:', req.user?.role);
  console.log('User routes - User ID:', req.user?._id);
  console.log('User routes - User email:', req.user?.email);
  next();
});

// Temporarily allow all roles for debugging - change back to admin only later
// router.use(authorize('admin'));

// Validation middleware
const createUserValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['student', 'admin', 'teacher']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required')
];

const updateUserValidation = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['student', 'admin', 'teacher']).withMessage('Invalid role'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

const resetPasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      console.log('Password validation - received value:', value);
      console.log('Password validation - request body:', req.body);
      return true;
    })
];

const bulkCreateValidation = [
  body('users').isArray({ min: 1 }).withMessage('Users array is required'),
  body('users.*.firstName').trim().notEmpty().withMessage('First name is required for all users'),
  body('users.*.lastName').trim().notEmpty().withMessage('Last name is required for all users'),
  body('users.*.email').isEmail().normalizeEmail().withMessage('Valid email is required for all users'),
  body('users.*.role').optional().isIn(['student', 'admin', 'teacher']).withMessage('Invalid role')
];

// User management routes
router.get('/', getUsers);
router.get('/statistics', getUserStatistics);
router.get('/export', exportUsers);
router.get('/students', getStudents);
router.get('/:id', getUser);
router.get('/:id/activity', getUserActivity);
router.get('/:id/exams', getUserExams);
router.get('/:id/results', getUserResults);
router.get('/:id/exam-assignments', getStudentExamAssignments);

router.post('/', createUserValidation, createUser);
router.post('/bulk-create', bulkCreateValidation, bulkCreateUsers);

router.put('/:id', updateUserValidation, updateUser);
router.put('/:id/toggle-status', toggleUserStatus);
router.put('/:id/reset-password', resetPasswordValidation, resetUserPassword);
router.put('/:id/assign-exams', assignExamsToStudent);
router.put('/:id/toggle-answer-viewing', toggleStudentAnswerViewing);

// Debug endpoint for password reset
router.put('/:id/reset-password-debug', (req, res) => {
  console.log('Debug password reset endpoint called');
  console.log('User ID:', req.params.id);
  console.log('Request body:', req.body);
  console.log('Headers:', req.headers);
  res.json({
    success: true,
    message: 'Debug endpoint working',
    data: {
      userId: req.params.id,
      body: req.body,
      hasAuth: !!req.headers.authorization
    }
  });
});

router.delete('/:id', deleteUser);

module.exports = router;
