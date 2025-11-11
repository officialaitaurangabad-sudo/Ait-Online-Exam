import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BookOpen, Clock, Trophy, TrendingUp, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import useReportStore from '../../store/useReportStore'
import useExamStore from '../../store/useExamStore'
import Loader from '../../components/common/Loader'

const StudentDashboard = () => {
  const { user } = useAuth()
  const { getStudentAnalytics, studentAnalytics, isLoading, error } = useReportStore()
  const { getExams, exams } = useExamStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load dashboard data on component mount
  useEffect(() => {
    if (user?._id) {
      loadDashboardData()
    }
  }, [user?._id])

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        getStudentAnalytics(user._id),
        getExams({ status: 'published' })
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadDashboardData()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Calculate stats from analytics data
  const getStats = () => {
    if (!studentAnalytics) {
      return [
        {
          title: 'Total Exams',
          value: '0',
          icon: BookOpen,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
          title: 'Completed',
          value: '0',
          icon: Trophy,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20'
        },
        {
          title: 'Upcoming',
          value: '0',
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20'
        },
        {
          title: 'Average Score',
          value: '0%',
          icon: TrendingUp,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20'
        }
      ]
    }

    const upcomingExams = exams?.filter(exam => 
      new Date(exam.startDate) > new Date() && 
      new Date(exam.endDate) > new Date()
    ).length || 0

    return [
      {
        title: 'Total Exams',
        value: studentAnalytics.totalExams?.toString() || '0',
        icon: BookOpen,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20'
      },
      {
        title: 'Completed',
        value: studentAnalytics.totalExams?.toString() || '0',
        icon: Trophy,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20'
      },
      {
        title: 'Upcoming',
        value: upcomingExams.toString(),
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20'
      },
      {
        title: 'Average Score',
        value: `${Math.round(studentAnalytics.averagePercentage || 0)}%`,
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20'
      }
    ]
  }

  const stats = getStats()

  if (isLoading && !studentAnalytics) {
    return <Loader text="Loading dashboard..." />
  }

  return (
    <div className="container-responsive py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Student Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.firstName}! Here's an overview of your exam progress.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Error loading dashboard data: {error}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-600 ">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Exams</CardTitle>
                <CardDescription>
                  Your latest exam activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAnalytics?.recentPerformance?.length > 0 ? (
                    studentAnalytics.recentPerformance.slice(0, 5).map((exam, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white rounded-lg">
                        <div>
                          <p className="font-medium">{exam.examTitle}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {exam.subject} • {new Date(exam.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${
                            exam.percentage >= 80 ? 'text-green-600' :
                            exam.percentage >= 60 ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {Math.round(exam.percentage)}%
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{exam.grade}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No exam results yet</p>
                      <p className="text-sm">Complete some exams to see your progress here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Your progress across subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAnalytics?.subjectPerformance && Object.keys(studentAnalytics.subjectPerformance).length > 0 ? (
                    Object.entries(studentAnalytics.subjectPerformance).map(([subject, performance], index) => {
                      const percentage = Math.round(performance.averagePercentage || 0)
                      const colorClass = percentage >= 80 ? 'bg-green-600' : 
                                       percentage >= 60 ? 'bg-blue-600' : 
                                       percentage >= 40 ? 'bg-orange-600' : 'bg-red-600'
                      
                      return (
                        <div key={subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{subject}</span>
                            <span>{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-green-300 rounded-full h-2">
                            <div 
                              className={`${colorClass} h-2 rounded-full transition-all duration-500`} 
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{performance.totalExams} exams</span>
                            <span>{Math.round(performance.passRate)}% pass rate</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No subject performance data</p>
                      <p className="text-sm">Complete exams in different subjects to see your progress</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Strengths and Weaknesses */}
        {studentAnalytics && (studentAnalytics.strengths?.length > 0 || studentAnalytics.weaknesses?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {studentAnalytics.strengths?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">Strengths</CardTitle>
                    <CardDescription>
                      Subjects where you excel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentAnalytics.strengths.map((strength, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {studentAnalytics.weaknesses?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
                    <CardDescription>
                      Subjects that need more attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {studentAnalytics.weaknesses.map((weakness, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-red-500 dark:bg-orange-900/20 text-orange-800 dark:text-orange-900 rounded-full text-sm"
                        >
                          {weakness}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default StudentDashboard
