import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, Calendar, MapPin, Shield, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Button } from '../ui/Button'
import useUserStore from '../../store/useUserStore'

const ViewUserModal = ({ isOpen, onClose, userId }) => {
  const { getUser, isLoading } = useUserStore()
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser()
    }
  }, [isOpen, userId])

  const fetchUser = async () => {
    try {
      const userData = await getUser(userId)
      setUser(userData)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setUser(null)
      onClose()
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Not provided'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!user && !isLoading) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
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
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    User Details
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    View user information and activity
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : user ? (
                  <div className="space-y-6">
                    {/* User Header */}
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role?.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {user.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(user.phone || user.dateOfBirth) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {user.phone && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <Phone className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {user.phone}
                                </p>
                              </div>
                            </div>
                          )}

                          {user.dateOfBirth && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <Calendar className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Date of Birth</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {formatDateOnly(user.dateOfBirth)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address Information */}
                    {user.address && (user.address.street || user.address.city || user.address.state || user.address.zipCode || user.address.country) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Address</h3>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                            <div className="text-gray-900 dark:text-white">
                              {user.address.street && <p>{user.address.street}</p>}
                              {(user.address.city || user.address.state || user.address.zipCode) && (
                                <p>
                                  {user.address.city}
                                  {user.address.city && user.address.state && ', '}
                                  {user.address.state}
                                  {user.address.zipCode && ` ${user.address.zipCode}`}
                                </p>
                              )}
                              {user.address.country && <p>{user.address.country}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDate(user.lastLogin)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {formatDateOnly(user.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {user.isEmailVerified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Email Verified</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.isEmailVerified ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Login Attempts</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.loginAttempts || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferences */}
                    {user.preferences && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Preferences</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Theme</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.preferences.theme?.charAt(0).toUpperCase() + user.preferences.theme?.slice(1) || 'Light'}
                            </p>
                          </div>

                          {user.preferences.notifications && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notifications</p>
                              <div className="space-y-1">
                                <p className="text-sm text-gray-900 dark:text-white">
                                  Email: {user.preferences.notifications.email ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  Exam Reminders: {user.preferences.notifications.examReminders ? 'Enabled' : 'Disabled'}
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  Results: {user.preferences.notifications.resultNotifications ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No user data available</p>
                  </div>
                )}
              </CardContent>

              {/* Actions - Fixed at bottom */}
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Close
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ViewUserModal
