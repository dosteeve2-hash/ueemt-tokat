import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBureauMember } from '@/lib/constants'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const { memberId, prenom, nom } = await req.json()

    if (!memberId || !prenom || !nom) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    const role = isBureauMember(prenom, nom) ? 'admin' : 'member'

    const { error } = await supabase.from('user_profiles').upsert({
      id: user.id,
      member_id: memberId,
      role,
      onboarding_complete: true,
    }, { onConflict: 'id' })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Profil déjà configuré.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send welcome email (non-blocking — failure must not break onboarding)
    if (user.email) {
      sendWelcomeEmail(user.email, prenom, nom).catch((e) =>
        console.error('[onboarding] welcome email failed:', e),
      )
    }

    return NextResponse.json({ ok: true, role })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
