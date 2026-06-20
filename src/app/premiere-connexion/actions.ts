'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// ─── Rate limiting ────────────────────────────────────────────────────────────

// 3 OTP requests per memberId per 10 minutes (anti-spam)
const otpRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkOtpRateLimit(memberId: string): boolean {
  const now = Date.now()
  const entry = otpRateLimitMap.get(memberId)
  if (!entry || now > entry.resetAt) {
    otpRateLimitMap.set(memberId, { count: 1, resetAt: now + 600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// 5 password attempts per email per 15 minutes
const passwordRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkPasswordRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = passwordRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    passwordRateLimitMap.set(key, { count: 1, resetAt: now + 900_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// ─── verifierEmailEtEnvoyerOTP ────────────────────────────────────────────────
// Vérifie côté serveur que l'email saisi correspond au membre, puis envoie un OTP.
// Anti-énumération : retourne toujours le même message de succès générique.

export async function verifierEmailEtEnvoyerOTP(
  memberId: string,
  emailSaisi: string,
): Promise<{ error: string | null }> {
  if (!memberId) return { error: 'Membre non sélectionné.' }

  const emailInput = emailSaisi?.trim().toLowerCase() ?? ''
  if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    return { error: 'Adresse email invalide.' }
  }

  if (!checkOtpRateLimit(memberId)) {
    return { error: 'Trop de tentatives. Réessaie dans 10 minutes.' }
  }

  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!serviceKey.startsWith('eyJ')) {
    return { error: 'Erreur de configuration serveur.' }
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Récupérer l'email DB — opération 100% serveur, jamais exposée au client
  const { data: membre } = await admin
    .from('members')
    .select('email')
    .eq('id', memberId)
    .single()

  const emailDB = (membre?.email as string | null)?.toLowerCase().trim() ?? null

  // Anti-énumération : même chemin de retour si email incorrect ou membre introuvable
  if (!emailDB || emailDB !== emailInput) {
    // On ne révèle pas si l'email correspond ou non
    return { error: null }
  }

  // Email vérifié — envoyer l'OTP (shouldCreateUser: true pour les nouveaux membres)
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signInWithOtp({
    email: emailDB,
    options: { shouldCreateUser: true },
  })

  return { error: null }
}

// ─── verifierOTP ──────────────────────────────────────────────────────────────
// Vérifie le code OTP reçu par email. Si correct, crée la session auth dans les cookies.

export async function verifierOTP(
  email: string,
  token: string,
): Promise<{ error: string | null }> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !token || token.trim().length !== 6) {
    return { error: 'Code invalide.' }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.verifyOtp({
    email: normalizedEmail,
    token: token.trim(),
    type: 'email',
  })

  if (error) {
    console.error('[verifierOTP]', error.message)
    return { error: 'Code incorrect ou expiré. Vérifie ta boîte mail ou demande un nouveau code.' }
  }

  return { error: null }
}

// ─── definirMotDePasseApresOTP ────────────────────────────────────────────────
// Définit le mot de passe d'un utilisateur déjà authentifié via OTP.
// Appelé uniquement après vérification OTP réussie — la session est dans les cookies.

export async function definirMotDePasseApresOTP(
  memberId: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!password || password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { error: 'Le mot de passe doit contenir au moins une majuscule.' }
  }
  if (!/[0-9]/.test(password)) {
    return { error: 'Le mot de passe doit contenir au moins un chiffre.' }
  }

  const supabase = await createSupabaseServerClient()

  // L'utilisateur doit être authentifié (session issue du OTP)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'Session expirée. Recommence depuis le début.' }
  }

  if (!checkPasswordRateLimit(user.email ?? '')) {
    return { error: 'Trop de tentatives. Réessaie dans 15 minutes.' }
  }

  // Définir le mot de passe sur le compte déjà authentifié
  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    console.error('[definirMotDePasseApresOTP] updateUser:', updateError.message)
    return { error: 'Erreur lors de la définition du mot de passe. Réessaie.' }
  }

  // Activer le membre et confirmer l'email dans la table members
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (serviceKey.startsWith('eyJ')) {
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    await admin
      .from('members')
      .update({ email: user.email, is_active: true })
      .eq('id', memberId)
  }

  return { error: null }
}
