import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { toast } from 'react-toastify'
import { examAPI } from '../../utils/api'
import useExamStore from '../../store/useExamStore'

const EditExamModal = ({ isOpen, onClose, exam, onExamUpdated }) => {
  const { updateExam } = useExamStore()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    category: '',
    duration: '',
    totalQuestions: '',
    totalMarks: '',
    passingMarks: '',
    startDate: '',
    endDate: '',
    instructions: '',
    allowedAttempts: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Initialize form data when exam changes
  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title || '',
        description: exam.description || '',
        subject: exam.subject || '',
        category: exam.category || '',
        duration: exam.duration || '',
        totalQuestions: exam.totalQuestions || '',
        totalMarks: exam.totalMarks || '',
        passingMarks: exam.passingMarks || '',
        startDate: exam.startDate ? new Date(exam.startDate).toISOString().slice(0, 16) : '',
        endDate: exam.endDate ? new Date(exam.endDate).toISOString().slice(0, 16) : '',
        instructions: exam.instructions || '',
        allowedAttempts: exam.allowedAttempts || ''
      })
      setErrors({})
    }
  }, [exam])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    if (!formData.category.trim()) newErrors.category = 'Category is required'
    if (!formData.duration || formData.duration <= 0) newErrors.duration = 'Duration must be greater than 0'
    if (!formData.totalQuestions || formData.totalQuestions <= 0) newErrors.totalQuestions = 'Total questions must be greater than 0'
    if (!formData.totalMarks || formData.totalMarks <= 0) newErrors.totalMarks = 'Total marks must be greater than 0'
    if (!formData.passingMarks || formData.passingMarks < 0) newErrors.passingMarks = 'Passing marks cannot be negative'
    if (!formData.startDate) newErrors.startDate = 'Start date is required'
    if (!formData.endDate) newErrors.endDate = 'End date is required'
    if (!formData.allowedAttempts || formData.allowedAttempts <= 0) newErrors.allowedAttempts = 'Allowed attempts must be greater than 0'

    // Validate date range
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      if (endDate <= startDate) {
        newErrors.endDate = 'End date must be after start date'
      }
    }

    // Validate passing marks
    if (formData.passingMarks && formData.totalMarks && parseInt(formData.passingMarks) > parseInt(formData.totalMarks)) {
      newErrors.passingMarks = 'Passing marks cannot be greater than total marks'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    setIsLoading(true)
    try {
      const examData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject.trim(),
        category: formData.category.trim(),
        duration: parseInt(formData.duration),
        totalQuestions: parseInt(formData.totalQuestions),
        totalMarks: parseInt(formData.totalMarks),
        passingMarks: parseInt(formData.passingMarks),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        instructions: formData.instructions.trim(),
        allowedAttempts: parseInt(formData.allowedAttempts)
      }

      console.log('EditExamModal - Updating exam:', { examId: exam._id, examData })
      const result = await updateExam(exam._id, examData)
      console.log('EditExamModal - Update result:', result)
      
      if (result.success) {
        toast.success('Exam updated successfully!')
        console.log('EditExamModal - Calling onExamUpdated callback')
        onExamUpdated()
        onClose()
      } else {
        toast.error(result.error || 'Failed to update exam')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update exam'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!exam) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-row items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Exam</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update the exam details
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title *
                      </label>
                      <Input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Enter exam title"
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject *
                      </label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="Enter subject"
                        className={errors.subject ? 'border-red-500' : ''}
                      />
                      {errors.subject && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.subject}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category *
                      </label>
                      <Input
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="Enter category"
                        className={errors.category ? 'border-red-500' : ''}
                      />
                      {errors.category && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (minutes) *
                      </label>
                      <Input
                        name="duration"
                        type="number"
                        value={formData.duration}
                        onChange={handleInputChange}
                        placeholder="Enter duration"
                        className={errors.duration ? 'border-red-500' : ''}
                      />
                      {errors.duration && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.duration}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Questions *
                      </label>
                      <Input
                        name="totalQuestions"
                        type="number"
                        value={formData.totalQuestions}
                        onChange={handleInputChange}
                        placeholder="Enter total questions"
                        className={errors.totalQuestions ? 'border-red-500' : ''}
                      />
                      {errors.totalQuestions && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.totalQuestions}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Marks *
                      </label>
                      <Input
                        name="totalMarks"
                        type="number"
                        value={formData.totalMarks}
                        onChange={handleInputChange}
                        placeholder="Enter total marks"
                        className={errors.totalMarks ? 'border-red-500' : ''}
                      />
                      {errors.totalMarks && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.totalMarks}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Passing Marks *
                      </label>
                      <Input
                        name="passingMarks"
                        type="number"
                        value={formData.passingMarks}
                        onChange={handleInputChange}
                        placeholder="Enter passing marks"
                        className={errors.passingMarks ? 'border-red-500' : ''}
                      />
                      {errors.passingMarks && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.passingMarks}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Allowed Attempts *
                      </label>
                      <Input
                        name="allowedAttempts"
                        type="number"
                        value={formData.allowedAttempts}
                        onChange={handleInputChange}
                        placeholder="Enter allowed attempts"
                        className={errors.allowedAttempts ? 'border-red-500' : ''}
                      />
                      {errors.allowedAttempts && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.allowedAttempts}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date *
                      </label>
                      <Input
                        name="startDate"
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className={errors.startDate ? 'border-red-500' : ''}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.startDate}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Date *
                      </label>
                      <Input
                        name="endDate"
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter exam description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Instructions
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      placeholder="Enter exam instructions"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 pb-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={isLoading}
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Update Exam
                    </Button>
                  </div>
                </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EditExamModal
