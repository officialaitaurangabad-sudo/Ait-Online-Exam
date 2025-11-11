import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { toast } from 'react-toastify'
import useQuestionStore from '../../store/useQuestionStore'

const BulkUploadModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState(null)

  const { bulkUploadQuestions } = useQuestionStore()

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/json') {
        toast.error('Please select a JSON file')
        return
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      const result = await bulkUploadQuestions(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (result.success) {
        setUploadResult({
          success: true,
          message: 'Questions uploaded successfully!',
          data: result.data
        })
        toast.success('Questions uploaded successfully!')
      } else {
        setUploadResult({
          success: false,
          message: result.error || 'Upload failed'
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setUploadResult(null)
    setUploadProgress(0)
    onClose()
  }

  const downloadTemplate = () => {
    const template = [
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        answer: "Paris",
        subject: "Geography",
        difficulty: "easy",
        marks: 1,
        category: "General Knowledge",
        explanation: "Paris is the capital and largest city of France."
      },
      {
        question: "Which programming language is known for its use in web development?",
        options: ["Python", "JavaScript", "C++", "Java"],
        answer: "JavaScript",
        subject: "Programming",
        difficulty: "medium",
        marks: 2,
        category: "Web Development",
        explanation: "JavaScript is primarily used for web development, especially for frontend development."
      }
    ]

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'question-template.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Template downloaded successfully!')
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
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-0 shadow-none h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold">Bulk Upload Questions</CardTitle>
                  <CardDescription>
                    Upload multiple questions from a JSON file
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
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Upload Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Upload a JSON file with question data</li>
                      <li>• Maximum file size: 10MB</li>
                      <li>• Use the template format for best results</li>
                      <li>• All questions will be marked as active by default</li>
                    </ul>
                  </div>

                  {/* Template Download */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Download Template
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Get the correct JSON format for bulk upload
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                    >
                      Download
                    </Button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select JSON File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center space-y-2"
                      >
                        <Upload className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {file ? file.name : 'Click to select file or drag and drop'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            JSON files only, max 10MB
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Uploading...
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {uploadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Result */}
                  {uploadResult && (
                    <div className={`p-4 rounded-lg border ${
                      uploadResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {uploadResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className={`text-sm font-medium ${
                            uploadResult.success
                              ? 'text-green-900 dark:text-green-100'
                              : 'text-red-900 dark:text-red-100'
                          }`}>
                            {uploadResult.message}
                          </p>
                          {uploadResult.data && (
                            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                              {uploadResult.data.imported || 0} questions imported successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* JSON Format Example */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected JSON Format
                    </h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                      <pre>{`[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "answer": "Paris",
    "subject": "Geography",
    "difficulty": "easy",
    "marks": 1,
    "category": "General Knowledge",
    "explanation": "Paris is the capital of France."
  }
]`}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>

              {/* Actions */}
              <div className="flex justify-end space-x-3 p-6 border-t">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  loading={isUploading}
                  disabled={!file || isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Questions
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default BulkUploadModal
