const User = require('../models/userModel');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { generateTokenPair } = require('../utils/tokenUtils');
const { sendWelcomeEmail } = require('../utils/emailUtils');

// @desc    Get all users with filtering and pagination
// @route   GET /api/users
// @access  Admin only
const getUsers = asyncHandler(async (req, res) => {
  console.log('getUsers called with params:', req.query);
  const {
    page = 1,
    limit = 10,
    search = '',
    role = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    filter.role = role;
  }
  
  if (status) {
    filter.isActive = status === 'active';
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshTokens -emailVerificationToken -passwordResetToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / parseInt(limit));

  console.log('Found users:', users.length, 'Total:', total);
  console.log('Response data:', { users, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages } });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin only
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Create new user
// @route   POST /api/users
// @access  Admin only
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone, dateOfBirth, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Create user
  console.log('Creating user with data:', { firstName, lastName, email, role, hasPassword: !!password });
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'student',
    phone,
    dateOfBirth,
    address,
    isEmailVerified: true // Admin created users are auto-verified
  });
  console.log('User created successfully:', user._id, user.email);

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;
  delete userResponse.emailVerificationToken;
  delete userResponse.passwordResetToken;

  res.status(201).json({
    success: true,
    data: userResponse
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin only
const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, role, phone, dateOfBirth, address, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }
  }

  // Update user
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone;
  if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
  if (address !== undefined) updateData.address = address;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

  res.json({
    success: true,
    data: updatedUser
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin only
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deleting themselves
  if (user._id.toString() === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Toggle user status (activate/deactivate)
// @route   PUT /api/users/:id/toggle-status
// @access  Admin only
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (user._id.toString() === req.user.id) {
    throw new AppError('You cannot deactivate your own account', 400);
  }

  user.isActive = !user.isActive;
  await user.save();

  // Remove sensitive data from response
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshTokens;
  delete userResponse.emailVerificationToken;
  delete userResponse.passwordResetToken;

  res.json({
    success: true,
    data: userResponse
  });
});

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Admin only
const resetUserPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  console.log('resetUserPassword called with:', { userId: req.params.id, hasPassword: !!newPassword });

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Set the password and mark it as modified to trigger the pre-save hook
  user.password = newPassword;
  user.markModified('password');
  await user.save();

  console.log('Password reset successfully for user:', user.email);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Get user statistics
// @route   GET /api/users/statistics
// @access  Admin only
const getUserStatistics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    students,
    teachers,
    admins,
    verifiedUsers,
    unverifiedUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isEmailVerified: true }),
    User.countDocuments({ isEmailVerified: false })
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      students,
      teachers,
      admins,
      verifiedUsers,
      unverifiedUsers
    }
  });
});

// @desc    Export users to CSV
// @route   GET /api/users/export
// @access  Admin only
const exportUsers = asyncHandler(async (req, res) => {
  const { search = '', role = '', status = '' } = req.query;

  // Build filter object
  const filter = {};
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    filter.role = role;
  }
  
  if (status) {
    filter.isActive = status === 'active';
  }

  const users = await User.find(filter)
    .select('firstName lastName email role phone isActive isEmailVerified createdAt lastLogin')
    .sort({ createdAt: -1 });

  // Convert to CSV format
  const csvHeader = 'First Name,Last Name,Email,Role,Phone,Status,Email Verified,Created At,Last Login\n';
  const csvData = users.map(user => {
    return [
      user.firstName,
      user.lastName,
      user.email,
      user.role,
      user.phone || '',
      user.isActive ? 'Active' : 'Inactive',
      user.isEmailVerified ? 'Yes' : 'No',
      user.createdAt.toISOString().split('T')[0],
      user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : 'Never'
    ].join(',');
  }).join('\n');

  const csv = csvHeader + csvData;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=users-export-${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csv);
});

