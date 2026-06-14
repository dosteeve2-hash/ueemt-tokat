'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// ─── Rate limiting ────────────────────────────────────────────────────────────

const verifyRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const createRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkVerifyRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = verifyRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    verifyRateLimitMap.set(key, { count: 1, resetAt: now + 600_000 }) // 10 min
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

function checkCreateRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = createRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    createRateLimitMap.set(key, { count: 1, resetAt: now + 3_600_000 }) // 1h
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// ─── verifierIdentite ─────────────────────────────────────────────────────────

export async function verifierIdentite(
  memberId: string,
  email: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase().replace(/^﻿/, '')

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (!checkVerifyRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 10 minutes.' }
  }

  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasValidServiceKey = serviceKey.startsWith('eyJ')

  const client = hasValidServiceKey
    ? createAdminClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : await createSupabaseServerClient()

  const { data: member } = await client
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('email', normalizedEmail)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) {
    return { error: "Cet email ne correspond pas à ce membre. Vérifie ton adresse email." }
  }
  return { error: null }
}

// ─── creerCompteEtConnecter ───────────────────────────────────────────────────

export async function creerCompteEtConnecter(
  memberId: string,
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase().replace(/^﻿/, '')

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (!password || password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }
  if (!checkCreateRateLimit(normalizedEmail)) {
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

  // Re-vérification sécurité : email + memberId + is_active
  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('email', normalizedEmail)
    .eq('is_active', true)
    .maybeSingle()

  if (!member) {
    return { error: "Cet email ne correspond pas à ce membre." }
  }

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
