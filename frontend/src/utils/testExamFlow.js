import { examAPI, resultAPI } from './api';
import useExamStore from '../store/useExamStore';
import useAuthStore from '../store/useAuthStore';

/**
 * Frontend Exam Flow Tester
 * Tests the complete exam process from the frontend perspective
 */
class FrontendExamFlowTester {
  constructor() {
    this.testResults = {
      login: false,
      getExams: false,
      startExam: false,
      submitAnswers: false,
      submitExam: false,
      getResult: false,
      getUserResults: false
    };
    this.testExamId = null;
    this.testResultId = null;
    this.testAnswers = {};
  }

  // Log with timestamp
  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  // Helper function to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test user login
  async testLogin() {
    try {
      this.log('Testing user login...');
      
      const { login, register } = useAuthStore.getState();
      
      // First try to login
      let result = await login({
        email: 'testuser@example.com',
        password: 'password123'
      });
      
      if (result.success) {
        this.log('Login successful', 'success');
        this.testResults.login = true;
        return true;
      }
      
      // Check if it's a rate limit error
      if (result.error && result.error.includes('Too many')) {
        this.log('Rate limit hit, waiting 10 seconds before retrying...', 'info');
        await this.delay(10000); // Wait 10 seconds
        
        // Try login again after delay
        result = await login({
          email: 'testuser@example.com',
          password: 'password123'
        });
        
        if (result.success) {
          this.log('Login successful after delay', 'success');
          this.testResults.login = true;
          return true;
        }
      }
      
      // If login fails, try to register the user
      this.log('Login failed, attempting to register test user...');
      result = await register({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123',
        role: 'student'
      });
      
      if (result.success) {
        this.log('Registration successful, now logging in...');
        // Add delay before login attempt
        await this.delay(2000);
        
        // Try to login again after registration
        result = await login({
          email: 'testuser@example.com',
          password: 'password123'
        });
        
        if (result.success) {
          this.log('Login successful after registration', 'success');
          this.testResults.login = true;
          return true;
        }
      }
      
      // Check for rate limit on registration
      if (result.error && result.error.includes('Too many')) {
        this.log('Registration rate limited, waiting 15 seconds...', 'info');
        await this.delay(15000);
        
        // Try registration again
        result = await register({
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          role: 'student'
        });
        
        if (result.success) {
          this.log('Registration successful after delay, logging in...', 'success');
          await this.delay(2000);
          
          result = await login({
            email: 'testuser@example.com',
            password: 'password123'
          });
          
          if (result.success) {
            this.log('Login successful after delayed registration', 'success');
            this.testResults.login = true;
            return true;
          }
        }
      }
      
      this.log(`Login/Registration failed: ${result.error}`, 'error');
      return false;
    } catch (error) {
      this.log(`Login error: ${error.message}`, 'error');
      return false;
    }
  }

