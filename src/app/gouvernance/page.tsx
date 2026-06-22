import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GouvClient, { type PropositionRow, type VoteRow } from './GouvClient'

const ROLES_GOUVERNANCE = ['admin', 'president', 'tresorier', 'adjoint_tresorier', 'secretaire', 'caissier', 'conseil_sages']

export default async function GouvernancePage() {
  const supabase = await createClient()

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // ── Profil + rôle ───────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ROLES_GOUVERNANCE.includes(profile.role)) {
    redirect('/dashboard')
  }

  // ── Fetch en parallèle : propositions + mes votes ───────────────────────────
  const [{ data: rawPropositions }, { data: mesVotes }] = await Promise.all([
    supabase
      .from('propositions')
      .select('id, titre, description, type, soumis_par, statut, votes_pour, votes_contre, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('votes_proposition')
      .select('proposition_id, vote')
      .eq('votant_id', user.id),
  ])

  // ── Enrichir les propositions avec les noms d'auteurs ───────────────────────
  const propositions: PropositionRow[] = []

  if (rawPropositions && rawPropositions.length > 0) {
    const auteurIds = [...new Set(
      rawPropositions.map(p => p.soumis_par).filter(Boolean) as string[]
    )]

    let auteurMap: Record<string, { prenom?: string; nom?: string }> = {}

    if (auteurIds.length > 0) {
      const { data: auteurProfiles } = await supabase
        .from('user_profiles')
        .select('id, member_id')
        .in('id', auteurIds)

      const memberIds = [...new Set(
        (auteurProfiles ?? []).map(p => p.member_id).filter(Boolean) as string[]
      )]

      let membersData: { id: string; prenom: string; nom: string }[] = []
      if (memberIds.length > 0) {
        const { data } = await supabase
          .from('members')
          .select('id, prenom, nom')
          .in('id', memberIds)
        membersData = data ?? []
      }

      const profileMemberMap = Object.fromEntries(
        (auteurProfiles ?? []).map(p => [p.id, p.member_id])
      )
      const memberNameMap = Object.fromEntries(membersData.map(m => [m.id, m]))

      auteurMap = Object.fromEntries(
        auteurIds.map(uid => {
          const memberId = profileMemberMap[uid]
          const member = memberId ? memberNameMap[memberId] : undefined
          return [uid, { prenom: member?.prenom, nom: member?.nom }]
        })
      )
    }

    for (const p of rawPropositions) {
      const auteur = p.soumis_par ? auteurMap[p.soumis_par] : undefined
      propositions.push({
        ...p,
        statut: p.statut as PropositionRow['statut'],
        auteur_prenom: auteur?.prenom,
        auteur_nom: auteur?.nom,
      })
    }
  }

  const votesTyped = (mesVotes ?? []) as VoteRow[]

  return (
    <GouvClient
      propositions={propositions}
      mesVotes={votesTyped}
      roleActuel={profile.role}
      userId={user.id}
    />
  )
}
