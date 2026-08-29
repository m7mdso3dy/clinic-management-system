import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { USER_ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { ModulePlaceholderPage } from '@/pages/module-placeholder-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { ProtectedRoute } from '@/routes/protected-route'
import { PublicOnlyRoute } from '@/routes/public-only-route'
import { RoleRoute } from '@/routes/role-route'

/**
 * Route tree. Clinic modules hang off the protected layout; role-only areas
 * are nested under `RoleRoute`.
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

            <Route element={<RoleRoute allowedRoles={USER_ROLES} />}>
              <Route
                path={ROUTES.patients}
                element={<ModulePlaceholderPage moduleId="patients" />}
              />
              <Route path={ROUTES.visits} element={<ModulePlaceholderPage moduleId="visits" />} />
              <Route
                path={ROUTES.payments}
                element={<ModulePlaceholderPage moduleId="payments" />}
              />
              <Route
                path={ROUTES.editRequests}
                element={<ModulePlaceholderPage moduleId="editRequests" />}
              />
              <Route path={ROUTES.reports} element={<ModulePlaceholderPage moduleId="reports" />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['doctor']} />}>
              <Route
                path={ROUTES.doctorDashboard}
                element={<ModulePlaceholderPage moduleId="doctorDashboard" />}
              />
            </Route>

            <Route element={<RoleRoute allowedRoles={['secretary']} />}>
              <Route
                path={ROUTES.secretaryWorkflow}
                element={<ModulePlaceholderPage moduleId="secretaryWorkflow" />}
              />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
