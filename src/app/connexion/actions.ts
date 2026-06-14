'use server'

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
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

function buildPasswordSetupEmailHtml(actionLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#14A44D;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">🎓 UEEMT-Tokat</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Union des Élèves et Étudiants Maliens à Tokat</p>
        </td></tr>
        <tr><td style="background:white;padding:40px;border-radius:0 0 12px 12px">
          <h2 style="color:#111827;margin:0 0 16px;font-size:20px;font-weight:700">Votre demande a été approuvée ✅</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 32px">
            Cliquez sur le bouton ci-dessous pour <strong style="color:#111827">définir votre mot de passe</strong>
            et accéder à votre espace membre. Ce lien est valable pendant <strong style="color:#111827">1 heure</strong>.
          </p>
          <div style="text-align:center;margin:0 0 32px">
            <a href="${actionLink}"
               style="background:#14A44D;color:white;padding:16px 48px;border-radius:50px;text-decoration:none;font-size:16px;font-weight:700;display:inline-block;box-shadow:0 4px 16px rgba(20,164,77,0.30)">
              🔑 Définir mon mot de passe
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 8px">
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.<br>
            Ce lien ne peut être utilisé qu'une seule fois.
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
          <p style="color:#d1d5db;font-size:11px;text-align:center;margin:0">
            UEEMT-Tokat · Tokat, Türkiye ·
            <a href="https://ueemt-tokat.vercel.app" style="color:#14A44D;text-decoration:none">ueemt-tokat.vercel.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildLoginEmailHtml(actionLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#14A44D;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">🎓 UEEMT-Tokat</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Union des Élèves et Étudiants Maliens à Tokat</p>
        </td></tr>
        <tr><td style="background:white;padding:40px;border-radius:0 0 12px 12px">
          <h2 style="color:#111827;margin:0 0 16px;font-size:20px;font-weight:700">Votre accès membres est prêt ✅</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 32px">
            Cliquez sur le bouton ci-dessous pour accéder à votre espace personnel UEEMT-Tokat.<br>
            Ce lien est sécurisé et valable pendant <strong style="color:#111827">1 heure</strong>.
          </p>
          <div style="text-align:center;margin:0 0 32px">
            <a href="${actionLink}"
               style="background:#14A44D;color:white;padding:16px 48px;border-radius:50px;text-decoration:none;font-size:16px;font-weight:700;display:inline-block;box-shadow:0 4px 16px rgba(20,164,77,0.30)">
              🔐 Accéder à mon espace
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 8px">
            Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.<br>
            Ce lien ne peut être utilisé qu'une seule fois.
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
          <p style="color:#d1d5db;font-size:11px;text-align:center;margin:0">
            UEEMT-Tokat · Tokat, Türkiye ·
            <a href="https://ueemt-tokat.vercel.app" style="color:#14A44D;text-decoration:none">ueemt-tokat.vercel.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
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
      return { error: 'Email non confirmé. Contactez un administrateur UEEMT.' }
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
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const resendKey = stripBom(process.env.RESEND_API_KEY)

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }

  const hasValidServiceKey = serviceKey.startsWith('eyJ')

  if (hasValidServiceKey && resendKey) {
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${siteUrl}/definir-mot-de-passe` },
    })

    if (linkError || !data?.properties?.action_link) {
      return { error: linkError?.message ?? 'Impossible de générer le lien de définition du mot de passe' }
    }

    const resend = new Resend(resendKey)
    const { error: emailError } = await resend.emails.send({
      from: 'UEEMT-Tokat <onboarding@resend.dev>',
      to: [normalizedEmail],
      subject: '🔑 Définissez votre mot de passe UEEMT-Tokat',
      html: buildPasswordSetupEmailHtml(data.properties.action_link),
    })

    if (!emailError) return { error: null }
    const isTestRestriction =
      emailError.message?.includes('testing emails') || emailError.message?.includes('own email')
    if (!isTestRestriction) return { error: emailError.message }
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${siteUrl}/definir-mot-de-passe`,
  })
  return { error: error?.message ?? null }
}

