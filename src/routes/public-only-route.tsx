import { Navigate, Outlet } from 'react-router-dom'

import { LoadingScreen } from '@/components/common/loading-screen'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'

/** Keeps signed-in users away from the sign-in screen. */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />
  }

  return <Outlet />
}
