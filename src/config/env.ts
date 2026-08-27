/**
 * Environment configuration.
 *
 * Values are read once, here, so the rest of the app never touches
 * `import.meta.env` directly. See `.env.example` for the required variables.
 */

export interface AppEnv {
  supabaseUrl: string
  /** Browser-safe publishable key (`sb_publishable_…`). Never the secret key. */
  supabasePublishableKey: string
}

export type EnvCheckResult = { ok: true; env: AppEnv } | { ok: false; missing: string[] }

function read(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Validates the environment without throwing, so the UI can render a readable
 * setup screen instead of a blank page.
 */
export function checkEnv(): EnvCheckResult {
  const supabaseUrl = read(import.meta.env.VITE_SUPABASE_URL)
  const supabasePublishableKey = read(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)

  if (supabaseUrl === null || supabasePublishableKey === null) {
    const missing: string[] = []
    if (supabaseUrl === null) missing.push('VITE_SUPABASE_URL')
    if (supabasePublishableKey === null) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')

    return { ok: false, missing }
  }

  return { ok: true, env: { supabaseUrl, supabasePublishableKey } }
}

/**
 * Returns the validated environment, or throws with an actionable message.
 * Used by infrastructure code (e.g. the Supabase client) that cannot render UI.
 */
export function getEnv(): AppEnv {
  const result = checkEnv()

  if (!result.ok) {
    throw new Error(
      `Missing environment variable(s): ${result.missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in your Supabase project credentials.',
    )
  }

  return result.env
}
