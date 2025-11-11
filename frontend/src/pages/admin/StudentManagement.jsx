import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  UserPlus,
  GraduationCap,
  BookOpen,
  Users,
  Settings,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import Loader from '../../components/common/Loader'
import { toast } from 'react-toastify'
import useStudentStore from '../../store/useStudentStore'
import useExamStore from '../../store/useExamStore'
import { resultAPI } from '../../utils/api'

const StudentManagement = () => {
  const {
    students,
    isLoading,
    error,
    pagination,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    toggleStudentStatus,
    assignExams,
    toggleAnswerViewing,
    getStudentExamAssignments,
    clearError
  } = useStudentStore()

  const { exams, getExams } = useExamStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedExams, setSelectedExams] = useState([])
  const [studentResults, setStudentResults] = useState([])
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [newStudentData, setNewStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    canViewAnswers: false
  })
  const [editStudentData, setEditStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    canViewAnswers: false
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchStudents({ page: 1, limit: 50 }),
        getExams()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterRole === 'all' || student.role === filterRole
    return matchesSearch && matchesFilter
  })

  const handleAddStudent = () => {
    setShowAddModal(true)
  }

  const handleEditStudent = (student) => {
    setSelectedStudent(student)
    setEditStudentData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      canViewAnswers: student.canViewAnswers
    })
    setShowEditModal(true)
  }

  const handleViewStudent = (student) => {
    setSelectedStudent(student)
    setShowViewModal(true)
  }

  const handleAssignExams = (student) => {
    setSelectedStudent(student)
    setSelectedExams(student.assignedExams || [])
    setShowAssignModal(true)
  }

  const handleViewResults = async (student) => {
    setSelectedStudent(student)
    setIsLoadingResults(true)
    setShowResultsModal(true)
    
    try {
      // Use the API utility with proper authentication
      const response = await resultAPI.getStudentResults(student._id)
      
      if (response.data.success) {
        setStudentResults(response.data.data.results || [])
      } else {
        toast.error('Failed to load student results')
        setStudentResults([])
      }
    } catch (error) {
      console.error('Error fetching student results:', error)
      toast.error('Failed to load student results')
      setStudentResults([])
    } finally {
      setIsLoadingResults(false)
    }
  }

  const handleToggleActive = async (studentId) => {
    try {
      await toggleStudentStatus(studentId)
    } catch (error) {
      console.error('Error toggling student status:', error)
    }
  }

  const handleToggleAnswerViewing = async (studentId) => {
    try {
      await toggleAnswerViewing(studentId)
    } catch (error) {
      console.error('Error toggling answer viewing:', error)
    }
  }

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(studentId)
      } catch (error) {
        console.error('Error deleting student:', error)
      }
    }
  }

  const handleAssignExamsSubmit = async () => {
    try {
      await assignExams(selectedStudent._id, selectedExams)
      setShowAssignModal(false)
    } catch (error) {
      console.error('Error assigning exams:', error)
    }
  }

  const handleAddStudentSubmit = async () => {
    try {
      await createStudent(newStudentData)
      setShowAddModal(false)
      setNewStudentData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        canViewAnswers: false
      })
    } catch (error) {
      console.error('Error creating student:', error)
    }
  }

  const handleEditStudentSubmit = async () => {
    try {
      await updateStudent(selectedStudent._id, editStudentData)
      setShowEditModal(false)
    } catch (error) {
      console.error('Error updating student:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage students and their exam assignments</p>
        </div>
        <Button onClick={handleAddStudent} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <motion.div
            key={student._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-black">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">{student.email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {student.assignedExams?.length || 0} exams assigned
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Answer Viewing Toggle */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">View Answers:</span>
                      <button
                        onClick={() => handleToggleAnswerViewing(student._id)}
                        className="flex items-center"
                      >
                        {student.canViewAnswers ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStudent(student)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResults(student)}
                        title="View Exam Results"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                        title="Edit Student"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignExams(student)}
                        title="Assign Exams"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(student._id)}
                        title={student.isActive ? 'Deactivate' : 'Activate'}
                        className={student.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {student.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStudent(student._id)}
                        title="Delete Student"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">
              No students found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first student.'
              }
            </p>
            {!searchTerm && filterRole === 'all' && (
              <Button onClick={handleAddStudent}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Add New Student
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddStudentSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <Input 
                  placeholder="Enter first name" 
                  value={newStudentData.firstName}
                  onChange={(e) => setNewStudentData({...newStudentData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <Input 
                  placeholder="Enter last name" 
                  value={newStudentData.lastName}
                  onChange={(e) => setNewStudentData({...newStudentData, lastName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input 
                  type="email" 
                  placeholder="Enter email address" 
                  value={newStudentData.email}
                  onChange={(e) => setNewStudentData({...newStudentData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <Input 
                  type="password" 
                  placeholder="Enter password" 
                  value={newStudentData.password}
                  onChange={(e) => setNewStudentData({...newStudentData, password: e.target.value})}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="canViewAnswers" 
                  className="rounded" 
                  checked={newStudentData.canViewAnswers}
                  onChange={(e) => setNewStudentData({...newStudentData, canViewAnswers: e.target.checked})}
                />
                <label htmlFor="canViewAnswers" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow viewing answers
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Edit Student
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditStudentSubmit(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <Input 
                  value={editStudentData.firstName}
                  onChange={(e) => setEditStudentData({...editStudentData, firstName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <Input 
                  value={editStudentData.lastName}
                  onChange={(e) => setEditStudentData({...editStudentData, lastName: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input 
                  type="email" 
                  value={editStudentData.email}
                  onChange={(e) => setEditStudentData({...editStudentData, email: e.target.value})}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="editCanViewAnswers" 
                  className="rounded" 
                  checked={editStudentData.canViewAnswers}
                  onChange={(e) => setEditStudentData({...editStudentData, canViewAnswers: e.target.checked})}
                />
                <label htmlFor="editCanViewAnswers" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow viewing answers
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Student Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name
                  </label>
                  <p className="text-black">{selectedStudent.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name
                  </label>
                  <p className="text-black">{selectedStudent.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-black">{selectedStudent.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedStudent.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {selectedStudent.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Can View Answers
                  </label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedStudent.canViewAnswers 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {selectedStudent.canViewAnswers ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Exams
                  </label>
                  <p className="text-black">{selectedStudent.assignedExams?.length || 0}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Exams Modal */}
      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Assign Exams to {selectedStudent.firstName} {selectedStudent.lastName}
            </h3>
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto">
                {exams.map((exam) => (
                  <div key={exam._id} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <input
                      type="checkbox"
                      id={`exam-${exam._id}`}
                      checked={selectedExams.includes(exam._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedExams([...selectedExams, exam._id])
                        } else {
                          setSelectedExams(selectedExams.filter(id => id !== exam._id))
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor={`exam-${exam._id}`} className="block text-sm font-medium text-black">
                        {exam.title}
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{exam.subject}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      exam.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {exam.status}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignExamsSubmit}>
                  Assign Exams
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Results Modal */}
      {showResultsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-black">
                Exam Results - {selectedStudent.firstName} {selectedStudent.lastName}
              </h3>
              <Button variant="outline" onClick={() => setShowResultsModal(false)}>
                Close
              </Button>
            </div>

            {isLoadingResults ? (
              <div className="flex items-center justify-center h-64">
                <Loader size="lg" text="Loading results..." />
              </div>
            ) : studentResults.length > 0 ? (
              <div className="space-y-4">
                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Exams</p>
                        <p className="text-2xl font-bold text-black">{studentResults.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Award className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Passed</p>
                        <p className="text-2xl font-bold text-black">
                          {studentResults.filter(r => r.isPassed).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                        <p className="text-2xl font-bold text-black">
                          {Math.round(studentResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / studentResults.length)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time</p>
                        <p className="text-2xl font-bold text-black">
                          {Math.round(studentResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / studentResults.length)}m
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Results */}
                <div className="space-y-3">
                  {studentResults.map((result, index) => (
                    <Card key={result._id || index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-black">
                              {result.exam?.title || 'Unknown Exam'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Subject: {result.exam?.subject || 'N/A'} • 
                              Date: {new Date(result.endTime || result.startTime).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                result.isPassed 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {result.isPassed ? 'Passed' : 'Failed'}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Score: {result.percentage?.toFixed(1) || 0}%
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Grade: {result.grade || 'N/A'}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Time: {result.timeSpent || 0} minutes
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-black">
                              {result.obtainedMarks || 0}/{result.totalMarks || 0}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Marks</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2">
                  No Exam Results Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  This student hasn't taken any exams yet.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManagement
