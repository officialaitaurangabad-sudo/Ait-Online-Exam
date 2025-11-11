// Browser console debugging helpers
// Copy and paste these functions into your browser console

// Import role checker
import { completeRoleCheck } from './checkUserRole.js'

// Quick token check
window.checkAuth = () => {
  console.log('🔍 Quick Auth Check...')
  
  // Check auth store
  const authState = useAuthStore.getState()
  console.log('👤 User:', authState.user)
  console.log('🔑 Has token:', !!authState.accessToken)
  console.log('🎭 User role:', authState.user?.role)
  
  if (authState.accessToken) {
    // Decode token
    try {
      const parts = authState.accessToken.split('.')
      const payload = JSON.parse(atob(parts[1]))
      console.log('🔓 Token payload:', payload)
      console.log('⏰ Expires:', new Date(payload.exp * 1000))
      console.log('👤 Role in token:', payload.role)
    } catch (e) {
      console.log('❌ Error decoding token:', e.message)
    }
  }
  
  return authState
}

// Test API call
window.testAnalytics = async () => {
  console.log('🧪 Testing Analytics API...')
  try {
    const response = await analyticsAPI.getDashboard()
    console.log('✅ Success:', response.data)
    return response
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data?.message)
    return error
  }
}

// Complete diagnostic
window.debugAuth = async () => {
  console.log('🚀 Running Complete Auth Debug...')
  
  // Step 1: Check auth state
  const auth = window.checkAuth()
  
  // Step 2: Test API
  const apiTest = await window.testAnalytics()
  
  // Step 3: Diagnosis
  if (!auth.accessToken) {
    console.log('❌ ISSUE: No authentication token')
    console.log('💡 FIX: Log in to the application')
  } else if (auth.user?.role !== 'admin' && auth.user?.role !== 'teacher') {
    console.log('❌ ISSUE: User role is not admin/teacher')
    console.log('💡 FIX: Promote user to admin or log in with admin account')
    console.log('🛠️  Run: node backend/src/scripts/makeUserAdmin.js <email>')
  } else if (apiTest.response?.status === 403) {
    console.log('❌ ISSUE: 403 Forbidden - likely role mismatch')
    console.log('💡 FIX: Check user role in database vs token')
  } else if (apiTest.response?.status === 401) {
    console.log('❌ ISSUE: 401 Unauthorized - token invalid/expired')
    console.log('💡 FIX: Log out and log back in')
  } else {
    console.log('✅ All checks passed!')
  }
}

// Quick fixes
window.quickFixes = {
  reLogin: () => {
    console.log('🔄 Quick Fix: Re-login')
    console.log('1. Click logout button')
    console.log('2. Clear browser storage: localStorage.clear()')
    console.log('3. Log back in with admin credentials')
  },
  
  promoteUser: (email) => {
    console.log(`🔄 Quick Fix: Promote user to admin`)
    console.log(`Run in backend directory:`)
    console.log(`node src/scripts/makeUserAdmin.js ${email}`)
  },
  
  restartBackend: () => {
    console.log('🔄 Quick Fix: Restart Backend')
    console.log('1. Stop backend server (Ctrl+C)')
    console.log('2. Run: npm start')
    console.log('3. Wait for server to start')
    console.log('4. Try dashboard again')
  }
}

// Role-specific check
window.checkRole = () => {
  return completeRoleCheck()
}

console.log('🛠️  Debug helpers loaded!')
console.log('Available commands:')
console.log('  - checkAuth() - Check current auth state')
console.log('  - checkRole() - Check user role and JWT token')
console.log('  - testAnalytics() - Test analytics API call')
console.log('  - debugAuth() - Run complete diagnostic')
console.log('  - quickFixes.reLogin() - Get re-login instructions')
console.log('  - quickFixes.promoteUser(email) - Get promote user instructions')
console.log('  - quickFixes.restartBackend() - Get restart backend instructions')
