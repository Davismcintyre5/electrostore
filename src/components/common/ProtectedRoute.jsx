import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  
  // Only customers allowed
  if (!user || user.role !== 'customer') {
    return <Navigate to="/login" replace />
  }
  
  return <Outlet />
}

export default ProtectedRoute