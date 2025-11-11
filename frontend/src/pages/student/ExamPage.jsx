import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Flag,
  Play,
  Pause,
  RotateCcw,
  HelpCircle,
  Award,
  XCircle,
  Maximize,
  Minimize,
  Eye,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import useExamStore from '../../store/useExamStore'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

const ExamPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentExam,
    currentResult,
    isLoading,
    error,
    getExam,
    startExam,
    submitAnswer,
    submitExam,
    clearError
  } = useExamStore()

  const [examStarted, setExamStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false)
  const [isSecurityActive, setIsSecurityActive] = useState(false)
  const timerRef = useRef(null)
  const securityRef = useRef(null)

  // Load exam data on component mount
  useEffect(() => {
    if (id) {
      getExam(id)
    }
  }, [id, getExam])

  // Load existing answers when currentResult changes
  useEffect(() => {
    if (currentResult && currentExam && examStarted) {
      loadExistingAnswers(currentResult)
    }
  }, [currentResult, currentExam, examStarted])

  // Debug exam data structure
  useEffect(() => {
    if (currentExam) {
      console.log('Exam data:', currentExam)
      if (currentExam.questions && currentExam.questions.length > 0) {
        console.log('First question:', currentExam.questions[0])
        console.log('First question options:', currentExam.questions[0].options)
        console.log('Question text:', currentExam.questions[0].question)
        console.log('Question keys:', Object.keys(currentExam.questions[0]))
      }
    }
  }, [currentExam])

  // Debug current question - always called but conditionally logs
  useEffect(() => {
    if (currentExam && currentExam.questions && currentExam.questions.length > 0 && currentQuestionIndex >= 0) {
      const currentQuestion = currentExam.questions[currentQuestionIndex]
      if (currentQuestion) {
        console.log('Current question:', currentQuestion)
        console.log('Current question text:', currentQuestion.question)
        console.log('Current question keys:', Object.keys(currentQuestion))
      }
    }
  }, [currentExam, currentQuestionIndex])

  // Debug currentResult state
  useEffect(() => {
    console.log('CurrentResult state changed:', currentResult)
  }, [currentResult])

  // Debug store state changes
  useEffect(() => {
    const unsubscribe = useExamStore.subscribe((state) => {
      console.log('Store state changed:', {
        currentResult: state.currentResult,
        currentExam: state.currentExam,
        isLoading: state.isLoading,
        error: state.error
      })
    })
    
    return unsubscribe
  }, [])


  // Timer effect
  useEffect(() => {
    if (examStarted && timeLeft > 0 && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [examStarted, timeLeft, isPaused])

  // Security measures effect
  useEffect(() => {
    if (examStarted && isSecurityActive) {
      enableSecurityMeasures()
    } else {
      disableSecurityMeasures()
    }

    return () => {
      disableSecurityMeasures()
    }
  }, [examStarted, isSecurityActive])

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && examStarted && isSecurityActive) {
        setTabSwitchCount(prev => prev + 1)
        setShowTabSwitchWarning(true)
        
        if (tabSwitchCount >= 2) {
          toast.error('Multiple tab switches detected! Exam will be submitted automatically.')
          handleAutoSubmit()
        } else {
          toast.warning(`Tab switch detected! Warning ${tabSwitchCount + 1}/2`)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [examStarted, isSecurityActive, tabSwitchCount])

  // Security measures functions
  const enableSecurityMeasures = () => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault()
      toast.warning('Right-click is disabled during exam')
      return false
    }

    // Disable copy, paste, cut, select all
    const handleKeyDown = (e) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault()
        toast.warning('Developer tools are disabled during exam')
        return false
      }

      // Disable F11 (Fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault()
        toast.warning('Fullscreen toggle is disabled during exam')
        return false
      }

      // Disable Alt+Tab (Window switching)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault()
        toast.warning('Window switching is disabled during exam')
        return false
      }

      // Disable Alt+F4 (Close window)
      if (e.altKey && e.key === 'F4') {
        e.preventDefault()
        toast.warning('Closing window is disabled during exam')
        return false
      }

      // Disable Ctrl+W (Close tab)
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
        toast.warning('Closing tab is disabled during exam')
        return false
      }

      // Disable Ctrl+Shift+T (Reopen closed tab)
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        toast.warning('Reopening tabs is disabled during exam')
        return false
      }

      // Disable Ctrl+T (New tab)
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        toast.warning('Opening new tabs is disabled during exam')
        return false
      }

      // Disable Ctrl+N (New window)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault()
        toast.warning('Opening new windows is disabled during exam')
        return false
      }

      // Disable copy, paste, cut, select all
      if ((e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) ||
          (e.metaKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a'))) {
        e.preventDefault()
        toast.warning('Copy/paste is disabled during exam')
        return false
      }

      // Disable print
      if ((e.ctrlKey && e.key === 'p') || (e.metaKey && e.key === 'p')) {
        e.preventDefault()
        toast.warning('Print is disabled during exam')
        return false
      }
    }

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault()
      return false
    }

    // Disable drag
    const handleDragStart = (e) => {
      e.preventDefault()
      return false
    }

    // Prevent window blur (minimizing)
    const handleWindowBlur = () => {
      if (examStarted && isSecurityActive) {
        toast.warning('You cannot minimize the window during the exam')
        // Force focus back to the window
        window.focus()
      }
    }

    // Prevent window beforeunload (closing)
    const handleBeforeUnload = (e) => {
      if (examStarted && isSecurityActive) {
        e.preventDefault()
        e.returnValue = 'You cannot close the window during the exam. Your progress will be lost.'
        return 'You cannot close the window during the exam. Your progress will be lost.'
      }
    }

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('selectstart', handleSelectStart)
    document.addEventListener('dragstart', handleDragStart)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Store references for cleanup
    securityRef.current = {
      handleContextMenu,
      handleKeyDown,
      handleSelectStart,
      handleDragStart,
      handleWindowBlur,
      handleBeforeUnload
    }

    // Disable text selection via CSS
    document.body.style.userSelect = 'none'
    document.body.style.webkitUserSelect = 'none'
    document.body.style.mozUserSelect = 'none'
    document.body.style.msUserSelect = 'none'

    // Disable drag
    document.body.style.webkitUserDrag = 'none'
    document.body.style.khtmlUserSelect = 'none'
    document.body.style.webkitTouchCallout = 'none'
  }

  const disableSecurityMeasures = () => {
    if (securityRef.current) {
      document.removeEventListener('contextmenu', securityRef.current.handleContextMenu)
      document.removeEventListener('keydown', securityRef.current.handleKeyDown)
      document.removeEventListener('selectstart', securityRef.current.handleSelectStart)
      document.removeEventListener('dragstart', securityRef.current.handleDragStart)
      window.removeEventListener('blur', securityRef.current.handleWindowBlur)
      window.removeEventListener('beforeunload', securityRef.current.handleBeforeUnload)
    }

    // Re-enable text selection
    document.body.style.userSelect = ''
    document.body.style.webkitUserSelect = ''
    document.body.style.mozUserSelect = ''
    document.body.style.msUserSelect = ''

    // Re-enable drag
    document.body.style.webkitUserDrag = ''
    document.body.style.khtmlUserSelect = ''
    document.body.style.webkitTouchCallout = ''
  }

  // Fullscreen functions
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        toast.success('Entered fullscreen mode')
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
        toast.info('Exited fullscreen mode')
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      toast.error('Fullscreen not supported')
    }
  }

  // Force fullscreen when exam starts
  const forceFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      toast.error('Please allow fullscreen mode to continue with the exam')
    }
  }

  // Prevent exiting fullscreen during exam
  const preventFullscreenExit = (e) => {
    if (examStarted && isSecurityActive) {
      e.preventDefault()
      toast.warning('You cannot exit fullscreen mode during the exam')
      return false
    }
  }

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)
      
      // If exam is active and user tries to exit fullscreen, force them back
      if (examStarted && isSecurityActive && !isCurrentlyFullscreen) {
        toast.warning('You must stay in fullscreen mode during the exam')
        setTimeout(() => {
          forceFullscreen()
        }, 1000)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [examStarted, isSecurityActive])

  // Periodic fullscreen check
  useEffect(() => {
    let fullscreenCheckInterval
    
    if (examStarted && isSecurityActive) {
      fullscreenCheckInterval = setInterval(() => {
        if (!document.fullscreenElement) {
          toast.warning('You must stay in fullscreen mode during the exam')
          forceFullscreen()
        }
      }, 2000) // Check every 2 seconds
    }

    return () => {
      if (fullscreenCheckInterval) {
        clearInterval(fullscreenCheckInterval)
      }
    }
  }, [examStarted, isSecurityActive])

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Start exam
  const handleStartExam = async () => {
    try {
      console.log('Starting exam with ID:', id)
      const result = await startExam(id)
      console.log('Start exam response:', result)
      
      if (result.success) {
        setExamStarted(true)
        setTimeLeft(currentExam.duration * 60) // Convert minutes to seconds
        setShowInstructions(false)
        setIsSecurityActive(true) // Enable security measures
        
        // Force fullscreen mode when exam starts
        await forceFullscreen()
        
        toast.success('Exam started successfully! Security measures activated. You are now in fullscreen mode.')
        console.log('Exam started, currentResult should be set in store')
        
        // Load existing answers from the result
        loadExistingAnswers(result.result)
      } else {
        toast.error(result.error || 'Failed to start exam')
      }
    } catch (error) {
      console.error('Start exam error:', error)
      toast.error('Failed to start exam')
    }
  }

  // Load existing answers from result
  const loadExistingAnswers = (result) => {
    if (result && result.answers) {
      const existingAnswers = {}
      result.answers.forEach(answer => {
        if (answer.isAnswered && answer.selectedAnswer) {
          // Find the question to get the option value
          const question = currentExam.questions.find(q => q._id === answer.question._id || q._id === answer.question)
          if (question && question.options) {
            // If selectedAnswer is text, find the corresponding option ID
            const selectedOption = question.options.find(opt => opt.text === answer.selectedAnswer)
            if (selectedOption) {
              existingAnswers[answer.question._id || answer.question] = selectedOption._id || selectedOption.id
            } else {
              // If no matching option found, use the selectedAnswer as is
              existingAnswers[answer.question._id || answer.question] = answer.selectedAnswer
            }
          }
        }
      })
      console.log('Loading existing answers:', existingAnswers)
      setAnswers(existingAnswers)
    }
  }

  // Handle answer selection
  const handleAnswerSelect = async (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
    
    // Submit answer to backend if exam is started and we have a result
    if (examStarted && currentResult) {
      try {
        // Find the current question to get the option text
        const currentQuestion = currentExam.questions.find(q => q._id === questionId)
        let selectedAnswerText = answer
        
        if (currentQuestion && currentQuestion.options) {
          // If answer is an ID, find the corresponding option text
          if (answer.match(/^[0-9a-fA-F]{24}$/)) {
            const selectedOption = currentQuestion.options.find(opt => 
              opt._id === answer || opt.id === answer
            )
            selectedAnswerText = selectedOption ? selectedOption.text : answer
          }
        }
        
        console.log('Submitting answer:', {
          questionId,
          originalAnswer: answer,
          selectedAnswerText,
          currentQuestion: currentQuestion
        })
        
        const submitResponse = await submitAnswer(currentResult._id, {
          questionId,
          selectedAnswer: selectedAnswerText,
          timeSpent: 0 // You might want to track actual time spent
        })
        
        console.log('Answer submission response:', submitResponse)
        console.log('Updated currentResult after submission:', useExamStore.getState().currentResult)
      } catch (error) {
        console.error('Failed to submit answer:', error)
        // Don't show error to user as it might be disruptive during exam
      }
    }
  }

  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentExam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // Navigate to previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  // Jump to specific question
  const handleJumpToQuestion = (index) => {
    setCurrentQuestionIndex(index)
  }

  // Submit exam
  const handleSubmitExam = async () => {
    if (window.confirm('Are you sure you want to submit the exam? This action cannot be undone.')) {
      try {
        // Disable security measures and fullscreen enforcement before submitting
        setIsSecurityActive(false)
        disableSecurityMeasures()
        
        // Allow user to exit fullscreen after exam submission
        if (document.fullscreenElement) {
          try {
            await document.exitFullscreen()
            setIsFullscreen(false)
          } catch (error) {
            console.log('Could not exit fullscreen:', error)
          }
        }
        
        console.log('Submit exam - currentResult:', currentResult)
        console.log('Submit exam - examStarted:', examStarted)
        
        // Check if we have a current result
        if (!currentResult || !currentResult._id) {
          console.error('No currentResult found:', currentResult)
          
          // Try to get the result from the store state
          const storeState = useExamStore.getState()
          console.log('Store state:', storeState)
          
          if (storeState.currentResult && storeState.currentResult._id) {
            console.log('Found currentResult in store, using it')
            const result = await submitExam(storeState.currentResult._id)
            if (result.success) {
              toast.success('Exam submitted successfully!')
              navigate(`/my-reports`)
            } else {
              toast.error(result.error || 'Failed to submit exam')
            }
          } else {
            // Try to find the result by exam ID and user
            console.log('Trying to find result by exam ID:', id)
            try {
              // Get user results to find the current exam result
              const userResults = await useExamStore.getState().getUserResults()
              if (userResults.success) {
                const currentExamResult = userResults.results.find(r => 
                  r.exam && r.exam._id === id && r.status === 'in-progress'
                )
                if (currentExamResult) {
                  console.log('Found in-progress result:', currentExamResult)
                  const result = await submitExam(currentExamResult._id)
                  if (result.success) {
                    toast.success('Exam submitted successfully!')
                    navigate(`/my-reports`)
                  } else {
                    toast.error(result.error || 'Failed to submit exam')
                  }
                } else {
                  toast.error('No active exam session found. Please refresh and try again.')
                }
              } else {
                toast.error('No active exam session found. Please refresh and try again.')
              }
            } catch (error) {
              console.error('Error finding result:', error)
              toast.error('No active exam session found. Please refresh and try again.')
            }
          }
          return
        }

        console.log('Submitting exam with result ID:', currentResult._id)
        const result = await submitExam(currentResult._id)
        console.log('Submit exam response:', result)
        
        if (result.success) {
          toast.success('Exam submitted successfully!')
          navigate(`/my-reports`)
        } else {
          toast.error(result.error || 'Failed to submit exam')
        }
      } catch (error) {
        console.error('Submit exam error:', error)
        toast.error('Failed to submit exam')
      }
    }
  }

  // Auto submit when time runs out
  const handleAutoSubmit = async () => {
    try {
      // Disable security measures and fullscreen enforcement before auto-submitting
      setIsSecurityActive(false)
      disableSecurityMeasures()
      
      // Allow user to exit fullscreen after auto-submission
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
          setIsFullscreen(false)
        } catch (error) {
          console.log('Could not exit fullscreen:', error)
        }
      }
      
      if (!currentResult || !currentResult._id) {
        console.error('No current result available for auto-submit')
        return
      }

      const result = await submitExam(currentResult._id)
      if (result.success) {
        toast.info('Time up! Exam submitted automatically.')
        navigate(`/my-reports`)
      } else {
        toast.error('Failed to auto-submit exam')
      }
    } catch (error) {
      console.error('Auto-submit error:', error)
      toast.error('Failed to auto-submit exam')
    }
  }

  // Toggle pause
  const handleTogglePause = () => {
    setIsPaused(prev => !prev)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading exam...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Error Loading Exam
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={() => navigate('/my-exams')} size="lg">
              Back to My Exams
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentExam) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Exam Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The exam you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/my-exams')} size="lg">
              Back to My Exams
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show instructions if exam hasn't started
  if (showInstructions) {
  return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
            className="max-w-5xl w-full"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {currentExam.title}
          </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                  {currentExam.description}
          </p>
        </div>

              <div className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="text-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{currentExam.duration} minutes</p>
                  </div>
                  <div className="text-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Questions</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{currentExam.questions?.length || 0}</p>
                  </div>
                  <div className="text-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-700 rounded-lg sm:col-span-2 lg:col-span-1">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Passing Score</p>
                    <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{currentExam.passingScore}%</p>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white text-center">
                    Exam Instructions
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium text-green-600 dark:text-green-400 mb-2 sm:mb-3">
                        ✓ What You Can Do:
                      </h3>
                      <ul className="space-y-2 sm:space-y-3 text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Navigation</p>
                            <p className="text-xs sm:text-sm">Use Previous/Next buttons to move between questions</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Auto Save</p>
                            <p className="text-xs sm:text-sm">Answers are saved automatically as you select them</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Timer Control</p>
                            <p className="text-xs sm:text-sm">You can pause the exam timer if needed</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-medium text-red-600 dark:text-red-400 mb-2 sm:mb-3">
                        ✗ What You Cannot Do:
                      </h3>
                      <ul className="space-y-2 sm:space-y-3 text-gray-600 dark:text-gray-400">
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Copy/Paste</p>
                            <p className="text-xs sm:text-sm">Copy, paste, and text selection are disabled during the exam</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">New Tabs/Windows</p>
                            <p className="text-xs sm:text-sm">Opening new tabs or switching tabs will trigger warnings</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Developer Tools</p>
                            <p className="text-xs sm:text-sm">F12, right-click, and developer tools are disabled</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Page Navigation</p>
                            <p className="text-xs sm:text-sm">Do not refresh the page or navigate away during the exam</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Fullscreen Mode</p>
                            <p className="text-xs sm:text-sm">You must stay in fullscreen mode throughout the exam</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Window Minimization</p>
                            <p className="text-xs sm:text-sm">You cannot minimize the window or switch to other applications</p>
                          </div>
                        </li>
                        <li className="flex items-start">
                          <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm sm:text-base">Auto Submit</p>
                            <p className="text-xs sm:text-sm">Exam will be submitted automatically when time runs out</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/my-exams')}
                    size="lg"
                    className="px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Back to My Exams
                  </Button>
                  <Button
                    onClick={handleStartExam}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Start Exam
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Show exam interface
  if (!currentExam.questions || currentExam.questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No Questions Available
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This exam doesn't have any questions yet.
            </p>
            <Button onClick={() => navigate('/my-exams')} size="lg">
              Back to My Exams
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = currentExam.questions[currentQuestionIndex]
  const answeredQuestions = Object.keys(answers).length
  const totalQuestions = currentExam.questions.length

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Full-screen Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {currentExam.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* Security Status */}
            {isSecurityActive && (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">Security Active</span>
              </div>
            )}
            
            {/* Fullscreen Warning */}
            {examStarted && isSecurityActive && !isFullscreen && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Fullscreen Required</span>
              </div>
            )}
            
            {/* Tab Switch Warning */}
            {showTabSwitchWarning && (
              <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Tab Switch: {tabSwitchCount}/2</span>
              </div>
            )}
            
            <div className="text-right">
              <div className={`text-2xl sm:text-3xl font-mono font-bold ${
                timeLeft < 300 ? 'text-red-600' : 'text-gray-900 dark:text-white'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isPaused ? 'Paused' : 'Time Remaining'}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex-shrink-0"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                disabled={examStarted && isSecurityActive}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleTogglePause}
                className="flex-shrink-0"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switch Warning Modal */}
      {showTabSwitchWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-8 w-8 text-orange-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tab Switch Detected
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You have switched tabs {tabSwitchCount} time(s). 
              {tabSwitchCount >= 2 
                ? ' This is your final warning. The exam will be submitted automatically if you switch tabs again.'
                : ' Please stay focused on the exam. Multiple tab switches may result in automatic submission.'
              }
            </p>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowTabSwitchWarning(false)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Content with Sidebar */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Question Navigation Sidebar */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 sm:p-6 overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Questions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {answeredQuestions} of {totalQuestions} answered
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Current: Question {currentQuestionIndex + 1} of {totalQuestions}
            </div>
          </div>
          
          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-3">
            {currentExam.questions.map((question, index) => (
              <button
                key={question._id}
                onClick={() => handleJumpToQuestion(index)}
                className={`w-12 h-12 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[question._id]
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Main Question Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:p-8">
              <div className="mb-6 sm:mb-8">
                {/* Debug info - remove this later
                <div className="mb-4 p-3 text-white dark:bg-gray-500 rounded-lg text-xs">
                  <strong>Debug:</strong> Question keys: {Object.keys(currentQuestion).join(', ')}<br/>
                  Question text: {JSON.stringify(currentQuestion.question)}<br/>
                  Question text field: {currentQuestion.question || currentQuestion.text || currentQuestion.questionText || 'NOT FOUND'}
                </div> */}
                
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  {currentQuestion.questionText || currentQuestion.question || currentQuestion.text || 'Question text not available'}
                </h2>
                
                <div className="space-y-3 sm:space-y-4">
                  {currentQuestion.options.map((option, index) => {
                    // Handle both string and object options
                    const optionText = typeof option === 'string' ? option : option.text
                    const optionValue = typeof option === 'string' ? option : option._id || option.id
                    
                    return (
                      <label
                        key={optionValue || index}
                        className={`flex items-center p-3 sm:p-4 lg:p-6 rounded-lg border cursor-pointer transition-colors ${
                          answers[currentQuestion._id] === optionValue
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion._id}`}
                          value={optionValue}
                          checked={answers[currentQuestion._id] === optionValue}
                          onChange={() => handleAnswerSelect(currentQuestion._id, optionValue)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center ${
                          answers[currentQuestion._id] === optionValue
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {answers[currentQuestion._id] === optionValue && (
                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-white">{optionText}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handlePrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  size="lg"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Previous
                </Button>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleJumpToQuestion(currentQuestionIndex)}
                    size="lg"
                  >
                    <Flag className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Flag
                  </Button>
                </div>
                
                {currentQuestionIndex === totalQuestions - 1 ? (
                  <Button
                    onClick={handleSubmitExam}
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    Submit Exam
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextQuestion} 
                    size="lg"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamPage
