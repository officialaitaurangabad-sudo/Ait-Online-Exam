import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { questionAPI } from '../utils/api'
import { toast } from 'react-toastify'

const useQuestionStore = create(
  persist(
    (set, get) => ({
      // State
      questions: [],
      currentQuestions: [],
      isLoading: false,
      error: null,
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: 10,
      filters: {
        search: '',
        subject: '',
        questionType: '',
        difficulty: '',
        isActive: true
      },

      // Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }))
        get().fetchQuestions()
      },

      setPagination: (page, limit) => {
        set({ currentPage: page, itemsPerPage: limit })
        get().fetchQuestions()
      },

      fetchQuestions: async (params = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const { filters, currentPage, itemsPerPage } = get()
          const queryParams = {
            page: currentPage,
            limit: itemsPerPage,
            ...filters,
            ...params
          }

          // Remove empty filters
          Object.keys(queryParams).forEach(key => {
            if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
              delete queryParams[key]
            }
          })

          const response = await questionAPI.getQuestions(queryParams)
          
          if (response.data.success) {
            const { questions, pagination } = response.data.data
            set({
              questions,
              currentQuestions: questions,
              totalItems: pagination.totalItems,
              totalPages: pagination.totalPages,
              isLoading: false,
              error: null
            })
          } else {
            throw new Error(response.data.message || 'Failed to fetch questions')
          }
        } catch (error) {
          console.error('Error fetching questions:', error)
          set({
            error: error.response?.data?.message || error.message || 'Failed to fetch questions',
            isLoading: false
          })
          toast.error('Failed to fetch questions')
        }
      },

      getQuestion: async (id) => {
        try {
          const response = await questionAPI.getQuestion(id)
          if (response.data.success) {
            return response.data.data.question
          } else {
            throw new Error(response.data.message || 'Failed to fetch question')
          }
        } catch (error) {
          console.error('Error fetching question:', error)
          toast.error('Failed to fetch question')
          throw error
        }
      },

      createQuestion: async (questionData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await questionAPI.createQuestion(questionData)
          
          if (response.data.success) {
            toast.success('Question created successfully!')
            get().fetchQuestions() // Refresh the list
            return { success: true, data: response.data.data.question }
          } else {
            throw new Error(response.data.message || 'Failed to create question')
          }
        } catch (error) {
          console.error('Error creating question:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Failed to create question'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      updateQuestion: async (id, questionData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await questionAPI.updateQuestion(id, questionData)
          
          if (response.data.success) {
            toast.success('Question updated successfully!')
            get().fetchQuestions() // Refresh the list
            return { success: true, data: response.data.data.question }
          } else {
            throw new Error(response.data.message || 'Failed to update question')
          }
        } catch (error) {
          console.error('Error updating question:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Failed to update question'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      deleteQuestion: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await questionAPI.deleteQuestion(id)
          
          if (response.data.success) {
            toast.success('Question deleted successfully!')
            get().fetchQuestions() // Refresh the list
            return { success: true }
          } else {
            throw new Error(response.data.message || 'Failed to delete question')
          }
        } catch (error) {
          console.error('Error deleting question:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Failed to delete question'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      bulkUploadQuestions: async (file) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await questionAPI.bulkUpload(file)
          
          if (response.data.success) {
            toast.success('Questions uploaded successfully!')
            get().fetchQuestions() // Refresh the list
            return { success: true, data: response.data.data }
          } else {
            throw new Error(response.data.message || 'Failed to upload questions')
          }
        } catch (error) {
          console.error('Error uploading questions:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Failed to upload questions'
          set({ error: errorMessage, isLoading: false })
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      exportQuestions: async (params = {}) => {
        try {
          const { filters } = get()
          const queryParams = {
            ...filters,
            ...params
          }

          // Remove empty filters
          Object.keys(queryParams).forEach(key => {
            if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined) {
              delete queryParams[key]
            }
          })

          const response = await questionAPI.exportQuestions(queryParams)
          
          if (response.data.success) {
            // Handle file download
            const blob = new Blob([response.data], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `questions-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            
            toast.success('Questions exported successfully!')
            return { success: true }
          } else {
            throw new Error(response.data.message || 'Failed to export questions')
          }
        } catch (error) {
          console.error('Error exporting questions:', error)
          const errorMessage = error.response?.data?.message || error.message || 'Failed to export questions'
          toast.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      getQuestionStatistics: async () => {
        try {
          const response = await questionAPI.getQuestionStatistics()
          
          if (response.data.success) {
            return response.data.data
          } else {
            throw new Error(response.data.message || 'Failed to fetch statistics')
          }
        } catch (error) {
          console.error('Error fetching question statistics:', error)
          toast.error('Failed to fetch question statistics')
          throw error
        }
      },

      clearError: () => set({ error: null }),

      resetFilters: () => {
        set({
          filters: {
            search: '',
            subject: '',
            questionType: '',
            difficulty: '',
            isActive: true
          },
          currentPage: 1
        })
        get().fetchQuestions()
      }
    }),
    {
      name: 'question-store',
      partialize: (state) => ({
        filters: state.filters,
        currentPage: state.currentPage,
        itemsPerPage: state.itemsPerPage
      })
    }
  )
)

export default useQuestionStore
