'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type CaisseInfo = {
  montant: number
  cotisation_mensuelle: number
}

export type MaCotisation = {
  paid: boolean
  amount: number | null
  paid_at: string | null
  month: string
}

export type CotisationRow = {
  member_id: string
  prenom: string
  nom: string
  filiere: string | null
  paid: boolean
  amount: number | null
  paid_at: string | null
  payment_id: string | null
}

export type HistoriqueItem = {
  month: string
  amount: number
  paid_at: string
}

function currentMonthDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

async function requireTresorierOrAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (!data || !['admin', 'tresorier', 'adjoint_tresorier'].includes(data.role)) {
    throw new Error('Accès refusé')
  }
  return data.role as string
}

export async function getCaisseInfo(): Promise<CaisseInfo> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data, error } = await supabase
    .from('caisse')
    .select('montant, cotisation_mensuelle')
    .eq('id', 1)
    .single()

  if (error || !data) return { montant: 0, cotisation_mensuelle: 2000 }
  return { montant: Number(data.montant), cotisation_mensuelle: Number(data.cotisation_mensuelle) }
}

export async function getMaCotisation(): Promise<MaCotisation> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const month = currentMonthDate()

  // Trouver l'ID du membre lié à ce user
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('member_id')
    .eq('id', user.id)
    .single()

  if (!profile?.member_id) {
    return { paid: false, amount: null, paid_at: null, month }
  }

  const { data } = await supabase
    .from('cotisation_payments')
    .select('amount, paid_at')
    .eq('member_id', profile.member_id)
    .eq('month', month)
    .maybeSingle()

  return {
    paid: !!data,
    amount: data ? Number(data.amount) : null,
    paid_at: data?.paid_at ?? null,
    month,
  }
}

export async function getMonHistorique(): Promise<HistoriqueItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('member_id')
    .eq('id', user.id)
    .single()

  if (!profile?.member_id) return []

  const { data } = await supabase
    .from('cotisation_payments')
    .select('month, amount, paid_at')
    .eq('member_id', profile.member_id)
    .order('month', { ascending: false })
    .limit(6)

  return (data ?? []).map(r => ({
    month: r.month,
    amount: Number(r.amount),
    paid_at: r.paid_at,
  }))
}

export async function getAllCotisations(month?: string): Promise<CotisationRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  await requireTresorierOrAdmin(supabase, user.id)

  const targetMonth = month ?? currentMonthDate()

  const { data: members, error } = await supabase
    .from('members')
    .select('id, prenom, nom, filiere')
    .eq('is_validated', true)
    .order('nom')

  if (error || !members) return []

  const memberIds = members.map(m => m.id)

  let payments: { member_id: string; amount: number; paid_at: string; id: string }[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('cotisation_payments')
      .select('member_id, amount, paid_at, id')
      .in('member_id', memberIds)
      .eq('month', targetMonth)
    payments = (data ?? []).map(p => ({ ...p, amount: Number(p.amount) }))
  }

  const paymentMap = Object.fromEntries(payments.map(p => [p.member_id, p]))

  return members.map(m => {
    const pay = paymentMap[m.id]
    return {
      member_id: m.id,
      prenom: m.prenom,
      nom: m.nom,
      filiere: m.filiere,
      paid: !!pay,
      amount: pay ? pay.amount : null,
      paid_at: pay?.paid_at ?? null,
      payment_id: pay?.id ?? null,
    }
  })
}

export async function marquerPaye(memberId: string, amount: number, notes?: string, month?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  await requireTresorierOrAdmin(supabase, user.id)

  if (amount <= 0) throw new Error('Montant invalide')

  const targetMonth = month ?? currentMonthDate()

  const { error } = await supabase
    .from('cotisation_payments')
    .upsert({
      member_id: memberId,
      month: targetMonth,
      amount,
      notes: notes ?? null,
      validated_by: user.id,
      paid_at: new Date().toISOString(),
    }, { onConflict: 'member_id,month' })

  if (error) throw new Error(error.message)
}

export async function annulerPaiement(memberId: string, month?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const role = await requireTresorierOrAdmin(supabase, user.id)
  if (role === 'adjoint_tresorier') throw new Error('Permission insuffisante')

  const targetMonth = month ?? currentMonthDate()

  const { error } = await supabase
    .from('cotisation_payments')
    .delete()
    .eq('member_id', memberId)
    .eq('month', targetMonth)

  if (error) throw new Error(error.message)
}

export async function updateCaisse(montant: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  await requireTresorierOrAdmin(supabase, user.id)

  if (montant < 0) throw new Error('Montant invalide')

  const { error } = await supabase
    .from('caisse')
    .update({ montant, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', 1)

  if (error) throw new Error(error.message)
}

export async function updateCotisationMensuelle(montant: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // admin only
  const { data } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (data?.role !== 'admin') throw new Error('Admin uniquement')

  if (montant <= 0) throw new Error('Montant invalide')

  const { error } = await supabase
    .from('caisse')
    .update({ cotisation_mensuelle: montant, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', 1)

  if (error) throw new Error(error.message)
}
