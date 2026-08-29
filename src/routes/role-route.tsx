import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/common/loading-screen'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'
import type { UserRole } from '@/types/models'

interface RoleRouteProps {
  allowedRoles: readonly UserRole[]
}

/**
 * Restricts a branch of the protected tree to specific clinic roles.
 * Users without a matching role are sent back to home.
 */
export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (role === null || !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
