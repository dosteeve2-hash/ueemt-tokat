'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type FounderKey = 'mansa' | 'idy'

const SETTING_KEYS: Record<FounderKey, string> = {
  mansa: 'founder_photo_mansa',
  idy: 'founder_photo_idy',
}

export type FounderPhotos = {
  mansa: string | null
  idy: string | null
}

export async function getFounderPhotos(): Promise<FounderPhotos> {
  const supabase = await createClient()

  const keys = Object.values(SETTING_KEYS)
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', keys)

  const map = Object.fromEntries((data ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))

  return {
    mansa: map[SETTING_KEYS.mansa] ?? null,
    idy: map[SETTING_KEYS.idy] ?? null,
  }
}

export async function saveFounderPhotoUrl(
  founderKey: FounderKey,
  url: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Seuls les admins/président peuvent modifier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['admin', 'president', 'tresorier']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { success: false, error: 'Accès refusé' }
  }

  const settingKey = SETTING_KEYS[founderKey]

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: settingKey, value: url }, { onConflict: 'key' })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/fondateurs')
  return { success: true }
}
