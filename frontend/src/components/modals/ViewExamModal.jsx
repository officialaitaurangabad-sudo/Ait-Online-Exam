import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Users, BookOpen, Target, FileText, User } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'

const ViewExamModal = ({ isOpen, onClose, exam }) => {
  if (!exam) return null

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'text-gray-600 bg-gray-100'
      case 'published': return 'text-green-600 bg-green-100'
      case 'archived': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-2xl font-bold">{exam.title}</CardTitle>
                  <CardDescription className="text-lg">
                    {exam.description || 'No description provided'}
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
              
              <CardContent className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Subject</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{exam.subject}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Category</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{exam.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Duration</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{formatDuration(exam.duration)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Questions</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {exam.questions?.length || 0} / {exam.totalQuestions}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exam Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900">Exam Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 flex items-center justify-center">
                          <span className="text-lg">📊</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium  text-white dark:text-gray-900">Total Marks</p>
                          <p className="text-sm text-white dark:text-gray-900">{exam.totalMarks}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 flex items-center justify-center">
                          <span className="text-lg">🎯</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Passing Marks</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{exam.passingMarks}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 flex items-center justify-center">
                          <span className="text-lg">🔄</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Max Attempts</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{exam.allowedAttempts}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="h-5 w-5 flex items-center justify-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                            {exam.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white dark:text-gray-900">Status</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{exam.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Information */}
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white dark:text-gray-900">Schedule</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-white dark:text-gray-900">Start Date</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(exam.startDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-white dark:text-gray-900">End Date</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(exam.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                {exam.instructions && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900">Instructions</h3>
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {exam.instructions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Created By */}
                {exam.createdBy && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-white dark:text-gray-900">Created By</h3>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 text-black    dark:text-white">
                          {exam.createdBy.firstName} {exam.createdBy.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{exam.createdBy.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ViewExamModal
