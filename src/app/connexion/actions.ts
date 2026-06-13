'use server'

import { createClient } from '@/lib/supabase/server'

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ueemt-tokat.vercel.app'
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })
  return { error: error?.message ?? null }
}
