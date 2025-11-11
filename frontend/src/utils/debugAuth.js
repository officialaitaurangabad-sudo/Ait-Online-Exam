// Debug authentication status
import useAuthStore from '../store/useAuthStore'

export const debugAuth = () => {
  const authState = useAuthStore.getState()
  
  console.log('🔍 Authentication Debug Info:')
  console.log('='.repeat(50))
  console.log('👤 User:', authState.user)
  console.log('🔑 Access Token:', authState.accessToken ? 'Present' : 'Missing')
  console.log('🔄 Refresh Token:', authState.refreshToken ? 'Present' : 'Missing')
  console.log('⏳ Loading:', authState.isLoading)
  console.log('❌ Error:', authState.error)
  
  if (authState.user) {
    console.log('📧 Email:', authState.user.email)
    console.log('👑 Role:', authState.user.role)
    console.log('✅ Is Active:', authState.user.isActive)
  }
  
  if (authState.accessToken) {
    console.log('🔑 Token Length:', authState.accessToken.length)
    console.log('🔑 Token Preview:', authState.accessToken.substring(0, 30) + '...')
  }
  
  console.log('='.repeat(50))
  
  return {
    isAuthenticated: !!authState.user && !!authState.accessToken,
    user: authState.user,
    hasToken: !!authState.accessToken,
    role: authState.user?.role
  }
}

// Test analytics endpoint access
export const testAnalyticsAccess = async () => {
  const { analyticsAPI } = await import('./api')
  
  console.log('🧪 Testing Analytics Endpoint Access...')
  console.log('='.repeat(50))
  
  try {
    // Test dashboard endpoint
    console.log('📊 Testing dashboard endpoint...')
    const dashboardResponse = await analyticsAPI.getDashboard()
    console.log('✅ Dashboard access successful:', dashboardResponse.data)
  } catch (error) {
    console.log('❌ Dashboard access failed:', error.response?.status, error.response?.data?.message)
  }
  
  try {
    // Test subjects endpoint
    console.log('📚 Testing subjects endpoint...')
    const subjectsResponse = await analyticsAPI.getSubjectWisePerformance()
    console.log('✅ Subjects access successful:', subjectsResponse.data)
  } catch (error) {
    console.log('❌ Subjects access failed:', error.response?.status, error.response?.data?.message)
  }
  
  try {
    // Test leaderboard endpoint
    console.log('🏆 Testing leaderboard endpoint...')
    const leaderboardResponse = await analyticsAPI.getTopPerformers()
    console.log('✅ Leaderboard access successful:', leaderboardResponse.data)
  } catch (error) {
    console.log('❌ Leaderboard access failed:', error.response?.status, error.response?.data?.message)
  }
  
  console.log('='.repeat(50))
}