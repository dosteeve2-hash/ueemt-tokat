import { createBrowserClient } from '@supabase/ssr'

// Strip BOM (U+FEFF) that PowerShell/Windows tooling can inject into env vars
const stripBom = (s: string | undefined) => s?.replace(/^﻿/, '') ?? ''

export function createClient() {
  return createBrowserClient(
    stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL),
    stripBom(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )
}
