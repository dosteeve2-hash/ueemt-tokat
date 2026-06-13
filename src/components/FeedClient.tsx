'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Megaphone, Send, Loader2 } from 'lucide-react'
import { createPost, deletePost, toggleLike } from '@/app/feed/actions'
import type { FeedPost } from '@/app/feed/page'

interface Props {
  posts: FeedPost[]
  currentUserId: string
  currentUserAvatar: string | null
  currentUserName: { prenom: string; nom: string }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const AVATAR_COLORS = ['bg-green-600', 'bg-yellow-500', 'bg-teal-600', 'bg-blue-600', 'bg-purple-600']

function Avatar({ name, avatar, size = 10, colorIdx = 0 }: { name: string; avatar: string | null; size?: number; colorIdx?: number }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  if (avatar) return <img src={avatar} alt={name} className={`${cls} object-cover`} />
  return (
    <div className={`${cls} ${AVATAR_COLORS[colorIdx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
      {initials}
    </div>
  )
}

export default function FeedClient({ posts: initialPosts, currentUserId, currentUserAvatar, currentUserName }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
  const [likedSet, setLikedSet] = useState<Set<string>>(
    new Set(initialPosts.filter(p => p.user_liked).map(p => p.id))
  )
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(initialPosts.map(p => [p.id, p.likes_count]))
  )
  const [newContent, setNewContent] = useState('')
  const [isPosting, startPostTransition] = useTransition()
  const [, startDeleteTransition] = useTransition()
  const [, startLikeTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const myName = `${currentUserName.prenom} ${currentUserName.nom}`.trim() || 'Moi'

  const handlePost = () => {
    if (!newContent.trim() || isPosting) return
    const content = newContent.trim()
    const optimisticPost: FeedPost = {
      id: `temp-${Date.now()}`,
      type: 'post',
      content,
      image_url: null,
      is_pinned: false,
      created_at: new Date().toISOString(),
      author_id: currentUserId,
      author_prenom: currentUserName.prenom,
      author_nom: currentUserName.nom,
      author_avatar: currentUserAvatar,
      likes_count: 0,
      user_liked: false,
    }
    setPosts(prev => [optimisticPost, ...prev])
    setLikeCounts(prev => ({ ...prev, [optimisticPost.id]: 0 }))
    setNewContent('')

    startPostTransition(async () => {
      try {
        await createPost(content)
        router.refresh()
      } catch {
        setPosts(prev => prev.filter(p => p.id !== optimisticPost.id))
      }
    })
  }

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    startDeleteTransition(async () => {
      try {
        await deletePost(postId)
      } catch {
        router.refresh()
      }
    })
  }

  const handleLike = (postId: string) => {
    const isLiked = likedSet.has(postId)
    const newSet = new Set(likedSet)
    if (isLiked) {
      newSet.delete(postId)
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] ?? 1) - 1) }))
    } else {
      newSet.add(postId)
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }))
    }
    setLikedSet(newSet)
    startLikeTransition(async () => { await toggleLike(postId) })
  }

  const pinnedPosts = posts.filter(p => p.is_pinned)
  const regularPosts = posts.filter(p => !p.is_pinned)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-1">Espace membres</p>
          <h1 className="text-3xl font-black">Fil d&apos;actualité</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Composer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex gap-3">
            <Avatar name={myName} avatar={currentUserAvatar} size={10} colorIdx={0} />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost()
                }}
                placeholder="Partage quelque chose avec tes camarades…"
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">{newContent.length}/2000 · Ctrl+Entrée pour publier</p>
                <button
                  onClick={handlePost}
                  disabled={!newContent.trim() || isPosting}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned announcements */}
        {pinnedPosts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            liked={likedSet.has(post.id)}
            likeCount={likeCounts[post.id] ?? post.likes_count}
            isOwn={post.author_id === currentUserId}
            colorIdx={i}
            onLike={() => handleLike(post.id)}
            onDelete={() => handleDelete(post.id)}
            pinned
          />
        ))}

        {/* Regular posts */}
        {regularPosts.length === 0 && pinnedPosts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
            <p className="text-lg font-medium">Aucune publication pour le moment.</p>
            <p className="text-sm mt-1">Sois le premier à partager quelque chose !</p>
          </div>
        )}

        {regularPosts.map((post, i) => (
          <PostCard
            key={post.id}
            post={post}
            liked={likedSet.has(post.id)}
            likeCount={likeCounts[post.id] ?? post.likes_count}
            isOwn={post.author_id === currentUserId}
            colorIdx={i + pinnedPosts.length}
            onLike={() => handleLike(post.id)}
            onDelete={() => handleDelete(post.id)}
            pinned={false}
          />
        ))}
      </div>
    </div>
  )
}

function PostCard({
  post,
  liked,
  likeCount,
  isOwn,
  colorIdx,
  onLike,
  onDelete,
  pinned,
}: {
  post: FeedPost
  liked: boolean
  likeCount: number
  isOwn: boolean
  colorIdx: number
  onLike: () => void
  onDelete: () => void
  pinned: boolean
}) {
  const authorName = `${post.author_prenom} ${post.author_nom}`.trim() || 'Membre'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      pinned ? 'border-green-200' : 'border-gray-100'
    }`}>
      {pinned && (
        <div className="bg-green-600 text-white text-xs font-semibold px-4 py-1.5 flex items-center gap-1.5">
          <Megaphone size={12} /> Annonce du bureau
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={authorName} avatar={post.author_avatar} size={9} colorIdx={colorIdx} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{authorName}</p>
            <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
          </div>
          {isOwn && (
            <button
              onClick={onDelete}
              className="text-gray-300 hover:text-red-500 transition-colors p-1"
              aria-label="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {post.content && (
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        )}

        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="mt-3 rounded-xl w-full object-cover max-h-80"
            loading="lazy"
          />
        )}

        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
            }`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">{likeCount > 0 ? likeCount : ''}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
