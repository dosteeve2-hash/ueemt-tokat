'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// ─── Rate limiting ────────────────────────────────────────────────────────────

const createRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkCreateRateLimit(memberId: string): boolean {
  const now = Date.now()
  const entry = createRateLimitMap.get(memberId)
  if (!entry || now > entry.resetAt) {
    createRateLimitMap.set(memberId, { count: 1, resetAt: now + 3_600_000 }) // 1h
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// ─── creerCompteEtConnecter ───────────────────────────────────────────────────

export async function creerCompteEtConnecter(
  memberId: string,
  emailInput: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!memberId) {
    return { error: 'Membre non sélectionné.' }
  }
  const rawEmail = emailInput?.trim().toLowerCase() ?? ''
  if (!rawEmail || !rawEmail.includes('@')) {
    return { error: 'Adresse email invalide.' }
  }
  if (!password || password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }
  if (!checkCreateRateLimit(memberId)) {
    return { error: 'Trop de tentatives. Réessaie dans 1 heure.' }
  }

  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasValidServiceKey = serviceKey.startsWith('eyJ')

  if (!hasValidServiceKey) {
    return { error: 'Erreur de configuration serveur. Réessaie dans quelques instants.' }
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Vérifier que le membre existe (sans filtre is_active — tous les membres recensés peuvent créer un compte)
  const { data: member, error: fetchError } = await admin
    .from('members')
    .select('id, email, is_active')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) {
    return { error: 'Membre introuvable. Vérifie que tu es bien recensé(e) sur /recensement.' }
  }

  // Activer le membre s'il ne l'est pas encore
  if (!member.is_active) {
    await admin.from('members').update({ is_active: true }).eq('id', memberId)
  }

  // Sauvegarder l'email dans members si absent ou différent
  const storedEmail = (member.email as string | null)?.trim().toLowerCase() ?? null
  if (!storedEmail || storedEmail !== rawEmail) {
    await admin.from('members').update({ email: rawEmail }).eq('id', memberId)
  }

  const normalizedEmail = rawEmail

  // Tentative de création — si le compte existe déjà, on met à jour le mot de passe
  const { error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
  })

  if (createError) {
    const alreadyExists =
      createError.message.includes('already been registered') ||
      createError.message.includes('already registered') ||
      createError.message.includes('duplicate')

    if (!alreadyExists) {
      console.error('[creerCompteEtConnecter] createUser:', createError.message)
      return { error: 'Erreur création compte. Réessaie.' }
    }

    // Compte existant : trouver l'ID et mettre à jour le mot de passe
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = (listData?.users ?? []).find(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    )

    if (!existingUser) {
      return { error: 'Compte introuvable. Recense-toi sur /recensement puis réessaie.' }
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
    })
    if (updateError) {
      console.error('[creerCompteEtConnecter] updateUserById:', updateError.message)
      return { error: 'Erreur mise à jour mot de passe. Réessaie.' }
    }
  }

  // Connexion directe via server client (écrit le cookie de session)
  const supabase = await createSupabaseServerClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (signInError) {
    console.error('[creerCompteEtConnecter] signIn:', signInError.message)
    return {
      error:
        'Compte créé mais connexion échouée. Va sur /connexion avec ton email et mot de passe.',
    }
  }

  return { error: null }
}
