/**
 * Welcome email sender — 3-tier fallback:
 * 1. Resend API (if RESEND_API_KEY is set)
 * 2. pending_emails table (if SUPABASE_SERVICE_ROLE_KEY is set)
 * 3. Console log
 */

function buildWelcomeHtml(prenom: string, nom: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bienvenue dans la famille UEEMT-Tokat !</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#14A44D;padding:36px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr>
                <td style="width:24px;height:6px;background:#22c55e;border-radius:3px;"></td>
                <td style="width:8px;"></td>
                <td style="width:24px;height:6px;background:#eab308;border-radius:3px;"></td>
                <td style="width:8px;"></td>
                <td style="width:24px;height:6px;background:#ef4444;border-radius:3px;"></td>
              </tr>
            </table>
            <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0 0 6px;letter-spacing:-0.5px;">UEEMT-TOKAT</h1>
            <p style="color:#bbf7d0;font-size:13px;margin:0;">Union des Élèves et Étudiants Maliens à Tokat</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="font-size:16px;color:#111827;margin:0 0 8px;font-weight:700;">Bonjour ${prenom},</p>
            <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.7;">
              Votre espace membre <strong>UEEMT-Tokat</strong> est maintenant activé. 🎓
            </p>
            <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.7;">
              Nous sommes heureux de vous accueillir officiellement,
              <strong>${prenom} ${nom}</strong>, au sein de l'Union des Élèves
              et Étudiants Maliens de Tokat.
            </p>

            <!-- Feature list -->
            <div style="background:#f0fdf4;border-left:4px solid #14A44D;border-radius:0 8px 8px 0;padding:18px 22px;margin:0 0 28px;">
              <p style="font-size:14px;color:#166534;margin:0 0 12px;font-weight:700;">Depuis votre espace, vous pouvez :</p>
              <p style="font-size:14px;color:#374151;margin:5px 0;line-height:1.5;">📷 &nbsp;Compléter votre profil (photo, téléphone, bio)</p>
              <p style="font-size:14px;color:#374151;margin:5px 0;line-height:1.5;">📄 &nbsp;Accéder aux documents et ressources de l'association</p>
              <p style="font-size:14px;color:#374151;margin:5px 0;line-height:1.5;">🤝 &nbsp;Participer à la vie de la communauté</p>
              <p style="font-size:14px;color:#374151;margin:5px 0;line-height:1.5;">💳 &nbsp;Suivre le statut de votre cotisation</p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin:0 0 28px;">
              <a href="${siteUrl}/dashboard"
                style="background:#14A44D;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;display:inline-block;letter-spacing:0.2px;">
                Accéder à mon espace →
              </a>
            </div>

            <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.7;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${siteUrl}/dashboard" style="color:#14A44D;word-break:break-all;">${siteUrl}/dashboard</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="font-size:13px;color:#374151;margin:0 0 4px;font-weight:700;">Le Bureau Exécutif de l'UEEMT-Tokat</p>
            <p style="font-size:12px;color:#9ca3af;margin:0 0 2px;">Travail · Solidarité · Réussite</p>
            <p style="font-size:11px;color:#d1d5db;margin:12px 0 0;">Tokat, Türkiye · Ne pas répondre à cet email</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendWelcomeEmail(
  to: string,
  prenom: string,
  nom: string,
): Promise<{ ok: boolean; method: 'resend' | 'pending_emails' | 'console' }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ueemt-tokat.vercel.app'
  const subject = `Bienvenue dans la famille UEEMT-Tokat, ${prenom} ! 🎓`
  const html = buildWelcomeHtml(prenom, nom, siteUrl)

  // Tier 1 — Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      })
      if (res.ok) return { ok: true, method: 'resend' }
      const detail = await res.text().catch(() => '')
      console.error('[welcome-email] Resend error:', res.status, detail)
    } catch (e) {
      console.error('[welcome-email] Resend fetch failed:', e)
    }
  }

  // Tier 2 — pending_emails table (needs service role key to bypass RLS)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      )
      const { error } = await adminClient
        .from('pending_emails')
        .insert({ to, subject, body_html: html })
      if (!error) return { ok: true, method: 'pending_emails' }
      console.error('[welcome-email] pending_emails insert error:', error.message)
    } catch (e) {
      console.error('[welcome-email] pending_emails failed:', e)
    }
  }

  // Tier 3 — console (always succeeds, so we don't block onboarding)
  console.log(
    `[welcome-email] CONSOLE FALLBACK | to:${to} | subject:${subject}`,
  )
  return { ok: true, method: 'console' }
}
