import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/common/loading-screen'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/hooks/use-permissions'

interface PermissionRouteProps {
  permission: string
}

/** Restricts a branch to callers whose role is assigned the named permission. */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { isLoading: isAuthLoading } = useAuth()
  const { has, isLoading: isPermissionLoading } = usePermissions()

  if (isAuthLoading || isPermissionLoading) {
    return <LoadingScreen />
  }

  if (!has(permission)) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
