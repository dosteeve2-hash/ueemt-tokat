import { Resend } from 'resend'

// Strip BOM (U+FEFF) that PowerShell/Windows tooling can inject into env vars
const resend = new Resend((process.env.RESEND_API_KEY ?? '').replace(/^﻿/, ''))

function buildWelcomeHtml(prenom: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#14A44D,#0d7a3a);padding:40px 32px;text-align:center;">
      <div style="font-size:42px;margin-bottom:8px;">🎓</div>
      <h1 style="color:#F0D100;font-size:22px;font-weight:800;margin:0;letter-spacing:1px;">UEEMT-TOKAT</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Union des Élèves et Étudiants Maliens à Tokat</p>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px;">
      <h2 style="color:#1a1a1a;font-size:20px;font-weight:700;margin:0 0 16px;">Bienvenue, ${prenom} ! 👋</h2>

      <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">
        Votre espace membre <strong>UEEMT-Tokat</strong> est maintenant activé. Nous sommes heureux de vous accueillir officiellement dans votre espace numérique au sein de notre association.
      </p>

      <p style="color:#4a5568;line-height:1.7;margin:0 0 24px;">
        Depuis votre tableau de bord personnel, vous pouvez :
      </p>

      <ul style="color:#4a5568;line-height:2;padding-left:20px;margin:0 0 32px;">
        <li>Compléter votre profil <em>(photo, numéro de téléphone, bio)</em></li>
        <li>Accéder à vos documents et attestations</li>
        <li>Suivre les activités et événements de l'association</li>
        <li>Rester connecté avec les membres de la communauté</li>
      </ul>

      <div style="text-align:center;margin:32px 0;">
        <a href="${siteUrl}/dashboard" style="display:inline-block;background:#14A44D;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;letter-spacing:0.5px;">
          Accéder à mon espace →
        </a>
      </div>

      <p style="color:#4a5568;line-height:1.7;margin:0;">
        Si vous avez des questions, n'hésitez pas à contacter le bureau de l'association.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:24px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#718096;font-size:12px;margin:0 0 8px;">
        <strong style="color:#14A44D;">UEEMT-Tokat</strong> — Union des Élèves et Étudiants Maliens à Tokat
      </p>
      <p style="color:#718096;font-size:11px;margin:0;">Tokat, Türkiye • 🇲🇱 🇹🇷</p>
    </div>

  </div>
</body>
</html>`
}

export async function sendWelcomeEmail(
  to: string,
  prenom: string,
  nom: string,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.error('[email] No RESEND_API_KEY — welcome email skipped')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ueemt-tokat.vercel.app'

  const { error } = await resend.emails.send({
    from: 'UEEMT-Tokat <onboarding@resend.dev>',
    to: [to],
    subject: `Bienvenue dans la famille UEEMT-Tokat, ${prenom} ! 🎓`,
    html: buildWelcomeHtml(prenom, siteUrl),
  })

  if (error) {
    console.error('[email] Resend error:', error)
    throw new Error(error.message)
  }
}
