/**
 * Single source of truth for route paths. Add clinic routes here as the
 * corresponding pages are implemented.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  patients: '/patients',
  visits: '/visits',
  payments: '/payments',
  doctorDashboard: '/doctor',
  secretaryWorkflow: '/secretary',
  editRequests: '/edit-requests',
  reports: '/reports',
  examinationTypes: '/examination-types',
  roles: '/roles',
  patientDetail: '/patients/:patientId',
  visitNew: '/visits/new',
  visitDetail: '/visits/:visitId',
  visitEdit: '/visits/:visitId/edit',
  visitPrescriptionPrint: '/visits/:visitId/prescription/print',
  visitLabPrint: '/visits/:visitId/lab/print',
} as const

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export function patientDetailPath(patientId: string): string {
  return `${ROUTES.patients}/${patientId}`
}

export function visitDetailPath(visitId: string): string {
  return `${ROUTES.visits}/${visitId}`
}

export function visitEditPath(visitId: string): string {
  return `${ROUTES.visits}/${visitId}/edit`
}

export function visitPrescriptionPrintPath(visitId: string): string {
  return `${ROUTES.visits}/${visitId}/prescription/print`
}

export function visitLabPrintPath(visitId: string): string {
  return `${ROUTES.visits}/${visitId}/lab/print`
}
