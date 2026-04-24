import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import ManageBudgets from './pages/ManageBudgets'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  return token ? children : <Navigate to="/login" />
}

function GuestRoute({ children }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  return !token ? children : <Navigate to="/" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><ManageBudgets /></ProtectedRoute>} />
      <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    </Routes>
  )
}
