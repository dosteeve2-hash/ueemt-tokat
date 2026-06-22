import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAppRole } from '@/lib/constants'
import { sendWelcomeEmail } from '@/lib/email'
import { sanitizeText } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const raw = await req.json()
    const memberId = raw.memberId as string | undefined
    const prenom = sanitizeText(raw.prenom ?? '', 100)
    const nom = sanitizeText(raw.nom ?? '', 100)

    if (!memberId || !prenom || !nom) {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
    }

    // 'president' | 'admin' | 'member'
    const role = getAppRole(prenom, nom)

    // Vérifier si ce member_id est déjà lié à un autre profil (contrainte UNIQUE)
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('member_id', memberId)
      .maybeSingle()

    if (existing && existing.id !== user.id) {
      // member_id déjà pris par un autre compte — mise à jour du profil existant
      await supabase
        .from('user_profiles')
        .update({ role, onboarding_complete: true })
        .eq('id', existing.id)
      return NextResponse.json({ ok: true, role })
    }

    const { error } = await supabase.from('user_profiles').upsert({
      id: user.id,
      member_id: memberId,
      role,
      onboarding_complete: true,
    }, { onConflict: 'id' })

    if (error) {
      if (error.code === '23505') {
        // Conflit UNIQUE sur member_id — profil déjà configuré, on retourne ok
        return NextResponse.json({ ok: true, role })
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
