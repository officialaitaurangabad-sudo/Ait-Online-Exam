import { create } from 'zustand'
import { analyticsAPI } from '../utils/api'

const useReportStore = create((set, get) => ({
  // State
  dashboardAnalytics: null,
  examAnalytics: null,
  studentAnalytics: null,
  questionAnalytics: null,
  performanceTrends: null,
  subjectWisePerformance: null,
  topPerformers: null,
  systemAnalytics: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get dashboard analytics
  getDashboardAnalytics: async () => {
    set({ isLoading: true, error: null })
    try {
      console.log('useReportStore - Calling analyticsAPI.getDashboard()')
      const response = await analyticsAPI.getDashboard()
      console.log('useReportStore - Dashboard response:', response.data)
      const analytics = response.data.data.analytics
      set({ dashboardAnalytics: analytics, isLoading: false })
      return { success: true, analytics }
    } catch (error) {
      console.error('useReportStore - Dashboard analytics error:', error)
      console.error('useReportStore - Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        data: error.response?.data
      })
      const errorMessage = error.response?.data?.message || 'Failed to fetch dashboard analytics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get exam analytics
  getExamAnalytics: async (examId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getExamAnalytics(examId)
      const analytics = response.data.data.analytics
      set({ examAnalytics: analytics, isLoading: false })
      return { success: true, analytics }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch exam analytics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get exam statistics
  getExamStatistics: async (examId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getExamStatistics(examId)
      const statistics = response.data.data.statistics
      set({ examAnalytics: statistics, isLoading: false })
      return { success: true, statistics }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch exam statistics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get student analytics
  getStudentAnalytics: async (studentId) => {
    console.log('useReportStore - getStudentAnalytics called with studentId:', studentId)
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getStudentAnalytics(studentId)
      console.log('useReportStore - getStudentAnalytics response:', response.data)
      const analytics = response.data.data.analytics
      set({ studentAnalytics: analytics, isLoading: false })
      return { success: true, analytics }
    } catch (error) {
      console.error('useReportStore - getStudentAnalytics error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to fetch student analytics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get student progress
  getStudentProgress: async (studentId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getStudentProgress(studentId)
      const progress = response.data.data.progress
      set({ studentAnalytics: progress, isLoading: false })
      return { success: true, progress }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch student progress'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get question analytics
  getQuestionAnalytics: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getQuestionAnalytics(params)
      const analytics = response.data.data.analytics
      set({ questionAnalytics: analytics, isLoading: false })
      return { success: true, analytics }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch question analytics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get performance trends
  getPerformanceTrends: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getPerformanceTrends(params)
      const trends = response.data.data.trends
      set({ performanceTrends: trends, isLoading: false })
      return { success: true, trends }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch performance trends'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get subject-wise performance
  getSubjectWisePerformance: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getSubjectWisePerformance(params)
      const performance = response.data.data.performance
      set({ subjectWisePerformance: performance, isLoading: false })
      return { success: true, performance }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch subject-wise performance'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get top performers
  getTopPerformers: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getTopPerformers(params)
      const performers = response.data.data.performers
      set({ topPerformers: performers, isLoading: false })
      return { success: true, performers }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch top performers'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get system analytics
  getSystemAnalytics: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await analyticsAPI.getSystemAnalytics()
      const analytics = response.data.data.analytics
      set({ systemAnalytics: analytics, isLoading: false })
      return { success: true, analytics }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch system analytics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Clear specific analytics
  clearDashboardAnalytics: () => set({ dashboardAnalytics: null }),
  clearExamAnalytics: () => set({ examAnalytics: null }),
  clearStudentAnalytics: () => set({ studentAnalytics: null }),
  clearQuestionAnalytics: () => set({ questionAnalytics: null }),
  clearPerformanceTrends: () => set({ performanceTrends: null }),
  clearSubjectWisePerformance: () => set({ subjectWisePerformance: null }),
  clearTopPerformers: () => set({ topPerformers: null }),
  clearSystemAnalytics: () => set({ systemAnalytics: null }),

  // Clear all analytics
  clearAll: () => set({
    dashboardAnalytics: null,
    examAnalytics: null,
    studentAnalytics: null,
    questionAnalytics: null,
    performanceTrends: null,
    subjectWisePerformance: null,
    topPerformers: null,
    systemAnalytics: null,
    error: null
  })
}))

export default useReportStore
