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

// Check and update user roles
const checkUserRoles = async () => {
  try {
    console.log('🔍 Checking user roles...');
    
    // Get all users
    const users = await User.find({}).select('firstName lastName email role isActive');
    
    console.log(`\n📊 Found ${users.length} users:`);
    console.log('='.repeat(80));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   ID: ${user._id}`);
      console.log('-'.repeat(40));
    });
    
    // Check for admin users
    const adminUsers = users.filter(user => user.role === 'admin');
    const teacherUsers = users.filter(user => user.role === 'teacher');
    const studentUsers = users.filter(user => user.role === 'student');
    
    console.log('\n📈 Role Summary:');
    console.log(`   Admin users: ${adminUsers.length}`);
    console.log(`   Teacher users: ${teacherUsers.length}`);
    console.log(`   Student users: ${studentUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('\n⚠️  WARNING: No admin users found!');
      console.log('   You need at least one admin user to access the analytics dashboard.');
      
      // Ask if user wants to create an admin
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('\n❓ Do you want to promote a user to admin? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          rl.question('Enter the email of the user to promote to admin: ', async (email) => {
            try {
              const userToUpdate = await User.findOne({ email });
              if (userToUpdate) {
                userToUpdate.role = 'admin';
                await userToUpdate.save();
                console.log(`✅ Successfully promoted ${userToUpdate.firstName} ${userToUpdate.lastName} to admin!`);
              } else {
                console.log('❌ User not found with that email.');
              }
            } catch (error) {
              console.error('❌ Error updating user role:', error);
            }
            rl.close();
            await mongoose.disconnect();
          });
        } else {
          rl.close();
          await mongoose.disconnect();
        }
      });
    } else {
      console.log('\n✅ Admin users found. Analytics dashboard should be accessible.');
      await mongoose.disconnect();
    }
    
  } catch (error) {
    console.error('Error checking user roles:', error);
    await mongoose.disconnect();
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await checkUserRoles();
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkUserRoles };
