'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function demandeInscription(data: {
  prenom: string
  nom: string
  email: string
  telephone?: string
  date_arrivee_tokat?: string
  statut?: string
  filiere?: string
  universite?: string
  niveau?: string
  num_etudiant?: string
  honeypot?: string
}): Promise<{ error: string | null; success: boolean }> {
  // Honeypot — bots fill hidden fields, humans don't
  if (data.honeypot) return { error: null, success: true }

  // IP rate limiting
  const headersList = await headers()
  const ip = (headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? 'unknown')
    .split(',')[0]
    .trim()

  if (!checkIpRateLimit(ip)) {
    return { error: 'Trop de demandes. Réessaie dans 1 heure.', success: false }
  }

  // Validation
  const prenom = data.prenom?.trim() ?? ''
  const nom = data.nom?.trim() ?? ''
  const email = data.email?.trim().toLowerCase() ?? ''

  if (!prenom || prenom.length > 100) return { error: 'Prénom invalide (1–100 caractères).', success: false }
  if (!nom || nom.length > 100) return { error: 'Nom invalide (1–100 caractères).', success: false }
  if (!email || !EMAIL_RE.test(email)) return { error: 'Adresse email invalide.', success: false }

  const telephone = (data.telephone ?? '').trim().slice(0, 20) || null
  const dateArrivee = (data.date_arrivee_tokat ?? '').trim() || null
  const statut = (data.statut ?? '').trim() || 'Étudiant'
  const filiere = (data.filiere ?? '').trim().slice(0, 200) || null
  const universite = (data.universite ?? '').trim().slice(0, 200) || null
  const niveau = (data.niveau ?? '').trim().slice(0, 100) || null
  const numEtudiant = (data.num_etudiant ?? '').trim().slice(0, 50) || null

  const supabase = await createClient()

  const { error } = await supabase.from('members').insert({
    prenom,
    nom,
    email,
    telephone,
    date_arrivee_tokat: dateArrivee,
    statut,
    filiere,
    universite,
    niveau,
    num_etudiant: numEtudiant,
    is_validated: false,
    cotisation_payee: false,
  })

  if (error) {
    console.error('[inscription] insert failed:', error.code)
    // Don't reveal if email already exists — generic message for security
    return { error: 'Une erreur est survenue. Réessaie plus tard.', success: false }
  }

  return { error: null, success: true }
}
