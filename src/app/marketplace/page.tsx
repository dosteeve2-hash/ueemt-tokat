import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarketplaceClient from './MarketplaceClient'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, description, price, currency, category, photos, contact_info, is_active, created_at, author_id')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)

  // Récupérer les noms des auteurs
  const authorIds = [...new Set((listings ?? []).map(l => l.author_id))]
  const { data: profiles } = authorIds.length > 0
    ? await supabase
        .from('user_profiles')
        .select('id, avatar_url, member:member_id(prenom, nom)')
        .in('id', authorIds)
    : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]))

  const enrichedListings = (listings ?? []).map(l => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = profileMap[l.author_id] as any
    // Supabase retourne member comme tableau sur les joins
    const member = Array.isArray(p?.member) ? p.member[0] : p?.member
    return {
      ...l,
      author_name: member ? `${member.prenom} ${member.nom}` : 'Membre',
      author_avatar: p?.avatar_url ?? null,
      is_own: l.author_id === user.id,
    }
  })

  return (
    <MarketplaceClient
      listings={enrichedListings}
      currentUserId={user.id}
    />
  )
}
