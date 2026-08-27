import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getEnv } from '@/config/env'
import type { Database } from '@/types/database.types'

export type AppSupabaseClient = SupabaseClient<Database>

let client: AppSupabaseClient | null = null

/**
 * Returns the shared, schema-typed Supabase client.
 *
 * Creation is lazy on purpose: importing this module must never throw, so the
 * app can render a "missing environment variables" screen instead of crashing
 * at module-evaluation time.
 *
 * Only services should call this — never components.
 */
export function getSupabaseClient(): AppSupabaseClient {
  if (client === null) {
    const { supabaseUrl, supabasePublishableKey } = getEnv()

    client = createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return client
}
