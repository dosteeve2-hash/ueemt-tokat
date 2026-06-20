import { createClient } from '@supabase/supabase-js'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

export function createAdminClient() {
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
