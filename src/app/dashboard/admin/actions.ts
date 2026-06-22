'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendPasswordSetupEmail } from '@/app/connexion/actions'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'admin' && data?.role !== 'president') redirect('/dashboard')
  return { supabase, userId: user.id }
}

export async function approuverMembre(memberId: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requireAdmin()

    // Get member email first
    const { data: member, error: fetchErr } = await supabase
      .from('members')
      .select('email, prenom, nom')
      .eq('id', memberId)
      .single()

    if (fetchErr || !member) return { error: 'Membre introuvable.' }

    // Validate the member
    const { error: updateErr } = await supabase
      .from('members')
      .update({ is_validated: true, is_active: true })
      .eq('id', memberId)

    if (updateErr) return { error: 'Impossible de valider le membre.' }

    // Send access link if member has an email
    if (member.email) {
      await sendPasswordSetupEmail(member.email)
    }

    return { error: null }
  } catch (e) {
    console.error('[admin:approuverMembre]', e)
    return { error: 'Une erreur est survenue.' }
  }
}

export async function refuserMembre(memberId: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requireAdmin()

    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId)
      .eq('is_validated', false)

    if (error) return { error: 'Impossible de supprimer la demande.' }
    return { error: null }
  } catch (e) {
    console.error('[admin:refuserMembre]', e)
    return { error: 'Une erreur est survenue.' }
  }
}

// ─── Actions réservées au Président ──────────────────────────────────────────

async function requirePresident() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (data?.role !== 'president') redirect('/dashboard')
  return { supabase, userId: user.id }
}

export async function supprimerMembreValide(memberId: string): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requirePresident()

    // Supprimer le membre (CASCADE supprime user_profiles via FK si configuré, sinon on nettoie manuellement)
    await supabase.from('user_profiles').update({ member_id: null }).eq('member_id', memberId)
    const { error } = await supabase.from('members').delete().eq('id', memberId)

    if (error) return { error: 'Impossible de supprimer ce membre.' }
    return { error: null }
  } catch (e) {
    console.error('[admin:supprimerMembreValide]', e)
    return { error: 'Une erreur est survenue.' }
  }
}

export async function changerRoleUser(
  memberProfileId: string,
  newRole: 'admin' | 'member',
): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requirePresident()

    const { error } = await supabase
      .from('user_profiles')
      .update({ role: newRole })
      .eq('id', memberProfileId)

    if (error) return { error: 'Impossible de changer le rôle.' }
    return { error: null }
  } catch (e) {
    console.error('[admin:changerRoleUser]', e)
    return { error: 'Une erreur est survenue.' }
  }
}
