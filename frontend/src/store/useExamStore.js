import { create } from 'zustand'
import { examAPI, resultAPI } from '../utils/api'

const useExamStore = create((set, get) => ({
  // State
  exams: [],
  currentExam: null,
  examResults: [],
  currentResult: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all exams
  getExams: async (params = {}) => {
    console.log('useExamStore - getExams called with params:', params)
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.getExams(params)
      console.log('useExamStore - getExams response:', response.data)
      const exams = response.data.data.exams
      console.log('useExamStore - getExams exams:', exams)
      set({ exams, isLoading: false })
      return { success: true, exams }
    } catch (error) {
      console.error('useExamStore - getExams error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to fetch exams'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get single exam
  getExam: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.getExam(id)
      const exam = response.data.data.exam
      set({ currentExam: exam, isLoading: false })
      return { success: true, exam }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Create exam
  createExam: async (examData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.createExam(examData)
      const exam = response.data.data.exam
      set(state => ({ 
        exams: [...state.exams, exam], 
        isLoading: false 
      }))
      return { success: true, exam }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Update exam
  updateExam: async (id, examData) => {
    console.log('useExamStore - updateExam called with:', { id, examData })
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.updateExam(id, examData)
      console.log('useExamStore - updateExam response:', response.data)
      const exam = response.data.data.exam
      console.log('useExamStore - Updated exam:', exam)
      
      set(state => {
        const updatedExams = state.exams.map(e => e._id === id ? exam : e)
        console.log('useExamStore - Updated exams list:', updatedExams)
        return {
          exams: updatedExams,
          currentExam: state.currentExam?._id === id ? exam : state.currentExam,
          isLoading: false
        }
      })
      return { success: true, exam }
    } catch (error) {
      console.error('useExamStore - updateExam error:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Delete exam
  deleteExam: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await examAPI.deleteExam(id)
      set(state => ({
        exams: state.exams.filter(e => e._id !== id),
        currentExam: state.currentExam?._id === id ? null : state.currentExam,
        isLoading: false
      }))
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Publish exam
  publishExam: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.publishExam(id)
      const exam = response.data.data.exam
      set(state => ({
        exams: state.exams.map(e => e._id === id ? exam : e),
        currentExam: state.currentExam?._id === id ? exam : state.currentExam,
        isLoading: false
      }))
      return { success: true, exam }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to publish exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Archive exam
  archiveExam: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.archiveExam(id)
      const exam = response.data.data.exam
      set(state => ({
        exams: state.exams.map(e => e._id === id ? exam : e),
        currentExam: state.currentExam?._id === id ? exam : state.currentExam,
        isLoading: false
      }))
      return { success: true, exam }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to archive exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get live exams
  getLiveExams: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.getLiveExams()
      const exams = response.data.data.exams
      set({ exams, isLoading: false })
      return { success: true, exams }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch live exams'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get upcoming exams
  getUpcomingExams: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await examAPI.getUpcomingExams()
      const exams = response.data.data.exams
      set({ exams, isLoading: false })
      return { success: true, exams }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch upcoming exams'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Start exam
  startExam: async (examId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.startExam(examId)
      const result = response.data.data.result
      set({ currentResult: result, isLoading: false })
      return { success: true, result }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to start exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Submit answer
  submitAnswer: async (resultId, answerData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.submitAnswer(resultId, answerData)
      const { answer, result } = response.data.data
      console.log('Submit answer response:', { answer, result })
      set({ currentResult: result, isLoading: false })
      return { success: true, result, answer }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit answer'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Submit exam
  submitExam: async (resultId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.submitExam(resultId)
      const result = response.data.data.result
      set({ currentResult: result, isLoading: false })
      return { success: true, result }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Auto submit exam
  autoSubmitExam: async (resultId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.autoSubmitExam(resultId)
      const result = response.data.data.result
      set({ currentResult: result, isLoading: false })
      return { success: true, result }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to auto submit exam'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get user results
  getUserResults: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.getUserResults(params)
      const results = response.data.data.results
      set({ examResults: results, isLoading: false })
      return { success: true, results }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch results'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get single result
  getResult: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.getResult(id)
      const result = response.data.data.result
      set({ currentResult: result, isLoading: false })
      return { success: true, result }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch result'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get exam results
  getExamResults: async (examId, params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.getExamResults(examId, params)
      const results = response.data.data.results
      set({ examResults: results, isLoading: false })
      return { success: true, results }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch exam results'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get top performers
  getTopPerformers: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.getTopPerformers(params)
      const performers = response.data.data.performers
      set({ isLoading: false })
      return { success: true, performers }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch top performers'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Get result statistics
  getResultStatistics: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await resultAPI.getResultStatistics(params)
      const statistics = response.data.data.statistics
      set({ isLoading: false })
      return { success: true, statistics }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch statistics'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  // Clear current exam
  clearCurrentExam: () => set({ currentExam: null }),

  // Clear current result
  clearCurrentResult: () => set({ currentResult: null }),

  // Clear all data
  clearAll: () => set({
    exams: [],
    currentExam: null,
    examResults: [],
    currentResult: null,
    error: null
  })
}))

export default useExamStore
