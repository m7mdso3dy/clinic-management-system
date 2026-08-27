import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ROUTES } from '@/constants/routes'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { ProtectedRoute } from '@/routes/protected-route'
import { PublicOnlyRoute } from '@/routes/public-only-route'

/**
 * Route tree. Clinic routes (patients, visits, approvals…) are added as
 * children of the protected branch, grouped by role guard when needed.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.home} element={<HomePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
