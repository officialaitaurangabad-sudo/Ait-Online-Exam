import { createContext, useContext, useEffect, useState, useRef } from 'react'
import useAuthStore from '../store/useAuthStore'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const { user, isLoading, checkAuth } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Only run once to prevent infinite loops
    if (!hasInitialized.current) {
      hasInitialized.current = true
      const initializeAuth = async () => {
        try {
          await checkAuth()
        } catch (error) {
          console.error('Auth initialization error:', error)
        } finally {
          setIsInitialized(true)
        }
      }
      initializeAuth()
    }
  }, [checkAuth])

  const value = {
    user,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
    canAccessAdmin: user?.role === 'admin' || user?.role === 'teacher',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}