/**
 * Route dynamique pour servir l'icône PWA depuis le logo courant en Supabase.
 * Chaque fois que Steve change le logo dans site_settings, cette route reflète
 * automatiquement la mise à jour — même pour les icônes de l'écran d'accueil.
 *
 * Utilisée par manifest.json et les meta tags <link rel="icon">.
 */

import { NextRequest, NextResponse } from 'next/server'

// Revalide le cache toutes les heures côté Vercel
export const revalidate = 3600

async function fetchLogoUrl(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^﻿/, '')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.replace(/^﻿/, '')

  if (!supabaseUrl || !supabaseAnonKey) return null

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?key=eq.logo_url&select=value&limit=1`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return null
    const data = (await res.json()) as Array<{ value: string }>
    const value = data[0]?.value
    if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
      return value
    }
  } catch {
    // Ignore, fallback below
  }
  return null
}

export async function GET(_req: NextRequest) {
  // 1. Try the dynamic logo from Supabase site_settings
  const dynamicLogoUrl = await fetchLogoUrl()

  let imageBuffer: ArrayBuffer | null = null
  let contentType = 'image/jpeg'

  if (dynamicLogoUrl) {
    try {
      const res = await fetch(dynamicLogoUrl, { next: { revalidate: 3600 } })
      if (res.ok) {
        imageBuffer = await res.arrayBuffer()
        contentType = res.headers.get('content-type') || 'image/jpeg'
      }
    } catch {
      // Fall through to local fallback
    }
  }

  // 2. Fallback: proxy the local /logo.jpeg via the site URL
  if (!imageBuffer) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/^﻿/, '') ||
      'https://ueemt-tokat.vercel.app'
    try {
      const res = await fetch(`${siteUrl}/logo.jpeg`, { next: { revalidate: 3600 } })
      if (res.ok) {
        imageBuffer = await res.arrayBuffer()
        contentType = 'image/jpeg'
      }
    } catch {
      // Nothing we can do
    }
  }

  if (!imageBuffer) {
    return new NextResponse('Logo introuvable', { status: 404 })
  }

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      // CDN cache : 1h côté client, 24h côté serveur, périmé-mais-utilisable 7j
      'Cache-Control':
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
