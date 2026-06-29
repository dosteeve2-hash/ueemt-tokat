import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AnnoncesClient from './AnnoncesClient'

export type Annonce = {
  id: string
  content: string
  categorie: 'urgent' | 'info' | 'evenement' | 'general'
  created_at: string
  author_prenom: string
  author_nom: string
  author_avatar: string | null
}

function detectCategorie(content: string): Annonce['categorie'] {
  const lower = content.toLowerCase()
  if (/urgent|urgence|attention urgente|rappel important/.test(lower)) return 'urgent'
  if (/événement|evenement|match|réunion|reunion|sortie|fête|fete|cérémonie|ceremonie/.test(lower)) return 'evenement'
  if (/visa|document|administratif|délai|inscription|bourse|consul|passeport|résidence|residence/.test(lower)) return 'info'
  return 'general'
}

export const metadata = {
  title: 'Annonces — UEEMT-Tokat',
  description: 'Toutes les annonces officielles du bureau de l\'UEEMT-Tokat',
}

export default async function AnnoncesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion?redirect=/annonces')

  // Fetch pinned posts + current user profile in parallel
  const [{ data: posts }, { data: myProfile }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, content, created_at, author_id')
      .eq('is_pinned', true)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle(),
  ])

  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'president'
  const authorIds = [...new Set((posts ?? []).map((p) => p.author_id as string))]

  const profilesResp = authorIds.length > 0
    ? await supabase
        .from('user_profiles')
        .select('id, avatar_url, member_id')
        .in('id', authorIds)
    : { data: [] as { id: string; avatar_url: string | null; member_id: string | null }[] }

  const profilesData = profilesResp.data ?? []
  const memberIds = [...new Set(profilesData.map((p) => p.member_id).filter(Boolean))] as string[]

  let membersData: { id: string; prenom: string; nom: string }[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('members')
      .select('id, prenom, nom')
      .in('id', memberIds)
    membersData = data ?? []
  }

  const profileMap = Object.fromEntries(profilesData.map((p) => [p.id, p]))
  const memberMap = Object.fromEntries(membersData.map((m) => [m.id, m]))

  const annonces: Annonce[] = (posts ?? []).map((p) => {
    const raw = p as Record<string, unknown>
    const prof = profileMap[p.author_id as string]
    const mem = prof?.member_id ? memberMap[prof.member_id] : null
    return {
      id: p.id as string,
      content: (raw.content as string | null) ?? '',
      categorie: detectCategorie((raw.content as string | null) ?? ''),
      created_at: p.created_at as string,
      author_prenom: mem?.prenom ?? 'Bureau',
      author_nom: mem?.nom ?? '',
      author_avatar: prof?.avatar_url ?? null,
    }
  })

  return <AnnoncesClient annonces={annonces} isAdmin={isAdmin} />
}
