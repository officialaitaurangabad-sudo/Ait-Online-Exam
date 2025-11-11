// Debug analytics access with multiple methods
import { analyticsAPI } from './api'
import useAuthStore from '../store/useAuthStore'

export const debugAnalyticsAccess = async () => {
  console.log('🔍 Debugging Analytics Access...')
  console.log('='.repeat(50))
  
  // Method 1: Test debug endpoint (no auth required)
  console.log('📋 Method 1: Testing debug endpoint (no auth)...')
  try {
    const debugResponse = await fetch('http://localhost:5000/api/analytics/dashboard-debug')
    const debugData = await debugResponse.json()
    console.log('✅ Debug endpoint response:', debugData)
  } catch (error) {
    console.log('❌ Debug endpoint failed:', error.message)
  }
  
  // Method 2: Check current auth state
  console.log('\n📋 Method 2: Checking current auth state...')
  const authState = useAuthStore.getState()
  console.log('👤 Current user:', authState.user)
  console.log('🔑 Has token:', !!authState.accessToken)
  
  if (authState.accessToken) {
    try {
      const parts = authState.accessToken.split('.')
      const payload = JSON.parse(atob(parts[1]))
      console.log('📋 Token payload:', payload)
      console.log('🎭 Role in token:', payload.role || 'MISSING')
    } catch (e) {
      console.log('❌ Error decoding token:', e.message)
    }
  }
  
  // Method 3: Test with current token
  console.log('\n📋 Method 3: Testing with current token...')
  try {
    const response = await analyticsAPI.getDashboard()
    console.log('✅ Analytics API success:', response.data)
  } catch (error) {
    console.log('❌ Analytics API failed:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      data: error.response?.data
    })
  }
  
  // Method 4: Test with manual fetch
  console.log('\n📋 Method 4: Testing with manual fetch...')
  try {
    const response = await fetch('http://localhost:5000/api/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${authState.accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    console.log('📊 Manual fetch response:', {
      status: response.status,
      statusText: response.statusText,
      data: data
    })
    
    if (response.status === 403) {
      console.log('❌ 403 Error - Authorization issue')
      console.log('💡 Possible causes:')
      console.log('   1. Token missing role field')
      console.log('   2. User role not admin/teacher')
      console.log('   3. Backend server not restarted')
      console.log('   4. Token expired or invalid')
    }
    
  } catch (error) {
    console.log('❌ Manual fetch failed:', error.message)
  }
  
  // Method 5: Generate new token manually
  console.log('\n📋 Method 5: Testing token generation...')
  try {
    // Try to get a fresh token by calling login API
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'ait@gmail.com',
        password: 'your-password-here' // You'll need to provide this
      })
    })
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      console.log('✅ New token generated:', loginData.data.accessToken.substring(0, 30) + '...')
      
      // Decode new token
      const parts = loginData.data.accessToken.split('.')
      const payload = JSON.parse(atob(parts[1]))
      console.log('📋 New token payload:', payload)
      console.log('🎭 Role in new token:', payload.role || 'MISSING')
    } else {
      console.log('❌ Login failed:', loginResponse.status)
    }
  } catch (error) {
    console.log('❌ Token generation test failed:', error.message)
  }
  
  console.log('\n🎯 Debug Summary:')
  console.log('If debug endpoint works but analytics fails, it\'s an auth issue')
  console.log('If both fail, it\'s a server connectivity issue')
  console.log('If role is missing from token, you need to re-login')
}

// Quick fixes
export const quickFixes = {
  // Test debug endpoint
  testDebug: async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics/dashboard-debug')
      const data = await response.json()
      console.log('✅ Debug endpoint:', data)
    } catch (error) {
      console.log('❌ Debug endpoint failed:', error.message)
    }
  },
  
  // Force new token
  forceNewToken: async () => {
    console.log('🔄 Forcing new token generation...')
    console.log('💡 You need to provide your password for this to work')
    console.log('💡 Or use the logout/login method instead')
  },
  
  // Check server status
  checkServer: async () => {
    try {
      const response = await fetch('http://localhost:5000/')
      const data = await response.json()
      console.log('✅ Backend server is running:', data)
    } catch (error) {
      console.log('❌ Backend server not responding:', error.message)
    }
  }
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  window.debugAnalyticsAccess = debugAnalyticsAccess
  window.testDebug = quickFixes.testDebug
  window.checkServer = quickFixes.checkServer
  
  console.log('🛠️  Analytics debug helpers loaded!')
  console.log('Available commands:')
  console.log('  - debugAnalyticsAccess() - Run complete debug')
  console.log('  - testDebug() - Test debug endpoint')
  console.log('  - checkServer() - Check server status')
}

export default {
  debugAnalyticsAccess,
  quickFixes
}
