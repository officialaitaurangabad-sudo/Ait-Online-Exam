// Quick user role checker utility
import useAuthStore from '../store/useAuthStore'

export const checkUserRole = () => {
  console.log('🔍 Checking Current User Role...')
  console.log('='.repeat(50))
  
  const authState = useAuthStore.getState()
  const user = authState.user
  const token = authState.accessToken
  
  if (!user) {
    console.log('❌ No user found - not logged in')
    return { hasUser: false }
  }
  
  console.log('👤 User Information:')
  console.log(`   Name: ${user.firstName} ${user.lastName}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   ID: ${user._id}`)
  console.log(`   Active: ${user.isActive}`)
  
  if (!token) {
    console.log('❌ No access token found')
    return { hasUser: true, hasToken: false }
  }
  
  console.log('\n🔑 JWT Token Analysis:')
  console.log(`   Token length: ${token.length} characters`)
  console.log(`   Token preview: ${token.substring(0, 30)}...`)
  
  try {
    // Decode JWT token
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format')
      return { hasUser: true, hasToken: true, validToken: false }
    }
    
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))
    
    console.log('\n📋 JWT Header:', header)
    console.log('\n📋 JWT Payload:', payload)
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp < now
    
    console.log('\n⏰ Token Expiration:')
    console.log(`   Expires at: ${new Date(payload.exp * 1000)}`)
    console.log(`   Current time: ${new Date(now * 1000)}`)
    console.log(`   Is expired: ${isExpired ? '❌ Yes' : '✅ No'}`)
    
    // Check role
    console.log('\n🎭 Role Analysis:')
    console.log(`   Role in token: ${payload.role}`)
    console.log(`   Role in user object: ${user.role}`)
    console.log(`   Roles match: ${payload.role === user.role ? '✅ Yes' : '❌ No'}`)
    
    const hasAdminRole = payload.role === 'admin' || payload.role === 'teacher'
    console.log(`   Has admin/teacher role: ${hasAdminRole ? '✅ Yes' : '❌ No'}`)
    
    // JWT.io link
    console.log('\n🔗 JWT.io Inspection:')
    console.log('   Copy this token to jwt.io to inspect:')
    console.log(`   ${token}`)
    console.log('\n   Or visit: https://jwt.io/')
    console.log('   Paste the token in the "Encoded" section')
    
    return {
      hasUser: true,
      hasToken: true,
      validToken: true,
      user,
      token,
      payload,
      isExpired,
      hasAdminRole,
      role: payload.role
    }
    
  } catch (error) {
    console.log('❌ Error decoding JWT:', error.message)
    return { hasUser: true, hasToken: true, validToken: false, error: error.message }
  }
}

// Quick role fix suggestions
export const getRoleFixSuggestions = (roleCheck) => {
  console.log('\n💡 Fix Suggestions:')
  console.log('='.repeat(50))
  
  if (!roleCheck.hasUser) {
    console.log('1. Log in to the application')
    console.log('2. Make sure you have admin credentials')
    return
  }
  
  if (!roleCheck.hasToken) {
    console.log('1. Log out and log back in')
    console.log('2. Check if authentication is working')
    return
  }
  
  if (roleCheck.isExpired) {
    console.log('1. Token has expired')
    console.log('2. Log out and log back in')
    console.log('3. Check token expiration settings')
    return
  }
  
  if (!roleCheck.hasAdminRole) {
    console.log('❌ Current role does not have admin access')
    console.log('\n🛠️  Solutions:')
    console.log('1. Promote current user to admin:')
    console.log(`   node backend/src/scripts/makeUserAdmin.js ${roleCheck.user.email}`)
    console.log('\n2. Log in with an existing admin account')
    console.log('\n3. Create a new admin user in the database')
    console.log('\n4. Modify backend to allow your current role:')
    console.log('   Edit: backend/src/routes/analyticsRoutes.js')
    console.log('   Change: authorize([\'admin\', \'teacher\'])')
    console.log(`   To: authorize([\'admin\', \'teacher\', \'${roleCheck.role}\'])`)
  } else {
    console.log('✅ User has admin/teacher role')
    console.log('\n🛠️  If still getting 403:')
    console.log('1. Restart the backend server')
    console.log('2. Clear browser cache and cookies')
    console.log('3. Check backend logs for detailed error messages')
  }
}

// Complete role check with suggestions
export const completeRoleCheck = () => {
  const roleCheck = checkUserRole()
  getRoleFixSuggestions(roleCheck)
  return roleCheck
}

export default {
  checkUserRole,
  getRoleFixSuggestions,
  completeRoleCheck
}
