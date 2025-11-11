import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', credentials)
          const { user, accessToken, refreshToken } = response.data.data

          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null
          })

          // Set default authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', userData)
          const { user, accessToken, refreshToken } = response.data.data

          set({
            user,
            accessToken,
            refreshToken,
            isLoading: false,
            error: null
          })

          // Set default authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Logout
      logout: async () => {
        try {
          if (get().refreshToken) {
            await api.post('/auth/logout', { refreshToken: get().refreshToken })
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear state regardless of API call success
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            error: null
          })

          // Remove authorization header
          delete api.defaults.headers.common['Authorization']
        }
      },

      // Refresh token
      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          if (!refreshToken) {
            throw new Error('No refresh token available')
          }

          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken } = response.data.data

          set({ accessToken })
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          return { success: true, accessToken }
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          return { success: false, error: error.message }
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { accessToken, refreshToken } = get()
        
        if (!accessToken) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })

        try {
          // Set authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          // Try to get current user
          const response = await api.get('/auth/me')
          const { user } = response.data.data

          set({ user, isLoading: false })
        } catch (error) {
          if (error.response?.status === 401) {
            // Token expired, try to refresh
            const refreshResult = await get().refreshAccessToken()
            if (refreshResult.success) {
              // Retry getting user info
              try {
                const response = await api.get('/auth/me')
                const { user } = response.data.data
                set({ user, isLoading: false })
              } catch (retryError) {
                get().logout()
              }
            } else {
              get().logout()
            }
          } else {
            set({ error: error.message, isLoading: false })
          }
        }
      },

      // Update profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.put('/auth/profile', profileData)
          const { user } = response.data.data

          set({ user, isLoading: false })
          return { success: true, user }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Change password
      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null })
        try {
          await api.put('/auth/change-password', passwordData)
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password change failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Forgot password
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/forgot-password', { email })
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password reset failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Reset password
      resetPassword: async (resetData) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/reset-password', resetData)
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password reset failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Verify email
      verifyEmail: async (token) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/verify-email', { token })
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Email verification failed'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Resend verification
      resendVerification: async () => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/resend-verification')
          set({ isLoading: false })
          return { success: true }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to resend verification'
          set({ error: errorMessage, isLoading: false })
          return { success: false, error: errorMessage }
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore
