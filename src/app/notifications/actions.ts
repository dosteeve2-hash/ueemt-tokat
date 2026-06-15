'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type NotificationData = {
  id: string
  type: string
  actor_id: string | null
  post_id: string | null
  read: boolean
  created_at: string
  actor_prenom: string
  actor_nom: string
  actor_avatar: string | null
  post_content: string | null
}

export async function getNotifications(): Promise<NotificationData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: notifs, error } = await supabase
    .from('notifications')
    .select('id, type, actor_id, post_id, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !notifs?.length) return []

  const actorIds = [...new Set(notifs.map(n => n.actor_id).filter(Boolean))] as string[]
  const postIds = [...new Set(notifs.map(n => n.post_id).filter(Boolean))] as string[]

  let profiles: { id: string; avatar_url: string | null; member_id: string | null }[] = []
  let members: { id: string; prenom: string; nom: string }[] = []
  let posts: { id: string; content: string | null }[] = []

  if (actorIds.length > 0) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, avatar_url, member_id')
      .in('id', actorIds)
    profiles = data ?? []

    const memberIds = [...new Set(profiles.map(p => p.member_id).filter(Boolean))] as string[]
    if (memberIds.length > 0) {
      const { data: mData } = await supabase
        .from('members')
        .select('id, prenom, nom')
        .in('id', memberIds)
      members = mData ?? []
    }
  }

  if (postIds.length > 0) {
    const { data } = await supabase
      .from('posts')
      .select('id, content')
      .in('id', postIds)
    posts = data ?? []
  }

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]))
  const postMap = Object.fromEntries(posts.map(p => [p.id, p]))

  return notifs.map(n => {
    const prof = n.actor_id ? profileMap[n.actor_id] : null
    const mem = prof?.member_id ? memberMap[prof.member_id] : null
    const post = n.post_id ? postMap[n.post_id] : null
    return {
      id: n.id,
      type: n.type,
      actor_id: n.actor_id,
      post_id: n.post_id,
      read: n.read,
      created_at: n.created_at,
      actor_prenom: mem?.prenom ?? 'Membre',
      actor_nom: mem?.nom ?? '',
      actor_avatar: prof?.avatar_url ?? null,
      post_content: post?.content ?? null,
    }
  })
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) return 0
  return count ?? 0
}

export async function markAsRead(notifId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notifId)
    .eq('user_id', user.id)
}

export async function markAllAsRead(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
}

export async function insertNotification(params: {
  userId: string
  type: string
  actorId?: string
  postId?: string
}): Promise<void> {
  const supabase = await createClient()
  // Don't notify yourself
  if (params.actorId === params.userId) return

  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    actor_id: params.actorId ?? null,
    post_id: params.postId ?? null,
  })
}

export async function getAdminUserIds(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('role', 'admin')
  return (data ?? []).map(p => p.id)
}
