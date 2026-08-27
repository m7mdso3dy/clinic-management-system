/**
 * Authentication types consumed by the UI layer.
 */

import type { Session, User } from '@supabase/supabase-js'

import type { UserProfile, UserRole } from '@/types/models'

export interface SignInCredentials {
  email: string
  password: string
}

export interface AuthState {
  session: Session | null
  user: User | null
  /** Clinic profile row for the signed-in user; null until it has loaded. */
  profile: UserProfile | null
  /** True while the session or the profile is being resolved. */
  isLoading: boolean
}

export interface AuthContextValue extends AuthState {
  role: UserRole | null
  isAuthenticated: boolean
  signIn: (credentials: SignInCredentials) => Promise<void>
  signOut: () => Promise<void>
  /** Triggers a profile re-fetch (e.g. after a role change). */
  refreshProfile: () => void
}
