import axios from 'axios'
import { toast } from 'react-toastify'
import { config, HTTP_STATUS } from './config'
import useAuthStore from '../store/useAuthStore'

// Create axios instance
const api = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }
    
    // Add authorization header if token exists
    const { accessToken } = useAuthStore.getState()
    console.log('API Request - URL:', config.url)
    console.log('API Request - Has token:', !!accessToken)
    console.log('API Request - Token preview:', accessToken?.substring(0, 30) + '...')
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
      console.log('API Request - Authorization header set')
    } else {
      console.log('API Request - No token available')
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response
      const message = data?.message || 'An error occurred'

      switch (status) {
        case HTTP_STATUS.UNAUTHORIZED:
          // Unauthorized - token expired or invalid
          if (data?.message !== 'Invalid credentials') {
            // Don't show toast for login errors
            toast.error('Session expired. Please login again.')
          }
          break
        case HTTP_STATUS.FORBIDDEN:
          toast.error('Access denied. You do not have permission to perform this action.')
          break
        case HTTP_STATUS.NOT_FOUND:
          toast.error('Resource not found.')
          break
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          // Validation errors
          if (data?.errors) {
            Object.values(data.errors).forEach(errorArray => {
              if (Array.isArray(errorArray)) {
                errorArray.forEach(error => toast.error(error))
              } else {
                toast.error(errorArray)
              }
            })
          } else {
            toast.error(message)
          }
          break
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          toast.error('Too many requests. Please try again later.')
          break
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          toast.error('Server error. Please try again later.')
          break
        default:
          if (status >= 400 && status < 500) {
            toast.error(message)
          } else if (status >= 500) {
            toast.error('Server error. Please try again later.')
          }
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.')
    } else {
      // Other error
      toast.error('An unexpected error occurred.')
    }

    return Promise.reject(error)
  }
)

// API methods
export const apiMethods = {
  // GET request
  get: (url, config = {}) => api.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => api.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => api.put(url, data, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => api.patch(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => api.delete(url, config),
  
  // Upload file
  upload: (url, formData, config = {}) => {
    return api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    })
  },
  
  // Download file
  download: (url, config = {}) => {
    return api.get(url, {
      ...config,
      responseType: 'blob',
    })
  },
}

// Specific API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (resetData) => api.post('/auth/reset-password', resetData),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
}

export const examAPI = {
  getExams: (params = {}) => api.get('/exams', { params }),
  getExam: (id) => api.get(`/exams/${id}`),
  createExam: (examData) => api.post('/exams', examData),
  updateExam: (id, examData) => api.put(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
  publishExam: (id) => api.put(`/exams/${id}/publish`),
  archiveExam: (id) => api.put(`/exams/${id}/archive`),
  addQuestionsToExam: (id, questionIds) => api.put(`/exams/${id}/questions`, { questionIds }),
  getLiveExams: () => api.get('/exams/live'),
  getUpcomingExams: () => api.get('/exams/upcoming'),
  getExamStatistics: (id) => api.get(`/exams/${id}/statistics`),
  getExamResults: (id, params = {}) => api.get(`/exams/${id}/results`, { params }),
}

export const questionAPI = {
  getQuestions: (params = {}) => api.get('/questions', { params }),
  getQuestion: (id) => api.get(`/questions/${id}`),
  createQuestion: (questionData) => api.post('/questions', questionData),
  updateQuestion: (id, questionData) => api.put(`/questions/${id}`, questionData),
  deleteQuestion: (id) => api.delete(`/questions/${id}`),
  bulkUpload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/questions/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  exportQuestions: (params = {}) => api.get('/questions/export', { params }),
  getRandomQuestions: (params = {}) => api.get('/questions/random', { params }),
  getQuestionStatistics: () => api.get('/questions/statistics'),
}

export const resultAPI = {
  startExam: (examId) => api.post('/results/start', { examId }),
  submitAnswer: (resultId, answerData) => api.put(`/results/${resultId}/answer`, answerData),
  submitExam: (resultId) => api.post(`/results/${resultId}/submit`),
  autoSubmitExam: (resultId) => api.post(`/results/${resultId}/auto-submit`),
  getUserResults: (params = {}) => api.get('/results', { params }),
  getResult: (id) => api.get(`/results/${id}`),
  getExamResults: (examId, params = {}) => api.get(`/results/exam/${examId}`, { params }),
  getStudentResults: (studentId, params = {}) => api.get(`/results/student/${studentId}`, { params }),
  getTopPerformers: (params = {}) => api.get('/results/top-performers', { params }),
  getResultStatistics: (params = {}) => api.get('/results/statistics', { params }),
  reviewResult: (id, reviewData) => api.put(`/results/${id}/review`, reviewData),
}

export const userAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id) => api.put(`/users/${id}/toggle-status`),
  resetUserPassword: (id, passwordData) => api.put(`/users/${id}/reset-password`, passwordData),
  getUserStatistics: () => api.get('/users/statistics'),
  exportUsers: (params = {}) => api.get('/users/export', { params, responseType: 'blob' }),
  bulkCreateUsers: (usersData) => api.post('/users/bulk-create', usersData),
  getUserActivity: (id, params = {}) => api.get(`/users/${id}/activity`, { params }),
  getUserExams: (id, params = {}) => api.get(`/users/${id}/exams`, { params }),
  getUserResults: (id, params = {}) => api.get(`/users/${id}/results`, { params }),
}

export const studentAPI = {
  getStudents: (params = {}) => api.get('/users/students', { params }),
  getStudent: (id) => api.get(`/users/${id}`),
  createStudent: (studentData) => api.post('/users', { ...studentData, role: 'student' }),
  updateStudent: (id, studentData) => api.put(`/users/${id}`, studentData),
  deleteStudent: (id) => api.delete(`/users/${id}`),
  toggleStudentStatus: (id) => api.put(`/users/${id}/toggle-status`),
  assignExams: (id, examIds) => api.put(`/users/${id}/assign-exams`, { examIds }),
  toggleAnswerViewing: (id) => api.put(`/users/${id}/toggle-answer-viewing`),
  getStudentExamAssignments: (id) => api.get(`/users/${id}/exam-assignments`),
}

export const uploadAPI = {
  uploadSingle: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadMultiple: (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadProfilePicture: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/upload/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteFile: (publicId) => api.delete(`/upload/${publicId}`),
  getFileInfo: (publicId) => api.get(`/upload/${publicId}/info`),
}

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getExamAnalytics: (examId) => api.get(`/analytics/exam/${examId}`),
  getStudentAnalytics: (studentId) => api.get(`/analytics/student/${studentId}`),
  getStudentProgress: (studentId, params = {}) => api.get(`/analytics/student/${studentId}/progress`, { params }),
  getQuestionAnalytics: (params = {}) => api.get('/analytics/questions', { params }),
  getQuestionDifficultyAnalysis: (params = {}) => api.get('/analytics/question-difficulty', { params }),
  getPerformanceTrends: (params = {}) => api.get('/analytics/trends', { params }),
  getTimeBasedAnalytics: (params = {}) => api.get('/analytics/time-based', { params }),
  exportAnalytics: (params = {}) => api.get('/analytics/export', { params }),
  // Additional endpoints for leaderboard and subject performance
  getLeaderboard: (params = {}) => api.get('/analytics/leaderboard', { params }),
  getSubjectWisePerformance: (params = {}) => api.get('/analytics/subjects', { params }),
  getTopPerformers: (params = {}) => api.get('/analytics/leaderboard', { params }),
}

export default api
