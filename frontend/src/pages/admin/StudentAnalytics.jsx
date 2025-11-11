import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, Award, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import Loader from '../../components/common/Loader'
import PerformanceChart from '../../components/charts/PerformanceChart'
import useAnalyticsStore from '../../store/useAnalyticsStore'
import { toast } from 'react-toastify'
import { debugAuth, testAnalyticsAccess } from '../../utils/debugAuth'

const StudentAnalytics = () => {
  const {
    dashboardData,
    subjectPerformance,
    topPerformers,
    trends,
    loading,
    error,
    lastUpdated,
    fetchDashboardAnalytics,
    fetchSubjectWisePerformance,
    fetchTopPerformers,
    fetchPerformanceTrends,
    refreshAllAnalytics,
    clearError
  } = useAnalyticsStore()

  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      await Promise.all([
        fetchDashboardAnalytics(),
        fetchSubjectWisePerformance(),
        fetchTopPerformers(),
        fetchPerformanceTrends({ timeframe: '30d' }),
      ])
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshAllAnalytics()
      toast.success('Analytics refreshed successfully')
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      toast.error('Failed to refresh analytics')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDebugAuth = () => {
    debugAuth()
    testAnalyticsAccess()
  }

  // Calculate analytics overview from dashboard data
  const analytics = dashboardData ? [
    {
      title: 'Total Students',
      value: dashboardData.overview?.totalUsers?.toLocaleString() || '0',
      change: '+12%', // This would need to be calculated from historical data
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'Total Exams',
      value: dashboardData.overview?.totalExams?.toLocaleString() || '0',
      change: '+8%',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Avg. Performance',
      value: `${Math.round(dashboardData.overview?.averageScore || 0)}%`,
      change: '+3%',
      changeType: 'positive',
      icon: BarChart3
    },
    {
      title: 'Pass Rate',
      value: `${Math.round(dashboardData.overview?.passRate || 0)}%`,
      change: '+15%',
      changeType: 'positive',
      icon: Award
    }
  ] : []

  // Format top performers data
  const formattedTopPerformers = topPerformers?.map((performer, index) => ({
    name: `${performer.student?.firstName || ''} ${performer.student?.lastName || ''}`.trim() || 'Unknown Student',
    score: Math.round(performer.averageScore || 0),
    exams: performer.totalExams || 0,
    improvement: '+8%' // This would need to be calculated from historical data
  })) || []

  // Format subject performance data
  const formattedSubjectPerformance = subjectPerformance?.map(subject => ({
    subject: subject.subject || 'Unknown Subject',
    average: Math.round(subject.averageScore || 0),
    students: subject.totalAttempts || 0,
    trend: subject.averageScore >= 70 ? 'up' : 'down'
  })) || []

  // Show loading state
  if (loading.dashboard && loading.subjects && loading.topPerformers) {
    return (
      <div className="container-responsive py-8">
        <div className="flex items-center justify-center h-64">
          <Loader size="lg" />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container-responsive py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2">
              Error Loading Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={() => { clearError(); loadAnalytics(); }}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
                Student Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive insights into student performance and engagement.
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleDebugAuth}
                variant="outline"
                className="flex items-center gap-2"
              >
                Debug Auth
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analytics.length > 0 ? analytics.map((stat, index) => {
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
                        <p className="text-2xl font-bold text-gray-900 dark:text-black">
                          {stat.value}
                        </p>
                        <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change} from last month
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          }) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
            </div>
          )}
        </div>

        {/* Charts and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>
                  Average scores by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formattedSubjectPerformance.length > 0 ? formattedSubjectPerformance.map((subject, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{subject.subject}</span>
                        <span className="flex items-center">
                          {subject.average}%
                          <span className={`ml-2 text-xs ${
                            subject.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {subject.trend === 'up' ? '↗' : '↘'}
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${subject.average}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {subject.students} attempts
                      </p>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No subject performance data available</p>
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
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Students with highest average scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formattedTopPerformers.length > 0 ? formattedTopPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-blue-800 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 dark:text-black">{performer.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{performer.exams} exams</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-black">{performer.score}%</p>
                        <p className="text-xs text-green-600">{performer.improvement}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">No top performers data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Performance overview over the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart 
                data={trends} 
                loading={loading.trends}
              />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default StudentAnalytics
