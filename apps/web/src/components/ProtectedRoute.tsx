import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { selectIsAuthenticated, selectAuthLoading } from '../store/auth/auth.selectors'

export function ProtectedRoute(): JSX.Element {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const loading = useSelector(selectAuthLoading)

  // Wait for initAuth to resolve before deciding — prevents flash redirect to /login
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
