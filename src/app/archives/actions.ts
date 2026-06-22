'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize'
import { revalidatePath } from 'next/cache'

const ROLES_BUREAU = ['admin', 'president', 'tresorier', 'adjoint_tresorier', 'secretaire', 'caissier']

const EMOJI_MAP: Record<string, string> = {
  juridique: '⚖️',
  annonce: '📢',
  evenement: '🗓️',
  historique: '🏛️',
  autre: '📄',
}

export async function ajouterDocument(
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non connecté' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !ROLES_BUREAU.includes(profile.role)) {
    return { error: 'Réservé aux membres du bureau' }
  }

  const titre = sanitizeText((formData.get('titre') as string) ?? '', 200)
  if (!titre) return { error: 'Titre requis' }

  const categorie = (formData.get('categorie') as string) || 'autre'
  const description = sanitizeText((formData.get('description') as string) ?? '', 1000)
  const dateDoc = (formData.get('date_document') as string) || null
  const rawUrl = (formData.get('fichier_url') as string) ?? ''
  const fichierUrl = rawUrl ? sanitizeUrl(rawUrl) : null

  const admin = createAdminClient()
  const { error } = await admin.from('archive_documents').insert({
    title: titre,
    category: categorie,
    description: description || null,
    file_url: fichierUrl || null,
    date_document: dateDoc || null,
    emoji: EMOJI_MAP[categorie] ?? '📄',
    is_public: true,
  })

  if (error) {
    console.error('[ajouterDocument]', error.message)
    return { error: "Erreur lors de l'ajout du document." }
  }

  revalidatePath('/archives')
  return { success: true }
}
