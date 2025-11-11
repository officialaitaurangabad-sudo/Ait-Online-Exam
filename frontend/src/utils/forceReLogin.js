// Force re-login utility to get new JWT token with role
import useAuthStore from '../store/useAuthStore'

export const forceReLogin = () => {
  console.log('🔄 Forcing Re-login to Get New JWT Token...')
  console.log('='.repeat(50))
  
  const authState = useAuthStore.getState()
  
  if (!authState.user) {
    console.log('❌ No user logged in. Please log in first.')
    return false
  }
  
  console.log('👤 Current user:', authState.user.email)
  console.log('🔑 Current token preview:', authState.accessToken?.substring(0, 30) + '...')
  
  console.log('\n🛠️  Steps to get new JWT token with role:')
  console.log('1. Click the logout button in the UI')
  console.log('2. Or run: useAuthStore.getState().logout()')
  console.log('3. Clear browser storage: localStorage.clear()')
  console.log('4. Log back in with the same credentials')
  console.log('5. The new token will include the role field')
  
  return true
}

// Quick logout function
export const quickLogout = () => {
  console.log('🚪 Logging out...')
  
  try {
    const { logout } = useAuthStore.getState()
    logout()
    console.log('✅ Logged out successfully')
    console.log('🔄 Now log back in to get a new JWT token with role')
  } catch (error) {
    console.log('❌ Error during logout:', error)
  }
}

// Clear all auth data
export const clearAuthData = () => {
  console.log('🧹 Clearing all authentication data...')
  
  try {
    // Clear localStorage
    localStorage.clear()
    console.log('✅ localStorage cleared')
    
    // Clear sessionStorage
    sessionStorage.clear()
    console.log('✅ sessionStorage cleared')
    
    // Reset auth store
    const { clearAll } = useAuthStore.getState()
    if (clearAll) {
      clearAll()
      console.log('✅ Auth store cleared')
    }
    
    console.log('🎯 All auth data cleared. Please log in again.')
  } catch (error) {
    console.log('❌ Error clearing auth data:', error)
  }
}

// Complete re-authentication process
export const completeReAuth = () => {
  console.log('🔄 Complete Re-authentication Process')
  console.log('='.repeat(50))
  
  // Step 1: Show current state
  const authState = useAuthStore.getState()
  console.log('📊 Current auth state:')
  console.log('   User:', authState.user?.email || 'None')
  console.log('   Has token:', !!authState.accessToken)
  
  if (authState.accessToken) {
    try {
      const parts = authState.accessToken.split('.')
      const payload = JSON.parse(atob(parts[1]))
      console.log('   Role in token:', payload.role || 'MISSING')
    } catch (e) {
      console.log('   Role in token: ERROR DECODING')
    }
  }
  
  console.log('\n🛠️  Next steps:')
  console.log('1. Run: quickLogout() - to log out')
  console.log('2. Run: clearAuthData() - to clear all data')
  console.log('3. Refresh the page')
  console.log('4. Log back in with your credentials')
  console.log('5. Run: checkRole() - to verify the new token has role')
  
  return authState
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  window.forceReLogin = forceReLogin
  window.quickLogout = quickLogout
  window.clearAuthData = clearAuthData
  window.completeReAuth = completeReAuth
  
  console.log('🛠️  Re-authentication helpers loaded!')
  console.log('Available commands:')
  console.log('  - forceReLogin() - Show re-login instructions')
  console.log('  - quickLogout() - Log out immediately')
  console.log('  - clearAuthData() - Clear all auth data')
  console.log('  - completeReAuth() - Complete re-auth process')
}

export default {
  forceReLogin,
  quickLogout,
  clearAuthData,
  completeReAuth
}
