'use server'

import { createClient } from '@/lib/supabase/server'
import { sanitizeText } from '@/lib/sanitize'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const ROLES_BUREAU = ['admin', 'president', 'tresorier', 'adjoint_tresorier', 'secretaire', 'caissier']
const ROLES_GOUVERNANCE = [...ROLES_BUREAU, 'conseil_sages']

// ─── Soumettre une proposition ───────────────────────────────────────────────

export async function soumettreProposition(
  titre: string,
  description: string,
  type: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ROLES_BUREAU.includes(profile.role)) {
    return { error: 'Accès réservé aux membres du bureau actif.' }
  }

  const titreSafe = sanitizeText(titre, 200)
  const descSafe = sanitizeText(description, 2000)

  if (titreSafe.length < 5) return { error: 'Le titre est trop court (min 5 caractères).' }
  if (descSafe.length < 10) return { error: 'La description est trop courte (min 10 caractères).' }

  const typesValides = ['modification_site', 'modification_regles', 'evenement', 'autre']
  if (!typesValides.includes(type)) return { error: 'Type de proposition invalide.' }

  const { error } = await supabase.from('propositions').insert({
    titre: titreSafe,
    description: descSafe,
    type,
    soumis_par: user.id,
  })

  if (error) {
    console.error('[soumettreProposition]', error.code, error.message)
    return { error: 'Impossible de soumettre la proposition. Réessaie.' }
  }

  revalidatePath('/gouvernance')
  return { error: null }
}

// ─── Voter sur une proposition ───────────────────────────────────────────────

export async function voterProposition(
  propositionId: string,
  vote: 'pour' | 'contre' | 'abstention',
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ROLES_GOUVERNANCE.includes(profile.role)) {
    return { error: 'Accès réservé aux membres du bureau et du Conseil des Sages.' }
  }

  if (!['pour', 'contre', 'abstention'].includes(vote)) {
    return { error: 'Vote invalide.' }
  }

  // Vérifier que la proposition est en attente
  const { data: prop } = await supabase
    .from('propositions')
    .select('statut')
    .eq('id', propositionId)
    .single()

  if (!prop) return { error: 'Proposition introuvable.' }
  if (prop.statut !== 'en_attente') return { error: 'Cette proposition n\'est plus ouverte au vote.' }

  const { error } = await supabase.from('votes_proposition').insert({
    proposition_id: propositionId,
    votant_id: user.id,
    vote,
  })

  if (error?.code === '23505') return { error: 'Tu as déjà voté sur cette proposition.' }
  if (error) {
    console.error('[voterProposition]', error.code, error.message)
    return { error: 'Impossible d\'enregistrer le vote. Réessaie.' }
  }

  // Recalculer les totaux
  const { data: votes } = await supabase
    .from('votes_proposition')
    .select('vote')
    .eq('proposition_id', propositionId)

  const pour = votes?.filter(v => v.vote === 'pour').length ?? 0
  const contre = votes?.filter(v => v.vote === 'contre').length ?? 0

  await supabase.from('propositions')
    .update({ votes_pour: pour, votes_contre: contre })
    .eq('id', propositionId)

  revalidatePath('/gouvernance')
  return { error: null }
}

// ─── Changer le statut d'une proposition (admin/président uniquement) ────────

export async function changerStatutProposition(
  propositionId: string,
  statut: 'approuvee' | 'rejetee',
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'president'].includes(profile.role)) {
    return { error: 'Seuls l\'admin et le président peuvent clôturer une proposition.' }
  }

  const { error } = await supabase.from('propositions')
    .update({ statut })
    .eq('id', propositionId)

  if (error) {
    console.error('[changerStatut]', error.code, error.message)
    return { error: 'Impossible de modifier le statut.' }
  }

  revalidatePath('/gouvernance')
  return { error: null }
}