function buildPremierAccesEmailHtml(actionLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <tr><td style="background:#14A44D;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">🎓 UEEMT-Tokat</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Union des Élèves et Étudiants Maliens à Tokat</p>
        </td></tr>
        <tr><td style="background:white;padding:40px;border-radius:0 0 12px 12px">
          <h2 style="color:#111827;margin:0 0 16px;font-size:20px;font-weight:700">Bienvenue sur UEEMT — Définissez votre mot de passe 🎉</h2>
          <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 32px">
            Clique sur le lien ci-dessous pour <strong style="color:#111827">définir ton mot de passe</strong> et accéder à la plateforme.
            Ce lien expire dans <strong style="color:#111827">24h</strong>.
          </p>
          <div style="text-align:center;margin:0 0 32px">
            <a href="${actionLink}"
               style="background:#14A44D;color:white;padding:16px 48px;border-radius:50px;text-decoration:none;font-size:16px;font-weight:700;display:inline-block;box-shadow:0 4px 16px rgba(20,164,77,0.30)">
              🔑 Définir mon mot de passe
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0 0 8px">
            Si tu n'es pas à l'origine de cette demande, ignore cet email.<br>
            Ce lien ne peut être utilisé qu'une seule fois.
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0">
          <p style="color:#d1d5db;font-size:11px;text-align:center;margin:0">
            UEEMT-Tokat · Tokat, Türkiye ·
            <a href="https://ueemt-tokat.vercel.app" style="color:#14A44D;text-decoration:none">ueemt-tokat.vercel.app</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function envoyerLienPremierAcces(
  email: string,
): Promise<{ error: string | null; message?: string }> {
  const siteUrl = stripBom(process.env.NEXT_PUBLIC_SITE_URL) || 'https://ueemt-tokat.vercel.app'
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const resendKey = stripBom(process.env.RESEND_API_KEY)

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

  const { data: member } = await admin
    .from('members')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (!member) return genericSuccess

  const { data, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: normalizedEmail,
    options: { redirectTo: `${siteUrl}/definir-mot-de-passe` },
  })

  if (linkError || !data?.properties?.action_link) return genericSuccess

  if (resendKey) {
    const resend = new Resend(resendKey)
    const { error: resendError } = await resend.emails.send({
      from: 'UEEMT-Tokat <onboarding@resend.dev>',
      to: [normalizedEmail],
      subject: 'Bienvenue sur UEEMT — Définissez votre mot de passe',
      html: buildPremierAccesEmailHtml(data.properties.action_link),
    })

    if (!resendError) return genericSuccess

    const isTestRestriction =
      resendError.message?.includes('testing emails') ||
      resendError.message?.includes('own email')
    if (!isTestRestriction) {
      console.error('[envoyerLienPremierAcces] Resend error:', resendError.message)
    }
  }

  const supabase = await createSupabaseServerClient()
  await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: `${siteUrl}/definir-mot-de-passe`,
  })

  return genericSuccess
}

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const siteUrl = stripBom(process.env.NEXT_PUBLIC_SITE_URL) || 'https://ueemt-tokat.vercel.app'
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const resendKey = stripBom(process.env.RESEND_API_KEY)

  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { error: 'Adresse email invalide.' }
  }

  if (!checkRateLimit(normalizedEmail)) {
    return { error: 'Trop de tentatives. Réessaie dans 1 heure.' }
  }

  const hasValidServiceKey = serviceKey.startsWith('eyJ')

  if (hasValidServiceKey && resendKey) {
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })

    if (linkError || !data?.properties?.action_link) {
      return { error: linkError?.message ?? 'Impossible de générer le lien de connexion' }
    }

    const resend = new Resend(resendKey)
    const { error: emailError } = await resend.emails.send({
      from: 'UEEMT-Tokat <onboarding@resend.dev>',
      to: [normalizedEmail],
      subject: '🔐 Votre lien de connexion UEEMT-Tokat',
      html: buildLoginEmailHtml(data.properties.action_link),
    })

    if (!emailError) return { error: null }
    const isTestRestriction = emailError.message?.includes('testing emails') || emailError.message?.includes('own email')
    if (!isTestRestriction) return { error: emailError.message }
  }

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
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('members')
      .select('id, nom_complet, filiere')
      .eq('is_active', true)
      .order('nom_complet')

    if (error) return { membres: [], error: error.message }
    return { membres: (data ?? []) as Array<{ id: string; nom_complet: string; filiere: string | null }>, error: null }
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
    .eq('is_active', true)
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
    return { error: 'Configuration serveur manquante. Contacte un administrateur.' }
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
    .eq('is_active', true)
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
      return { error: 'Impossible de trouver le compte. Contacte un administrateur.' }
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
