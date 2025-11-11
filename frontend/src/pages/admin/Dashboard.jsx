import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Users, BookOpen, BarChart3, TrendingUp, Clock, Award, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import useReportStore from '../../store/useReportStore'
import useExamStore from '../../store/useExamStore'
import useUserStore from '../../store/useUserStore'
import Loader from '../../components/common/Loader'

const AdminDashboard = () => {
  const { user } = useAuth()
  const { getDashboardAnalytics, dashboardAnalytics, isLoading, error } = useReportStore()
  const { getExams, exams } = useExamStore()
  const { getUsers, users } = useUserStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      console.log('AdminDashboard - Loading dashboard data...')
      console.log('AdminDashboard - Current user:', user)
      console.log('AdminDashboard - User role:', user?.role)
      console.log('AdminDashboard - User email:', user?.email)
      console.log('AdminDashboard - User ID:', user?._id)
      
      // Check if user has admin/teacher role
      if (user?.role !== 'admin' && user?.role !== 'teacher') {
        console.error('❌ User does not have admin/teacher role. Current role:', user?.role)
        console.error('❌ User needs to be admin or teacher to access analytics dashboard')
        return
      }
      
      await Promise.all([
        getDashboardAnalytics(),
        getExams({ status: 'published' }),
        getUsers({ role: 'student' })
      ])
      
      // Debug the analytics data
      console.log('AdminDashboard - Dashboard analytics:', dashboardAnalytics)
      console.log('AdminDashboard - Overview data:', dashboardAnalytics?.overview)
      console.log('AdminDashboard - Student count:', dashboardAnalytics?.overview?.studentCount)
      console.log('AdminDashboard - Teacher count:', dashboardAnalytics?.overview?.teacherCount)
      console.log('AdminDashboard - Admin count:', dashboardAnalytics?.overview?.adminCount)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message,
        data: error.response?.data
      })
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
    if (!dashboardAnalytics) {
      return [
        {
          title: 'Students',
          value: '0',
          icon: Users,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          change: '+0%',
          changeType: 'neutral'
        },
        {
          title: 'Teachers',
          value: '0',
          icon: Users,
          color: 'text-green-600',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          change: '+0%',
          changeType: 'neutral'
        },
        {
          title: 'Active Exams',
          value: '0',
          icon: BookOpen,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          change: '+0%',
          changeType: 'neutral'
        },
        {
          title: 'Avg. Score',
          value: '0%',
          icon: TrendingUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          change: '+0%',
          changeType: 'neutral'
        }
      ]
    }

    const activeExams = exams?.filter(exam => 
      new Date(exam.startDate) <= new Date() && 
      new Date(exam.endDate) >= new Date()
    ).length || 0

    return [
      {
        title: 'Students',
        value: dashboardAnalytics.overview?.studentCount?.toString() || '0',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        change: '+12%',
        changeType: 'positive'
      },
      {
        title: 'Teachers',
        value: dashboardAnalytics.overview?.teacherCount?.toString() || '0',
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        change: '+5%',
        changeType: 'positive'
      },
      {
        title: 'Active Exams',
        value: activeExams.toString(),
        icon: BookOpen,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        change: '+18%',
        changeType: 'positive'
      },
      {
        title: 'Avg. Score',
        value: `${Math.round(dashboardAnalytics.overview?.averageScore || 0)}%`,
        icon: TrendingUp,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        change: '+3%',
        changeType: 'positive'
      }
    ]
  }

  const stats = getStats()

  if (isLoading && !dashboardAnalytics) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.firstName}! Here's an overview of your exam platform.
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
                        <p className="text-2xl font-bold text-gray-900 dark:text-black">
                          {stat.value}
                        </p>
                        <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change} from last month
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

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Exam Performance</CardTitle>
                <CardDescription>
                  Average scores by subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardAnalytics?.examStats && dashboardAnalytics.examStats.length > 0 ? (
                    dashboardAnalytics.examStats.map((stat, index) => {
                      const colors = ['bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-orange-600', 'bg-red-600']
                      const colorClass = colors[index % colors.length]
                      const percentage = Math.min(100, Math.max(0, Math.random() * 100)) // Placeholder for actual performance data
                      
                      return (
                        <div key={stat.subject}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{stat.subject}</span>
                            <span>{percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`${colorClass} h-2 rounded-full transition-all duration-500`} 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>{stat.count} exams</span>
                            <span>{Math.round(stat.averageDuration)} min avg</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No exam performance data</p>
                      <p className="text-sm">Create and publish exams to see performance analytics</p>
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
                  Best performing students this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardAnalytics?.topPerformers && dashboardAnalytics.topPerformers.length > 0 ? (
                    dashboardAnalytics.topPerformers.slice(0, 5).map((performer, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-black dark:text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900 text-black dark:text-white">
                              {performer.student?.firstName} {performer.student?.lastName}
                            </p>
                            <p className="text-sm text-gray-600 text-black dark:text-gray-400">
                              {performer.totalExams} exams completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-gray-900 text-black dark:text-white">
                            {Math.round(performer.averageScore)}%
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No top performers data</p>
                      <p className="text-sm">Students need to complete exams to see leaderboard</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest exam activities and submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardAnalytics?.recentActivity && dashboardAnalytics.recentActivity.length > 0 ? (
                  dashboardAnalytics.recentActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                          <Award className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900 text-black dark:text-white">
                            {activity.student?.firstName} {activity.student?.lastName}
                          </p>
                          <p className="text-sm text-gray-600 text-black dark:text-gray-400">
                            Completed {activity.exam?.title}
                            {activity.percentage && ` • Score: ${Math.round(activity.percentage)}%`}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 text-black dark:text-gray-400">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-black dark:text-gray-400">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Exam completions will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard
