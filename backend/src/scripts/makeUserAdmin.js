const mongoose = require('mongoose');
const User = require('../models/userModel');
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

// Make a user admin
const makeUserAdmin = async (email) => {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found with that email.');
      return false;
    }
    
    console.log(`👤 Found user: ${user.firstName} ${user.lastName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🎭 Current role: ${user.role}`);
    
    if (user.role === 'admin') {
      console.log('✅ User is already an admin!');
      return true;
    }
    
    // Update user role to admin
    user.role = 'admin';
    await user.save();
    
    console.log('🎉 Successfully updated user role to admin!');
    console.log(`✅ ${user.firstName} ${user.lastName} is now an admin.`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return false;
  }
};

// Main execution
const main = async () => {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Please provide an email address.');
    console.log('Usage: node makeUserAdmin.js <email>');
    console.log('Example: node makeUserAdmin.js admin@example.com');
    process.exit(1);
  }
  
  await connectDB();
  const success = await makeUserAdmin(email);
  
  if (success) {
    console.log('\n🎯 Next steps:');
    console.log('1. Log out of the application');
    console.log('2. Log back in with the updated user');
    console.log('3. Try accessing the admin dashboard again');
  }
  
  await mongoose.disconnect();
  process.exit(success ? 0 : 1);
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeUserAdmin };
