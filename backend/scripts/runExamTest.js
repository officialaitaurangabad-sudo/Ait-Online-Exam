#!/usr/bin/env node

/**
 * Simple script to run the exam flow test
 * Usage: node scripts/runExamTest.js
 */

const ExamFlowTester = require('./testExamFlow');

async function main() {
  console.log('🚀 Starting Exam Flow Test...\n');
  
  const tester = new ExamFlowTester();
  
  try {
    const results = await tester.runCompleteTest();
    tester.printResults(results);
    
    // Exit with appropriate code
    const allPassed = Object.values(results).every(result => result === true);
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

main();
