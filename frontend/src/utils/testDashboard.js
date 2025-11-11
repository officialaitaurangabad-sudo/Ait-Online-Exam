// Test script for dashboard functionality
import { analyticsAPI } from './api'

export const testDashboardIntegration = async () => {
  console.log('🧪 Testing Dashboard Integration...')
  
  try {
    // Test 1: Dashboard Analytics API
    console.log('📊 Testing Dashboard Analytics API...')
    const dashboardResponse = await analyticsAPI.getDashboard()
    console.log('✅ Dashboard Analytics:', dashboardResponse.data)
    
    // Test 2: Student Analytics API (if user ID is available)
    const testStudentId = '507f1f77bcf86cd799439011' // Example ObjectId
    console.log('👨‍🎓 Testing Student Analytics API...')
    try {
      const studentResponse = await analyticsAPI.getStudentAnalytics(testStudentId)
      console.log('✅ Student Analytics:', studentResponse.data)
    } catch (error) {
      console.log('⚠️ Student Analytics (expected to fail with test ID):', error.response?.status)
    }
    
    // Test 3: Performance Trends
    console.log('📈 Testing Performance Trends API...')
    const trendsResponse = await analyticsAPI.getPerformanceTrends({ timeframe: '30d' })
    console.log('✅ Performance Trends:', trendsResponse.data)
    
    // Test 4: Subject-wise Performance
    console.log('📚 Testing Subject-wise Performance API...')
    const subjectResponse = await analyticsAPI.getSubjectWisePerformance()
    console.log('✅ Subject-wise Performance:', subjectResponse.data)
    
    console.log('🎉 All dashboard API tests completed successfully!')
    return { success: true, message: 'Dashboard integration test passed' }
    
  } catch (error) {
    console.error('❌ Dashboard integration test failed:', error)
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    }
  }
}

// Test dashboard data structure
export const validateDashboardData = (data) => {
  const requiredFields = {
    dashboard: ['overview', 'recentActivity', 'topPerformers', 'examStats'],
    student: ['totalExams', 'averagePercentage', 'subjectPerformance', 'recentPerformance']
  }
  
  const errors = []
  
  // Validate dashboard analytics structure
  if (data.dashboardAnalytics) {
    const dashboard = data.dashboardAnalytics
    requiredFields.dashboard.forEach(field => {
      if (!dashboard[field]) {
        errors.push(`Missing dashboard field: ${field}`)
      }
    })
  }
  
  // Validate student analytics structure
  if (data.studentAnalytics) {
    const student = data.studentAnalytics
    requiredFields.student.forEach(field => {
      if (student[field] === undefined || student[field] === null) {
        errors.push(`Missing student field: ${field}`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to format dashboard data for display
export const formatDashboardData = (data) => {
  if (!data) return null
  
  return {
    overview: {
      totalUsers: data.overview?.totalUsers || 0,
      totalExams: data.overview?.totalExams || 0,
      totalQuestions: data.overview?.totalQuestions || 0,
      totalResults: data.overview?.totalResults || 0,
      passRate: Math.round(data.overview?.passRate || 0),
      averageScore: Math.round(data.overview?.averageScore || 0)
    },
    recentActivity: data.recentActivity?.slice(0, 10) || [],
    topPerformers: data.topPerformers?.slice(0, 5) || [],
    examStats: data.examStats || []
  }
}

// Helper function to format student data for display
export const formatStudentData = (data) => {
  if (!data) return null
  
  return {
    totalExams: data.totalExams || 0,
    averagePercentage: Math.round(data.averagePercentage || 0),
    passRate: Math.round(data.passRate || 0),
    improvement: Math.round(data.improvement || 0),
    subjectPerformance: data.subjectPerformance || {},
    recentPerformance: data.recentPerformance?.slice(0, 5) || [],
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || []
  }
}

export default {
  testDashboardIntegration,
  validateDashboardData,
  formatDashboardData,
  formatStudentData
}
