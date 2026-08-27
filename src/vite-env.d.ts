/// <reference types="vite/client" />

// Opts into Vite's strict `import.meta.env` typing: only the variables declared
// below are readable, and they are typed instead of `any`.
interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}
