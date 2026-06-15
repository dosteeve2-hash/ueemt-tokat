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
  password: string,
): Promise<{ error: string | null }> {
  if (!memberId) {
    return { error: 'Membre non sélectionné.' }
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
    return { error: 'Configuration serveur manquante. Contacte un administrateur.' }
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Récupérer l'email depuis la DB — le client ne l'envoie plus
  const { data: member, error: fetchError } = await admin
    .from('members')
    .select('email')
    .eq('id', memberId)
    .eq('is_active', true)
    .single()

  if (fetchError || !member?.email) {
    return { error: 'Membre introuvable ou compte désactivé. Contacte un administrateur.' }
  }

  const normalizedEmail = (member.email as string).trim().toLowerCase()

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
      return { error: 'Impossible de trouver le compte. Contacte un administrateur.' }
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
