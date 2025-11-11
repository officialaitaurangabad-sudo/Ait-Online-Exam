import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, Loader, RefreshCw } from 'lucide-react';
import FrontendExamFlowTester from '../utils/testExamFlow';

const TestExamFlow = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [logs, setLogs] = useState([]);

  // Override console.log to capture logs
  const captureLogs = () => {
    const originalLog = console.log;
    const newLogs = [];
    
    console.log = (...args) => {
      const message = args.join(' ');
      newLogs.push({
        timestamp: new Date().toLocaleTimeString(),
        message: message,
        type: message.includes('❌') ? 'error' : message.includes('✅') ? 'success' : 'info'
      });
      originalLog(...args);
    };
    
    return () => {
      console.log = originalLog;
      setLogs(newLogs);
    };
  };

  const runTest = async () => {
    setIsRunning(true);
    setTestResults(null);
    setLogs([]);
    
    // Capture logs
    const restoreLogs = captureLogs();
    
    try {
      const tester = new FrontendExamFlowTester();
      const results = await tester.runCompleteTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      restoreLogs();
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === null) return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    if (status) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-blue-500" />;
    }
  };

  const testSteps = [
    { key: 'login', name: 'User Login', description: 'Authenticate with test credentials' },
    { key: 'getExams', name: 'Get Exams', description: 'Fetch available exams' },
    { key: 'startExam', name: 'Start Exam', description: 'Initialize exam session' },
    { key: 'submitAnswers', name: 'Submit Answers', description: 'Submit answers to questions' },
    { key: 'submitExam', name: 'Submit Exam', description: 'Finalize exam submission' },
    { key: 'getResult', name: 'Get Result', description: 'Retrieve exam result' },
    { key: 'getUserResults', name: 'Get User Results', description: 'Fetch user result history' }
  ];

  const passedTests = testResults ? Object.values(testResults).filter(Boolean).length : 0;
  const totalTests = testSteps.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Exam Flow Test Suite
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive testing of the exam process from start to finish
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Run Exam Flow Test
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This will test the complete exam process including login, exam start, answer submission, and result retrieval.
              </p>
            </div>
            <button
              onClick={runTest}
              disabled={isRunning}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Running Test...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Test Results
              </h2>
              <div className={`px-4 py-2 rounded-lg font-medium ${
                passedTests === totalTests
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {passedTests}/{totalTests} Tests Passed
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testSteps.map((step) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    testResults[step.key]
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    {getStatusIcon(testResults[step.key])}
                    <h3 className="ml-2 font-medium text-gray-900 dark:text-white">
                      {step.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Test Logs */}
        {logs.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Test Logs
              </h2>
              <button
                onClick={() => setLogs([])}
                className="flex items-center px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Clear
              </button>
            </div>
            
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex items-start mb-1">
                  <span className="text-gray-500 mr-2 min-w-[80px]">
                    {log.timestamp}
                  </span>
                  <span className="mr-2">
                    {getLogIcon(log.type)}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            Test Instructions
          </h3>
          <ul className="text-blue-800 dark:text-blue-300 space-y-2">
            <li>• Make sure the backend server is running on port 5000</li>
            <li>• Ensure you have a test user with email 'adeeb@ait.com' and password 'password123'</li>
            <li>• The test will create a temporary exam and submit it</li>
            <li>• Check the browser console for detailed logs</li>
            <li>• All test data will be cleaned up automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestExamFlow;
