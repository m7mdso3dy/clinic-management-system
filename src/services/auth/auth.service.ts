import type { Session, User } from '@supabase/supabase-js'

import { getSupabaseClient } from '@/services/supabase/client'
import type { SignInCredentials } from '@/types/auth'

/**
 * Supabase Auth wrapper. All authentication traffic goes through here so the
 * UI never talks to Supabase directly.
 *
 * Errors are rethrown as-is (Supabase errors are `Error` instances) and are
 * expected to be handled by the caller.
 */
export const authService = {
  async signIn({ email, password }: SignInCredentials): Promise<Session> {
    const { data, error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) throw error

    return data.session
  },

  async signOut(): Promise<void> {
    const { error } = await getSupabaseClient().auth.signOut()

    if (error) throw error
  },

  async getCurrentSession(): Promise<Session | null> {
    const { data, error } = await getSupabaseClient().auth.getSession()

    if (error) throw error

    return data.session
  },

  async getCurrentUser(): Promise<User | null> {
    const { data, error } = await getSupabaseClient().auth.getUser()

    if (error) {
      // Signed-out users are not an error condition for this call.
      if (error.status === 401) return null
      throw error
    }

    return data.user
  },

  /** Subscribes to sign-in / sign-out / token-refresh events. */
  onAuthStateChange(listener: (session: Session | null) => void): () => void {
    const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
      listener(session)
    })

    return () => {
      data.subscription.unsubscribe()
    }
  },
}
