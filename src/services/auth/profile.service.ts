import { getSupabaseClient } from '@/services/supabase/client'
import type { UserProfile, UserRole } from '@/types/models'

interface ProfileWithRole {
  created_at: string
  email: string
  full_name: string
  id: string
  role_id: string
  updated_at: string
  roles: { name: string } | null
}

export interface ResolvedProfile {
  profile: UserProfile
  role: UserRole | null
}

/**
 * Reads the clinic profile that carries the user's role.
 *
 * RLS restricts a secretary to their own row, so this is safe to call with any
 * authenticated session.
 */
export const profileService = {
  async getProfile(userId: string): Promise<ResolvedProfile | null> {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', userId)
      .maybeSingle()

    if (error) throw error
    if (data === null) return null

    const row = data as ProfileWithRole
    const roleName = row.roles?.name

    return {
      profile: {
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role_id: row.role_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
      role: roleName ?? null,
    }
  },
}
