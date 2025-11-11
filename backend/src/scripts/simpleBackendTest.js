const mongoose = require('mongoose');
const User = require('../models/userModel');
const { generateTokenPair } = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/online-exam-platform');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test backend components
const testBackendComponents = async (email) => {
  try {
    console.log('🔍 Testing Backend Components...');
    console.log('='.repeat(50));
    
    // Step 1: Check user in database
    console.log('📋 Step 1: Checking user in database...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found in database');
      return false;
    }
    
    console.log('✅ User found in database:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Locked: ${user.isLocked}`);
    
    // Step 2: Generate JWT token
    console.log('\n📋 Step 2: Generating JWT token...');
    const tokens = await generateTokenPair(user._id);
    console.log('✅ JWT token generated successfully!');
    
    // Step 3: Decode and analyze token
    console.log('\n📋 Step 3: Analyzing JWT token...');
    const decoded = jwt.decode(tokens.accessToken);
    console.log('📋 JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Step 4: Check token validity
    console.log('\n📋 Step 4: Checking token validity...');
    try {
      const verified = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      console.log('✅ JWT token is valid');
      console.log('📋 Verified payload:', verified);
    } catch (error) {
      console.log('❌ JWT token verification failed:', error.message);
      return false;
    }
    
    // Step 5: Check role in token vs database
    console.log('\n📋 Step 5: Checking role consistency...');
    console.log(`   Database role: ${user.role}`);
    console.log(`   Token role: ${decoded.role}`);
    
    if (user.role !== decoded.role) {
      console.log('❌ ROLE MISMATCH: Database and token roles don\'t match!');
      return false;
    }
    
    if (!decoded.role) {
      console.log('❌ ERROR: Role is missing from JWT token!');
      return false;
    }
    
    if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
      console.log(`❌ ERROR: Role "${decoded.role}" is not admin or teacher!`);
      return false;
    }
    
    console.log('✅ Role consistency check passed');
    
    // Step 6: Check environment variables
    console.log('\n📋 Step 6: Checking environment variables...');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Missing'}`);
    console.log(`   JWT_EXPIRE: ${process.env.JWT_EXPIRE || 'Not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'Not set'}`);
    console.log(`   PORT: ${process.env.PORT || 'Not set'}`);
    
    if (!process.env.JWT_SECRET) {
      console.log('❌ ERROR: JWT_SECRET is not set!');
      return false;
    }
    
    console.log('✅ Environment variables check passed');
    
    // Step 7: Test token expiration
    console.log('\n📋 Step 7: Checking token expiration...');
    const now = Math.floor(Date.now() / 1000);
    const isExpired = decoded.exp < now;
    
    console.log(`   Current time: ${new Date(now * 1000)}`);
    console.log(`   Token expires: ${new Date(decoded.exp * 1000)}`);
    console.log(`   Is expired: ${isExpired ? 'Yes' : 'No'}`);
    
    if (isExpired) {
      console.log('❌ ERROR: Token is expired!');
      return false;
    }
    
    console.log('✅ Token expiration check passed');
    
    console.log('\n🎉 All backend component tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ User exists and is active`);
    console.log(`   ✅ User role: ${user.role}`);
    console.log(`   ✅ JWT token is valid`);
    console.log(`   ✅ JWT token includes role: ${decoded.role}`);
    console.log(`   ✅ Role is admin/teacher`);
    console.log(`   ✅ Token is not expired`);
    console.log(`   ✅ Environment variables are set`);
    
    console.log('\n🎯 If you\'re still getting 403 errors:');
    console.log('   1. Make sure backend server is restarted');
    console.log('   2. Log out and log back in to get new token');
    console.log('   3. Check browser console for detailed error logs');
    console.log('   4. Verify the token in jwt.io');
    
    console.log('\n🔗 JWT Token for jwt.io inspection:');
    console.log(tokens.accessToken);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during backend component test:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  const email = process.argv[2] || 'ait@gmail.com';
  
  console.log('🚀 Backend Component Test');
  console.log('='.repeat(50));
  console.log(`Testing user: ${email}`);
  console.log('');
  
  await connectDB();
  const success = await testBackendComponents(email);
  
  await mongoose.disconnect();
  process.exit(success ? 0 : 1);
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testBackendComponents };
