import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Upload, Download, RefreshCw, Search, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import CreateQuestionModal from '../../components/modals/CreateQuestionModal'
import ViewQuestionModal from '../../components/modals/ViewQuestionModal'
import EditQuestionModal from '../../components/modals/EditQuestionModal'
import BulkUploadModal from '../../components/modals/BulkUploadModal'
import useQuestionStore from '../../store/useQuestionStore'
import { toast } from 'react-toastify'

const ManageQuestions = () => {
  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get data from store
  const { 
    questions, 
    currentQuestions,
    isLoading, 
    error, 
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage,
    filters,
    fetchQuestions,
    deleteQuestion,
    exportQuestions,
    setFilters,
    setPagination,
    resetFilters,
    clearError
  } = useQuestionStore()

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleSearchChange = (value) => {
    setFilters({ search: value })
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const handleClearFilters = () => {
    resetFilters()
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchQuestions()
    setIsRefreshing(false)
  }

  const handleViewQuestion = (question) => {
    setSelectedQuestion(question)
    setShowViewModal(true)
  }

  const handleEditQuestion = (question) => {
    setSelectedQuestion(question)
    setShowEditModal(true)
  }

  const handleDeleteQuestion = async (questionId, questionText) => {
    if (window.confirm(`Are you sure you want to delete this question?\n\n"${questionText.substring(0, 50)}..."\n\nThis action cannot be undone.`)) {
      try {
        const result = await deleteQuestion(questionId)
        if (result.success) {
          toast.success('Question deleted successfully!')
        }
      } catch (error) {
        console.error('Error deleting question:', error)
      }
    }
  }

  const handleQuestionUpdated = () => {
    toast.success('Question updated successfully!')
    fetchQuestions()
  }

  const handleExportQuestions = async () => {
    try {
      await exportQuestions()
    } catch (error) {
      console.error('Error exporting questions:', error)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'multiple-choice':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'true-false':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'short-answer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      case 'essay':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-black">
              Manage Questions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create, edit, and organize your question bank. {totalItems} questions available.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              loading={isRefreshing}
              title="Refresh questions"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowBulkUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button 
              variant="outline"
              onClick={handleExportQuestions}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-5 w-5 text-red-600">⚠️</div>
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearError}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Filter and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <select 
              value={filters.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-blue-800 text-gray-900 dark:text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Subjects</option>
              <option value="C Programming">C Programming</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
            </select>
            <select 
              value={filters.questionType}
              onChange={(e) => handleFilterChange('questionType', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-blue-800 text-gray-900 dark:text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="short-answer">Short Answer</option>
              <option value="essay">Essay</option>
            </select>
            <select 
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-blue-800 text-gray-900 dark:text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {(filters.search || filters.subject || filters.questionType || filters.difficulty) && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>Question Bank</CardTitle>
            <CardDescription>
              {totalItems} questions in your question bank
              {isLoading && <span className="ml-2 text-blue-600">Loading...</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Loading questions...</p>
              </div>
            ) : currentQuestions.length > 0 ? (
              <div className="space-y-4">
                {currentQuestions.map((question, index) => (
                  <motion.div
                    key={question._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-blue-800 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(question.questionType)}`}>
                          {question.questionType.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {question.marks} marks
                        </span>
                        {!question.isActive && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-black mb-1">
                        {question.questionText}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Subject: {question.subject}</span>
                        <span>Category: {question.category}</span>
                        <span>Used: {question.usageCount || 0} times</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewQuestion(question)}
                        title="View Question"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                        title="Edit Question"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteQuestion(question._id, question.questionText)}
                        title="Delete Question"
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
                  {filters.search || filters.subject || filters.questionType || filters.difficulty 
                    ? 'No questions match your filters' 
                    : 'No questions found'
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {filters.search || filters.subject || filters.questionType || filters.difficulty
                    ? 'Try adjusting your search criteria or clear the filters.'
                    : 'Start building your question bank by adding questions.'
                  }
                </p>
                <div className="flex justify-center space-x-2">
                  {(filters.search || filters.subject || filters.questionType || filters.difficulty) ? (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline"
                        onClick={() => setShowBulkUploadModal(true)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Bulk Upload
                      </Button>
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </motion.div>

      {/* Modals */}
      <CreateQuestionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <ViewQuestionModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        question={selectedQuestion}
      />

      <EditQuestionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        question={selectedQuestion}
        onQuestionUpdated={handleQuestionUpdated}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
      />
    </div>
  )
}

export default ManageQuestions
