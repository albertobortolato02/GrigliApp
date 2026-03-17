import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CreateBBQ from './pages/CreateBBQ'
import JoinBBQ from './pages/JoinBBQ'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EditBBQ from './pages/EditBBQ'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" style={{ marginTop: '40vh' }}></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crea" element={
          <ProtectedRoute><CreateBBQ /></ProtectedRoute>
        } />
        <Route path="/partecipa" element={<JoinBBQ />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/modifica/:id" element={
          <ProtectedRoute><EditBBQ /></ProtectedRoute>
        } />
      </Routes>
      <Footer />
    </>
  )
}
