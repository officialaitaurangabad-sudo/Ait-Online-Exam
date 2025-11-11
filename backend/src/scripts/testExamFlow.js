const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('../models/examModel');
const Question = require('../models/questionModel');
const User = require('../models/userModel');
const Result = require('../models/resultModel');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const TEST_USER_EMAIL = 'adeeb@ait.com';
const TEST_USER_PASSWORD = 'password123';

class ExamFlowTester {
  constructor() {
    this.authToken = null;
    this.testExam = null;
    this.testResult = null;
    this.testUser = null;
  }

  // Initialize database connection
  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ait-exam-platform-dev');
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  // Login and get auth token
  async login() {
    try {
      console.log('\n🔐 Logging in...');
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (response.data.success) {
        this.authToken = response.data.token;
        this.testUser = response.data.user;
        console.log(`✅ Logged in as: ${this.testUser.email}`);
        console.log(`   User ID: ${this.testUser._id}`);
        return true;
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Get or create test exam
  async setupTestExam() {
    try {
      console.log('\n📝 Setting up test exam...');
      
      // Try to find existing test exam
      this.testExam = await Exam.findOne({ title: 'Test Exam - Automated Testing' });
      
      if (!this.testExam) {
        // Create test questions first
        const questions = await this.createTestQuestions();
        
        // Create test exam
        this.testExam = await Exam.create({
          title: 'Test Exam - Automated Testing',
          description: 'This is an automated test exam for testing the exam flow',
          subject: 'Computer Science',
          category: 'Programming',
          duration: 30, // 30 minutes
          totalQuestions: questions.length,
          totalMarks: questions.length * 2, // 2 marks per question
          passingMarks: Math.ceil(questions.length * 0.6), // 60% passing
          allowedAttempts: 3,
          status: 'published',
          questions: questions.map(q => q._id),
          createdBy: this.testUser._id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        });
        
        console.log(`✅ Created test exam: ${this.testExam.title}`);
        console.log(`   Exam ID: ${this.testExam._id}`);
        console.log(`   Questions: ${this.testExam.totalQuestions}`);
        console.log(`   Duration: ${this.testExam.duration} minutes`);
      } else {
        console.log(`✅ Found existing test exam: ${this.testExam.title}`);
        console.log(`   Exam ID: ${this.testExam._id}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to setup test exam:', error.message);
      return false;
    }
  }

  // Create test questions
  async createTestQuestions() {
    const questions = [];
    
    const questionData = [
      {
        questionText: 'What is the output of console.log(2 + 2)?',
        questionType: 'multiple-choice',
        options: [
          { text: '4', isCorrect: true },
          { text: '22', isCorrect: false },
          { text: 'undefined', isCorrect: false },
          { text: 'error', isCorrect: false }
        ],
        correctAnswer: '4',
        explanation: '2 + 2 equals 4 in JavaScript',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        category: 'Programming'
      },
      {
        questionText: 'Which keyword is used to declare a variable in JavaScript?',
        questionType: 'multiple-choice',
        options: [
          { text: 'var', isCorrect: true },
          { text: 'int', isCorrect: false },
          { text: 'string', isCorrect: false },
          { text: 'float', isCorrect: false }
        ],
        correctAnswer: 'var',
        explanation: 'var, let, and const are used to declare variables in JavaScript',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        category: 'Programming'
      },
      {
        questionText: 'What does HTML stand for?',
        questionType: 'multiple-choice',
        options: [
          { text: 'HyperText Markup Language', isCorrect: true },
          { text: 'High-level Text Markup Language', isCorrect: false },
          { text: 'Home Tool Markup Language', isCorrect: false },
          { text: 'Hyperlink and Text Markup Language', isCorrect: false }
        ],
        correctAnswer: 'HyperText Markup Language',
        explanation: 'HTML stands for HyperText Markup Language',
        marks: 2,
        difficulty: 'easy',
        subject: 'Computer Science',
        category: 'Web Development'
      }
    ];

    for (const qData of questionData) {
      const question = await Question.create(qData);
      questions.push(question);
    }

    console.log(`✅ Created ${questions.length} test questions`);
    return questions;
  }

  // Test exam start
  async testStartExam() {
    try {
      console.log('\n🚀 Testing exam start...');
      
      const response = await axios.post(
        `${API_BASE_URL}/results/start`,
        { examId: this.testExam._id },
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        this.testResult = response.data.data.result;
        console.log(`✅ Exam started successfully`);
        console.log(`   Result ID: ${this.testResult._id}`);
        console.log(`   Attempt Number: ${this.testResult.attemptNumber}`);
        console.log(`   Status: ${this.testResult.status}`);
        console.log(`   Total Questions: ${this.testResult.answers.length}`);
        return true;
      } else {
        throw new Error('Failed to start exam');
      }
    } catch (error) {
      console.error('❌ Failed to start exam:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test answer submission
  async testAnswerSubmission() {
    try {
      console.log('\n📝 Testing answer submission...');
      
      if (!this.testResult || !this.testResult.answers) {
        throw new Error('No active exam result found');
      }

      let correctAnswers = 0;
      let totalAnswers = 0;

      // Submit answers for each question
      for (let i = 0; i < this.testResult.answers.length; i++) {
        const answer = this.testResult.answers[i];
        const questionId = answer.question;
        
        // Get the question to find correct answer
        const question = await Question.findById(questionId);
        if (!question) continue;

        let selectedAnswer = null;
        
        // For multiple choice, select the correct answer
        if (question.questionType === 'multiple-choice') {
          const correctOption = question.options.find(opt => opt.isCorrect);
          if (correctOption) {
            selectedAnswer = correctOption.text;
            correctAnswers++;
          }
        }
        
        // Submit the answer
        const response = await axios.put(
          `${API_BASE_URL}/results/${this.testResult._id}/answer`,
          {
            questionId: questionId,
            selectedAnswer: selectedAnswer,
            timeSpent: Math.floor(Math.random() * 60) + 10 // Random time between 10-70 seconds
          },
          { headers: { Authorization: `Bearer ${this.authToken}` } }
        );

        if (response.data.success) {
          totalAnswers++;
          console.log(`   ✅ Question ${i + 1}: ${selectedAnswer || 'No answer'}`);
        } else {
          console.log(`   ❌ Question ${i + 1}: Failed to submit answer`);
        }
      }

      console.log(`✅ Submitted ${totalAnswers}/${this.testResult.answers.length} answers`);
      console.log(`   Correct answers: ${correctAnswers}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to submit answers:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test exam submission
  async testExamSubmission() {
    try {
      console.log('\n📤 Testing exam submission...');
      
      const response = await axios.post(
        `${API_BASE_URL}/results/${this.testResult._id}/submit`,
        {},
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        console.log(`✅ Exam submitted successfully`);
        console.log(`   Final Result ID: ${response.data.data.result._id}`);
        console.log(`   Status: ${response.data.data.result.status}`);
        console.log(`   Score: ${response.data.data.result.percentage}%`);
        console.log(`   Marks: ${response.data.data.result.obtainedMarks}/${response.data.data.result.totalMarks}`);
        console.log(`   Grade: ${response.data.data.result.grade}`);
        return true;
      } else {
        throw new Error('Failed to submit exam');
      }
    } catch (error) {
      console.error('❌ Failed to submit exam:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test result retrieval
  async testResultRetrieval() {
    try {
      console.log('\n📊 Testing result retrieval...');
      
      const response = await axios.get(
        `${API_BASE_URL}/results/${this.testResult._id}`,
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        const result = response.data.data.result;
        console.log(`✅ Result retrieved successfully`);
        console.log(`   Result ID: ${result._id}`);
        console.log(`   Exam: ${result.exam?.title || 'N/A'}`);
        console.log(`   Student: ${result.student?.email || 'N/A'}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Percentage: ${result.percentage}%`);
        console.log(`   Grade: ${result.grade}`);
        console.log(`   Attempt Number: ${result.attemptNumber}`);
        console.log(`   Time Spent: ${result.timeSpent} seconds`);
        console.log(`   Answers: ${result.answers?.length || 0} questions`);
        
        // Check if answers are properly populated
        if (result.answers && result.answers.length > 0) {
          const answeredQuestions = result.answers.filter(a => a.selectedAnswer);
          const correctAnswers = result.answers.filter(a => a.isCorrect);
          console.log(`   Answered Questions: ${answeredQuestions.length}`);
          console.log(`   Correct Answers: ${correctAnswers.length}`);
        }
        
        return true;
      } else {
        throw new Error('Failed to retrieve result');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve result:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test user results
  async testUserResults() {
    try {
      console.log('\n📋 Testing user results...');
      
      const response = await axios.get(
        `${API_BASE_URL}/results`,
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        const results = response.data.results;
        console.log(`✅ Retrieved ${results.length} user results`);
        
        // Find our test result
        const testResults = results.filter(r => r.exam && r.exam._id === this.testExam._id);
        console.log(`   Test exam results: ${testResults.length}`);
        
        testResults.forEach((result, index) => {
          console.log(`   Result ${index + 1}:`);
          console.log(`     ID: ${result._id}`);
          console.log(`     Status: ${result.status}`);
          console.log(`     Percentage: ${result.percentage}%`);
          console.log(`     Attempt: ${result.attemptNumber}`);
          console.log(`     Date: ${new Date(result.createdAt).toLocaleString()}`);
        });
        
        return true;
      } else {
        throw new Error('Failed to retrieve user results');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve user results:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Test analytics
  async testAnalytics() {
    try {
      console.log('\n📈 Testing analytics...');
      
      const response = await axios.get(
        `${API_BASE_URL}/analytics/student/${this.testUser._id}`,
        { headers: { Authorization: `Bearer ${this.authToken}` } }
      );

      if (response.data.success) {
        const analytics = response.data.analytics;
        console.log(`✅ Analytics retrieved successfully`);
        console.log(`   Total Exams: ${analytics.totalExams}`);
        console.log(`   Average Score: ${analytics.averagePercentage}%`);
        console.log(`   Pass Rate: ${analytics.passRate}%`);
        console.log(`   Recent Performance: ${analytics.recentPerformance?.length || 0} exams`);
        
        if (analytics.recentPerformance && analytics.recentPerformance.length > 0) {
          analytics.recentPerformance.forEach((perf, index) => {
            console.log(`     ${index + 1}. ${perf.examTitle}: ${perf.percentage}% (${perf.grade})`);
          });
        }
        
        return true;
      } else {
        throw new Error('Failed to retrieve analytics');
      }
    } catch (error) {
      console.error('❌ Failed to retrieve analytics:', error.response?.data?.message || error.message);
      return false;
    }
  }

  // Cleanup test data
  async cleanup() {
    try {
      console.log('\n🧹 Cleaning up test data...');
      
      // Delete test results
      if (this.testResult) {
        await Result.deleteMany({ _id: this.testResult._id });
        console.log(`✅ Deleted test result: ${this.testResult._id}`);
      }
      
      // Delete test exam
      if (this.testExam) {
        await Exam.deleteOne({ _id: this.testExam._id });
        console.log(`✅ Deleted test exam: ${this.testExam._id}`);
      }
      
      // Delete test questions
      await Question.deleteMany({ questionText: { $regex: /Test Exam|console\.log|JavaScript|HTML/ } });
      console.log(`✅ Deleted test questions`);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  // Run complete test flow
  async runCompleteTest() {
    console.log('🧪 Starting Complete Exam Flow Test');
    console.log('=====================================');
    
    const results = {
      login: false,
      setupExam: false,
      startExam: false,
      submitAnswers: false,
      submitExam: false,
      retrieveResult: false,
      userResults: false,
      analytics: false
    };

    try {
      // Connect to database
      await this.connectDB();
      
      // Test login
      results.login = await this.login();
      if (!results.login) return results;
      
      // Setup test exam
      results.setupExam = await this.setupTestExam();
      if (!results.setupExam) return results;
      
      // Test exam start
      results.startExam = await this.testStartExam();
      if (!results.startExam) return results;
      
      // Test answer submission
      results.submitAnswers = await this.testAnswerSubmission();
      if (!results.submitAnswers) return results;
      
      // Test exam submission
      results.submitExam = await this.testExamSubmission();
      if (!results.submitExam) return results;
      
      // Test result retrieval
      results.retrieveResult = await this.testResultRetrieval();
      
      // Test user results
      results.userResults = await this.testUserResults();
      
      // Test analytics
      results.analytics = await this.testAnalytics();
      
    } catch (error) {
      console.error('❌ Test flow failed:', error.message);
    } finally {
      // Cleanup
      await this.cleanup();
      
      // Close database connection
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }

    return results;
  }

  // Print test results
  printResults(results) {
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    
    const testSteps = [
      { key: 'login', name: 'User Login' },
      { key: 'setupExam', name: 'Exam Setup' },
      { key: 'startExam', name: 'Start Exam' },
      { key: 'submitAnswers', name: 'Submit Answers' },
      { key: 'submitExam', name: 'Submit Exam' },
      { key: 'retrieveResult', name: 'Retrieve Result' },
      { key: 'userResults', name: 'User Results' },
      { key: 'analytics', name: 'Analytics' }
    ];

    let passed = 0;
    let total = testSteps.length;

    testSteps.forEach(step => {
      const status = results[step.key] ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${step.name}`);
      if (results[step.key]) passed++;
    });

    console.log(`\n📈 Overall Result: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Exam flow is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the logs above.');
    }
  }
}

// Main execution
async function main() {
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

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ExamFlowTester;
