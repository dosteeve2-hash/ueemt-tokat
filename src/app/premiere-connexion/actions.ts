'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { getAppRole } from '@/lib/constants'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// ─── Rate limiting ────────────────────────────────────────────────────────────

// 5 tentatives / 15min par email (anti-bruteforce)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 900_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// ─── creerCompteAvecEmailEtMotDePasse ─────────────────────────────────────────
// Vérifie l'email côté serveur contre la DB, crée ou met à jour le compte
// Supabase Auth, et connecte l'utilisateur sans aucun email OTP.
// Sécurisé car l'email doit correspondre exactement à celui en DB.

export async function creerCompteAvecEmailEtMotDePasse(
  memberId: string,
  emailSaisi: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!memberId) return { error: 'Membre non sélectionné.' }

  const emailInput = emailSaisi?.trim().toLowerCase() ?? ''
  if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
    return { error: 'Adresse email invalide.' }
  }

  if (!password || password.length < 8) {
    return { error: 'Mot de passe trop court (minimum 8 caractères).' }
  }
  if (!/[A-Z]/.test(password)) {
    return { error: 'Le mot de passe doit contenir au moins une majuscule.' }
  }
  if (!/[0-9]/.test(password)) {
    return { error: 'Le mot de passe doit contenir au moins un chiffre.' }
  }

  if (!checkRateLimit(emailInput)) {
    return { error: 'Trop de tentatives. Réessaie dans 15 minutes.' }
  }

  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!serviceKey.startsWith('eyJ')) {
    return { error: 'Erreur de configuration serveur.' }
  }

  const admin = createAdminClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ─── 1. Vérifier / enregistrer l'email ──────────────────────────────────────
  const { data: membre } = await admin
    .from('members')
    .select('id, email, prenom, nom')
    .eq('id', memberId)
    .single()

  if (!membre) {
    return { error: 'Membre introuvable. Vérifie ta sélection.' }
  }

  const emailDB = (membre.email as string | null)?.toLowerCase().trim() ?? null

  if (emailDB && emailDB !== emailInput) {
    // Un email était déjà enregistré ET il ne correspond pas → erreur
    return { error: 'Cet email ne correspond pas à celui enregistré lors du recensement. Vérifie ton email ou contacte le bureau.' }
  }

  // Si aucun email n'était enregistré (recensement sans email), on sauvegarde
  // celui que le membre vient de saisir pour les connexions futures.
  if (!emailDB) {
    await admin.from('members').update({ email: emailInput }).eq('id', memberId)
  }

  const email = emailInput

  // ─── 2. Créer ou mettre à jour le compte Supabase Auth ───────────────────
  let userId: string

  const { data: newUserData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError) {
    // L'utilisateur existe déjà → mettre à jour son mot de passe
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    )

    if (!existingUser) {
      console.error('[creerCompte] createUser error:', createError.message)
      return { error: 'Erreur lors de la création du compte. Réessaie.' }
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
    })
    if (updateError) {
      console.error('[creerCompte] updateUser error:', updateError.message)
      return { error: 'Erreur lors de la mise à jour du mot de passe.' }
    }

    userId = existingUser.id
  } else {
    userId = newUserData.user.id
  }

  // ─── 3. Upsert user_profile (crée si absent, met à jour si existant) ────────
  // Détermine le rôle en fonction des constantes du bureau
  const role = getAppRole(
    (membre!.prenom as string) ?? '',
    (membre!.nom as string) ?? '',
  )

  // Vérifier que le member_id n'est pas déjà pris par UN AUTRE compte
  const { data: claimedBy } = await admin
    .from('user_profiles')
    .select('id')
    .eq('member_id', memberId)
    .neq('id', userId)
    .maybeSingle()

  if (!claimedBy) {
    // Upsert : INSERT pour les nouveaux, UPDATE pour les existants
    // Utilise le client admin pour bypasser RLS (fiable même si session pas encore propagée)
    const { error: upsertError } = await admin
      .from('user_profiles')
      .upsert(
        { id: userId, member_id: memberId, role },
        { onConflict: 'id', ignoreDuplicates: false },
      )
    if (upsertError) {
      console.error('[creerCompte] upsert user_profiles:', upsertError.message)
      // Non-bloquant : /api/onboarding le retentera côté client
    }
  }

  // ─── 4. Activer le membre ─────────────────────────────────────────────────
  await admin
    .from('members')
    .update({ is_active: true })
    .eq('id', memberId)

  // ─── 5. Connecter directement via signInWithPassword ─────────────────────
  const supabase = await createSupabaseServerClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
  if (signInError) {
    console.error('[creerCompte] signIn error:', signInError.message)
    return { error: 'Compte créé, mais connexion automatique échouée. Connecte-toi normalement via /connexion.' }
  }

  return { error: null }
}
