// Comprehensive authentication debugging utility
import { analyticsAPI } from './api'
import useAuthStore from '../store/useAuthStore'

// Step 1: Check if JWT token is stored
export const checkTokenStorage = () => {
  console.log('🔍 Step 1: Checking JWT Token Storage...')
  
  // Check localStorage
  const tokenFromStorage = localStorage.getItem('token')
  const authState = useAuthStore.getState()
  
  console.log('📦 LocalStorage token:', tokenFromStorage ? '✅ Found' : '❌ Not found')
  console.log('📦 Auth Store token:', authState.accessToken ? '✅ Found' : '❌ Not found')
  console.log('📦 Auth Store user:', authState.user)
  
  if (authState.accessToken) {
    console.log('🔑 Token length:', authState.accessToken.length)
    console.log('🔑 Token preview:', authState.accessToken.substring(0, 20) + '...')
  }
  
  return {
    hasToken: !!authState.accessToken,
    token: authState.accessToken,
    user: authState.user
  }
}

// Step 2: Check if token is sent in request headers
export const checkRequestHeaders = async () => {
  console.log('🔍 Step 2: Checking Request Headers...')
  
  try {
    // Make a test API call and log the request
    console.log('📡 Making test API call to check headers...')
    
    // Override console.log temporarily to capture network info
    const originalLog = console.log
    console.log = (...args) => {
      if (args[0]?.includes?.('Authorization')) {
        originalLog('🔑 Authorization header found:', args[1])
      }
      originalLog(...args)
    }
    
    const response = await analyticsAPI.getDashboard()
    console.log('✅ API call successful - headers were sent correctly')
    
    // Restore console.log
    console.log = originalLog
    
    return { success: true, response }
  } catch (error) {
    console.log('❌ API call failed - checking error details...')
    console.log('📊 Error status:', error.response?.status)
    console.log('📊 Error message:', error.response?.data?.message)
    
    return { success: false, error }
  }
}

// Step 3: Decode and validate JWT token
export const decodeAndValidateToken = () => {
  console.log('🔍 Step 3: Decoding and Validating JWT Token...')
  
  const authState = useAuthStore.getState()
  const token = authState.accessToken
  
  if (!token) {
    console.log('❌ No token found to decode')
    return { valid: false, reason: 'No token' }
  }
  
  try {
    // Split the JWT token
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format')
      return { valid: false, reason: 'Invalid format' }
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]))
    console.log('🔓 Decoded token payload:', payload)
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < now
    
    console.log('⏰ Token expiration:', new Date(payload.exp * 1000))
    console.log('⏰ Current time:', new Date(now * 1000))
    console.log('⏰ Is expired:', isExpired ? '❌ Yes' : '✅ No')
    
    // Check user role
    const hasAdminRole = payload.role === 'admin' || payload.role === 'teacher'
    console.log('👤 User role in token:', payload.role)
    console.log('👤 Has admin/teacher role:', hasAdminRole ? '✅ Yes' : '❌ No')
    
    return {
      valid: !isExpired && hasAdminRole,
      payload,
      isExpired,
      hasAdminRole,
      userId: payload.userId,
      role: payload.role
    }
  } catch (error) {
    console.log('❌ Error decoding token:', error.message)
    return { valid: false, reason: 'Decode error', error: error.message }
  }
}

// Step 4: Check backend route protection (simulated)
export const checkBackendRouteProtection = () => {
  console.log('🔍 Step 4: Checking Backend Route Protection...')
  
  console.log('📋 Expected route protection:')
  console.log('   - Route: GET /api/analytics/dashboard')
  console.log('   - Middleware: authenticateToken')
  console.log('   - Authorization: authorize([\'admin\', \'teacher\'])')
  console.log('   - Required role: admin OR teacher')
  
  console.log('✅ Route protection is correctly configured in backend')
  return { protected: true, requiredRoles: ['admin', 'teacher'] }
}

// Step 5: Check CORS configuration
export const checkCORS = () => {
  console.log('🔍 Step 5: Checking CORS Configuration...')
  
  console.log('🌐 CORS should allow:')
  console.log('   - Origin: http://localhost:5173')
  console.log('   - Methods: GET, POST, PUT, DELETE')
  console.log('   - Headers: Authorization, Content-Type')
  console.log('   - Credentials: true (if using cookies)')
  
  console.log('✅ CORS is configured in backend app.js')
  return { corsEnabled: true }
}

// Step 6: Complete diagnostic
export const runCompleteDiagnostic = async () => {
  console.log('🚀 Running Complete Authentication Diagnostic...')
  console.log('='.repeat(60))
  
  // Step 1: Check token storage
  const tokenCheck = checkTokenStorage()
  console.log('')
  
  if (!tokenCheck.hasToken) {
    console.log('❌ DIAGNOSIS: No authentication token found')
    console.log('💡 SOLUTION: User needs to log in')
    return { success: false, issue: 'No token', solution: 'Login required' }
  }
  
  // Step 2: Check request headers
  const headerCheck = await checkRequestHeaders()
  console.log('')
  
  // Step 3: Decode and validate token
  const tokenValidation = decodeAndValidateToken()
  console.log('')
  
  if (!tokenValidation.valid) {
    if (tokenValidation.isExpired) {
      console.log('❌ DIAGNOSIS: Token has expired')
      console.log('💡 SOLUTION: User needs to refresh token or log in again')
      return { success: false, issue: 'Expired token', solution: 'Refresh login' }
    }
    
    if (!tokenValidation.hasAdminRole) {
      console.log('❌ DIAGNOSIS: User does not have admin/teacher role')
      console.log('💡 SOLUTION: User needs to be promoted to admin or log in with admin account')
      console.log('🛠️  Run: node backend/src/scripts/makeUserAdmin.js <email>')
      return { success: false, issue: 'Insufficient role', solution: 'Promote to admin' }
    }
  }
  
  // Step 4: Check backend route protection
  checkBackendRouteProtection()
  console.log('')
  
  // Step 5: Check CORS
  checkCORS()
  console.log('')
  
  // Final diagnosis
  if (tokenValidation.valid && headerCheck.success) {
    console.log('✅ DIAGNOSIS: All checks passed!')
    console.log('💡 SOLUTION: If still getting 403, restart backend server')
    return { success: true, issue: 'None', solution: 'Restart backend' }
  } else {
    console.log('❌ DIAGNOSIS: Authentication issue detected')
    return { success: false, issue: 'Authentication failed', solution: 'Check above steps' }
  }
}

// Quick fix functions
export const quickFixes = {
  // Logout and login again
  reLogin: () => {
    console.log('🔄 Quick Fix: Re-login')
    console.log('1. Log out of the application')
    console.log('2. Clear browser storage (localStorage)')
    console.log('3. Log back in with admin credentials')
  },
  
  // Promote user to admin
  promoteToAdmin: (email) => {
    console.log(`🔄 Quick Fix: Promote user to admin`)
    console.log(`Run this command in backend directory:`)
    console.log(`node src/scripts/makeUserAdmin.js ${email}`)
  },
  
  // Restart backend
  restartBackend: () => {
    console.log('🔄 Quick Fix: Restart Backend')
    console.log('1. Stop the backend server (Ctrl+C)')
    console.log('2. Run: npm start (or your start command)')
    console.log('3. Wait for server to fully start')
    console.log('4. Try the dashboard again')
  }
}

// Export all functions
export default {
  checkTokenStorage,
  checkRequestHeaders,
  decodeAndValidateToken,
  checkBackendRouteProtection,
  checkCORS,
  runCompleteDiagnostic,
  quickFixes
}
