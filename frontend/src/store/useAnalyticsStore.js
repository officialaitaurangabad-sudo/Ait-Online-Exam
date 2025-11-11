import { create } from 'zustand'
import { analyticsAPI } from '../utils/api'

const useAnalyticsStore = create((set, get) => ({
  // State
  dashboardData: null,
  studentAnalytics: null,
  examAnalytics: null,
  questionAnalytics: null,
  trends: null,
  subjectPerformance: null,
  topPerformers: null,
  loading: {
    dashboard: false,
    student: false,
    exam: false,
    question: false,
    trends: false,
    subjects: false,
    topPerformers: false,
  },
  error: null,
  lastUpdated: null,

  // Actions
  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  // Dashboard Analytics
  fetchDashboardAnalytics: async () => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('dashboard', true)
      setError(null)
      
      const response = await analyticsAPI.getDashboard()
      const data = response.data.data.analytics
      
      set({
        dashboardData: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error)
      setError(error.response?.data?.message || 'Failed to fetch dashboard analytics')
      throw error
    } finally {
      setLoading('dashboard', false)
    }
  },

  // Student Analytics
  fetchStudentAnalytics: async (studentId) => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('student', true)
      setError(null)
      
      const response = await analyticsAPI.getStudentAnalytics(studentId)
      const data = response.data.data.analytics
      
      set({
        studentAnalytics: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching student analytics:', error)
      setError(error.response?.data?.message || 'Failed to fetch student analytics')
      throw error
    } finally {
      setLoading('student', false)
    }
  },

  // Exam Analytics
  fetchExamAnalytics: async (examId) => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('exam', true)
      setError(null)
      
      const response = await analyticsAPI.getExamAnalytics(examId)
      const data = response.data.data.analytics
      
      set({
        examAnalytics: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching exam analytics:', error)
      setError(error.response?.data?.message || 'Failed to fetch exam analytics')
      throw error
    } finally {
      setLoading('exam', false)
    }
  },

  // Question Analytics
  fetchQuestionAnalytics: async (params = {}) => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('question', true)
      setError(null)
      
      const response = await analyticsAPI.getQuestionAnalytics(params)
      const data = response.data.data.analytics
      
      set({
        questionAnalytics: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching question analytics:', error)
      setError(error.response?.data?.message || 'Failed to fetch question analytics')
      throw error
    } finally {
      setLoading('question', false)
    }
  },

  // Performance Trends
  fetchPerformanceTrends: async (params = {}) => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('trends', true)
      setError(null)
      
      const response = await analyticsAPI.getPerformanceTrends(params)
      const data = response.data.data.trends
      
      set({
        trends: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching performance trends:', error)
      setError(error.response?.data?.message || 'Failed to fetch performance trends')
      throw error
    } finally {
      setLoading('trends', false)
    }
  },

  // Subject-wise Performance
  fetchSubjectWisePerformance: async (params = {}) => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('subjects', true)
      setError(null)
      
      const response = await analyticsAPI.getSubjectWisePerformance(params)
      const data = response.data.data.subjectStats
      
      set({
        subjectPerformance: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching subject-wise performance:', error)
      setError(error.response?.data?.message || 'Failed to fetch subject-wise performance')
      throw error
    } finally {
      setLoading('subjects', false)
    }
  },

  // Top Performers
  fetchTopPerformers: async (params = {}) => {
    const { setLoading, setError } = get()
    
    try {
      setLoading('topPerformers', true)
      setError(null)
      
      const response = await analyticsAPI.getTopPerformers(params)
      const data = response.data.data.leaderboard
      
      set({
        topPerformers: data,
        lastUpdated: new Date().toISOString(),
      })
      
      return data
    } catch (error) {
      console.error('Error fetching top performers:', error)
      setError(error.response?.data?.message || 'Failed to fetch top performers')
      throw error
    } finally {
      setLoading('topPerformers', false)
    }
  },

  // Refresh all analytics
  refreshAllAnalytics: async () => {
    const { fetchDashboardAnalytics, fetchSubjectWisePerformance, fetchTopPerformers, fetchPerformanceTrends } = get()
    
    try {
      await Promise.all([
        fetchDashboardAnalytics(),
        fetchSubjectWisePerformance(),
        fetchTopPerformers(),
        fetchPerformanceTrends({ timeframe: '30d' }),
      ])
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      throw error
    }
  },

  // Reset store
  reset: () => set({
    dashboardData: null,
    studentAnalytics: null,
    examAnalytics: null,
    questionAnalytics: null,
    trends: null,
    subjectPerformance: null,
    topPerformers: null,
    loading: {
      dashboard: false,
      student: false,
      exam: false,
      question: false,
      trends: false,
      subjects: false,
      topPerformers: false,
    },
    error: null,
    lastUpdated: null,
  }),
}))

export default useAnalyticsStore
