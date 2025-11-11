const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const logger = require('../config/logger');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('authenticateToken - Auth header:', authHeader);
    console.log('authenticateToken - Token exists:', !!token);

    if (!token) {
      console.log('authenticateToken - No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('authenticateToken - Token decoded:', { userId: decoded.userId });
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    console.log('authenticateToken - User found:', { id: user?._id, email: user?.email, role: user?.role });
    
    if (!user) {
      console.log('authenticateToken - User not found');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      console.log('authenticateToken - User account deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      console.log('authenticateToken - User account locked');
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    req.user = user;
    console.log('authenticateToken - Authentication successful');
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    console.log('authenticateToken - Error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Check user role
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('authorize - Checking authorization for roles:', roles);
    console.log('authorize - User:', req.user);
    console.log('authorize - User role:', req.user?.role);
    
    if (!req.user) {
      console.log('authorize - No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      console.log('authorize - Access denied. User role not in allowed roles');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    console.log('authorize - Authorization successful');
    next();
  };
};

// Check if user is admin
const requireAdmin = authorize('admin');

// Check if user is teacher or admin
const requireTeacher = authorize('admin', 'teacher');

// Check if user is student
const requireStudent = authorize('student');

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (resourceUserIdField = 'createdBy') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource ? req.resource[resourceUserIdField] : null;
    
    if (!resourceUserId || resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources'
      });
    }

    next();
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  const key = `auth_${req.ip}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  // This would typically use a Redis store or similar
  // For now, we'll implement a simple in-memory store
  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }

  const now = Date.now();
  const attempts = global.authAttempts.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + windowMs;
  }

  attempts.count++;

  if (attempts.count > maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    });
  }

  global.authAttempts.set(key, attempts);
  next();
};

// Verify refresh token
const verifyRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if refresh token exists in user's refresh tokens
    const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
    
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    req.user = user;
    req.refreshToken = refreshToken;
    next();
  } catch (error) {
    logger.error('Refresh token verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  requireAdmin,
  requireTeacher,
  requireStudent,
  optionalAuth,
  checkOwnership,
  authRateLimit,
  verifyRefreshToken
};
