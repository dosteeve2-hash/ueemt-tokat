'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createPost(content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')
  if (!content.trim()) throw new Error('Post vide')

  const { error } = await supabase.from('posts').insert({
    content: content.trim().slice(0, 2000),
    author_id: user.id,
    type: 'post',
  })
  if (error) throw new Error(error.message)

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
  if (error) throw new Error(error.message)
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
  }
}
