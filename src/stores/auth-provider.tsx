import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { authService } from '@/services/auth/auth.service'
import { profileService } from '@/services/auth/profile.service'
import { AuthContext } from '@/stores/auth-context'
import type { AuthContextValue, SignInCredentials } from '@/types/auth'
import type { UserProfile } from '@/types/models'

interface AuthProviderProps {
  children: ReactNode
}

/** Profile paired with the user it was fetched for, so staleness is detectable. */
interface LoadedProfile {
  userId: string
  profile: UserProfile | null
}

/**
 * Owns the only mutable authentication state in the app: the Supabase session
 * and the matching clinic profile (which carries the user's role).
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [loadedProfile, setLoadedProfile] = useState<LoadedProfile | null>(null)
  const [profileReloadToken, setProfileReloadToken] = useState(0)

  const userId = session?.user.id ?? null

  // A profile belonging to a different user is treated as absent, which also
  // makes "loading" a derived value instead of another piece of state.
  const isProfileStale = loadedProfile?.userId !== userId
  const profile = isProfileStale ? null : loadedProfile.profile
  const isProfileLoading = userId !== null && isProfileStale

  useEffect(() => {
    let isActive = true

    authService
      .getCurrentSession()
      .then((currentSession) => {
        if (isActive) setSession(currentSession)
      })
      .catch((error: unknown) => {
        console.error('Failed to restore session', error)
      })
      .finally(() => {
        if (isActive) setIsSessionLoading(false)
      })

    const unsubscribe = authService.onAuthStateChange((nextSession) => {
      setSession(nextSession)
      setIsSessionLoading(false)
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (userId === null) return

    let isActive = true

    profileService
      .getProfile(userId)
      .then((nextProfile) => {
        if (isActive) setLoadedProfile({ userId, profile: nextProfile })
      })
      .catch((error: unknown) => {
        console.error('Failed to load user profile', error)
        if (isActive) setLoadedProfile({ userId, profile: null })
      })

    return () => {
      isActive = false
    }
  }, [userId, profileReloadToken])

  /** Requests a profile re-fetch; observe `isLoading` for completion. */
  const refreshProfile = useCallback(() => {
    setProfileReloadToken((token) => token + 1)
  }, [])

  const signIn = useCallback(async (credentials: SignInCredentials) => {
    await authService.signIn(credentials)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      isAuthenticated: session !== null,
      isLoading: isSessionLoading || isProfileLoading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, isSessionLoading, isProfileLoading, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
