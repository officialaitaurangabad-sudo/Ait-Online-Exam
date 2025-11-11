import { runIntegrationTest } from './testIntegration'
import { config } from './config'

/**
 * Development tools for testing and debugging
 */
export class DevTools {
  constructor() {
    this.isDevelopment = config.IS_DEVELOPMENT
    this.debugMode = config.DEBUG_MODE
  }

  /**
   * Log debug information
   * @param {string} message - Debug message
   * @param {any} data - Data to log
   */
  log(message, data = null) {
    if (this.isDevelopment && this.debugMode) {
      console.group(`🔍 ${message}`)
      if (data) {
        console.log(data)
      }
      console.groupEnd()
    }
  }

  /**
   * Log API call
   * @param {string} method - HTTP method
   * @param {string} url - API URL
   * @param {any} data - Request data
   * @param {any} response - Response data
   */
  logAPICall(method, url, data = null, response = null) {
    if (this.isDevelopment && this.debugMode) {
      console.group(`🌐 API Call: ${method} ${url}`)
      if (data) {
        console.log('Request:', data)
      }
      if (response) {
        console.log('Response:', response)
      }
      console.groupEnd()
    }
  }

  /**
   * Log error
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  logError(error, context = 'Unknown') {
    if (this.isDevelopment) {
      console.group(`🚨 Error in ${context}`)
      console.error('Error:', error)
      console.error('Stack:', error.stack)
      console.groupEnd()
    }
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} startTime - Start time
   * @param {number} endTime - End time
   */
  logPerformance(operation, startTime, endTime) {
    if (this.isDevelopment && this.debugMode) {
      const duration = endTime - startTime
      console.log(`⏱️  ${operation}: ${duration}ms`)
    }
  }

  /**
   * Test API connectivity
   */
  async testAPIConnectivity() {
    if (!this.isDevelopment) return

    console.log('🔗 Testing API connectivity...')
    
    try {
      const response = await fetch(`${config.API_URL.replace('/api', '')}/health`)
      if (response.ok) {
        const data = await response.json()
        console.log('✅ API is reachable:', data)
        return true
      } else {
        console.log('❌ API returned error:', response.status)
        return false
      }
    } catch (error) {
      console.log('❌ API connectivity test failed:', error.message)
      return false
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    if (!this.isDevelopment) return

    console.log('🧪 Running integration tests...')
    const results = await runIntegrationTest()
    
    if (results.successRate === 100) {
      console.log('🎉 All integration tests passed!')
    } else {
      console.log(`⚠️  Integration tests completed with ${results.successRate.toFixed(1)}% success rate`)
    }
    
    return results
  }

  /**
   * Check environment configuration
   */
  checkEnvironment() {
    if (!this.isDevelopment) return

    console.log('🔧 Environment Configuration:')
    console.log('  API URL:', config.API_URL)
    console.log('  App Name:', config.APP_NAME)
    console.log('  Environment:', config.NODE_ENV)
    console.log('  Debug Mode:', config.DEBUG_MODE)
    console.log('  Analytics Enabled:', config.ENABLE_ANALYTICS)
    console.log('  Notifications Enabled:', config.ENABLE_NOTIFICATIONS)
    console.log('  Dark Mode Enabled:', config.ENABLE_DARK_MODE)
  }

  /**
   * Monitor API performance
   * @param {Function} apiCall - API call function
   * @param {string} operation - Operation name
   */
  async monitorAPIPerformance(apiCall, operation) {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const endTime = performance.now()
      this.logPerformance(operation, startTime, endTime)
      return result
    } catch (error) {
      const endTime = performance.now()
      this.logPerformance(`${operation} (failed)`, startTime, endTime)
      throw error
    }
  }

  /**
   * Simulate network conditions
   * @param {number} delay - Delay in milliseconds
   * @param {number} failureRate - Failure rate (0-1)
   */
  simulateNetworkConditions(delay = 0, failureRate = 0) {
    if (!this.isDevelopment) return

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < failureRate) {
          reject(new Error('Simulated network failure'))
        } else {
          resolve()
        }
      }, delay)
    })
  }

  /**
   * Generate test data
   * @param {string} type - Data type
   * @param {number} count - Number of items
   */
  generateTestData(type, count = 1) {
    if (!this.isDevelopment) return

    const generators = {
      user: () => ({
        firstName: `Test${Math.random().toString(36).substr(2, 5)}`,
        lastName: `User${Math.random().toString(36).substr(2, 5)}`,
        email: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
        password: 'Test123!',
        role: 'student'
      }),
      exam: () => ({
        title: `Test Exam ${Math.random().toString(36).substr(2, 5)}`,
        description: 'This is a test exam',
        subject: 'Mathematics',
        category: 'Practice',
        duration: 60,
        totalQuestions: 10,
        totalMarks: 100,
        passingMarks: 50,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }),
      question: () => ({
        questionText: `Test question ${Math.random().toString(36).substr(2, 5)}?`,
        questionType: 'multiple-choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        marks: 10,
        difficulty: 'medium',
        subject: 'Mathematics'
      })
    }

    const generator = generators[type]
    if (!generator) {
      throw new Error(`Unknown test data type: ${type}`)
    }

    if (count === 1) {
      return generator()
    } else {
      return Array.from({ length: count }, generator)
    }
  }

  /**
   * Clear all local storage
   */
  clearStorage() {
    if (!this.isDevelopment) return

    localStorage.clear()
    sessionStorage.clear()
    console.log('🗑️  All local storage cleared')
  }

  /**
   * Export application state
   */
  exportState() {
    if (!this.isDevelopment) return

    const state = {
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `app-state-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    console.log('📤 Application state exported')
  }

  /**
   * Import application state
   * @param {File} file - State file
   */
  async importState(file) {
    if (!this.isDevelopment) return

    try {
      const text = await file.text()
      const state = JSON.parse(text)

      if (state.localStorage) {
        Object.entries(state.localStorage).forEach(([key, value]) => {
          localStorage.setItem(key, value)
        })
      }

      if (state.sessionStorage) {
        Object.entries(state.sessionStorage).forEach(([key, value]) => {
          sessionStorage.setItem(key, value)
        })
      }

      console.log('📥 Application state imported')
    } catch (error) {
      console.error('❌ Failed to import state:', error)
    }
  }
}

// Create global instance for development
const devTools = new DevTools()

// Make available globally in development
if (config.IS_DEVELOPMENT) {
  window.devTools = devTools
  window.runIntegrationTest = runIntegrationTest
}

export default devTools
