import { toast } from 'react-toastify'
import { HTTP_STATUS } from './config'

/**
 * Handle API errors and show appropriate toast messages
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default error message
 * @param {boolean} showToast - Whether to show toast notification
 * @returns {Object} Error object with formatted message
 */
export const handleError = (error, defaultMessage = 'An error occurred', showToast = true) => {
  let message = defaultMessage
  let status = null
  let errors = null

  if (error.response) {
    // Server responded with error status
    const { status: responseStatus, data } = error.response
    status = responseStatus
    message = data?.message || defaultMessage
    errors = data?.errors

    // Handle specific error cases
    switch (responseStatus) {
      case HTTP_STATUS.UNAUTHORIZED:
        if (data?.message !== 'Invalid credentials') {
          message = 'Session expired. Please login again.'
        }
        break
      case HTTP_STATUS.FORBIDDEN:
        message = 'Access denied. You do not have permission to perform this action.'
        break
      case HTTP_STATUS.NOT_FOUND:
        message = 'Resource not found.'
        break
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        if (errors) {
          // Handle validation errors
          const errorMessages = []
          Object.values(errors).forEach(errorArray => {
            if (Array.isArray(errorArray)) {
              errorArray.forEach(error => errorMessages.push(error))
            } else {
              errorMessages.push(errorArray)
            }
          })
          message = errorMessages.join(', ')
        }
        break
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        message = 'Too many requests. Please try again later.'
        break
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        message = 'Server error. Please try again later.'
        break
      default:
        if (responseStatus >= 400 && responseStatus < 500) {
          message = message || 'Client error occurred.'
        } else if (responseStatus >= 500) {
          message = 'Server error. Please try again later.'
        }
    }
  } else if (error.request) {
    // Network error
    message = 'Network error. Please check your connection.'
    status = 0
  } else {
    // Other error
    message = error.message || defaultMessage
  }

  // Show toast notification if enabled
  if (showToast) {
    toast.error(message)
  }

  return {
    message,
    status,
    errors,
    originalError: error
  }
}

/**
 * Handle form validation errors
 * @param {Object} errors - Validation errors object
 * @param {boolean} showToast - Whether to show toast notifications
 */
export const handleValidationErrors = (errors, showToast = true) => {
  if (!errors) return

  const errorMessages = []
  
  Object.entries(errors).forEach(([field, messages]) => {
    if (Array.isArray(messages)) {
      messages.forEach(message => {
        errorMessages.push(`${field}: ${message}`)
        if (showToast) {
          toast.error(`${field}: ${message}`)
        }
      })
    } else {
      errorMessages.push(`${field}: ${messages}`)
      if (showToast) {
        toast.error(`${field}: ${messages}`)
      }
    }
  })

  return errorMessages
}

/**
 * Handle success messages
 * @param {string} message - Success message
 * @param {boolean} showToast - Whether to show toast notification
 */
export const handleSuccess = (message, showToast = true) => {
  if (showToast) {
    toast.success(message)
  }
  return { message, success: true }
}

/**
 * Handle warning messages
 * @param {string} message - Warning message
 * @param {boolean} showToast - Whether to show toast notification
 */
export const handleWarning = (message, showToast = true) => {
  if (showToast) {
    toast.warning(message)
  }
  return { message, warning: true }
}

/**
 * Handle info messages
 * @param {string} message - Info message
 * @param {boolean} showToast - Whether to show toast notification
 */
export const handleInfo = (message, showToast = true) => {
  if (showToast) {
    toast.info(message)
  }
  return { message, info: true }
}

/**
 * Check if error is a network error
 * @param {Error} error - The error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.request
}

/**
 * Check if error is a server error
 * @param {Error} error - The error object
 * @returns {boolean} True if server error
 */
export const isServerError = (error) => {
  return error.response && error.response.status >= 500
}

/**
 * Check if error is a client error
 * @param {Error} error - The error object
 * @returns {boolean} True if client error
 */
export const isClientError = (error) => {
  return error.response && error.response.status >= 400 && error.response.status < 500
}

/**
 * Check if error is an authentication error
 * @param {Error} error - The error object
 * @returns {boolean} True if authentication error
 */
export const isAuthError = (error) => {
  return error.response && error.response.status === HTTP_STATUS.UNAUTHORIZED
}

/**
 * Check if error is an authorization error
 * @param {Error} error - The error object
 * @returns {boolean} True if authorization error
 */
export const isAuthorizationError = (error) => {
  return error.response && error.response.status === HTTP_STATUS.FORBIDDEN
}

/**
 * Check if error is a validation error
 * @param {Error} error - The error object
 * @returns {boolean} True if validation error
 */
export const isValidationError = (error) => {
  return error.response && error.response.status === HTTP_STATUS.UNPROCESSABLE_ENTITY
}

/**
 * Get error message from error object
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message if no message found
 * @returns {string} Error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.message) {
    return error.message
  }
  return defaultMessage
}

/**
 * Log error for debugging
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 */
export const logError = (error, context = 'Unknown') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error in ${context}`)
    console.error('Error:', error)
    console.error('Response:', error.response)
    console.error('Request:', error.request)
    console.groupEnd()
  }
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
export const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (isClientError(error) && error.response?.status !== HTTP_STATUS.TOO_MANY_REQUESTS) {
        throw error
      }
      
      // Don't retry on the last attempt
      if (i === maxRetries - 1) {
        throw error
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
  
  throw lastError
}

export default {
  handleError,
  handleValidationErrors,
  handleSuccess,
  handleWarning,
  handleInfo,
  isNetworkError,
  isServerError,
  isClientError,
  isAuthError,
  isAuthorizationError,
  isValidationError,
  getErrorMessage,
  logError,
  retryWithBackoff
}
