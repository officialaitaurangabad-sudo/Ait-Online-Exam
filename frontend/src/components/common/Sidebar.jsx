import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  BarChart3,
  Users,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isAdmin, isTeacher, isStudent } = useAuth()
  const location = useLocation()

  const getNavigationItems = () => {
    if (isAdmin || isTeacher) {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
        { name: 'Exams', href: '/admin/exams', icon: BookOpen },
        { name: 'Questions', href: '/admin/questions', icon: FileText },
        { name: 'Students', href: '/admin/students', icon: GraduationCap },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        ...(isAdmin ? [{ name: 'Users', href: '/admin/users', icon: Users }] : []),
        { name: 'Settings', href: '/admin/settings', icon: Settings }
      ]
    } else if (isStudent) {
      return [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'My Exams', href: '/my-exams', icon: BookOpen },
        { name: 'My Reports', href: '/my-reports', icon: FileText },
        { name: 'Settings', href: '/settings', icon: Settings }
      ]
    }
    return []
  }

  const navigationItems = getNavigationItems()

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? '4rem' : '16rem' }}
      className="fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 transition-all duration-300"
    >
      <div className="flex flex-col h-full">
        {/* Toggle button */}
        <div className="flex justify-end p-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }
                `}
              >
                <Icon className={`
                  flex-shrink-0 h-5 w-5
                  ${isActive
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                  }
                `} />
                
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <p>AIT Exam Platform</p>
              <p>Version 1.0.0</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Sidebar
