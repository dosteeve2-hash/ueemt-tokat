'use server'

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// In-memory rate limiters — reset on cold start (fine for Vercel serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const resetRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const premierAccesRateLimitMap = new Map<string, { count: number; resetAt: number }>()
const verifierIdentiteRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// 5 attempts per email per 15 minutes
function checkLoginRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = loginRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    loginRateLimitMap.set(key, { count: 1, resetAt: now + 900_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// 3 reset attempts per email per hour
function checkResetRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = resetRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    resetRateLimitMap.set(key, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// 3 premier-accès attempts per email per hour
function checkPremierAccesRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = premierAccesRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    premierAccesRateLimitMap.set(key, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// 5 attempts per email per 10 minutes
function checkVerifierIdentiteRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = verifierIdentiteRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    verifierIdentiteRateLimitMap.set(key, { count: 1, resetAt: now + 600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (!password) {
    return { error: 'Mot de passe requis.' }
  }
  if (!checkLoginRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 15 minutes.' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (error) {
    if (
      error.message.includes('Invalid login credentials') ||
      error.message.includes('invalid_credentials')
    ) {
      return { error: 'Email ou mot de passe incorrect.' }
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Email non confirmé. Utilise le lien de connexion reçu par email, ou réessaie via /premiere-connexion.' }
    }
    return { error: error.message }
  }

  return { error: null }
}

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const siteUrl = stripBom(process.env.NEXT_PUBLIC_SITE_URL) || 'https://ueemt-tokat.vercel.app'
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (!checkResetRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 1 heure.' }
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${siteUrl}/definir-mot-de-passe`,
  })

  return { error: null }
}

export async function sendPasswordSetupEmail(email: string): Promise<{ error: string | null }> {
  const siteUrl = stripBom(process.env.NEXT_PUBLIC_SITE_URL) || 'https://ueemt-tokat.vercel.app'
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }

  // Utilise le SMTP natif Supabase (pas de Resend)
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${siteUrl}/definir-mot-de-passe`,
  })
  return { error: error?.message ?? null }
}

export async function envoyerLienPremierAcces(
  email: string,
): Promise<{ error: string | null; message?: string }> {
  const siteUrl = stripBom(process.env.NEXT_PUBLIC_SITE_URL) || 'https://ueemt-tokat.vercel.app'
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }

  if (!checkPremierAccesRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 1 heure.' }
  }

  const genericSuccess = {
    error: null,
    message: 'Si ton adresse est reconnue, tu vas recevoir un email dans quelques minutes.',
  }

  const hasValidServiceKey = serviceKey.startsWith('eyJ')
  if (!hasValidServiceKey) return genericSuccess

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Vérifier que l'email appartient à un membre
  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (!member) return genericSuccess

  // Utilise le SMTP natif Supabase (pas de Resend)
  const supabase = await createSupabaseServerClient()
  await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${siteUrl}/definir-mot-de-passe`,
  })

  return genericSuccess
}

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const siteUrl = stripBom(process.env.NEXT_PUBLIC_SITE_URL) || 'https://ueemt-tokat.vercel.app'
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }

  if (!checkRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 1 heure.' }
  }

  // Utilise le SMTP natif Supabase (pas de Resend)
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })
  return { error: error?.message ?? null }
}

// ─────────────────────────────────────────────────────────────────────────────
// Flow "Choisir qui je suis" — sans email, sans lien magique
// ─────────────────────────────────────────────────────────────────────────────

export async function getMembresList(): Promise<{
  membres: Array<{ id: string; nom_complet: string; filiere: string | null }>
  error: string | null
}> {
  try {
    const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
    const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const hasValidServiceKey = serviceKey.startsWith('eyJ')

    // Utiliser supabaseAdmin pour bypasser le RLS — sinon la liste est vide pour les anonymes
    const client = hasValidServiceKey
      ? createAdminClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : await createSupabaseServerClient()

    const { data, error } = await client
      .from('members')
      .select('id, prenom, nom, filiere')
      .order('nom')

    if (error) {
      console.error('[getMembresList]', error)
      return { membres: [], error: error.message }
    }
    return {
      membres: (data ?? []).map((m) => ({
        id: m.id as string,
        nom_complet: `${(m.prenom as string) ?? ''} ${(m.nom as string) ?? ''}`.trim(),
        filiere: m.filiere as string | null,
      })),
      error: null,
    }
  } catch (e) {
    return { membres: [], error: String(e) }
  }
}

export async function verifierIdentite(
  memberId: string,
  email: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (!checkVerifierIdentiteRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 10 minutes.' }
  }

  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasValidServiceKey = serviceKey.startsWith('eyJ')

  const client = hasValidServiceKey
    ? createAdminClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : await createSupabaseServerClient()

  const { data: member } = await client
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (!member) {
    return { error: "Cet email ne correspond pas à ce membre. Vérifie ton email." }
  }
  return { error: null }
}

export async function creerMotDePasseEtConnecter(
  memberId: string,
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }
  if (!password || password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
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

  // Re-vérification de sécurité : email + memberId doivent correspondre
  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('id', memberId)
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (!member) {
    return { error: "Cet email ne correspond pas à ce membre." }
  }

  // Essai de création — si déjà existant, on met à jour
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
      return { error: createError.message }
    }

    // L'utilisateur existe — on trouve son ID et on met à jour le mot de passe
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
    if (updateError) return { error: updateError.message }
  }

  // Connexion directe
  const supabase = await createSupabaseServerClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  })

  if (signInError) {
    return { error: signInError.message }
  }

  return { error: null }
}
