const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
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

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
  const allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];

  const allowedTypes = [...allowedImageTypes, ...allowedDocumentTypes, ...allowedVideoTypes, ...allowedAudioTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images, documents, videos, and audio files are allowed.', 400), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter
});

// @desc    Upload single file
// @route   POST /api/upload/single
// @access  Private
const uploadSingle = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  try {
    // Upload to Cloudinary
    const result = await uploadImage(req.file, 'general-uploads');

    // Clean up local file
    fs.unlinkSync(req.file.path);

    logger.info(`File uploaded: ${result.public_id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        originalName: req.file.originalname,
        size: result.bytes,
        format: result.format
      }
    });
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private
const uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadResults = [];
  const errors = [];

  for (const file of req.files) {
    try {
      // Upload to Cloudinary
      const result = await uploadImage(file, 'general-uploads');

      uploadResults.push({
        publicId: result.public_id,
        url: result.secure_url,
        originalName: file.originalname,
        size: result.bytes,
        format: result.format
      });

      // Clean up local file
      fs.unlinkSync(file.path);
    } catch (error) {
      errors.push({
        fileName: file.originalname,
        error: error.message
      });

      // Clean up local file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }

  logger.info(`Multiple files uploaded: ${uploadResults.length} successful, ${errors.length} failed by ${req.user.email}`);

  res.json({
    success: true,
    message: `${uploadResults.length} files uploaded successfully`,
    data: {
      uploads: uploadResults,
      errors
    }
  });
});

// @desc    Upload profile picture
// @route   POST /api/upload/profile-picture
// @access  Private
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  // Validate file type for profile pictures
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    throw new AppError('Only image files are allowed for profile pictures', 400);
  }

  try {
    // Upload to Cloudinary with specific transformations for profile pictures
    const result = await uploadImage(req.file, 'profile-pictures');

    // Clean up local file
    fs.unlinkSync(req.file.path);

    logger.info(`Profile picture uploaded: ${result.public_id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        originalName: req.file.originalname,
        size: result.bytes,
        format: result.format
      }
    });
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Upload exam media
// @route   POST /api/upload/exam-media
// @access  Private (Admin/Teacher)
const uploadExamMedia = asyncHandler(async (req, res) => {
  if (req.user.role === 'student') {
    throw new AppError('Access denied', 403);
  }

  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  try {
    // Upload to Cloudinary
    const result = await uploadImage(req.file, 'exam-media');

    // Clean up local file
    fs.unlinkSync(req.file.path);

    logger.info(`Exam media uploaded: ${result.public_id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Exam media uploaded successfully',
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        originalName: req.file.originalname,
        size: result.bytes,
        format: result.format
      }
    });
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

// @desc    Delete uploaded file
// @route   DELETE /api/upload/:publicId
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  try {
    // Delete from Cloudinary
    const result = await deleteImage(publicId);

    logger.info(`File deleted: ${publicId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: { result }
    });
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw new AppError('Failed to delete file', 500);
  }
});

// @desc    Get upload statistics
// @route   GET /api/upload/statistics
// @access  Private (Admin)
const getUploadStatistics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  // This would typically query your database for upload statistics
  // For now, we'll return a basic structure
  const statistics = {
    totalUploads: 0,
    totalSize: 0,
    uploadsByType: {
      images: 0,
      documents: 0,
      videos: 0,
      audio: 0
    },
    uploadsByUser: [],
    recentUploads: []
  };

  res.json({
    success: true,
    data: { statistics }
  });
});

// @desc    Get user uploads
// @route   GET /api/upload/user-uploads
// @access  Private
const getUserUploads = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type } = req.query;

  // This would typically query your database for user uploads
  // For now, we'll return a basic structure
  const uploads = [];
  const total = 0;

  res.json({
    success: true,
    data: {
      uploads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }
  });
});

// @desc    Update file metadata
// @route   PUT /api/upload/:publicId/metadata
// @access  Private
const updateFileMetadata = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const { title, description, tags } = req.body;

  // This would typically update file metadata in your database
  // For now, we'll return a success response

  logger.info(`File metadata updated: ${publicId} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'File metadata updated successfully',
    data: {
      publicId,
      title,
      description,
      tags
    }
  });
});

// @desc    Get file info
// @route   GET /api/upload/:publicId/info
// @access  Private
const getFileInfo = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  // This would typically get file info from your database
  // For now, we'll return a basic structure
  const fileInfo = {
    publicId,
    url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
    size: 0,
    format: 'unknown',
    title: '',
    description: '',
    tags: []
  };

  res.json({
    success: true,
    data: { fileInfo }
  });
});

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadProfilePicture,
  uploadExamMedia,
  deleteFile,
  getUploadStatistics,
  getUserUploads,
  updateFileMetadata,
  getFileInfo,
  upload
};
