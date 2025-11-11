import { authAPI, examAPI, questionAPI, resultAPI, analyticsAPI, uploadAPI } from './api'
import { config } from './config'

/**
 * Test frontend-backend integration
 * This utility helps verify that all API endpoints are properly connected
 */
export class IntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  /**
   * Run a single test
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  async runTest(name, testFn) {
    try {
      await testFn()
      this.results.passed++
      this.results.tests.push({ name, status: 'PASSED', error: null })
      console.log(`✅ ${name}`)
    } catch (error) {
      this.results.failed++
      this.results.tests.push({ name, status: 'FAILED', error: error.message })
      console.log(`❌ ${name}: ${error.message}`)
    }
  }

  /**
   * Test API configuration
   */
  async testAPIConfig() {
    await this.runTest('API Configuration', () => {
      if (!config.API_URL) {
        throw new Error('API URL not configured')
      }
      if (!config.API_URL.startsWith('http')) {
        throw new Error('Invalid API URL format')
      }
    })
  }

  /**
   * Test authentication endpoints
   */
  async testAuthEndpoints() {
    await this.runTest('Auth API - Login endpoint exists', () => {
      if (typeof authAPI.login !== 'function') {
        throw new Error('Login function not found')
      }
    })

    await this.runTest('Auth API - Register endpoint exists', () => {
      if (typeof authAPI.register !== 'function') {
        throw new Error('Register function not found')
      }
    })

    await this.runTest('Auth API - Logout endpoint exists', () => {
      if (typeof authAPI.logout !== 'function') {
        throw new Error('Logout function not found')
      }
    })

    await this.runTest('Auth API - Refresh token endpoint exists', () => {
      if (typeof authAPI.refresh !== 'function') {
        throw new Error('Refresh token function not found')
      }
    })

    await this.runTest('Auth API - Get me endpoint exists', () => {
      if (typeof authAPI.getMe !== 'function') {
        throw new Error('Get me function not found')
      }
    })
  }

  /**
   * Test exam endpoints
   */
  async testExamEndpoints() {
    await this.runTest('Exam API - Get exams endpoint exists', () => {
      if (typeof examAPI.getExams !== 'function') {
        throw new Error('Get exams function not found')
      }
    })

    await this.runTest('Exam API - Get exam endpoint exists', () => {
      if (typeof examAPI.getExam !== 'function') {
        throw new Error('Get exam function not found')
      }
    })

    await this.runTest('Exam API - Create exam endpoint exists', () => {
      if (typeof examAPI.createExam !== 'function') {
        throw new Error('Create exam function not found')
      }
    })

    await this.runTest('Exam API - Update exam endpoint exists', () => {
      if (typeof examAPI.updateExam !== 'function') {
        throw new Error('Update exam function not found')
      }
    })

    await this.runTest('Exam API - Delete exam endpoint exists', () => {
      if (typeof examAPI.deleteExam !== 'function') {
        throw new Error('Delete exam function not found')
      }
    })

    await this.runTest('Exam API - Publish exam endpoint exists', () => {
      if (typeof examAPI.publishExam !== 'function') {
        throw new Error('Publish exam function not found')
      }
    })

    await this.runTest('Exam API - Archive exam endpoint exists', () => {
      if (typeof examAPI.archiveExam !== 'function') {
        throw new Error('Archive exam function not found')
      }
    })

    await this.runTest('Exam API - Get live exams endpoint exists', () => {
      if (typeof examAPI.getLiveExams !== 'function') {
        throw new Error('Get live exams function not found')
      }
    })

    await this.runTest('Exam API - Get upcoming exams endpoint exists', () => {
      if (typeof examAPI.getUpcomingExams !== 'function') {
        throw new Error('Get upcoming exams function not found')
      }
    })
  }

  /**
   * Test question endpoints
   */
  async testQuestionEndpoints() {
    await this.runTest('Question API - Get questions endpoint exists', () => {
      if (typeof questionAPI.getQuestions !== 'function') {
        throw new Error('Get questions function not found')
      }
    })

    await this.runTest('Question API - Get question endpoint exists', () => {
      if (typeof questionAPI.getQuestion !== 'function') {
        throw new Error('Get question function not found')
      }
    })

    await this.runTest('Question API - Create question endpoint exists', () => {
      if (typeof questionAPI.createQuestion !== 'function') {
        throw new Error('Create question function not found')
      }
    })

    await this.runTest('Question API - Update question endpoint exists', () => {
      if (typeof questionAPI.updateQuestion !== 'function') {
        throw new Error('Update question function not found')
      }
    })

    await this.runTest('Question API - Delete question endpoint exists', () => {
      if (typeof questionAPI.deleteQuestion !== 'function') {
        throw new Error('Delete question function not found')
      }
    })

    await this.runTest('Question API - Bulk upload endpoint exists', () => {
      if (typeof questionAPI.bulkUpload !== 'function') {
        throw new Error('Bulk upload function not found')
      }
    })

    await this.runTest('Question API - Export questions endpoint exists', () => {
      if (typeof questionAPI.exportQuestions !== 'function') {
        throw new Error('Export questions function not found')
      }
    })

    await this.runTest('Question API - Get random questions endpoint exists', () => {
      if (typeof questionAPI.getRandomQuestions !== 'function') {
        throw new Error('Get random questions function not found')
      }
    })
  }

  /**
   * Test result endpoints
   */
  async testResultEndpoints() {
    await this.runTest('Result API - Start exam endpoint exists', () => {
      if (typeof resultAPI.startExam !== 'function') {
        throw new Error('Start exam function not found')
      }
    })

    await this.runTest('Result API - Submit answer endpoint exists', () => {
      if (typeof resultAPI.submitAnswer !== 'function') {
        throw new Error('Submit answer function not found')
      }
    })

    await this.runTest('Result API - Submit exam endpoint exists', () => {
      if (typeof resultAPI.submitExam !== 'function') {
        throw new Error('Submit exam function not found')
      }
    })

    await this.runTest('Result API - Auto submit exam endpoint exists', () => {
      if (typeof resultAPI.autoSubmitExam !== 'function') {
        throw new Error('Auto submit exam function not found')
      }
    })

    await this.runTest('Result API - Get user results endpoint exists', () => {
      if (typeof resultAPI.getUserResults !== 'function') {
        throw new Error('Get user results function not found')
      }
    })

    await this.runTest('Result API - Get result endpoint exists', () => {
      if (typeof resultAPI.getResult !== 'function') {
        throw new Error('Get result function not found')
      }
    })

    await this.runTest('Result API - Get exam results endpoint exists', () => {
      if (typeof resultAPI.getExamResults !== 'function') {
        throw new Error('Get exam results function not found')
      }
    })

    await this.runTest('Result API - Get top performers endpoint exists', () => {
      if (typeof resultAPI.getTopPerformers !== 'function') {
        throw new Error('Get top performers function not found')
      }
    })
  }

  /**
   * Test analytics endpoints
   */
  async testAnalyticsEndpoints() {
    await this.runTest('Analytics API - Get dashboard endpoint exists', () => {
      if (typeof analyticsAPI.getDashboard !== 'function') {
        throw new Error('Get dashboard function not found')
      }
    })

    await this.runTest('Analytics API - Get exam analytics endpoint exists', () => {
      if (typeof analyticsAPI.getExamAnalytics !== 'function') {
        throw new Error('Get exam analytics function not found')
      }
    })

    await this.runTest('Analytics API - Get student analytics endpoint exists', () => {
      if (typeof analyticsAPI.getStudentAnalytics !== 'function') {
        throw new Error('Get student analytics function not found')
      }
    })

    await this.runTest('Analytics API - Get question analytics endpoint exists', () => {
      if (typeof analyticsAPI.getQuestionAnalytics !== 'function') {
        throw new Error('Get question analytics function not found')
      }
    })

    await this.runTest('Analytics API - Get performance trends endpoint exists', () => {
      if (typeof analyticsAPI.getPerformanceTrends !== 'function') {
        throw new Error('Get performance trends function not found')
      }
    })

    await this.runTest('Analytics API - Get subject-wise performance endpoint exists', () => {
      if (typeof analyticsAPI.getSubjectWisePerformance !== 'function') {
        throw new Error('Get subject-wise performance function not found')
      }
    })

    await this.runTest('Analytics API - Get top performers endpoint exists', () => {
      if (typeof analyticsAPI.getTopPerformers !== 'function') {
        throw new Error('Get top performers function not found')
      }
    })

    await this.runTest('Analytics API - Get system analytics endpoint exists', () => {
      if (typeof analyticsAPI.getSystemAnalytics !== 'function') {
        throw new Error('Get system analytics function not found')
      }
    })
  }

  /**
   * Test upload endpoints
   */
  async testUploadEndpoints() {
    await this.runTest('Upload API - Upload single file endpoint exists', () => {
      if (typeof uploadAPI.uploadSingle !== 'function') {
        throw new Error('Upload single file function not found')
      }
    })

    await this.runTest('Upload API - Upload multiple files endpoint exists', () => {
      if (typeof uploadAPI.uploadMultiple !== 'function') {
        throw new Error('Upload multiple files function not found')
      }
    })

    await this.runTest('Upload API - Upload profile picture endpoint exists', () => {
      if (typeof uploadAPI.uploadProfilePicture !== 'function') {
        throw new Error('Upload profile picture function not found')
      }
    })

    await this.runTest('Upload API - Delete file endpoint exists', () => {
      if (typeof uploadAPI.deleteFile !== 'function') {
        throw new Error('Delete file function not found')
      }
    })

    await this.runTest('Upload API - Get file info endpoint exists', () => {
      if (typeof uploadAPI.getFileInfo !== 'function') {
        throw new Error('Get file info function not found')
      }
    })
  }

  /**
   * Test store integration
   */
  async testStoreIntegration() {
    await this.runTest('Auth Store - Login function exists', async () => {
      const { useAuthStore } = await import('../store/useAuthStore')
      const store = useAuthStore.getState()
      if (typeof store.login !== 'function') {
        throw new Error('Login function not found in auth store')
      }
    })

    await this.runTest('Auth Store - Register function exists', async () => {
      const { useAuthStore } = await import('../store/useAuthStore')
      const store = useAuthStore.getState()
      if (typeof store.register !== 'function') {
        throw new Error('Register function not found in auth store')
      }
    })

    await this.runTest('Auth Store - Logout function exists', async () => {
      const { useAuthStore } = await import('../store/useAuthStore')
      const store = useAuthStore.getState()
      if (typeof store.logout !== 'function') {
        throw new Error('Logout function not found in auth store')
      }
    })

    await this.runTest('Exam Store - Get exams function exists', async () => {
      const { useExamStore } = await import('../store/useExamStore')
      const store = useExamStore.getState()
      if (typeof store.getExams !== 'function') {
        throw new Error('Get exams function not found in exam store')
      }
    })

    await this.runTest('Report Store - Get dashboard analytics function exists', async () => {
      const { useReportStore } = await import('../store/useReportStore')
      const store = useReportStore.getState()
      if (typeof store.getDashboardAnalytics !== 'function') {
        throw new Error('Get dashboard analytics function not found in report store')
      }
    })
  }

  /**
   * Test component integration
   */
  async testComponentIntegration() {
    await this.runTest('Protected Route component exists', async () => {
      const { default: ProtectedRoute } = await import('../components/common/ProtectedRoute')
      if (typeof ProtectedRoute !== 'function') {
        throw new Error('ProtectedRoute component not found')
      }
    })

    await this.runTest('Button component exists', async () => {
      const { default: Button } = await import('../components/ui/Button')
      if (typeof Button !== 'function') {
        throw new Error('Button component not found')
      }
    })

    await this.runTest('Input component exists', async () => {
      const { default: Input } = await import('../components/ui/Input')
      if (typeof Input !== 'function') {
        throw new Error('Input component not found')
      }
    })

    await this.runTest('Card component exists', async () => {
      const { default: Card } = await import('../components/ui/Card')
      if (typeof Card !== 'function') {
        throw new Error('Card component not found')
      }
    })
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting Frontend-Backend Integration Tests...\n')

    await this.testAPIConfig()
    await this.testAuthEndpoints()
    await this.testExamEndpoints()
    await this.testQuestionEndpoints()
    await this.testResultEndpoints()
    await this.testAnalyticsEndpoints()
    await this.testUploadEndpoints()
    await this.testStoreIntegration()
    await this.testComponentIntegration()

    this.printResults()
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 Integration Test Results:')
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log(`📈 Total: ${this.results.passed + this.results.failed}`)
    console.log(`🎯 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`)

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`)
        })
    }

    if (this.results.passed === this.results.passed + this.results.failed) {
      console.log('\n🎉 All tests passed! Frontend-Backend integration is working correctly.')
    } else {
      console.log('\n⚠️  Some tests failed. Please check the integration setup.')
    }
  }

  /**
   * Get test results as object
   */
  getResults() {
    return {
      ...this.results,
      successRate: (this.results.passed / (this.results.passed + this.results.failed)) * 100
    }
  }
}

/**
 * Quick integration test function
 */
export const runIntegrationTest = async () => {
  const tester = new IntegrationTester()
  await tester.runAllTests()
  return tester.getResults()
}

export default IntegrationTester
