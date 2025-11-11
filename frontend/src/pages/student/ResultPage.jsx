import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  BookOpen,
  Target,
  Timer,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import useExamStore from '../../store/useExamStore'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const ResultPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentResult, getResult, isLoading, error } = useExamStore()
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (id) {
      loadResult()
    }
  }, [id])

  const loadResult = async () => {
    try {
      const response = await getResult(id)
      if (response.success) {
        console.log('Result loaded:', response.result)
        console.log('Answers:', response.result.answers)
        response.result.answers.forEach((answer, index) => {
          console.log(`Answer ${index + 1}:`, {
            isAnswered: answer.isAnswered,
            selectedAnswer: answer.selectedAnswer,
            isCorrect: answer.isCorrect,
            question: answer.question
          })
        })
        setResult(response.result)
      }
    } catch (error) {
      console.error('Error loading result:', error)
      toast.error('Failed to load exam result')
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'D':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  // Helper function to get the display text for selected answer
  const getDisplayAnswer = (answer) => {
    console.log('getDisplayAnswer called with:', {
      isAnswered: answer.isAnswered,
      selectedAnswer: answer.selectedAnswer,
      question: answer.question
    })
    
    // Check if the answer was actually answered
    if (!answer.isAnswered || !answer.selectedAnswer) {
      console.log('Answer not answered or no selected answer')
      return null
    }
    
    // If it's already a string (text), return it
    if (typeof answer.selectedAnswer === 'string') {
      // Check if it's an ID (ObjectId format) or actual text
      if (answer.selectedAnswer.match(/^[0-9a-fA-F]{24}$/)) {
        console.log('Selected answer is an ID, looking for option text')
        // It's an ID, find the corresponding option text
        if (answer.question && answer.question.options) {
          const option = answer.question.options.find(opt => 
            opt._id === answer.selectedAnswer || opt.id === answer.selectedAnswer
          )
          console.log('Found option:', option)
          return option ? option.text : answer.selectedAnswer
        }
        return answer.selectedAnswer
      }
      console.log('Selected answer is text:', answer.selectedAnswer)
      return answer.selectedAnswer
    }
    
    // If it's an object or array, stringify it
    console.log('Selected answer is object/array, stringifying')
    return JSON.stringify(answer.selectedAnswer)
  }

  // Helper function to get the correct answer text
  const getCorrectAnswer = (question) => {
    if (!question) return null
    
    // For multiple choice questions
    if (question.questionType === 'multiple-choice' && question.options) {
      const correctOption = question.options.find(opt => opt.isCorrect)
      return correctOption ? correctOption.text : null
    }
    
    // For other question types
    if (question.correctAnswer) {
      return typeof question.correctAnswer === 'string' 
        ? question.correctAnswer 
        : JSON.stringify(question.correctAnswer)
    }
    
    return null
  }

  if (isLoading) {
    return (
      <div className="container-responsive py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading results...</span>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="container-responsive py-8">
        <div className="text-center py-12">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-900 mb-4">
            Error Loading Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'Unable to load exam results'}
          </p>
          <Button onClick={() => navigate('/my-exams')} size="lg">
            Back to My Exams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-responsive py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900 mb-2">
            Exam Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {result.exam?.title || 'Exam'} - {result.exam?.subject || 'Subject'}
          </p>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(result.percentage || 0)}`}>
                {result.percentage || 0}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-900">
                {result.grade || 'F'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Grade</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-900">
                {result.obtainedMarks || 0}/{result.totalMarks || 0}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Marks</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Timer className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-900">
                {result.timeSpent || 0}m
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Spent</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Detailed breakdown of your exam performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {result.analytics?.correctAnswers || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Correct Answers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-2">
                  {result.analytics?.wrongAnswers || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Wrong Answers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 mb-2">
                  {result.analytics?.unansweredQuestions || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unanswered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        {result.answers && result.answers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
              <CardDescription>
                {user?.canViewAnswers 
                  ? "Review your answers and see the correct solutions"
                  : "Review your answers (correct solutions are hidden by your instructor)"
                }
              </CardDescription>
              {!user?.canViewAnswers && (
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <EyeOff className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Answer viewing is disabled by your instructor
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {result.answers.map((answer, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-900">
                        Question {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {answer.isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          answer.isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                    </div>
                    
                    {answer.question && (
                      <div className="mb-3">
                        <p className="text-gray-700 dark:text-red-800">
                          {answer.question.questionText || answer.question.question}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Your Answer:
                        </p>
                        <p className="text-gray-900 dark:text-gray-900">
                          {getDisplayAnswer(answer) || 'Not answered'}
                        </p>
                      </div>
                      {user?.canViewAnswers && answer.question && answer.question.options && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Correct Answer:
                          </p>
                          <p className="text-gray-900 dark:text-gray-900">
                            {getCorrectAnswer(answer.question) || 'N/A'}
                          </p>
                        </div>
                      )}
                      {!user?.canViewAnswers && (
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                          <EyeOff className="h-4 w-4" />
                          <span className="text-sm">Answer viewing is disabled by your instructor</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Marks: {answer.marksObtained || 0}/{answer.question?.marks || 0}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Time: {answer.timeSpent || 0}s
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/my-exams')}
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Exams
          </Button>
          <Button
            onClick={() => navigate('/my-reports')}
            size="lg"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View All Reports
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default ResultPage
