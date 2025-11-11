import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Award, Calendar, RefreshCw, AlertCircle, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import useExamStore from '../../store/useExamStore'
import useReportStore from '../../store/useReportStore'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const MyReports = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { examResults, isLoading, error, getUserResults } = useExamStore()
  const { studentAnalytics, getStudentAnalytics } = useReportStore()
  
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Debug data availability
  useEffect(() => {
    console.log('MyReports - Component data:', {
      examResults: examResults?.length || 0,
      examResultsData: examResults,
      studentAnalytics: studentAnalytics,
      isLoading,
      error,
      user: user?.id
    })
  }, [examResults, studentAnalytics, isLoading, error, user])

  // Load data on component mount
  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load reports data
  const loadReports = async () => {
    console.log('MyReports - Loading reports data...', { userId: user?.id })
    try {
      console.log('MyReports - Fetching user results...')
      const resultsResponse = await getUserResults()
      console.log('MyReports - User results response:', resultsResponse)
      
      if (user?.id) {
        console.log('MyReports - Fetching student analytics for user:', user.id)
        const analyticsResponse = await getStudentAnalytics(user.id)
        console.log('MyReports - Student analytics response:', analyticsResponse)
      }
    } catch (error) {
      console.error('MyReports - Error loading reports:', error)
      toast.error('Failed to load reports')
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadReports()
      toast.success('Reports refreshed successfully')
    } catch (error) {
      toast.error('Failed to refresh reports')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate statistics from exam results
  const calculateStatistics = () => {
    if (!examResults || examResults.length === 0) {
      return {
        averageScore: 0,
        bestScore: 0,
        totalExams: 0,
        improvement: 0
      }
    }

    const scores = examResults.map(result => result.percentage || 0)
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    const bestScore = Math.max(...scores)
    const totalExams = examResults.length

    // Calculate improvement (compare last 3 vs previous 3)
    let improvement = 0
    if (examResults.length >= 6) {
      const recent = examResults.slice(0, 3)
      const previous = examResults.slice(3, 6)
      const recentAvg = recent.reduce((sum, r) => sum + (r.percentage || 0), 0) / recent.length
      const previousAvg = previous.reduce((sum, r) => sum + (r.percentage || 0), 0) / previous.length
      improvement = Math.round(recentAvg - previousAvg)
    }

    return {
      averageScore,
      bestScore,
      totalExams,
      improvement
    }
  }

  const statistics = calculateStatistics()

  // Get grade from score
  const getGradeFromScore = (score) => {
    if (score >= 97) return 'A+'
    if (score >= 93) return 'A'
    if (score >= 90) return 'A-'
    if (score >= 87) return 'B+'
    if (score >= 83) return 'B'
    if (score >= 80) return 'B-'
    if (score >= 77) return 'C+'
    if (score >= 73) return 'C'
    if (score >= 70) return 'C-'
    if (score >= 67) return 'D+'
    if (score >= 65) return 'D'
    return 'F'
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'A-':
      case 'B+':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
      case 'B':
      case 'B-':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'C+':
      case 'C':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-blue-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="container-responsive py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                View your exam results and performance analytics.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Average Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.averageScore}%
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Best Score
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.bestScore}%
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                    <Award className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Exams
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statistics.totalExams}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Improvement
                    </p>
                    <p className={`text-2xl font-bold ${statistics.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {statistics.improvement >= 0 ? '+' : ''}{statistics.improvement}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${statistics.improvement >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                    <TrendingUp className={`h-6 w-6 ${statistics.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your reports...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error Loading Reports
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Exam Results */}
        {!isLoading && !error && (
          <div className="space-y-6">
            {examResults && examResults.length > 0 ? (
              examResults.map((result, index) => {
                const grade = getGradeFromScore(result.percentage || 0)
                return (
                  <motion.div
                    key={result._id || result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.exam?.title || result.examTitle || 'Exam'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {result.exam?.subject || 'General'} • {new Date(result.endTime || result.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${getScoreColor(result.percentage || 0)}`}>
                              {result.percentage || 0}%
                            </div>
                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getGradeColor(grade)}`}>
                              Grade {grade}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.obtainedMarks || 0}/{result.totalMarks || result.exam?.totalMarks || 100}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.timeSpent || 0}min
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.status || 'Completed'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Attempts</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {result.attemptNumber || 1}
                            </p>
                          </div>
                        </div>

{/* <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Completed: {new Date(result.endTime || result.createdAt).toLocaleString()}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/results/${result._id || result.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
 */}                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-12"
              >
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No reports available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete some exams to see your performance reports here.
                </p>
                <Button onClick={() => navigate('/my-exams')}>
                  View Available Exams
                </Button>
              </motion.div>
            )}
          </div>
        )}

      </motion.div>
    </div>
  )
}

export default MyReports
