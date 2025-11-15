// Environment configuration
export const config = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://46.37.122.240:5000/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AIT Online Exam Platform',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment
  NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.VITE_NODE_ENV === 'development',
  IS_PRODUCTION: import.meta.env.VITE_NODE_ENV === 'production',
  
  // Features
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_DARK_MODE: import.meta.env.VITE_ENABLE_DARK_MODE === 'true',
  
  // File Upload
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf'
  ],
  
  // Exam Settings
  DEFAULT_EXAM_DURATION: parseInt(import.meta.env.VITE_DEFAULT_EXAM_DURATION) || 60, // minutes
  AUTO_SAVE_INTERVAL: parseInt(import.meta.env.VITE_AUTO_SAVE_INTERVAL) || 30000, // 30 seconds
  WARNING_TIME: parseInt(import.meta.env.VITE_WARNING_TIME) || 300, // 5 minutes
  
  // UI Settings
  ITEMS_PER_PAGE: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 10,
  DEBOUNCE_DELAY: parseInt(import.meta.env.VITE_DEBOUNCE_DELAY) || 300,
  
  // External Services
  CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
  
  // Development
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
}

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },
  
  // Exams
  EXAMS: {
    BASE: '/exams',
    LIVE: '/exams/live',
    UPCOMING: '/exams/upcoming',
    STATISTICS: (id) => `/exams/${id}/statistics`,
    RESULTS: (id) => `/exams/${id}/results`,
    PUBLISH: (id) => `/exams/${id}/publish`,
    ARCHIVE: (id) => `/exams/${id}/archive`,
  },
  
  // Questions
  QUESTIONS: {
    BASE: '/questions',
    RANDOM: '/questions/random',
    EXPORT: '/questions/export',
    BULK_UPLOAD: '/questions/bulk-upload',
    STATISTICS: '/questions/statistics',
  },
  
  // Results
  RESULTS: {
    BASE: '/results',
    START: '/results/start',
    SUBMIT: (id) => `/results/${id}/submit`,
    AUTO_SUBMIT: (id) => `/results/${id}/auto-submit`,
    ANSWER: (id) => `/results/${id}/answer`,
    REVIEW: (id) => `/results/${id}/review`,
    EXAM: (id) => `/results/exam/${id}`,
    TOP_PERFORMERS: '/results/top-performers',
    STATISTICS: '/results/statistics',
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    EXAM: (id) => `/analytics/exam/${id}`,
    EXAM_STATISTICS: (id) => `/analytics/exam/${id}/statistics`,
    STUDENT: (id) => `/analytics/student/${id}`,
    STUDENT_PROGRESS: (id) => `/analytics/student/${id}/progress`,
    QUESTIONS: '/analytics/questions',
    PERFORMANCE_TRENDS: '/analytics/performance/trends',
    SUBJECT_WISE: '/analytics/performance/subjects',
    TOP_PERFORMERS: '/analytics/performance/top-performers',
    SYSTEM: '/analytics/system',
  },
  
  // Upload
  UPLOAD: {
    SINGLE: '/upload/single',
    MULTIPLE: '/upload/multiple',
    PROFILE_PICTURE: '/upload/profile-picture',
    DELETE: (id) => `/upload/${id}`,
    INFO: (id) => `/upload/${id}/info`,
  },
}

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
}

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
}

// Exam status
export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  LIVE: 'live',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
}

// Question types
export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  ESSAY: 'essay',
  MATCHING: 'matching',
  ORDERING: 'ordering',
}

// Result status
export const RESULT_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  REVIEWED: 'reviewed',
}

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

// File types
export const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  VIDEO: 'video',
  AUDIO: 'audio',
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
}

// Time formats
export const TIME_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_DATETIME: 'MMM DD, YYYY HH:mm',
}

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  QUESTION_MAX_LENGTH: 2000,
  OPTION_MAX_LENGTH: 500,
}

// Local storage keys
export const STORAGE_KEYS = {
  AUTH: 'auth-storage',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings',
  EXAM_PROGRESS: 'exam-progress',
}

export default config
