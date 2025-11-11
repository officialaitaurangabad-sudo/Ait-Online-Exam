import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, UserCheck, UserX, Search, Filter, RefreshCw, Download, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import useUserStore from '../../store/useUserStore'
import CreateUserModal from '../../components/modals/CreateUserModal'
import ViewUserModal from '../../components/modals/ViewUserModal'
import EditUserModal from '../../components/modals/EditUserModal'
import { toast } from 'react-toastify'

const UserManagement = () => {
  const {
    users = [],
    isLoading,
    isRefreshing,
    error,
    filters = {},
    pagination = { total: 0 },
    fetchUsers,
    deleteUser,
    toggleUserStatus,
    exportUsers,
    setFilters,
    setPagination,
    resetFilters,
    clearError,
    refreshUsers
  } = useUserStore()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Debug current state
  console.log('UserManagement render - users:', users, 'isLoading:', isLoading, 'error:', error)

  // Initialize data on component mount
  useEffect(() => {
    console.log('UserManagement mounted, calling fetchUsers')
    fetchUsers()
  }, [])

  // Update search when searchTerm changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({ search: searchTerm })
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, setFilters])

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleFilterChange = (filterType, value) => {
    setFilters({ [filterType]: value })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    resetFilters()
  }

  const handleRefresh = () => {
    refreshUsers()
  }

  const handleViewUser = (userId) => {
    setSelectedUserId(userId)
    setShowViewModal(true)
  }

  const handleEditUser = (userId) => {
    setSelectedUserId(userId)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await deleteUser(userId)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleToggleStatus = async (userId, currentStatus, userName) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (window.confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
      try {
        await toggleUserStatus(userId)
      } catch (error) {
        console.error('Error toggling user status:', error)
      }
    }
  }

  const handleExportUsers = async () => {
    try {
      const response = await exportUsers(filters)
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Users exported successfully')
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('Failed to export users')
    }
  }

  const handleCloseCreateModal = () => {
    setShowCreateModal(false)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedUserId(null)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setSelectedUserId(null)
  }

  const handleUserCreated = () => {
    toast.success('User created successfully')
    setShowCreateModal(false)
    // Refresh the user list to ensure it's up to date
    fetchUsers()
  }

  const handleUserUpdated = () => {
    toast.success('User updated successfully')
    setShowEditModal(false)
    setSelectedUserId(null)
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage user accounts, roles, and permissions.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportUsers}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-blue-800 text-gray-900 dark:text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select 
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-blue-800 text-gray-900 dark:text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
            <select 
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-blue-800 text-gray-900 dark:text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(filters.role || filters.status || searchTerm) && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {pagination.total} users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-800 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-black">
                            {user.firstName} {user.lastName}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                            {user.role?.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
                            {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Last login: {formatDate(user.lastLogin)}</span>
                          <span>Joined: {formatDate(user.createdAt)}</span>
                          {user.phone && <span>Phone: {user.phone}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewUser(user._id)}
                        title="View user details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user._id)}
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={user.isActive ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                        onClick={() => handleToggleStatus(user._id, user.isActive, `${user.firstName} ${user.lastName}`)}
                        title={user.isActive ? "Deactivate user" : "Activate user"}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-black mb-2">
                  {filters.role || filters.status || searchTerm ? 'No users found' : 'No users yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {filters.role || filters.status || searchTerm 
                    ? 'Try adjusting your search criteria or filters.'
                    : 'Start by adding users to your system.'
                  }
                </p>
                {filters.role || filters.status || searchTerm ? (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateUserModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onUserCreated={handleUserCreated}
        />
        
        <ViewUserModal
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          userId={selectedUserId}
        />
        
        <EditUserModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          userId={selectedUserId}
        />
      </motion.div>
    </div>
  )
}

export default UserManagement