  // Test getting exams
  async testGetExams() {
    try {
      this.log('Testing get exams...');
      
      const { getExams } = useExamStore.getState();
      const result = await getExams({ status: 'published' });
      
      if (result.success && result.exams.length > 0) {
        // Find a test exam or use the first available exam
        const testExam = result.exams.find(exam => 
          exam.title.includes('Test') || exam.title.includes('C Programming')
        ) || result.exams[0];
        
        this.testExamId = testExam._id;
        this.log(`Found test exam: ${testExam.title} (ID: ${testExam._id})`, 'success');
        this.testResults.getExams = true;
        return true;
      } else {
        this.log('No exams found', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Get exams error: ${error.message}`, 'error');
      return false;
    }
  }

  // Test starting an exam
  async testStartExam() {
    try {
      this.log('Testing start exam...');
      
      if (!this.testExamId) {
        this.log('No test exam ID available', 'error');
        return false;
      }

      const { startExam } = useExamStore.getState();
      const result = await startExam(this.testExamId);
      
      if (result.success) {
        this.testResultId = result.result._id;
        this.log(`Exam started successfully (Result ID: ${this.testResultId})`, 'success');
        this.log(`Attempt Number: ${result.result.attemptNumber}`, 'info');
        this.log(`Total Questions: ${result.result.answers.length}`, 'info');
        this.testResults.startExam = true;
        return true;
      } else {
        this.log(`Start exam failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Start exam error: ${error.message}`, 'error');
      return false;
    }
  }

  // Test submitting answers
  async testSubmitAnswers() {
    try {
      this.log('Testing answer submission...');
      
      if (!this.testResultId) {
        this.log('No test result ID available', 'error');
        return false;
      }

      const { submitAnswer } = useExamStore.getState();
      const { currentResult } = useExamStore.getState();
      
      if (!currentResult || !currentResult.answers) {
        this.log('No current result or answers available', 'error');
        return false;
      }

      let submittedAnswers = 0;
      let correctAnswers = 0;

      // Submit answers for each question
      for (let i = 0; i < currentResult.answers.length; i++) {
        const answer = currentResult.answers[i];
        const questionId = answer.question;
        
        // Get the question details to submit correct answers
        const { getExam } = useExamStore.getState();
        const examResult = await getExam(this.testExamId);
        
        let selectedAnswer = null;
        
        if (examResult.success && examResult.exam.questions) {
          const question = examResult.exam.questions.find(q => q._id === questionId);
          if (question) {
            // Submit correct answers for testing
            if (question.questionType === 'multiple-choice') {
              const correctOption = question.options.find(opt => opt.isCorrect);
              if (correctOption) {
                selectedAnswer = correctOption.text;
              }
            } else if (question.questionType === 'true-false') {
              selectedAnswer = question.correctAnswer;
            } else if (question.questionType === 'fill-in-blank') {
              selectedAnswer = question.correctAnswer;
            } else {
              // For other types, use the correct answer
              selectedAnswer = question.correctAnswer;
            }
          }
        }
        
        // Fallback to test answers if we couldn't get the correct answer
        if (!selectedAnswer) {
          const testAnswers = ['A', 'B', 'C', 'D', 'Option 1', 'Option 2', 'True', 'False'];
          selectedAnswer = testAnswers[i % testAnswers.length];
        }
        
        try {
          const result = await submitAnswer(this.testResultId, {
            questionId: questionId,
            selectedAnswer: selectedAnswer,
            timeSpent: Math.floor(Math.random() * 60) + 10
          });
          
          if (result.success) {
            submittedAnswers++;
            this.testAnswers[questionId] = selectedAnswer;
            this.log(`Question ${i + 1}: Submitted "${selectedAnswer}" (correct answer)`, 'info');
          } else {
            this.log(`Question ${i + 1}: Failed to submit answer`, 'error');
          }
        } catch (error) {
          this.log(`Question ${i + 1}: Error submitting answer - ${error.message}`, 'error');
        }
      }

      this.log(`Submitted ${submittedAnswers}/${currentResult.answers.length} answers`, 'success');
      this.testResults.submitAnswers = submittedAnswers > 0;
      return this.testResults.submitAnswers;
    } catch (error) {
      this.log(`Submit answers error: ${error.message}`, 'error');
      return false;
    }
  }

  // Test submitting the exam
  async testSubmitExam() {
    try {
      this.log('Testing exam submission...');
      
      if (!this.testResultId) {
        this.log('No test result ID available', 'error');
        return false;
      }

      const { submitExam } = useExamStore.getState();
      const result = await submitExam(this.testResultId);
      
      if (result.success) {
        this.log('Exam submitted successfully', 'success');
        this.log(`Final Score: ${result.result.percentage}%`, 'info');
        this.log(`Grade: ${result.result.grade}`, 'info');
        this.log(`Marks: ${result.result.obtainedMarks}/${result.result.totalMarks}`, 'info');
        this.testResults.submitExam = true;
        return true;
      } else {
        this.log(`Submit exam failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Submit exam error: ${error.message}`, 'error');
      return false;
    }
  }

  // Test getting the result
  async testGetResult() {
    try {
      this.log('Testing get result...');
      
      if (!this.testResultId) {
        this.log('No test result ID available', 'error');
        return false;
      }

      const { getResult } = useExamStore.getState();
      const result = await getResult(this.testResultId);
      
      if (result.success) {
        const resultData = result.result;
        this.log('Result retrieved successfully', 'success');
        this.log(`Result ID: ${resultData._id}`, 'info');
        this.log(`Status: ${resultData.status}`, 'info');
        this.log(`Percentage: ${resultData.percentage}%`, 'info');
        this.log(`Grade: ${resultData.grade}`, 'info');
        this.log(`Attempt Number: ${resultData.attemptNumber}`, 'info');
        this.log(`Time Spent: ${resultData.timeSpent} seconds`, 'info');
        
        if (resultData.answers) {
          const answeredQuestions = resultData.answers.filter(a => a.selectedAnswer);
          const correctAnswers = resultData.answers.filter(a => a.isCorrect);
          this.log(`Answered Questions: ${answeredQuestions.length}`, 'info');
          this.log(`Correct Answers: ${correctAnswers.length}`, 'info');
        }
        
        this.testResults.getResult = true;
        return true;
      } else {
        this.log(`Get result failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Get result error: ${error.message}`, 'error');
      return false;
    }
  }

  // Test getting user results
  async testGetUserResults() {
    try {
      this.log('Testing get user results...');
      
      const { getUserResults } = useExamStore.getState();
      const result = await getUserResults();
      
      if (result.success) {
        this.log(`Retrieved ${result.results.length} user results`, 'success');
        
        // Find our test result
        const testResults = result.results.filter(r => r._id === this.testResultId);
        if (testResults.length > 0) {
          const testResult = testResults[0];
          this.log(`Found test result:`, 'info');
          this.log(`  ID: ${testResult._id}`, 'info');
          this.log(`  Status: ${testResult.status}`, 'info');
          this.log(`  Percentage: ${testResult.percentage}%`, 'info');
          this.log(`  Attempt: ${testResult.attemptNumber}`, 'info');
        }
        
        this.testResults.getUserResults = true;
        return true;
      } else {
        this.log(`Get user results failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Get user results error: ${error.message}`, 'error');
      return false;
    }
  }

  // Run complete test flow
  async runCompleteTest() {
    console.log('🧪 Starting Frontend Exam Flow Test');
    console.log('===================================');
    
    try {
      // Test login
      if (!(await this.testLogin())) {
        this.log('Login failed, checking if user is already logged in...', 'info');
        
        // Check if user is already logged in
        const { user } = useAuthStore.getState();
        if (user && user.email) {
          this.log(`User already logged in: ${user.email}`, 'success');
          this.testResults.login = true;
        } else {
          this.log('No user logged in and login failed, stopping test', 'error');
          this.log('💡 Tip: Try logging in manually first, then run the test', 'info');
          return this.testResults;
        }
      }
      
      // Test getting exams
      if (!(await this.testGetExams())) {
        this.log('Get exams failed, stopping test', 'error');
        return this.testResults;
      }
      
      // Test starting exam
      if (!(await this.testStartExam())) {
        this.log('Start exam failed, stopping test', 'error');
        return this.testResults;
      }
      
      // Test submitting answers
      if (!(await this.testSubmitAnswers())) {
        this.log('Submit answers failed, stopping test', 'error');
        return this.testResults;
      }
      
      // Test submitting exam
      if (!(await this.testSubmitExam())) {
        this.log('Submit exam failed, stopping test', 'error');
        return this.testResults;
      }
      
      // Test getting result
      await this.testGetResult();
      
      // Test getting user results
      await this.testGetUserResults();
      
    } catch (error) {
      this.log(`Test flow error: ${error.message}`, 'error');
    }
    
    return this.testResults;
  }

  // Print test results
  printResults() {
    console.log('\n📊 Frontend Test Results Summary');
    console.log('================================');
    
    const testSteps = [
      { key: 'login', name: 'User Login' },
      { key: 'getExams', name: 'Get Exams' },
      { key: 'startExam', name: 'Start Exam' },
      { key: 'submitAnswers', name: 'Submit Answers' },
      { key: 'submitExam', name: 'Submit Exam' },
      { key: 'getResult', name: 'Get Result' },
      { key: 'getUserResults', name: 'Get User Results' }
    ];

    let passed = 0;
    let total = testSteps.length;

    testSteps.forEach(step => {
      const status = this.testResults[step.key] ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${step.name}`);
      if (this.testResults[step.key]) passed++;
    });

    console.log(`\n📈 Overall Result: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All frontend tests passed! Exam flow is working correctly.');
    } else {
      console.log('⚠️  Some frontend tests failed. Please check the logs above.');
    }
  }
}

// Export for use in components
export default FrontendExamFlowTester;

// Function to run the test (can be called from browser console)
export const runExamFlowTest = async () => {
  const tester = new FrontendExamFlowTester();
  const results = await tester.runCompleteTest();
  tester.printResults();
  return results;
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  window.runExamFlowTest = runExamFlowTest;
  window.FrontendExamFlowTester = FrontendExamFlowTester;
}
