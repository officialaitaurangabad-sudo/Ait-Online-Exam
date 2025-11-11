const fs = require('fs');
const path = require('path');

// Script to modify analytics route access
const modifyAnalyticsAccess = (allowedRoles = ['admin', 'teacher']) => {
  console.log('🔧 Modifying Analytics Route Access...');
  console.log('='.repeat(50));
  
  const routesPath = path.join(__dirname, '../routes/analyticsRoutes.js');
  
  try {
    // Read the current routes file
    let content = fs.readFileSync(routesPath, 'utf8');
    
    console.log('📄 Current analytics routes file found');
    
    // Find the dashboard route line
    const dashboardRouteRegex = /router\.get\('\/dashboard', authorize\(\[.*?\]\), getDashboard\);/;
    const match = content.match(dashboardRouteRegex);
    
    if (!match) {
      console.log('❌ Could not find dashboard route in analyticsRoutes.js');
      return false;
    }
    
    const currentLine = match[0];
    console.log('🔍 Current dashboard route:');
    console.log(`   ${currentLine}`);
    
    // Create new line with updated roles
    const newLine = `router.get('/dashboard', authorize([${allowedRoles.map(role => `'${role}'`).join(', ')}]), getDashboard);`;
    
    console.log('🔄 New dashboard route:');
    console.log(`   ${newLine}`);
    
    // Replace the line
    const newContent = content.replace(dashboardRouteRegex, newLine);
    
    // Write back to file
    fs.writeFileSync(routesPath, newContent, 'utf8');
    
    console.log('✅ Successfully updated analytics routes!');
    console.log('📋 Allowed roles for analytics dashboard:');
    allowedRoles.forEach(role => console.log(`   - ${role}`));
    
    console.log('\n🔄 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Try accessing the analytics dashboard again');
    console.log('3. The new roles should now have access');
    
    return true;
    
  } catch (error) {
    console.log('❌ Error modifying routes file:', error.message);
    return false;
  }
};

// Show current analytics access
const showCurrentAccess = () => {
  console.log('📋 Current Analytics Access Configuration:');
  console.log('='.repeat(50));
  
  const routesPath = path.join(__dirname, '../routes/analyticsRoutes.js');
  
  try {
    const content = fs.readFileSync(routesPath, 'utf8');
    
    // Find all authorize calls
    const authorizeRegex = /authorize\(\[(.*?)\]\)/g;
    let match;
    
    console.log('🔐 Protected routes and their allowed roles:');
    
    while ((match = authorizeRegex.exec(content)) !== null) {
      const roles = match[1].split(',').map(role => role.trim().replace(/'/g, ''));
      console.log(`   - ${roles.join(', ')}`);
    }
    
  } catch (error) {
    console.log('❌ Error reading routes file:', error.message);
  }
};

// Main execution
const main = () => {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'show') {
    showCurrentAccess();
  } else if (command === 'modify') {
    const roles = args.slice(1);
    if (roles.length === 0) {
      console.log('❌ Please specify roles to allow');
      console.log('Usage: node modifyAnalyticsAccess.js modify admin teacher student');
      return;
    }
    modifyAnalyticsAccess(roles);
  } else {
    console.log('🔧 Analytics Access Modifier');
    console.log('='.repeat(50));
    console.log('Usage:');
    console.log('  node modifyAnalyticsAccess.js show                    - Show current access');
    console.log('  node modifyAnalyticsAccess.js modify admin teacher    - Allow admin and teacher');
    console.log('  node modifyAnalyticsAccess.js modify admin student    - Allow admin and student');
    console.log('  node modifyAnalyticsAccess.js modify admin teacher student - Allow all roles');
    console.log('');
    console.log('Examples:');
    console.log('  node modifyAnalyticsAccess.js show');
    console.log('  node modifyAnalyticsAccess.js modify admin teacher student');
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { modifyAnalyticsAccess, showCurrentAccess };
