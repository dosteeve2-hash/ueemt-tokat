'use server'

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// In-memory rate limiter — 3 attempts per email per hour
// Resets on cold start (fine for Vercel serverless where each instance is isolated)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

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

function buildLoginEmailHtml(actionLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:#14A44D;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">🎓 UEEMT-Tokat</h1>
          <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Union des Élèves et Étudiants Maliens à Tokat</p>
        </td></tr>
        <!-- Body -->
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

  // Admin API path: generates link + sends via Resend (custom template)
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

    // Resend test-mode restriction: can only send to account owner's email.
    // Fall through to Supabase signInWithOtp for all other recipients.
    if (!emailError) return { error: null }
    const isTestRestriction = emailError.message?.includes('testing emails') || emailError.message?.includes('own email')
    if (!isTestRestriction) return { error: emailError.message }
  }

  // Fallback: Supabase sends its default email (rate-limited but covers all recipients)
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  })
  return { error: error?.message ?? null }
}