// @desc    Bulk create users
// @route   POST /api/users/bulk-create
// @access  Admin only
const bulkCreateUsers = asyncHandler(async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    throw new AppError('Users array is required', 400);
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        results.failed.push({
          email: userData.email,
          error: 'User already exists with this email'
        });
        continue;
      }

      // Create user
      const user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password || 'defaultPassword123', // Default password
        role: userData.role || 'student',
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        isEmailVerified: true
      });

      results.successful.push({
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      });
    } catch (error) {
      results.failed.push({
        email: userData.email,
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    data: results
  });
});

// @desc    Get user activity
// @route   GET /api/users/:id/activity
// @access  Admin only
const getUserActivity = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // This would typically come from a separate activity log collection
  // For now, we'll return basic user info
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      activities: [] // Placeholder for future activity tracking
    }
  });
});

// @desc    Get user exams
// @route   GET /api/users/:id/exams
// @access  Admin only
const getUserExams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // This would typically query exam results or assigned exams
  // For now, we'll return basic info
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
      },
      exams: [] // Placeholder for future exam data
    }
  });
});

// @desc    Get user results
// @route   GET /api/users/:id/results
// @access  Admin only
const getUserResults = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // This would typically query exam results
  // For now, we'll return basic info
  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role
      },
      results: [] // Placeholder for future results data
    }
  });
});

// @desc    Get all students with filtering and pagination
// @route   GET /api/users/students
// @access  Admin/Teacher only
const getStudents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object for students only
  const filter = { role: 'student' };
  
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) {
    filter.isActive = status === 'active';
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query
  const [students, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshTokens')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments(filter)
  ]);

  // Calculate pagination info
  const totalPages = Math.ceil(total / parseInt(limit));
  const hasNextPage = parseInt(page) < totalPages;
  const hasPrevPage = parseInt(page) > 1;

  res.json({
    success: true,
    data: {
      students,
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

// @desc    Assign exams to a student
// @route   PUT /api/users/:id/assign-exams
// @access  Admin/Teacher only
const assignExamsToStudent = asyncHandler(async (req, res) => {
  const { examIds } = req.body;
  const studentId = req.params.id;

  if (!examIds || !Array.isArray(examIds)) {
    throw new AppError('Exam IDs array is required', 400);
  }

  // Find the student
  const student = await User.findById(studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  if (student.role !== 'student') {
    throw new AppError('User is not a student', 400);
  }

  // Update student with assigned exams
  student.assignedExams = examIds;
  await student.save();

  res.json({
    success: true,
    message: 'Exams assigned successfully',
    data: {
      studentId: student._id,
      assignedExams: student.assignedExams
    }
  });
});

// @desc    Toggle student's ability to view answers
// @route   PUT /api/users/:id/toggle-answer-viewing
// @access  Admin/Teacher only
const toggleStudentAnswerViewing = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  // Find the student
  const student = await User.findById(studentId);
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  if (student.role !== 'student') {
    throw new AppError('User is not a student', 400);
  }

  // Toggle the canViewAnswers field
  student.canViewAnswers = !student.canViewAnswers;
  await student.save();

  res.json({
    success: true,
    message: `Answer viewing ${student.canViewAnswers ? 'enabled' : 'disabled'} successfully`,
    data: {
      studentId: student._id,
      canViewAnswers: student.canViewAnswers
    }
  });
});

// @desc    Get student's exam assignments
// @route   GET /api/users/:id/exam-assignments
// @access  Admin/Teacher only
const getStudentExamAssignments = asyncHandler(async (req, res) => {
  const studentId = req.params.id;

  // Find the student
  const student = await User.findById(studentId).select('assignedExams');
  if (!student) {
    throw new AppError('Student not found', 404);
  }

  if (student.role !== 'student') {
    throw new AppError('User is not a student', 400);
  }

  // Get exam details for assigned exams
  const Exam = require('../models/examModel');
  const assignedExams = await Exam.find({ 
    _id: { $in: student.assignedExams || [] } 
  }).select('title subject status startDate endDate');

  res.json({
    success: true,
    data: {
      studentId: student._id,
      assignedExams
    }
  });
});

module.exports = {
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
};
