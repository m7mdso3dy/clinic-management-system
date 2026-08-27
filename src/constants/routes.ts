/**
 * Single source of truth for route paths. Add clinic routes here as the
 * corresponding pages are implemented.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
} as const

export type AppRoutePath = (typeof ROUTES)[keyof typeof ROUTES]
