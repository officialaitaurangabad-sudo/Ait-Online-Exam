import { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import Navbar from './components/common/Navbar'
import Sidebar from './components/common/Sidebar'
import Footer from './components/common/Footer'
import Loader from './components/common/Loader'

// Auth pages - Keep these as regular imports for faster initial load
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Student pages - Lazy load heavy pages
import StudentDashboard from './pages/student/Dashboard'
import MyExams from './pages/student/MyExams'
import MyReports from './pages/student/MyReports'
const ExamPage = lazy(() => import('./pages/student/ExamPage'))
const TestExamFlow = lazy(() => import('./pages/TestExamFlow'))
const ResultPage = lazy(() => import('./pages/student/ResultPage'))

// Admin pages - Lazy load heavy pages
import AdminDashboard from './pages/admin/Dashboard'
import ManageExams from './pages/admin/ManageExams'
import ManageQuestions from './pages/admin/ManageQuestions'
import StudentManagement from './pages/admin/StudentManagement'
const StudentAnalytics = lazy(() => import('./pages/admin/StudentAnalytics'))
import UserManagement from './pages/admin/UserManagement'

// Error page
import ErrorPage from './pages/ErrorPage'

// Inner component that uses the auth context
function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <Loader />
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Full-screen exam route - no sidebar, navbar, or footer */}
        <Route path="/exam/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Suspense fallback={<Loader text="Loading exam..." />}>
              <ExamPage />
            </Suspense>
          </ProtectedRoute>
        } />
        
        {/* All other routes with normal layout */}
        <Route path="*" element={
          <div>
            {user && <Navbar />}
            
            <div className={`flex ${user ? 'pt-16' : ''}`}>
              {user && <Sidebar />}
              
              <main className={`flex-1 ${user ? 'ml-64' : ''} min-h-[calc(100vh-4rem)]`}>
                <Routes>
                  {/* Public routes */}
                  <Route 
                    path="/login" 
                    element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace /> : <Login />} 
                  />
                  <Route 
                    path="/register" 
                    element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace /> : <Register />} 
                  />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  
                  {/* Protected routes */}
                  <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />} />
                  
                  {/* Student routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-exams" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyExams />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-reports" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/results/:id" element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <Suspense fallback={<Loader text="Loading results..." />}>
                        <ResultPage />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/test-exam-flow" element={
                    <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
                      <Suspense fallback={<Loader text="Loading test suite..." />}>
                        <TestExamFlow />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/exams" element={
                    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                      <ManageExams />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/questions" element={
                    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                      <ManageQuestions />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/students" element={
                    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                      <StudentManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                      <Suspense fallback={<Loader text="Loading analytics..." />}>
                        <StudentAnalytics />
                      </Suspense>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  
                  {/* Error route */}
                  <Route path="*" element={<ErrorPage />} />
                </Routes>
              </main>
            </div>
{/*             
            {user && <Footer />} */}
          </div>
        } />
      </Routes>
    </div>
  )
}

// Main App component that provides the auth context
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
