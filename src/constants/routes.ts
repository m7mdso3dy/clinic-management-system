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
} as const

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES]
