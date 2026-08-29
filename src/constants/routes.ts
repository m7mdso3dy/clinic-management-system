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
} as const

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES]

export function patientDetailPath(patientId: string): string {
  return `${ROUTES.patients}/${patientId}`
}

export function visitDetailPath(visitId: string): string {
  return `${ROUTES.visits}/${visitId}`
}
