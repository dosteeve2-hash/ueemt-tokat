'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Rate limiting ──────────────────────────────────────────────────────────

const createListingRateLimit = new Map<string, { count: number; resetAt: number }>()

function checkCreateListing(userId: string): boolean {
  const now = Date.now()
  const entry = createListingRateLimit.get(userId)
  if (!entry || now > entry.resetAt) {
    createListingRateLimit.set(userId, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// ─── createListing ──────────────────────────────────────────────────────────

export async function createListing(formData: FormData): Promise<{ error: string | null; id?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  if (!checkCreateListing(user.id)) {
    return { error: 'Trop d\'annonces créées. Réessaie dans 1 heure.' }
  }

  const title = (formData.get('title') as string | null)?.trim().slice(0, 200) ?? ''
  const description = (formData.get('description') as string | null)?.trim().slice(0, 1000) ?? ''
  const category = (formData.get('category') as string | null)?.trim() ?? ''
  const priceRaw = formData.get('price') as string | null
  const price = priceRaw ? parseFloat(priceRaw) : null
  const currency = (formData.get('currency') as string | null) ?? 'TRY'
  const contactInfo = (formData.get('contact_info') as string | null)?.trim() ?? ''

  if (!title || title.length < 3) return { error: 'Titre trop court (3 caractères min).' }
  if (!['vente', 'echange', 'service', 'don'].includes(category)) return { error: 'Catégorie invalide.' }
  if (price !== null && (isNaN(price) || price < 0)) return { error: 'Prix invalide.' }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      author_id: user.id,
      title,
      description: description || null,
      category,
      price: price ?? null,
      currency,
      contact_info: contactInfo || null,
      photos: [],
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createListing]', error.message)
    return { error: 'Erreur lors de la création de l\'annonce.' }
  }

  revalidatePath('/marketplace')
  return { error: null, id: data.id }
}

// ─── deleteListing ──────────────────────────────────────────────────────────

export async function deleteListing(id: string): Promise<{ error: string | null }> {
  if (!id) return { error: 'ID manquant.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Vérification ownership (RLS aussi appliqué, double sécurité)
  const { data: listing } = await supabase
    .from('listings')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!listing || listing.author_id !== user.id) {
    return { error: 'Annonce introuvable ou accès refusé.' }
  }

  const { error } = await supabase.from('listings').delete().eq('id', id)
  if (error) return { error: 'Erreur lors de la suppression.' }

  revalidatePath('/marketplace')
  return { error: null }
}

// ─── toggleListingActive ─────────────────────────────────────────────────────

export async function toggleListingActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('listings')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('author_id', user.id) // ownership check

  if (error) return { error: 'Erreur de mise à jour.' }
  revalidatePath('/marketplace')
  return { error: null }
}
