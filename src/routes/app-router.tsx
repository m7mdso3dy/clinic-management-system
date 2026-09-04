import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { PERMISSIONS } from '@/constants/permissions'
import { USER_ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { AppLayout } from '@/layouts/app-layout'
import { AuthLayout } from '@/layouts/auth-layout'
import { PrintLayout } from '@/layouts/print-layout'
import { DoctorDashboardPage } from '@/pages/doctor-dashboard-page'
import { EditVisitPage } from '@/pages/edit-visit-page'
import { ExaminationTypesPage } from '@/pages/examination-types-page'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { ModulePlaceholderPage } from '@/pages/module-placeholder-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { PatientDetailPage } from '@/pages/patient-detail-page'
import { PatientsPage } from '@/pages/patients-page'
import { PaymentsPage } from '@/pages/payments-page'
import { RolesPage } from '@/pages/roles-page'
import { VisitDetailPage } from '@/pages/visit-detail-page'
import { VisitPrintPage } from '@/pages/visit-print-page'
import { VisitsPage } from '@/pages/visits-page'
import { PermissionRoute } from '@/routes/permission-route'
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
          <Route element={<PrintLayout />}>
            <Route element={<PermissionRoute permission={PERMISSIONS.visitsView} />}>
              <Route
                path={ROUTES.visitPrescriptionPrint}
                element={<VisitPrintPage kind="prescription" />}
              />
              <Route path={ROUTES.visitLabPrint} element={<VisitPrintPage kind="lab" />} />
            </Route>
          </Route>

          <Route element={<AppLayout />}>
            <Route path={ROUTES.home} element={<HomePage />} />

            <Route element={<PermissionRoute permission={PERMISSIONS.examinationTypesList} />}>
              <Route path={ROUTES.examinationTypes} element={<ExaminationTypesPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.patientsList} />}>
              <Route path={ROUTES.patients} element={<PatientsPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.patientsView} />}>
              <Route path={ROUTES.patientDetail} element={<PatientDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.rolesList} />}>
              <Route path={ROUTES.roles} element={<RolesPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.visitsList} />}>
              <Route path={ROUTES.visits} element={<VisitsPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.visitsCreate} />}>
              <Route path={ROUTES.visitNew} element={<Navigate to={ROUTES.visits} replace />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.visitsUpdate} />}>
              <Route path={ROUTES.visitEdit} element={<EditVisitPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.visitsView} />}>
              <Route path={ROUTES.visitDetail} element={<VisitDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.paymentsList} />}>
              <Route path={ROUTES.payments} element={<PaymentsPage />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={USER_ROLES} />}>
              <Route
                path={ROUTES.editRequests}
                element={<ModulePlaceholderPage moduleId="editRequests" />}
              />
              <Route path={ROUTES.reports} element={<ModulePlaceholderPage moduleId="reports" />} />
            </Route>

            <Route element={<RoleRoute allowedRoles={['doctor']} />}>
              <Route path={ROUTES.doctorDashboard} element={<DoctorDashboardPage />} />
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
