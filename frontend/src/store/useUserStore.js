import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userAPI } from '../utils/api'
import { toast } from 'react-toastify'

const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      users: [],
      currentUser: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      filters: {
        search: '',
        role: '',
        status: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      },

      // Actions
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
        }))
      },

      setPagination: (newPagination) => {
        set((state) => ({
          pagination: { ...state.pagination, ...newPagination }
        }))
      },

      resetFilters: () => {
        set({
          filters: {
            search: '',
            role: '',
            status: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        })
      },

      clearError: () => {
        set({ error: null })
      },

      // Fetch users with filters and pagination
      fetchUsers: async () => {
        const { filters, pagination } = get()
        
        set({ isLoading: true, error: null })
        
        try {
          const params = {
            page: pagination.page,
            limit: pagination.limit,
            ...filters
          }

          // Remove empty filters
          Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
              delete params[key]
            }
          })

          console.log('Fetching users with params:', params)
          console.log('Current auth state:', {
            hasToken: !!localStorage.getItem('accessToken'),
            token: localStorage.getItem('accessToken')?.substring(0, 30) + '...'
          })

          const response = await userAPI.getUsers(params)
          console.log('Fetch users response:', response.data)
          console.log('Response structure:', {
            success: response.data.success,
            hasData: !!response.data.data,
            users: response.data.data?.users,
            pagination: response.data.data?.pagination
          })
          
          set({
            users: response.data.data.users,
            pagination: {
              ...pagination,
              total: response.data.data.pagination.total,
              totalPages: response.data.data.pagination.totalPages
            },
            isLoading: false
          })
        } catch (error) {
          console.error('Error fetching users:', error)
          console.error('Error response:', error.response?.data)
          console.error('Error status:', error.response?.status)
          set({
            error: error.response?.data?.message || 'Failed to fetch users',
            isLoading: false
          })
          toast.error('Failed to fetch users')
        }
      },

      // Get single user
      getUser: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.getUser(id)
          console.log('Get user response:', response.data)
          const userData = response.data.data || response.data
          set({ currentUser: userData, isLoading: false })
          return userData
        } catch (error) {
          console.error('Error fetching user:', error)
          set({
            error: error.response?.data?.message || 'Failed to fetch user',
            isLoading: false
          })
          toast.error('Failed to fetch user')
          throw error
        }
      },

      // Create user
      createUser: async (userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.createUser(userData)
          console.log('Create user response:', response.data)
          
          const newUser = response.data.data
          
          // Add new user to the list
          set((state) => ({
            users: [newUser, ...state.users],
            pagination: {
              ...state.pagination,
              total: state.pagination.total + 1
            },
            isLoading: false
          }))
          
          toast.success('User created successfully')
          return newUser
        } catch (error) {
          console.error('Error creating user:', error)
          set({
            error: error.response?.data?.message || 'Failed to create user',
            isLoading: false
          })
          toast.error('Failed to create user')
          throw error
        }
      },

      // Update user
      updateUser: async (id, userData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.updateUser(id, userData)
          
          // Update user in the list
          set((state) => ({
            users: state.users.map(user => 
              user._id === id ? response.data : user
            ),
            currentUser: state.currentUser?._id === id ? response.data : state.currentUser,
            isLoading: false
          }))
          
          toast.success('User updated successfully')
          return response.data
        } catch (error) {
          console.error('Error updating user:', error)
          set({
            error: error.response?.data?.message || 'Failed to update user',
            isLoading: false
          })
          toast.error('Failed to update user')
          throw error
        }
      },

      // Delete user
      deleteUser: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          await userAPI.deleteUser(id)
          
          // Remove user from the list
          set((state) => ({
            users: state.users.filter(user => user._id !== id),
            pagination: {
              ...state.pagination,
              total: state.pagination.total - 1
            },
            isLoading: false
          }))
          
          toast.success('User deleted successfully')
        } catch (error) {
          console.error('Error deleting user:', error)
          set({
            error: error.response?.data?.message || 'Failed to delete user',
            isLoading: false
          })
          toast.error('Failed to delete user')
          throw error
        }
      },

      // Toggle user status (activate/deactivate)
      toggleUserStatus: async (id) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.toggleUserStatus(id)
          
          // Update user in the list
          set((state) => ({
            users: state.users.map(user => 
              user._id === id ? response.data : user
            ),
            currentUser: state.currentUser?._id === id ? response.data : state.currentUser,
            isLoading: false
          }))
          
          const action = response.data.isActive ? 'activated' : 'deactivated'
          toast.success(`User ${action} successfully`)
          return response.data
        } catch (error) {
          console.error('Error toggling user status:', error)
          set({
            error: error.response?.data?.message || 'Failed to update user status',
            isLoading: false
          })
          toast.error('Failed to update user status')
          throw error
        }
      },

      // Reset user password
      resetUserPassword: async (id, passwordData) => {
        set({ isLoading: true, error: null })
        
        try {
          console.log('Resetting password for user:', id, 'with data:', passwordData)
          const response = await userAPI.resetUserPassword(id, passwordData)
          console.log('Password reset response:', response.data)
          set({ isLoading: false })
          toast.success('Password reset successfully')
        } catch (error) {
          console.error('Error resetting password:', error)
          console.error('Error response:', error.response?.data)
          const errorMessage = error.response?.data?.message || 'Failed to reset password'
          set({
            error: errorMessage,
            isLoading: false
          })
          toast.error(errorMessage)
          throw error
        }
      },

      // Get user statistics
      getUserStatistics: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.getUserStatistics()
          set({ isLoading: false })
          return response.data
        } catch (error) {
          console.error('Error fetching user statistics:', error)
          set({
            error: error.response?.data?.message || 'Failed to fetch user statistics',
            isLoading: false
          })
          toast.error('Failed to fetch user statistics')
          throw error
        }
      },

      // Export users
      exportUsers: async (params = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.exportUsers(params)
          set({ isLoading: false })
          return response.data
        } catch (error) {
          console.error('Error exporting users:', error)
          set({
            error: error.response?.data?.message || 'Failed to export users',
            isLoading: false
          })
          toast.error('Failed to export users')
          throw error
        }
      },

      // Get users (simple method for dashboard)
      getUsers: async (params = {}) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await userAPI.getUsers(params)
          set({ 
            users: response.data.data.users,
            isLoading: false 
          })
          return { success: true, users: response.data.data.users }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch users'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Refresh users (for manual refresh)
      refreshUsers: async () => {
        set({ isRefreshing: true })
        await get().fetchUsers()
        set({ isRefreshing: false })
      }
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
)

export default useUserStore
