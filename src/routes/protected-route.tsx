import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/common/loading-screen'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'

/**
 * Gate for authenticated routes. Role-based restrictions are not implemented
 * yet — they belong here (e.g. an `allowedRoles` prop) once the doctor and
 * secretary areas exist.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen message="Checking your session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />
  }

  return <Outlet />
}
