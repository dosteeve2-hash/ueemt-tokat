import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedClient from '@/components/FeedClient'
import { getActiveStories } from './stories-actions'

export type FeedPost = {
  id: string
  type: string
  content: string | null
  image_url: string | null
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

  // Current user profile for the composer
  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('id, avatar_url, member_id, role')
    .eq('id', user.id)
    .maybeSingle()

  let myMemberName = { prenom: '', nom: '' }
  if (myProfile?.member_id) {
    const { data } = await supabase
      .from('members')
      .select('prenom, nom')
      .eq('id', myProfile.member_id)
      .single()
    if (data) myMemberName = data
  }

  // Posts
  const { data: postsData } = await supabase
    .from('posts')
    .select('id, type, content, image_url, document_url, document_name, is_pinned, created_at, author_id')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const postIds = (postsData ?? []).map(p => p.id)

  // Likes
  let likesData: { post_id: string; user_id: string }[] = []
  if (postIds.length > 0) {
    const { data } = await supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds)
    likesData = data ?? []
  }

  const likesByPost: Record<string, number> = {}
  const userLikedSet = new Set<string>()
  for (const like of likesData) {
    likesByPost[like.post_id] = (likesByPost[like.post_id] ?? 0) + 1
    if (like.user_id === user.id) userLikedSet.add(like.post_id)
  }

  // Comment counts — graceful if table doesn't exist yet
  const commentsByPost: Record<string, number> = {}
  try {
    if (postIds.length > 0) {
      const { data: commentsCountData } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds)
      for (const c of commentsCountData ?? []) {
        commentsByPost[c.post_id] = (commentsByPost[c.post_id] ?? 0) + 1
      }
    }
  } catch { /* post_comments not yet migrated */ }

  // Author info
  const authorIds = [...new Set((postsData ?? []).map(p => p.author_id))]
  let profilesData: { id: string; avatar_url: string | null; member_id: string | null }[] = []
  if (authorIds.length > 0) {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, avatar_url, member_id')
      .in('id', authorIds)
    profilesData = data ?? []
  }

  const memberIds = [...new Set(profilesData.map(p => p.member_id).filter(Boolean))] as string[]
  let membersData: { id: string; prenom: string; nom: string }[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('members')
      .select('id, prenom, nom')
      .in('id', memberIds)
    membersData = data ?? []
  }

  const profileMap = Object.fromEntries(profilesData.map(p => [p.id, p]))
  const memberMap = Object.fromEntries(membersData.map(m => [m.id, m]))

  const posts: FeedPost[] = (postsData ?? []).map(p => {
    const prof = profileMap[p.author_id]
    const mem = prof?.member_id ? memberMap[prof.member_id] : null
    return {
      ...p,
      document_url: p.document_url ?? null,
      document_name: p.document_name ?? null,
      author_prenom: mem?.prenom ?? 'Membre',
      author_nom: mem?.nom ?? '',
      author_avatar: prof?.avatar_url ?? null,
      likes_count: likesByPost[p.id] ?? 0,
      user_liked: userLikedSet.has(p.id),
      comments_count: commentsByPost[p.id] ?? 0,
    }
  })

  const stories = await getActiveStories().catch(() => [])
  const isAdmin = myProfile?.role === 'admin'

  return (
    <FeedClient
      posts={posts}
      currentUserId={user.id}
      currentUserAvatar={myProfile?.avatar_url ?? null}
      currentUserName={myMemberName}
      stories={stories}
      isAdmin={isAdmin}
    />
  )
}
