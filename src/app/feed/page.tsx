import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedClient from '@/components/FeedClient'
import { getActiveStories } from './stories-actions'

export type FeedPost = {
  id: string
  type: string
  content: string | null
  image_url: string | null
  image_urls: string[] | null
  link_url: string | null
  document_url: string | null
  document_name: string | null
  is_pinned: boolean
  created_at: string
  author_id: string
  author_prenom: string
  author_nom: string
  author_avatar: string | null
  likes_count: number
  user_liked: boolean
  comments_count: number
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Layer 1: myProfile + posts + stories are independent — run in parallel
  const [{ data: myProfile }, { data: postsData }, stories, { data: caisseData }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('id, avatar_url, bio, member_id, role')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id, type, content, image_url, image_urls, link_url, document_url, document_name, is_pinned, created_at, author_id')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
    getActiveStories().catch(() => []),
    (async () => { try { return await supabase.from('caisse').select('montant, cotisation_mensuelle').single() } catch { return { data: null as { montant: number; cotisation_mensuelle: number } | null } } })(),
  ])

  const postIds = (postsData ?? []).map(p => p.id)
  const authorIds = [...new Set((postsData ?? []).map(p => p.author_id))]

  // Layer 2: all depend on layer 1, but independent of each other — run in parallel
  const [myMemberResp, likesResp, commentsResp, authorProfilesResp] = await Promise.all([
    myProfile?.member_id
      ? supabase.from('members').select('prenom, nom').eq('id', myProfile.member_id).single()
      : Promise.resolve({ data: null as { prenom: string; nom: string } | null }),
    postIds.length > 0
      ? supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string; user_id: string }[] }),
    (async () => {
      if (postIds.length === 0) return { data: [] as { post_id: string }[] }
      try {
        return await supabase.from('post_comments').select('post_id').in('post_id', postIds)
      } catch {
        return { data: [] as { post_id: string }[] }
      }
    })(),
    authorIds.length > 0
      ? supabase.from('user_profiles').select('id, avatar_url, member_id').in('id', authorIds)
      : Promise.resolve({ data: [] as { id: string; avatar_url: string | null; member_id: string | null }[] }),
  ])

  const myMemberName = myMemberResp.data ?? { prenom: '', nom: '' }

  const likesByPost: Record<string, number> = {}
  const userLikedSet = new Set<string>()
  for (const like of likesResp.data ?? []) {
    likesByPost[like.post_id] = (likesByPost[like.post_id] ?? 0) + 1
    if (like.user_id === user.id) userLikedSet.add(like.post_id)
  }

  const commentsByPost: Record<string, number> = {}
  for (const c of commentsResp.data ?? []) {
    commentsByPost[c.post_id] = (commentsByPost[c.post_id] ?? 0) + 1
  }

  // Layer 3: membersData for post authors depends on authorProfiles — stays sequential
  const profilesData = authorProfilesResp.data ?? []
  const memberIds = [...new Set(profilesData.map(p => p.member_id).filter(Boolean))] as string[]
  let membersData: { id: string; prenom: string; nom: string }[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase.from('members').select('id, prenom, nom').in('id', memberIds)
    membersData = data ?? []
  }

  const profileMap = Object.fromEntries(profilesData.map(p => [p.id, p]))
  const memberMap = Object.fromEntries(membersData.map(m => [m.id, m]))

  const posts: FeedPost[] = (postsData ?? []).map(p => {
    const raw = p as Record<string, unknown>
    const prof = profileMap[p.author_id]
    const mem = prof?.member_id ? memberMap[prof.member_id] : null
    return {
      id: p.id,
      type: p.type,
      content: raw.content as string | null ?? null,
      image_url: raw.image_url as string | null ?? null,
      image_urls: raw.image_urls as string[] | null ?? null,
      link_url: raw.link_url as string | null ?? null,
      document_url: raw.document_url as string | null ?? null,
      document_name: raw.document_name as string | null ?? null,
      is_pinned: p.is_pinned,
      created_at: p.created_at,
      author_id: p.author_id,
      author_prenom: mem?.prenom ?? 'Membre',
      author_nom: mem?.nom ?? '',
      author_avatar: prof?.avatar_url ?? null,
      likes_count: likesByPost[p.id] ?? 0,
      user_liked: userLikedSet.has(p.id),
      comments_count: commentsByPost[p.id] ?? 0,
    }
  })

  const isAdmin = myProfile?.role === 'admin' || myProfile?.role === 'president'
  const hasBio = !!((myProfile as { bio?: string | null } | null)?.bio?.trim())
  const hasAvatar = !!(myProfile?.avatar_url)
  const caisseMontant = (caisseData as { montant?: number } | null)?.montant ?? null

  return (
    <FeedClient
      posts={posts}
      currentUserId={user.id}
      currentUserAvatar={myProfile?.avatar_url ?? null}
      currentUserName={myMemberName}
      stories={stories}
      isAdmin={isAdmin}
      hasBio={hasBio}
      hasAvatar={hasAvatar}
      caisseMontant={caisseMontant}
    />
  )
}
