'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { insertNotification, getAdminUserIds } from '@/app/notifications/actions'

export type PostCommentData = {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  author_prenom: string
  author_nom: string
  author_avatar: string | null
}

export async function createPost(
  content: string,
  imageUrl?: string,
  documentUrl?: string,
  documentName?: string,
  imageUrls?: string[],
  linkUrl?: string,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  const trimmedContent = content.trim()
  const hasMedia = imageUrl || documentUrl || (imageUrls && imageUrls.length > 0) || linkUrl
  if (!trimmedContent && !hasMedia) throw new Error('Post vide')

  const { data: newPost, error } = await supabase.from('posts').insert({
    content: trimmedContent.slice(0, 2000),
    author_id: user.id,
    type: 'post',
    ...(imageUrl ? { image_url: imageUrl } : {}),
    ...(imageUrls && imageUrls.length > 0 ? { image_urls: imageUrls } : {}),
    ...(linkUrl ? { link_url: linkUrl } : {}),
    ...(documentUrl ? { document_url: documentUrl, document_name: documentName ?? null } : {}),
  }).select('id, type, is_pinned').single()
  if (error) {
    console.error('[createPost]', error.code)
    throw new Error('Impossible de publier le post. Réessaie.')
  }

  // Notify admins if it's a pinned/announcement post
  if (newPost?.is_pinned) {
    const adminIds = await getAdminUserIds().catch(() => [])
    for (const adminId of adminIds) {
      insertNotification({ userId: adminId, type: 'new_post', actorId: user.id, postId: newPost.id }).catch(() => {})
    }
  }

  // Fire-and-forget push notification
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ueemt-tokat.vercel.app'
  fetch(`${siteUrl}/api/notify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'UEEMT-Tokat',
      message: 'Nouveau post dans le fil d\'actu',
      url: '/feed',
    }),
  }).catch(() => {})
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)
  if (error) {
    console.error('[deletePost]', error.code)
    throw new Error('Impossible de supprimer le post.')
  }
}

export async function toggleLike(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id)
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
    // Notify post author
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single()
    if (post?.author_id) {
      insertNotification({ userId: post.author_id, type: 'like', actorId: user.id, postId }).catch(() => {})
    }
  }
}

export async function addComment(postId: string, content: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const trimmed = content.trim().slice(0, 500)
  if (!trimmed) throw new Error('Commentaire vide')

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, author_id: user.id, content: trimmed })
    .select('id')
    .single()

  if (error) {
    console.error('[addComment]', error.code)
    throw new Error('Impossible d\'ajouter le commentaire.')
  }

  // Notify post author
  const { data: post } = await supabase
    .from('posts')
    .select('author_id, content')
    .eq('id', postId)
    .single()
  if (post?.author_id) {
    insertNotification({ userId: post.author_id, type: 'comment', actorId: user.id, postId }).catch(() => {})
  }

  return data.id
}

export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) {
    console.error('[deleteComment]', error.code)
    throw new Error('Impossible de supprimer le commentaire.')
  }
}

export async function getCommentsWithAuthors(postId: string): Promise<PostCommentData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: comments, error } = await supabase
    .from('post_comments')
    .select('id, content, created_at, author_id')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error || !comments?.length) return []

  const authorIds = [...new Set(comments.map(c => c.author_id))]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, avatar_url, member_id')
    .in('id', authorIds)

  const memberIds = [...new Set((profiles ?? []).map(p => p.member_id).filter(Boolean))] as string[]
  let membersData: { id: string; prenom: string; nom: string }[] = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('members')
      .select('id, prenom, nom')
      .in('id', memberIds)
    membersData = data ?? []
  }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const memberMap = Object.fromEntries(membersData.map(m => [m.id, m]))

  return comments.map(c => {
    const prof = profileMap[c.author_id]
    const mem = prof?.member_id ? memberMap[prof.member_id] : null
    return {
      id: c.id,
      post_id: postId,
      author_id: c.author_id,
      content: c.content,
      created_at: c.created_at,
      author_prenom: mem?.prenom ?? 'Membre',
      author_nom: mem?.nom ?? '',
      author_avatar: prof?.avatar_url ?? null,
    }
  })
}
