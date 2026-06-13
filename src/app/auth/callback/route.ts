import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as
    | 'email'
    | 'recovery'
    | 'invite'
    | 'sms'
    | 'phone_change'
    | 'email_change'
    | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  async function resolveRedirect(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return '/connexion?error=lien_invalide'
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle()
    if (!profile || !profile.onboarding_complete) return '/onboarding'
    return next
  }

  // PKCE flow (newer Supabase / Admin generateLink)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(await resolveRedirect(), origin))
    }
  }

  // OTP / token_hash flow (signInWithOtp default)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(new URL(await resolveRedirect(), origin))
    }
  }

  return NextResponse.redirect(new URL('/connexion?error=lien_invalide', origin))
}
