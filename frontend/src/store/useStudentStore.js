import { create } from 'zustand'
import { studentAPI } from '../utils/api'
import { toast } from 'react-toastify'

const useStudentStore = create((set, get) => ({
  // State
  students: [],
  currentStudent: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  },

  // Actions
  // Get all students
  fetchStudents: async (params = {}) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.getStudents(params)
      const { students, pagination } = response.data.data
      
      set({ 
        students, 
        pagination,
        isLoading: false 
      })
      
      return { students, pagination }
    } catch (error) {
      console.error('Error fetching students:', error)
      const errorMessage = error.response?.data?.message || 'Failed to fetch students'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Get single student
  getStudent: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.getStudent(id)
      const student = response.data.data
      set({ currentStudent: student, isLoading: false })
      return student
    } catch (error) {
      console.error('Error fetching student:', error)
      const errorMessage = error.response?.data?.message || 'Failed to fetch student'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Create new student
  createStudent: async (studentData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.createStudent(studentData)
      const newStudent = response.data.data
      
      set(state => ({
        students: [newStudent, ...state.students],
        isLoading: false
      }))
      
      toast.success('Student created successfully')
      return newStudent
    } catch (error) {
      console.error('Error creating student:', error)
      const errorMessage = error.response?.data?.message || 'Failed to create student'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Update student
  updateStudent: async (id, studentData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.updateStudent(id, studentData)
      const updatedStudent = response.data.data
      
      set(state => ({
        students: state.students.map(student => 
          student._id === id ? updatedStudent : student
        ),
        currentStudent: state.currentStudent?._id === id ? updatedStudent : state.currentStudent,
        isLoading: false
      }))
      
      toast.success('Student updated successfully')
      return updatedStudent
    } catch (error) {
      console.error('Error updating student:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update student'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Delete student
  deleteStudent: async (id) => {
    set({ isLoading: true, error: null })

    try {
      await studentAPI.deleteStudent(id)
      
      set(state => ({
        students: state.students.filter(student => student._id !== id),
        currentStudent: state.currentStudent?._id === id ? null : state.currentStudent,
        isLoading: false
      }))
      
      toast.success('Student deleted successfully')
    } catch (error) {
      console.error('Error deleting student:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete student'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Toggle student status
  toggleStudentStatus: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.toggleStudentStatus(id)
      const updatedStudent = response.data.data
      
      set(state => ({
        students: state.students.map(student => 
          student._id === id ? updatedStudent : student
        ),
        currentStudent: state.currentStudent?._id === id ? updatedStudent : state.currentStudent,
        isLoading: false
      }))
      
      toast.success(`Student ${updatedStudent.isActive ? 'activated' : 'deactivated'} successfully`)
      return updatedStudent
    } catch (error) {
      console.error('Error toggling student status:', error)
      const errorMessage = error.response?.data?.message || 'Failed to toggle student status'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Assign exams to student
  assignExams: async (id, examIds) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.assignExams(id, examIds)
      const updatedStudent = response.data.data
      
      set(state => ({
        students: state.students.map(student => 
          student._id === id ? { ...student, assignedExams: examIds } : student
        ),
        currentStudent: state.currentStudent?._id === id ? { ...state.currentStudent, assignedExams: examIds } : state.currentStudent,
        isLoading: false
      }))
      
      toast.success('Exams assigned successfully')
      return updatedStudent
    } catch (error) {
      console.error('Error assigning exams:', error)
      const errorMessage = error.response?.data?.message || 'Failed to assign exams'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Toggle answer viewing permission
  toggleAnswerViewing: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.toggleAnswerViewing(id)
      const updatedStudent = response.data.data
      
      set(state => ({
        students: state.students.map(student => 
          student._id === id ? { ...student, canViewAnswers: updatedStudent.canViewAnswers } : student
        ),
        currentStudent: state.currentStudent?._id === id ? { ...state.currentStudent, canViewAnswers: updatedStudent.canViewAnswers } : state.currentStudent,
        isLoading: false
      }))
      
      toast.success(`Answer viewing ${updatedStudent.canViewAnswers ? 'enabled' : 'disabled'} successfully`)
      return updatedStudent
    } catch (error) {
      console.error('Error toggling answer viewing:', error)
      const errorMessage = error.response?.data?.message || 'Failed to toggle answer viewing'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Get student exam assignments
  getStudentExamAssignments: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const response = await studentAPI.getStudentExamAssignments(id)
      const assignments = response.data.data
      
      set({ isLoading: false })
      return assignments
    } catch (error) {
      console.error('Error fetching student exam assignments:', error)
      const errorMessage = error.response?.data?.message || 'Failed to fetch exam assignments'
      set({
        error: errorMessage,
        isLoading: false
      })
      toast.error(errorMessage)
      throw error
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store
  reset: () => set({
    students: [],
    currentStudent: null,
    isLoading: false,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false
    }
  })
}))

export default useStudentStore
