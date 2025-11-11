import { motion, AnimatePresence } from 'framer-motion'
import { X, BookOpen, Target, Clock, Star, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'

const ViewQuestionModal = ({ isOpen, onClose, question }) => {
  if (!question) return null

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'true-false':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'short-answer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'essay':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-bold">Question Details</CardTitle>
                  <CardDescription>
                    View complete question information
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="space-y-6">
                  {/* Question Text */}
                  <div>
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Question</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {question.questionText}
                      </p>
                    </div>
                  </div>

                  {/* Question Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white dark:text-gray-900">Question Information</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-white dark:text-gray-900">Subject</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{question.subject}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Target className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-white dark:text-gray-900">Category</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{question.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Star className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-white dark:text-gray-900">Marks</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{question.marks}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white dark:text-gray-900">Question Properties</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getTypeColor(question.questionType)}`}>
                            {question.questionType.replace('-', ' ').toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white dark:text-gray-900">Type</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-white dark:text-gray-900">Difficulty</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="h-5 w-5 flex items-center justify-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              question.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {question.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white dark:text-gray-900">Status</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Options for Multiple Choice */}
                  {question.questionType === 'multiple-choice' && question.options && question.options.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Options</h3>
                      <div className="space-y-2">
                        {question.options.map((option, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border flex items-center space-x-3 ${
                              option.isCorrect
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {option.isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${
                                option.isCorrect
                                  ? 'text-green-900 dark:text-green-700 font-medium'
                                  : 'text-gray-900 dark:text-white'
                              }`}>
                                {option.text}
                              </p>
                            </div>
                            {option.isCorrect && (
                              <span className="text-xs font-medium  bg-green-800 text--gray-900 dark:text-white px-2 py-1 rounded">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer for other types */}
                  {question.questionType !== 'multiple-choice' && question.correctAnswer && (
                    <div>
                      <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Correct Answer</h3>
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-green-900 dark:text-green-100 font-medium">
                          {question.correctAnswer}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  {question.explanation && (
                    <div>
                      <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Explanation</h3>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                          {question.explanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Usage Statistics */}
                  <div>
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Usage Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {question.usageCount || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Times Used</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {question.averageScore || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {question.successRate || 'N/A'}%
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div>
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Timestamps</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Created</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(question.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Last Updated</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(question.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Created By */}
                  {question.createdBy && (
                    <div>
                      <h3 className="text-lg font-semibold text-white dark:text-gray-900 mb-3">Created By</h3>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {question.createdBy.firstName?.[0]}{question.createdBy.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">
                            {question.createdBy.firstName} {question.createdBy.lastName}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{question.createdBy.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ViewQuestionModal
