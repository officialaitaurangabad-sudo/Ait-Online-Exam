const mongoose = require('mongoose');
const User = require('../models/userModel');
const { generateTokenPair } = require('../utils/tokenUtils');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

// Test analytics access end-to-end
const testAnalyticsAccess = async (email) => {
  try {
    console.log('🔍 Testing Analytics Access End-to-End...');
    console.log('='.repeat(60));
    
    // Step 1: Find user
    console.log('📋 Step 1: Finding user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    console.log('✅ User found:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Step 2: Generate new token
    console.log('\n📋 Step 2: Generating new JWT token...');
    const tokens = await generateTokenPair(user._id);
    console.log('✅ Token generated successfully!');
    
    // Step 3: Decode and verify token
    console.log('\n📋 Step 3: Verifying JWT token...');
    const decoded = jwt.decode(tokens.accessToken);
    console.log('📋 JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    if (!decoded.role) {
      console.log('❌ ERROR: Role is missing from JWT token!');
      return false;
    }
    
    if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
      console.log(`❌ ERROR: User role "${decoded.role}" is not admin or teacher!`);
      return false;
    }
    
    console.log('✅ JWT token is valid and has correct role');
    
    // Step 4: Test API call
    console.log('\n📋 Step 4: Testing analytics API call...');
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Analytics API call successful!');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response data:', response.data);
      
    } catch (apiError) {
      console.log('❌ Analytics API call failed!');
      console.log('📊 Error status:', apiError.response?.status);
      console.log('📊 Error message:', apiError.response?.data?.message);
      console.log('📊 Error data:', apiError.response?.data);
      
      if (apiError.response?.status === 403) {
        console.log('\n🔍 403 Error Analysis:');
        console.log('   - Token is valid and has role');
        console.log('   - User exists and is active');
        console.log('   - Possible issues:');
        console.log('     1. Backend server not restarted with new code');
        console.log('     2. Middleware not using token role correctly');
        console.log('     3. Database user role mismatch');
        
        // Check if user role in DB matches token role
        if (user.role !== decoded.role) {
          console.log(`   - ROLE MISMATCH: DB role="${user.role}" vs Token role="${decoded.role}"`);
        }
      }
      
      return false;
    }
    
    console.log('\n🎉 All tests passed! Analytics access is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Error during analytics access test:', error);
    return false;
  }
};

// Test backend server status
const testBackendServer = async () => {
  console.log('🔍 Testing Backend Server Status...');
  console.log('='.repeat(40));
  
  try {
    const response = await axios.get('http://localhost:5000/', {
      timeout: 5000
    });
    
    console.log('✅ Backend server is running');
    console.log('📊 Response:', response.data);
    return true;
    
  } catch (error) {
    console.log('❌ Backend server is not responding');
    console.log('📊 Error:', error.message);
    console.log('💡 Make sure to start the backend server: npm start');
    return false;
  }
};

// Main execution
const main = async () => {
  const email = process.argv[2] || 'ait@gmail.com';
  
  console.log('🚀 Backend Analytics Access Test');
  console.log('='.repeat(60));
  
  await connectDB();
  
  // Test 1: Backend server status
  const serverRunning = await testBackendServer();
  if (!serverRunning) {
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log('\n');
  
  // Test 2: Analytics access
  const accessWorking = await testAnalyticsAccess(email);
  
  if (accessWorking) {
    console.log('\n🎯 Result: Analytics access is working correctly!');
    console.log('💡 If you\'re still getting 403 in the frontend:');
    console.log('   1. Log out of the frontend');
    console.log('   2. Clear browser storage');
    console.log('   3. Log back in');
    console.log('   4. Try the dashboard again');
  } else {
    console.log('\n🎯 Result: Analytics access is not working');
    console.log('💡 Check the error messages above for specific issues');
  }
  
  await mongoose.disconnect();
  process.exit(accessWorking ? 0 : 1);
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAnalyticsAccess, testBackendServer };
