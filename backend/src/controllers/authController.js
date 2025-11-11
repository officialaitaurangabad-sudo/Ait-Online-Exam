const User = require('../models/userModel');
const { generateTokenPair, removeAllRefreshTokens, generateEmailVerificationToken, generatePasswordResetToken, generateToken } = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendEmailVerificationEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone, dateOfBirth } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: role || 'student',
    phone,
    dateOfBirth
  });

  // Generate email verification token
  const emailVerificationToken = generateEmailVerificationToken();
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  // Generate tokens
  const tokens = await generateTokenPair(user._id);

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
  }

  // Send email verification email
  try {
    await sendEmailVerificationEmail(user, emailVerificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
  }

  // Remove password from response
  user.password = undefined;

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for verification.',
    data: {
      user,
      ...tokens
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);

  // Check if user exists and include password for comparison
  const user = await User.findByEmail(email).select('+password');
  console.log('User found:', user ? { id: user._id, email: user.email, isActive: user.isActive } : 'No user found');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is locked
  if (user.isLocked) {
    throw new AppError('Account is temporarily locked due to multiple failed login attempts', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Check password
  console.log('Checking password for user:', user.email);
  const isPasswordValid = await user.comparePassword(password);
  console.log('Password valid:', isPasswordValid);
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    throw new AppError('Invalid credentials', 401);
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const tokens = await generateTokenPair(user._id);

  // Remove password from response
  user.password = undefined;

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      ...tokens
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove specific refresh token
    await removeAllRefreshTokens(req.user._id);
  }

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new AppError('User not found', 401);
  }

  // Check if refresh token exists in user's tokens
  const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
  if (!tokenExists) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Generate new access token with role
  const newAccessToken = generateToken(user._id, { 
    role: user.role,
    email: user.email 
  });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRE || '24h'
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshTokens -emailVerificationToken -passwordResetToken');

  res.json({
    success: true,
    data: { user }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, dateOfBirth, address, preferences } = req.body;

  const user = await User.findById(req.user._id);

  // Update allowed fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone) user.phone = phone;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (address) user.address = { ...user.address, ...address };
  if (preferences) user.preferences = { ...user.preferences, ...preferences };

  await user.save();

  // Remove password from response
  user.password = undefined;

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Remove all refresh tokens to force re-login
  await removeAllRefreshTokens(user._id);

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Generate password reset token
  const resetToken = generatePasswordResetToken();
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send password reset email
  try {
    await sendPasswordResetEmail(user, resetToken);
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    throw new AppError('Failed to send password reset email', 500);
  }

  res.json({
    success: true,
    message: 'Password reset email sent successfully'
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Find user by reset token
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Remove all refresh tokens
  await removeAllRefreshTokens(user._id);

  logger.info(`Password reset for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Verify email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  logger.info(`Email verified for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// @desc    Resend email verification
// @route   POST /api/auth/resend-verification
// @access  Private
const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user.isEmailVerified) {
    throw new AppError('Email is already verified', 400);
  }

  // Generate new verification token
  const emailVerificationToken = generateEmailVerificationToken();
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();

  // Send verification email
  try {
    await sendEmailVerificationEmail(user, emailVerificationToken);
  } catch (error) {
    logger.error('Failed to send verification email:', error);
    throw new AppError('Failed to send verification email', 500);
  }

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Password is incorrect', 400);
  }

  // Deactivate account instead of deleting
  user.isActive = false;
  await user.save();

  // Remove all refresh tokens
  await removeAllRefreshTokens(user._id);

  logger.info(`Account deactivated for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  deleteAccount
};
