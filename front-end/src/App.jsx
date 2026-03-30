import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageStudents from './pages/admin/ManageStudents'
import UploadData from './pages/admin/UploadData'
import Reports from './pages/admin/Reports'
import TPODashboard from './pages/tpo/TPODashboard'
import PlacementReadiness from './pages/tpo/PlacementReadiness'
import FilterStudents from './pages/tpo/FilterStudents'
import StudentDashboard from './pages/student/StudentDashboard'
import UpdateProfile from './pages/student/UpdateProfile'
import ReadinessScore from './pages/student/ReadinessScore'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import UploadDocs from './pages/faculty/UploadDocs'         // ← NEW
import Layout from './components/Layout'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner"/>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="upload"   element={<UploadData />} />
        <Route path="reports"  element={<Reports />} />
      </Route>

      <Route path="/tpo" element={<ProtectedRoute roles={['tpo','admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<TPODashboard />} />
        <Route path="readiness" element={<PlacementReadiness />} />
        <Route path="filter"    element={<FilterStudents />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile"   element={<UpdateProfile />} />
        <Route path="readiness" element={<ReadinessScore />} />
      </Route>

      <Route path="/faculty" element={<ProtectedRoute roles={['faculty']}><Layout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="upload-docs" element={<UploadDocs />} />   {/* ← NEW */}
      </Route>

      <Route path="/unauthorized" element={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:16 }}>
          <h2>403 – Access Denied</h2>
        </div>
      } />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: {
            background:'#ffffff', color:'#1e1b4b',
            border:'1px solid #e4e0ff',
            fontFamily:'Plus Jakarta Sans, sans-serif', fontSize:'0.875rem'
          },
          success: { iconTheme: { primary:'#059669', secondary:'#ffffff' } },
          error:   { iconTheme: { primary:'#dc2626', secondary:'#ffffff' } }
        }} />
      </BrowserRouter>
    </AuthProvider>
  )
}