import { createClient } from './client'

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadDocument(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('documents').upload(path, file)
  if (error) return null
  return path
}

export async function getDocumentUrl(path: string): Promise<string | null> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

export async function deleteDocument(path: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from('documents').remove([path])
  return !error
}

export async function uploadPhoto(albumId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${albumId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('photos').upload(path, file, { contentType: file.type })
  if (error) return null
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

export async function deletePhotoFromStorage(url: string): Promise<boolean> {
  const supabase = createClient()
  const marker = '/object/public/photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return false
  const path = url.slice(idx + marker.length)
  const { error } = await supabase.storage.from('photos').remove([path])
  return !error
}

/**
 * Upload la photo d'un fondateur dans le bucket "avatars" sous fondateurs/<name>.<ext>
 * Retourne l'URL publique ou null en cas d'erreur.
 */
export async function uploadFounderPhoto(
  founderKey: string,
  file: File
): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `fondateurs/${founderKey}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) return null
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
