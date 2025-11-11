const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const logger = require('../config/logger');

// Generate JWT token with enhanced security
const generateToken = (userId, additionalClaims = {}) => {
  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    ...additionalClaims
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '1h',
      issuer: 'ait-exam-platform',
      audience: 'exam-platform-users'
    }
  );
};

// Generate refresh token with enhanced security
const generateRefreshToken = (userId) => {
  const payload = {
    userId,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
      issuer: 'ait-exam-platform',
      audience: 'exam-platform-users'
    }
  );
};

// Generate email verification token
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate random OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Verify JWT token with enhanced security
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret, {
      issuer: 'ait-exam-platform',
      audience: 'exam-platform-users',
      algorithms: ['HS256']
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active');
    }
    throw new Error('Token verification failed');
  }
};

// Decode JWT token without verification
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    throw new Error('Invalid token format');
  }
};

// Add refresh token to user
const addRefreshToken = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove old refresh tokens if more than 5
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens = user.refreshTokens.slice(-4);
    }

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return true;
  } catch (error) {
    logger.error('Error adding refresh token:', error);
    throw error;
  }
};

// Remove refresh token from user
const removeRefreshToken = async (userId, refreshToken) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshTokens = user.refreshTokens.filter(
      token => token.token !== refreshToken
    );
    await user.save();

    return true;
  } catch (error) {
    logger.error('Error removing refresh token:', error);
    throw error;
  }
};

// Remove all refresh tokens from user
const removeAllRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshTokens = [];
    await user.save();

    return true;
  } catch (error) {
    logger.error('Error removing all refresh tokens:', error);
    throw error;
  }
};

// Check if token is expired
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

// Get token expiration time
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Generate token pair (access + refresh)
const generateTokenPair = async (userId) => {
  try {
    // Get user details to include role in token
    const user = await User.findById(userId).select('role email');
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = generateToken(userId, { 
      role: user.role,
      email: user.email 
    });
    const refreshToken = generateRefreshToken(userId);

    // Add refresh token to user
    await addRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '24h'
    };
  } catch (error) {
    logger.error('Error generating token pair:', error);
    throw error;
  }
};

// Refresh access token
const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).select('role email');

    if (!user) {
      throw new Error('User not found');
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(token => token.token === refreshToken);
    if (!tokenExists) {
      throw new Error('Invalid refresh token');
    }

    // Generate new access token with role
    const newAccessToken = generateToken(user._id, { 
      role: user.role,
      email: user.email 
    });

    return {
      accessToken: newAccessToken,
      expiresIn: process.env.JWT_EXPIRE || '24h'
    };
  } catch (error) {
    logger.error('Error refreshing access token:', error);
    throw error;
  }
};

// Generate secure random token
const generateSecureToken = (length = 64) => {
  return crypto.randomBytes(length).toString('base64url');
};

// Hash token (for storing in database)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Verify hashed token
const verifyHashedToken = (token, hashedToken) => {
  const tokenHash = hashToken(token);
  return tokenHash === hashedToken;
};

module.exports = {
  generateToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  generateOTP,
  generateRandomString,
  verifyToken,
  decodeToken,
  addRefreshToken,
  removeRefreshToken,
  removeAllRefreshTokens,
  isTokenExpired,
  getTokenExpiration,
  generateTokenPair,
  refreshAccessToken,
  generateSecureToken,
  hashToken,
  verifyHashedToken
};
