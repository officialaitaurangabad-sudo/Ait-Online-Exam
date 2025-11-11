import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, BookOpen, Users, Upload, Plus, Trash2, FileText } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { toast } from 'react-toastify'
import useExamStore from '../../store/useExamStore'
import { questionAPI } from '../../utils/api'

const CreateExamModal = ({ isOpen, onClose }) => {
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
    passingScore: '',
    maxAttempts: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    answer: ''
  })
  const [questionMode, setQuestionMode] = useState('manual') // 'manual' or 'upload'
  
  const fileInputRef = useRef(null)
  const { createExam } = useExamStore()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Question management functions
  const handleQuestionChange = (e) => {
    const { name, value } = e.target
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }))
  }

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.answer) {
      toast.error('Please fill in the question and correct answer')
      return
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      toast.error('Please fill in all options')
      return
    }

    setQuestions(prev => [...prev, { ...currentQuestion }])
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      answer: ''
    })
    setShowQuestionForm(false)
    toast.success('Question added successfully!')
  }

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index))
    toast.success('Question removed!')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== 'application/json') {
      toast.error('Please upload a JSON file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result)
        
        if (!Array.isArray(jsonData)) {
          toast.error('JSON file must contain an array of questions')
          return
        }

        // Validate question structure
        const validQuestions = jsonData.filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 && 
          q.answer
        )

        if (validQuestions.length === 0) {
          toast.error('No valid questions found in the file')
          return
        }

        if (validQuestions.length !== jsonData.length) {
          toast.warning(`${validQuestions.length} out of ${jsonData.length} questions were valid and imported`)
        }

        setQuestions(prev => [...prev, ...validQuestions])
        toast.success(`${validQuestions.length} questions imported successfully!`)
        
        // Update total questions in form
        setFormData(prev => ({
          ...prev,
          totalQuestions: validQuestions.length
        }))

      } catch (error) {
        toast.error('Invalid JSON file format')
        console.error('JSON parsing error:', error)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.title || !formData.subject || !formData.category || !formData.duration || !formData.totalMarks || !formData.passingMarks || !formData.startDate || !formData.endDate) {
        toast.error('Please fill in all required fields')
        return
      }

      // Warn if no questions are added but totalQuestions is set
      if (questions.length === 0 && parseInt(formData.totalQuestions) > 0) {
        if (!window.confirm('You have set total questions but haven\'t added any questions. Do you want to continue creating the exam without questions?')) {
          return
        }
      }

      // Validate dates
      const startDate = new Date(formData.startDate)
      const endDate = new Date(formData.endDate)
      
      if (startDate >= endDate) {
        toast.error('End date must be after start date')
        return
      }

      // Create questions first if any
      let questionIds = []
      if (questions.length > 0) {
        try {
          const questionPromises = questions.map(async (question) => {
            const questionData = {
              questionText: question.question,
              questionType: 'multiple-choice',
              options: question.options.map((option, index) => ({
                text: option,
                isCorrect: option === question.answer
              })),
              correctAnswer: question.answer,
              marks: 1, // Default 1 mark per question
              subject: formData.subject,
              difficulty: 'medium',
              isActive: true
            }
            
            const response = await questionAPI.createQuestion(questionData)
            return response.data.data.question._id
          })
          
          questionIds = await Promise.all(questionPromises)
          console.log('Created question IDs:', questionIds)
          toast.success(`${questionIds.length} questions created successfully!`)
        } catch (error) {
          toast.error('Failed to create questions: ' + (error.response?.data?.message || error.message))
          return
        }
      }

      // Prepare exam data
      const examData = {
        title: formData.title,
        description: formData.description || '',
        subject: formData.subject,
        category: formData.category,
        duration: parseInt(formData.duration),
        totalQuestions: questionIds.length || parseInt(formData.totalQuestions) || 0,
        totalMarks: parseInt(formData.totalMarks),
        passingMarks: parseInt(formData.passingMarks),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        instructions: formData.instructions || '',
        allowedAttempts: parseInt(formData.maxAttempts) || 1,
        status: 'draft',
        questions: questionIds // Now we have actual question IDs
      }

      console.log('Creating exam with data:', examData)
      const result = await createExam(examData)
      
      if (result.success) {
        const questionMessage = questionIds.length > 0 ? ` with ${questionIds.length} questions` : ''
        toast.success(`Exam created successfully${questionMessage}!`)
        onClose()
        // Reset form
        setFormData({
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
          passingScore: '',
          maxAttempts: ''
        })
        setQuestions([])
        setCurrentQuestion({
          question: '',
          options: ['', '', '', ''],
          answer: ''
        })
        setShowQuestionForm(false)
      } else {
        toast.error(result.error || 'Failed to create exam')
      }
    } catch (error) {
      toast.error('An error occurred while creating the exam')
      console.error('Create exam error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const subjects = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Computer Science',
    'History',
    'Geography',
    'Economics',
    'Other'
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 "
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex-1 bg-white dark:bg-gray-800 w-full max-w-2xl max-h-[90vh]  overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold">Create New Exam</CardTitle>
                  <CardDescription>
                    Fill in the details to create a new exam
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Basic Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Exam Title *
                        </label>
                        <Input
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="Enter exam title"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Subject *
                        </label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        >
                          <option value="">Select subject</option>
                          {subjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Category *
                      </label>
                      <Input
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        placeholder="e.g., Midterm, Final, Quiz, Assignment"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter exam description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Exam Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Exam Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Duration (minutes) *
                        </label>
                        <Input
                          name="duration"
                          type="number"
                          value={formData.duration}
                          onChange={handleChange}
                          placeholder="120"
                          min="1"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Total Questions
                        </label>
                        <Input
                          name="totalQuestions"
                          type="number"
                          value={formData.totalQuestions}
                          onChange={handleChange}
                          placeholder="50"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Total Marks *
                        </label>
                        <Input
                          name="totalMarks"
                          type="number"
                          value={formData.totalMarks}
                          onChange={handleChange}
                          placeholder="100"
                          min="1"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Passing Marks *
                        </label>
                        <Input
                          name="passingMarks"
                          type="number"
                          value={formData.passingMarks}
                          onChange={handleChange}
                          placeholder="50"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Max Attempts
                      </label>
                      <Input
                        name="maxAttempts"
                        type="number"
                        value={formData.maxAttempts}
                        onChange={handleChange}
                        placeholder="1"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Schedule
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Start Date & Time *
                        </label>
                        <Input
                          name="startDate"
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          End Date & Time *
                        </label>
                        <Input
                          name="endDate"
                          type="datetime-local"
                          value={formData.endDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Instructions
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Exam Instructions
                      </label>
                      <textarea
                        name="instructions"
                        value={formData.instructions}
                        onChange={handleChange}
                        placeholder="Enter exam instructions for students"
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>

                  {/* Questions Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Questions ({questions.length})
                      </h3>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuestionMode('upload')}
                          className={questionMode === 'upload' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload JSON
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQuestionMode('manual')}
                          className={questionMode === 'manual' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Manually
                        </Button>
                      </div>
                    </div>

                    {/* File Upload Section */}
                    {questionMode === 'upload' && (
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium mb-2">Upload Questions from JSON</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Upload a JSON file with questions in the format: {`{question, options: [4 options], answer}`}
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose JSON File
                        </Button>
                      </div>
                    )}

                    {/* Manual Question Entry */}
                    {questionMode === 'manual' && (
                      <div className="space-y-4">
                        {!showQuestionForm ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowQuestionForm(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Question
                          </Button>
                        ) : (
                          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Add New Question</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQuestionForm(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">Question</label>
                              <textarea
                                name="question"
                                value={currentQuestion.question}
                                onChange={handleQuestionChange}
                                placeholder="Enter your question here..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {currentQuestion.options.map((option, index) => (
                                <div key={index}>
                                  <label className="block text-sm font-medium mb-2">
                                    Option {index + 1}
                                  </label>
                                  <Input
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                  />
                                </div>
                              ))}
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Correct Answer</label>
                              <select
                                name="answer"
                                value={currentQuestion.answer}
                                onChange={handleQuestionChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select correct answer</option>
                                {currentQuestion.options.map((option, index) => (
                                  <option key={index} value={option}>
                                    Option {index + 1}: {option}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowQuestionForm(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={addQuestion}
                              >
                                Add Question
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Questions List */}
                    {questions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Added Questions:</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {questions.map((q, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">{q.question}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Answer: {q.answer}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuestion(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
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
                      {isLoading ? 'Creating...' : 'Create Exam'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CreateExamModal
