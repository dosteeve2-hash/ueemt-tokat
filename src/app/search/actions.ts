'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchResults = {
  members: {
    id: string
    full_name: string
    filiere: string | null
    avatar_url: string | null
  }[]
  posts: {
    id: string
    content: string
    created_at: string
    author_name: string
    author_avatar: string | null
  }[]
  events: {
    id: string
    title: string
    event_date: string | null
    location: string | null
  }[]
}

export async function globalSearch(query: string): Promise<SearchResults> {
  const empty: SearchResults = { members: [], posts: [], events: [] }
  const trimmed = query?.trim() ?? ''
  if (trimmed.length < 2 || trimmed.length > 100) return empty

  const supabase = await createClient()
  // Escape SQL wildcards to avoid injection via PostgREST filter string
  const safe = trimmed.replace(/[%_\\]/g, c => `\\${c}`)
  const q = `%${safe}%`

  const [membersRes, postsRes, eventsRes] = await Promise.all([
    supabase
      .from('members')
      .select('id, prenom, nom, filiere')
      .or(`prenom.ilike.${q},nom.ilike.${q},filiere.ilike.${q}`)
      .eq('is_validated', true)
      .limit(5),
    supabase
      .from('posts')
      .select('id, content, created_at, author_id')
      .ilike('content', q)
      .eq('type', 'post')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('events')
      .select('id, title, event_date, location')
      .or(`title.ilike.${q},location.ilike.${q}`)
      .eq('is_published', true)
      .limit(5),
  ])

  // Avatar lookup for member results
  const memberIds = (membersRes.data ?? []).map(m => m.id)
  let avatarMap: Record<string, string | null> = {}
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('member_id, avatar_url')
      .in('member_id', memberIds)
    avatarMap = Object.fromEntries(
      (profiles ?? []).filter(p => p.member_id).map(p => [p.member_id as string, p.avatar_url ?? null])
    )
  }

  const members = (membersRes.data ?? []).map(m => ({
    id: m.id,
    full_name: `${m.prenom} ${m.nom}`,
    filiere: m.filiere ?? null,
    avatar_url: avatarMap[m.id] ?? null,
  }))

  // Author name lookup for post results
  const authorIds = [...new Set((postsRes.data ?? []).map(p => p.author_id))]
  let authorMap: Record<string, { name: string; avatar: string | null }> = {}
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, avatar_url, member_id')
      .in('id', authorIds)
    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    const mids = [...new Set((profiles ?? []).map(p => p.member_id).filter(Boolean))] as string[]
    let memberNames: { id: string; prenom: string; nom: string }[] = []
    if (mids.length > 0) {
      const { data } = await supabase.from('members').select('id, prenom, nom').in('id', mids)
      memberNames = data ?? []
    }
    const memberNameMap = Object.fromEntries(memberNames.map(m => [m.id, `${m.prenom} ${m.nom}`]))
    for (const authorId of authorIds) {
      const prof = profileMap[authorId]
      const name = prof?.member_id ? (memberNameMap[prof.member_id] ?? 'Membre') : 'Membre'
      authorMap[authorId] = { name, avatar: prof?.avatar_url ?? null }
    }
  }

  const posts = (postsRes.data ?? []).map(p => ({
    id: p.id,
    content: p.content ?? '',
    created_at: p.created_at,
    author_name: authorMap[p.author_id]?.name ?? 'Membre',
    author_avatar: authorMap[p.author_id]?.avatar ?? null,
  }))

  const events = (eventsRes.data ?? []).map(e => ({
    id: e.id,
    title: e.title,
    event_date: e.event_date ?? null,
    location: e.location ?? null,
  }))

  return { members, posts, events }
}
