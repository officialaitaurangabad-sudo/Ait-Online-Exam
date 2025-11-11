import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Play, Pause, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import Filter from '../../components/ui/Filter'
import Pagination from '../../components/ui/Pagination'
import CreateExamModal from '../../components/modals/CreateExamModal'
import AddQuestionsModal from '../../components/modals/AddQuestionsModal'
import ViewExamModal from '../../components/modals/ViewExamModal'
import EditExamModal from '../../components/modals/EditExamModal'
import useExamStore from '../../store/useExamStore'
import { toast } from 'react-toastify'

const ManageExams = () => {
  // State for pagination and filters
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    status: '',
    subject: ''
  })
  
  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [showAddQuestionsModal, setShowAddQuestionsModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState(null)
  const [selectedExamForView, setSelectedExamForView] = useState(null)
  const [selectedExamForEdit, setSelectedExamForEdit] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get data from store
  const { 
    exams, 
    isLoading, 
    error, 
    getExams, 
    deleteExam, 
    publishExam, 
    archiveExam 
  } = useExamStore()

  // Fetch exams on component mount
  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    console.log('ManageExams - fetchExams called')
    setIsRefreshing(true)
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters,
        search: searchTerm
      }
      console.log('ManageExams - Fetching exams with params:', params)
      const result = await getExams(params)
      console.log('ManageExams - getExams result:', result)
    } catch (error) {
      console.error('ManageExams - Error fetching exams:', error)
      toast.error('Failed to fetch exams')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh exams when filters or pagination change
  useEffect(() => {
    fetchExams()
  }, [currentPage, itemsPerPage, searchTerm, filters])

  // Use exams from store (already filtered by API)
  const currentExams = exams || []
  
  // Debug exam data
  useEffect(() => {
    console.log('ManageExams - Current exams data:', currentExams)
    if (currentExams.length > 0) {
      console.log('ManageExams - First exam data:', currentExams[0])
      console.log('ManageExams - First exam title:', currentExams[0].title)
      console.log('ManageExams - First exam allowedAttempts:', currentExams[0].allowedAttempts)
    }
  }, [currentExams])

  // Filter options
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' }
      ]
    },
    {
      key: 'subject',
      label: 'Subject',
      options: [
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Chemistry', label: 'Chemistry' },
        { value: 'Biology', label: 'Biology' },
        { value: 'English', label: 'English' }
      ]
    }
  ]

  // Handlers
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilters({ status: '', subject: '' })
    setCurrentPage(1)
  }

  // Modal handlers
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
    // Refresh exams after creating
    fetchExams()
  }

  // Action handlers
  const handleViewExam = (exam) => {
    setSelectedExamForView(exam)
    setShowViewModal(true)
  }

  const handleEditExam = (exam) => {
    console.log('ManageExams - handleEditExam called with exam:', exam)
    console.log('ManageExams - Exam title:', exam.title)
    console.log('ManageExams - Exam allowedAttempts:', exam.allowedAttempts)
    setSelectedExamForEdit(exam)
    setShowEditModal(true)
  }

  const handleAddQuestions = (exam) => {
    setSelectedExamForQuestions(exam)
    setShowAddQuestionsModal(true)
  }

  const handleQuestionsAdded = (questionCount) => {
    toast.success(`Added ${questionCount} questions to exam`)
    fetchExams() // Refresh the exam list
  }

  const handleExamUpdated = () => {
    console.log('ManageExams - handleExamUpdated called, refreshing exams...')
    toast.success('Exam updated successfully!')
    // Clear the selected exam to force re-selection with updated data
    setSelectedExamForEdit(null)
    fetchExams() // Refresh the exam list
  }

  const handleDeleteExam = async (examId, examTitle) => {
    if (window.confirm(`Are you sure you want to delete "${examTitle}"? This action cannot be undone.`)) {
      try {
        const result = await deleteExam(examId)
        if (result.success) {
          toast.success('Exam deleted successfully!')
          fetchExams() // Refresh the list
        } else {
          toast.error(result.error || 'Failed to delete exam')
        }
      } catch (error) {
        toast.error('Failed to delete exam')
      }
    }
  }

  const handlePublishExam = async (examId, examTitle) => {
    try {
      const result = await publishExam(examId)
      if (result.success) {
        toast.success(`"${examTitle}" published successfully!`)
        fetchExams() // Refresh the list
      } else {
        toast.error(result.error || 'Failed to publish exam')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to publish exam'
      if (errorMessage.includes('questions')) {
        toast.error('Cannot publish exam: ' + errorMessage + '. Please add questions to the exam first.')
      } else {
        toast.error('Failed to publish exam: ' + errorMessage)
      }
    }
  }

  const handleArchiveExam = async (examId, examTitle) => {
    if (window.confirm(`Are you sure you want to archive "${examTitle}"?`)) {
      try {
        const result = await archiveExam(examId)
        if (result.success) {
          toast.success(`"${examTitle}" archived successfully!`)
          fetchExams() // Refresh the list
        } else {
          toast.error(result.error || 'Failed to archive exam')
        }
      } catch (error) {
        toast.error('Failed to archive exam')
      }
    }
  }

  const handleRefresh = () => {
    fetchExams()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Manage Exams
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create, edit, and manage your exams. {currentExams.length > 0 && `(${currentExams.length} exams)`}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleOpenCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Filters */}
        <Filter
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          filters={filterOptions.map(filter => ({
            ...filter,
            value: filters[filter.key]
          }))}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          placeholder="Search exams by title or subject..."
        />

        {/* Exams Table */}
        <Card>
          <CardHeader>
            <CardTitle>Exams</CardTitle>
            <CardDescription>
              Manage all your exams and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading exams...</p>
                </div>
              ) : currentExams.length > 0 ? (
                currentExams.map((exam, index) => (
                  <motion.div
                    key={exam._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:gray-800">
                          {exam.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(exam.status)}`}>
                          {exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Subject:</span> {exam.subject}
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {exam.category}
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span> 
                          <span className={`ml-1 ${exam.questions?.length === 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {exam.questions?.length || 0}/{exam.totalQuestions}
                          </span>
                          {exam.questions?.length === 0 && (
                            <span className="ml-1 text-xs text-red-500">⚠️ No questions</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {exam.duration} min
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Marks:</span> {exam.totalMarks} (Pass: {exam.passingMarks})
                      </div>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Schedule:</span> {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                      </div>
                      {exam.createdBy && (
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Created by:</span> {exam.createdBy.firstName} {exam.createdBy.lastName}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewExam(exam)}
                        title="View Exam"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditExam(exam)}
                        title="Edit Exam"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {exam.questions?.length === 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddQuestions(exam)}
                          title="Add Questions to Exam"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                      {exam.status === 'published' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleArchiveExam(exam._id, exam.title)}
                          title="Archive Exam"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePublishExam(exam._id, exam.title)}
                          title={exam.questions?.length === 0 ? "Cannot publish: No questions added" : "Publish Exam"}
                          disabled={exam.questions?.length === 0}
                          className={exam.questions?.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteExam(exam._id, exam.title)}
                        title="Delete Exam"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No exams found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination - Only show if we have exams and not loading */}
        {!isLoading && currentExams.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(currentExams.length / itemsPerPage)}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={currentExams.length}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        {/* Empty State - Only show if not loading and no exams */}
        {!isLoading && currentExams.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No exams found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'No exams match your current filters. Try adjusting your search criteria.'
                : 'Create your first exam to get started.'
              }
            </p>
            <div className="flex justify-center space-x-3">
              {(searchTerm || Object.values(filters).some(f => f)) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
              <Button onClick={handleOpenCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      {/* Add Questions Modal */}
      <AddQuestionsModal
        isOpen={showAddQuestionsModal}
        onClose={() => setShowAddQuestionsModal(false)}
        examId={selectedExamForQuestions?._id}
        examTitle={selectedExamForQuestions?.title}
        onQuestionsAdded={handleQuestionsAdded}
      />

      {/* View Exam Modal */}
      <ViewExamModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        exam={selectedExamForView}
      />

      {/* Edit Exam Modal */}
      <EditExamModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        exam={selectedExamForEdit}
        onExamUpdated={handleExamUpdated}
      />
    </div>
  )
}

export default ManageExams
