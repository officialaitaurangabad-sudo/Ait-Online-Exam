const mongoose = require('mongoose');
const User = require('../models/userModel');
const { generateTokenPair } = require('../utils/tokenUtils');
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

// Test JWT token generation with role
const testJWTWithRole = async (email) => {
  try {
    console.log(`🔍 Testing JWT generation for user: ${email}`);
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return false;
    }
    
    console.log('👤 User found:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}`);
    
    // Generate new token pair
    console.log('\n🔑 Generating new JWT token...');
    const tokens = await generateTokenPair(user._id);
    
    console.log('✅ Token generated successfully!');
    console.log(`   Token length: ${tokens.accessToken.length} characters`);
    console.log(`   Expires in: ${tokens.expiresIn}`);
    
    // Decode and show token payload
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(tokens.accessToken);
    
    console.log('\n📋 JWT Payload:');
    console.log(JSON.stringify(decoded, null, 2));
    
    // Check if role is included
    if (decoded.role) {
      console.log(`\n✅ SUCCESS: Role "${decoded.role}" is included in JWT token!`);
      console.log('🎯 The analytics dashboard should now work.');
    } else {
      console.log('\n❌ ERROR: Role is still missing from JWT token!');
      console.log('🔧 Check the token generation code.');
    }
    
    console.log('\n🔗 JWT.io Inspection:');
    console.log('Copy this token to https://jwt.io/ to verify:');
    console.log(tokens.accessToken);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing JWT generation:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Please provide an email address.');
    console.log('Usage: node testJWTWithRole.js <email>');
    console.log('Example: node testJWTWithRole.js ait@gmail.com');
    process.exit(1);
  }
  
  await connectDB();
  const success = await testJWTWithRole(email);
  
  if (success) {
    console.log('\n🎯 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Log out of the frontend application');
    console.log('3. Log back in with the same email');
    console.log('4. Try accessing the analytics dashboard');
    console.log('5. Run checkRole() in browser console to verify the fix');
  }
  
  await mongoose.disconnect();
  process.exit(success ? 0 : 1);
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testJWTWithRole };
