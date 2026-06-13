'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Non autorisé')
  return { supabase, user }
}

const albumSchema = z.object({
  titre: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

const activitySchema = z.object({
  titre: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  date: z.string().optional(),
  instagram_url: z.string().url().optional().or(z.literal('')),
})

export async function createAlbum(formData: FormData) {
  const { supabase, user } = await requireAdmin()
  const parsed = albumSchema.safeParse({
    titre: formData.get('titre'),
    description: formData.get('description') || undefined,
  })
  if (!parsed.success) throw new Error('Données invalides')

  const { error } = await supabase.from('albums').insert({
    titre: parsed.data.titre,
    description: parsed.data.description ?? null,
    created_by: user.id,
    is_public: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/activites')
}

export async function createActivity(formData: FormData) {
  const { supabase, user } = await requireAdmin()
  const instagramRaw = (formData.get('instagram_url') as string) || ''
  const parsed = activitySchema.safeParse({
    titre: formData.get('titre'),
    description: formData.get('description') || undefined,
    date: formData.get('date') || undefined,
    instagram_url: instagramRaw || undefined,
  })
  if (!parsed.success) throw new Error('Données invalides')

  const { error } = await supabase.from('activities').insert({
    titre: parsed.data.titre,
    description: parsed.data.description ?? null,
    date: parsed.data.date ?? null,
    instagram_url: instagramRaw || null,
    created_by: user.id,
    is_published: true,
  })
  if (error) throw new Error(error.message)
  revalidatePath('/activites')
}
