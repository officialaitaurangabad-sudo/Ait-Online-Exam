import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, BookOpen, Calendar, Users, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import useExamStore from '../../store/useExamStore'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const MyExams = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    exams = [],
    examResults = [],
    isLoading,
    error,
    getExams,
    getUserResults,
    clearError
  } = useExamStore()

  const [activeFilter, setActiveFilter] = useState('all')
  const [combinedExams, setCombinedExams] = useState([])

  // Load exams and results on component mount
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading exam data on mount...')
      try {
        const [examsResult, resultsResult] = await Promise.all([
          getExams({ status: 'published', _t: Date.now() }),
          getUserResults()
        ])
        console.log('Loaded exams:', examsResult)
        console.log('Loaded results:', resultsResult)
      } catch (error) {
        console.error('Error loading exam data:', error)
      }
    }
    
    loadData()
  }, [getExams, getUserResults])

  // Combine exams with results to determine status
  useEffect(() => {
    const now = new Date()
    console.log('MyExams - Combining exams with results:', { exams: exams.length, examResults: examResults.length })
    console.log('MyExams - User assigned exams:', user?.assignedExams)
    
    // Filter exams to only show assigned ones
    const assignedExamIds = user?.assignedExams || []
    const filteredExams = exams.filter(exam => assignedExamIds.includes(exam._id))
    console.log('MyExams - Filtered exams for student:', filteredExams.length, 'out of', exams.length)
    
    const combined = filteredExams.map(exam => {
      const results = examResults.filter(r => r.exam._id === exam._id)
      const latestResult = results.length > 0 ? results[results.length - 1] : null
      const startDate = new Date(exam.startDate)
      const endDate = new Date(exam.endDate)
      const allowedAttempts = exam.allowedAttempts || 1
      const currentAttempts = results.length
      
      console.log(`Results for exam ${exam.title}:`, {
        examId: exam._id,
        resultsCount: results.length,
        results: results.map(r => ({ id: r._id, status: r.status, examId: r.exam._id })),
        latestResult: latestResult ? { id: latestResult._id, status: latestResult.status } : null
      })
      
      const isWithinDateRange = now >= startDate && now <= endDate
      console.log(`Exam ${exam.title}:`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        now: now.toISOString(),
        allowedAttempts,
        currentAttempts,
        hasResults: results.length > 0,
        latestResultStatus: latestResult?.status,
        isWithinDateRange,
        isActive: exam.isActive,
        status: exam.status,
        examId: exam._id,
        rawExamData: exam
      })
      
      // Detailed date comparison
      console.log(`Date comparison for ${exam.title}:`, {
        now: now.getTime(),
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        nowAfterStart: now >= startDate,
        nowBeforeEnd: now <= endDate,
        timeDiffStart: now.getTime() - startDate.getTime(),
        timeDiffEnd: endDate.getTime() - now.getTime()
      })
      
      let status = 'upcoming'
      
      // Check if exam is within date range and is active
      if (now >= startDate && now <= endDate && exam.isActive && exam.status === 'published') {
        console.log(`Exam ${exam.title}: Within date range and active, checking results...`)
        if (latestResult) {
          console.log(`Exam ${exam.title}: Has results, latest result status: ${latestResult.status}`)
          if (['completed', 'submitted', 'auto-submitted'].includes(latestResult.status)) {
            // Check if user can take more attempts
            if (currentAttempts < allowedAttempts) {
              status = 'available'
              console.log(`Exam ${exam.title}: Setting to available (retake allowed) - attempts: ${currentAttempts}/${allowedAttempts}`)
            } else {
              status = 'completed'
              console.log(`Exam ${exam.title}: Setting to completed (no more attempts) - attempts: ${currentAttempts}/${allowedAttempts}`)
            }
          } else if (latestResult.status === 'in-progress') {
            status = 'in-progress'
            console.log(`Exam ${exam.title}: Setting to in-progress`)
          }
        } else {
          // No results yet, exam is available
          status = 'available'
          console.log(`Exam ${exam.title}: Setting to available (no results yet)`)
        }
      } else if (now > endDate) {
        status = 'expired'
        console.log(`Exam ${exam.title}: Setting to expired`)
      } else if (!exam.isActive) {
        status = 'upcoming'
        console.log(`Exam ${exam.title}: Setting to upcoming (not active)`)
      } else if (exam.status !== 'published') {
        status = 'upcoming'
        console.log(`Exam ${exam.title}: Setting to upcoming (not published)`)
      } else {
        console.log(`Exam ${exam.title}: Setting to upcoming (not started yet)`)
      }
      
      console.log(`Exam ${exam.title}: Final status assigned: ${status}`)
      
      return {
        ...exam,
        status,
        result: latestResult,
        results,
        currentAttempts,
        allowedAttempts,
        totalQuestions: exam.questions?.length || 0,
        isWithinDateRange
      }
    })
    
    console.log('Combined exams with status:', combined.map(e => ({ 
      title: e.title, 
      status: e.status, 
      currentAttempts: e.currentAttempts, 
      allowedAttempts: e.allowedAttempts,
      hasResults: e.results?.length > 0,
      latestResultStatus: e.result?.status,
      isWithinDateRange: e.isWithinDateRange,
      isActive: e.isActive,
      examStatus: e.status
    })))
    setCombinedExams(combined)
  }, [exams, examResults, user?.assignedExams])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'upcoming':
        return 'Upcoming'
      case 'available':
        return 'Available'
      case 'in-progress':
        return 'In Progress'
      case 'expired':
        return 'Expired'
      default:
        return 'Unknown'
    }
  }

  // Filter exams based on active filter
  const filteredExams = combinedExams.filter(exam => {
    if (activeFilter === 'all') return true
    return exam.status === activeFilter
  })

  const handleStartExam = (examId) => {
    navigate(`/exam/${examId}`)
  }

  const handleViewResults = (resultId) => {
    navigate(`/results/${resultId}`)
  }

  const handleRefresh = async () => {
    console.log('Refreshing exam data...')
    try {
      await Promise.all([
        getExams({ status: 'published', _t: Date.now() }),
        getUserResults()
      ])
      console.log('Exam data refreshed')
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container-responsive py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearError}
                className="ml-auto"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Exams
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              View and manage your exam schedule and history.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: 'All Exams' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'available', label: 'Available' },
              { key: 'in-progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' },
              { key: 'expired', label: 'Expired' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading exams...</span>
          </div>
        )}

        {/* Exams Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredExams.map((exam, index) => (
              <motion.div
                key={exam._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {exam.subject}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exam.status)}`}>
                        {getStatusText(exam.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {exam.description}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4 mr-2" />
                          {exam.duration} minutes
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {exam.totalQuestions} questions
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(exam.startDate)}
                        </div>
                        {exam.result && exam.result.percentage !== undefined && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Users className="h-4 w-4 mr-2" />
                            Score: {exam.result.percentage}%
                          </div>
                        )}
                        {exam.currentAttempts > 0 && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Attempts: {exam.currentAttempts}/{exam.allowedAttempts}
                          </div>
                        )}
                      </div>

                      <div className="pt-4">
                        {exam.status === 'available' && (
                          <Button 
                            className="w-full"
                            onClick={() => handleStartExam(exam._id)}
                          >
                            {exam.currentAttempts > 0 ? `Retake Exam (${exam.currentAttempts}/${exam.allowedAttempts})` : 'Start Exam'}
                          </Button>
                        )}
                        {exam.status === 'upcoming' && (
                          <Button 
                            className="w-full" 
                            disabled
                          >
                            Not Available Yet
                          </Button>
                        )}
                        {exam.status === 'completed' && (
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleViewResults(exam.result._id)}
                          >
                            View Results
                          </Button>
                        )}
                        {exam.status === 'in-progress' && (
                          <Button 
                            variant="secondary" 
                            className="w-full"
                            onClick={() => handleStartExam(exam._id)}
                          >
                            Continue Exam
                          </Button>
                        )}
                        {exam.status === 'expired' && (
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            disabled
                          >
                            Exam Expired
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredExams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeFilter === 'all' ? 'No assigned exams' : `No ${activeFilter} exams`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {activeFilter === 'all' 
                ? "You don't have any exams assigned to you yet. Contact your instructor to get exam assignments."
                : `You don't have any ${activeFilter} exams assigned to you.`
              }
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default MyExams
