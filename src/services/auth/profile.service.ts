import { getSupabaseClient } from '@/services/supabase/client'
import type { UserProfile } from '@/types/models'

/**
 * Reads the clinic profile that carries the user's role.
 *
 * RLS restricts a secretary to their own row, so this is safe to call with any
 * authenticated session.
 */
export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error

    return data
  },
}
