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
  const path = `${albumId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('photos').upload(path, file)
  if (error) return null
  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}
