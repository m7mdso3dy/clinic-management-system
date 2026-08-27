import { useContext } from 'react'

import { AuthContext } from '@/stores/auth-context'
import type { AuthContextValue } from '@/types/auth'

/**
 * Access to the current session, profile and role.
 * Must be called below an `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used inside an <AuthProvider>')
  }

  return context
}
