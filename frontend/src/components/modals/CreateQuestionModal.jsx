import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Save, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { toast } from 'react-toastify'
import useQuestionStore from '../../store/useQuestionStore'

const CreateQuestionModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    questionText: '',
    questionType: 'multiple-choice',
    subject: '',
    difficulty: 'medium',
    marks: 1,
    category: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    correctAnswer: '',
    explanation: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { createQuestion } = useQuestionStore()

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

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = {
      ...newOptions[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      options: newOptions
    }))
  }

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, { text: '', isCorrect: false }]
      }))
    }
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      const newOptions = formData.options.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        options: newOptions
      }))
    }
  }

  const handleCorrectAnswerChange = (index) => {
    const newOptions = formData.options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }))
    setFormData(prev => ({
      ...prev,
      options: newOptions,
      correctAnswer: formData.options[index]?.text || ''
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.questionText.trim()) newErrors.questionText = 'Question text is required'
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required'
    if (!formData.category.trim()) newErrors.category = 'Category is required'
    if (!formData.marks || formData.marks <= 0) newErrors.marks = 'Marks must be greater than 0'

    // Validate options for multiple choice
    if (formData.questionType === 'multiple-choice') {
      const validOptions = formData.options.filter(opt => opt.text.trim())
      if (validOptions.length < 2) {
        newErrors.options = 'At least 2 options are required'
      }
      
      const correctOptions = validOptions.filter(opt => opt.isCorrect)
      if (correctOptions.length === 0) {
        newErrors.correctAnswer = 'Please select a correct answer'
      }
    }

    // Validate correct answer for other types
    if (formData.questionType !== 'multiple-choice' && !formData.correctAnswer.trim()) {
      newErrors.correctAnswer = 'Correct answer is required'
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
      const questionData = {
        questionText: formData.questionText.trim(),
        questionType: formData.questionType,
        subject: formData.subject.trim(),
        difficulty: formData.difficulty,
        marks: parseInt(formData.marks),
        category: formData.category.trim(),
        explanation: formData.explanation.trim(),
        isActive: true
      }

      // Add options for multiple choice questions
      if (formData.questionType === 'multiple-choice') {
        questionData.options = formData.options.filter(opt => opt.text.trim())
        questionData.correctAnswer = formData.correctAnswer
      } else {
        questionData.correctAnswer = formData.correctAnswer.trim()
      }

      const result = await createQuestion(questionData)
      
      if (result.success) {
        onClose()
        resetForm()
      }
    } catch (error) {
      console.error('Error creating question:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      questionText: '',
      questionType: 'multiple-choice',
      subject: '',
      difficulty: 'medium',
      marks: 1,
      category: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      correctAnswer: '',
      explanation: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
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
                  <CardTitle className="text-xl font-semibold">Create New Question</CardTitle>
                  <CardDescription>
                    Add a new question to your question bank
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto max-h-[calc(90vh-120px)] p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <form id="create-question-form" className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Question Type *
                      </label>
                      <select
                        name="questionType"
                        value={formData.questionType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True/False</option>
                        <option value="short-answer">Short Answer</option>
                        <option value="essay">Essay</option>
                      </select>
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
                        Difficulty
                      </label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Marks *
                      </label>
                      <Input
                        name="marks"
                        type="number"
                        value={formData.marks}
                        onChange={handleInputChange}
                        placeholder="Enter marks"
                        min="1"
                        className={errors.marks ? 'border-red-500' : ''}
                      />
                      {errors.marks && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.marks}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      name="questionText"
                      value={formData.questionText}
                      onChange={handleInputChange}
                      placeholder="Enter your question here..."
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                        errors.questionText ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {errors.questionText && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.questionText}
                      </p>
                    )}
                  </div>

                  {/* Options for Multiple Choice */}
                  {formData.questionType === 'multiple-choice' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Options *
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addOption}
                          disabled={formData.options.length >= 6}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {formData.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-1">
                              <Input
                                value={option.text}
                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                placeholder={`Option ${index + 1}`}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                name="correctAnswer"
                                checked={option.isCorrect}
                                onChange={() => handleCorrectAnswerChange(index)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">Correct</span>
                              {formData.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {errors.options && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.options}
                        </p>
                      )}
                      {errors.correctAnswer && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.correctAnswer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Correct Answer for other types */}
                  {formData.questionType !== 'multiple-choice' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Correct Answer *
                      </label>
                      <Input
                        name="correctAnswer"
                        value={formData.correctAnswer}
                        onChange={handleInputChange}
                        placeholder="Enter correct answer"
                        className={errors.correctAnswer ? 'border-red-500' : ''}
                      />
                      {errors.correctAnswer && (
                        <p className="text-red-500 text-xs mt-1 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.correctAnswer}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Explanation (Optional)
                    </label>
                    <textarea
                      name="explanation"
                      value={formData.explanation}
                      onChange={handleInputChange}
                      placeholder="Enter explanation for the answer..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                </form>
              </CardContent>

              {/* Actions - Fixed at bottom */}
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50 dark:bg-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="create-question-form"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Question
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CreateQuestionModal
