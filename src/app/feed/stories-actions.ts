'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type StoryData = {
  id: string
  author_id: string
  image_url: string | null
  text: string | null
  bg_color: string
  text_color: string
  expires_at: string
  created_at: string
  author_prenom: string
  author_nom: string
  author_avatar: string | null
}

export async function getActiveStories(): Promise<StoryData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, author_id, image_url, text, bg_color, text_color, expires_at, created_at')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error || !stories?.length) return []

  const authorIds = [...new Set(stories.map(s => s.author_id))]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, avatar_url, member_id')
    .in('id', authorIds)

  const memberIds = [...new Set((profiles ?? []).map(p => p.member_id).filter(Boolean))] as string[]
  let members: { id: string; prenom: string; nom: string }[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('members')
      .select('id, prenom, nom')
      .in('id', memberIds)
    members = data ?? []
  }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))

  return stories.map(s => {
    const prof = profileMap[s.author_id]
    const mem = prof?.member_id ? memberMap[prof.member_id] : null
    return {
      ...s,
      bg_color: s.bg_color ?? '#0F1C3F',
      text_color: s.text_color ?? '#FFFFFF',
      author_prenom: mem?.prenom ?? 'Membre',
      author_nom: mem?.nom ?? '',
      author_avatar: prof?.avatar_url ?? null,
    }
  })
}

export async function createStory(params: {
  imageUrl?: string
  text?: string
  bgColor?: string
  textColor?: string
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Action réservée aux admins')

  const { error } = await supabase.from('stories').insert({
    author_id: user.id,
    image_url: params.imageUrl ?? null,
    text: params.text?.trim().slice(0, 200) ?? null,
    bg_color: params.bgColor ?? '#0F1C3F',
    text_color: params.textColor ?? '#FFFFFF',
  })

  if (error) throw new Error(error.message)
}

export async function deleteStory(storyId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') throw new Error('Action réservée aux admins')

  await supabase.from('stories').delete().eq('id', storyId)
}
