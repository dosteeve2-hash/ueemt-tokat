import { createClient } from '@/lib/supabase/server'
import MembresClient from '@/components/MembresClient'

export type MembreCard = {
  id: string
  prenom: string
  nom: string
  filiere: string | null
  statut: string | null
  profileId: string | null
  role: string | null
  avatarUrl: string | null
  bio: string | null
}

export default async function MembresPage() {
  const supabase = await createClient()

  let isAdmin = false
  let currentUserId: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      currentUserId = user.id
      const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
      isAdmin = data?.role === 'admin'
    }
  } catch {}

  let membres: MembreCard[] = []
  try {
    const [{ data: membersData }, { data: profilesData }] = await Promise.all([
      supabase.from('members').select('id, prenom, nom, filiere, statut').eq('is_validated', true).order('nom'),
      supabase.from('user_profiles').select('id, member_id, role, avatar_url, bio').eq('is_public', true).not('member_id', 'is', null),
    ])

    const profileMap: Record<string, { id: string; role: string | null; avatar_url: string | null; bio: string | null }> = {}
    for (const p of (profilesData ?? [])) {
      if (p.member_id) profileMap[p.member_id] = { id: p.id, role: p.role, avatar_url: p.avatar_url, bio: p.bio }
    }

    membres = (membersData ?? []).map(m => ({
      id: m.id,
      prenom: m.prenom,
      nom: m.nom,
      filiere: m.filiere,
      statut: m.statut,
      profileId: profileMap[m.id]?.id ?? null,
      role: profileMap[m.id]?.role ?? null,
      avatarUrl: profileMap[m.id]?.avatar_url ?? null,
      bio: profileMap[m.id]?.bio ?? null,
    }))
  } catch {}

  return <MembresClient membres={membres} isAdmin={isAdmin} currentUserId={currentUserId} />
}
