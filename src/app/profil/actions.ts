'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const bio = (formData.get('bio') as string | null)?.trim().slice(0, 500) ?? null
  const quote = (formData.get('quote') as string | null)?.trim().slice(0, 200) ?? null
  const isPublic = formData.get('is_public') === 'true'

  const { error } = await supabase
    .from('user_profiles')
    .update({ bio: bio || null, quote: quote || null, is_public: isPublic })
    .eq('id', user.id)

  if (error) {
    console.error('[updateProfile]', error.code)
    throw new Error('Impossible de mettre à jour le profil.')
  }
}

export async function updateAvatarUrl(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Basic URL safety check
  if (avatarUrl && !avatarUrl.startsWith('https://')) {
    throw new Error('URL avatar invalide.')
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)
  if (error) {
    console.error('[updateAvatarUrl]', error.code)
    throw new Error('Impossible de mettre à jour l\'avatar.')
  }
}
