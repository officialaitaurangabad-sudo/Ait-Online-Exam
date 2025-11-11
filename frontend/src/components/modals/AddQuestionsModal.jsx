import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Plus, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { toast } from 'react-toastify'
import { questionAPI, examAPI } from '../../utils/api'

const AddQuestionsModal = ({ isOpen, onClose, examId, examTitle, onQuestionsAdded }) => {
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Fetch available questions
  useEffect(() => {
    if (isOpen) {
      fetchQuestions()
    }
  }, [isOpen])

  // Filter questions based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = questions.filter(q => 
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredQuestions(filtered)
    } else {
      setFilteredQuestions(questions)
    }
  }, [searchTerm, questions])

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const response = await questionAPI.getQuestions({ limit: 100 })
      setQuestions(response.data.data.questions)
      setFilteredQuestions(response.data.data.questions)
    } catch (error) {
      toast.error('Failed to fetch questions')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const addQuestionsToExam = async () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question')
      return
    }

    setIsAdding(true)
    try {
      const response = await examAPI.addQuestionsToExam(examId, selectedQuestions)
      if (response.data.success) {
        toast.success(`Added ${selectedQuestions.length} questions to "${examTitle}"`)
        onQuestionsAdded(selectedQuestions.length)
        onClose()
      } else {
        toast.error('Failed to add questions to exam')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add questions to exam'
      toast.error(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }

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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold">Add Questions to Exam</CardTitle>
                  <CardDescription>
                    Select questions to add to "{examTitle}"
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
              
              <CardContent className="flex-1 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Loading questions...</p>
                    </div>
                  ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map((question) => (
                      <div
                        key={question._id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedQuestions.includes(question._id)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => toggleQuestionSelection(question._id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {question.questionText}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>Subject: {question.subject}</span>
                              <span>Difficulty: {question.difficulty}</span>
                              <span>Marks: {question.marks}</span>
                            </div>
                          </div>
                          {selectedQuestions.includes(question._id) && (
                            <Check className="h-5 w-5 text-blue-600 ml-2" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No questions found</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      disabled={isAdding}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={addQuestionsToExam}
                      loading={isAdding}
                      disabled={selectedQuestions.length === 0 || isAdding}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add {selectedQuestions.length} Question{selectedQuestions.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddQuestionsModal
