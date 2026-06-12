import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isBureauMember } from '@/lib/constants'

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

    const { error } = await supabase.from('user_profiles').insert({
      id: user.id,
      member_id: memberId,
      role,
    })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Profil déjà configuré.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, role })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
