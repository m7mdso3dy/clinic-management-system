import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/common/loading-screen'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'

/**
 * Gate for authenticated routes. Role-based restrictions live on `RoleRoute`.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <Outlet />
}
