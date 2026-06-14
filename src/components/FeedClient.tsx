'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Megaphone, Send, Loader2, MessageCircle, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react'
import { createPost, deletePost, toggleLike, addComment, deleteComment, getCommentsWithAuthors } from '@/app/feed/actions'
import { createClient } from '@/lib/supabase/client'
import type { FeedPost } from '@/app/feed/page'
import type { PostCommentData } from '@/app/feed/actions'

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

async function resizeImage(file: File, maxPx = 1080): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}

// ─── Comment Section (lazy-loaded) ──────────────────────────────────────────
function CommentSection({
  postId,
  initialCount,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  colorIdx,
}: {
  postId: string
  initialCount: number
  currentUserId: string
  currentUserAvatar: string | null
  currentUserName: { prenom: string; nom: string }
  colorIdx: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<PostCommentData[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const myName = `${currentUserName.prenom} ${currentUserName.nom}`.trim() || 'Moi'

  const loadComments = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const data = await getCommentsWithAuthors(postId)
      setComments(data)
      setLoaded(true)
    } catch {
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = () => {
    if (!expanded) loadComments()
    setExpanded(e => !e)
  }

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return
    const content = newComment.trim()
    const optimisticId = `tmp-${Date.now()}`
    const optimistic: PostCommentData = {
      id: optimisticId,
      post_id: postId,
      author_id: currentUserId,
      content,
      created_at: new Date().toISOString(),
      author_prenom: currentUserName.prenom,
      author_nom: currentUserName.nom,
      author_avatar: currentUserAvatar,
    }
    setComments(prev => [...prev, optimistic])
    setCount(c => c + 1)
    setNewComment('')
    setSubmitting(true)
    try {
      const realId = await addComment(postId, content)
      setComments(prev => prev.map(c => c.id === optimisticId ? { ...c, id: realId } : c))
    } catch {
      setComments(prev => prev.filter(c => c.id !== optimisticId))
      setCount(c => Math.max(0, c - 1))
      setNewComment(content)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    setCount(c => Math.max(0, c - 1))
    try {
      await deleteComment(commentId)
    } catch {
      loadComments()
    }
  }

  return (
    <div className="border-t border-gray-50 mt-3 pt-3">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors"
      >
        <MessageCircle size={15} />
        <span className="text-xs font-medium">
          {count > 0 ? `${count} commentaire${count > 1 ? 's' : ''}` : 'Commenter'}
        </span>
        {count > 0 && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {loading && (
            <div className="flex justify-center py-2">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          )}

          {!loading && loaded && comments.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">
              💬 Sois le premier à commenter !
            </p>
          )}

          {comments.map((comment, ci) => {
            const name = `${comment.author_prenom} ${comment.author_nom}`.trim() || 'Membre'
            const isOwn = comment.author_id === currentUserId
            return (
              <div key={comment.id} className="flex gap-2.5 group/comment">
                <Avatar name={name} avatar={comment.author_avatar} size={7} colorIdx={(colorIdx + ci) % 5} />
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-50 rounded-xl px-3 py-2">
                    <p className="text-xs font-semibold text-gray-800">{name}</p>
                    <p className="text-sm text-gray-700 leading-snug break-words">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 px-1">
                    <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/comment:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex gap-2.5 pt-1">
            <Avatar name={myName} avatar={currentUserAvatar} size={7} colorIdx={colorIdx} />
            <div className="flex-1 flex items-end gap-2">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="Ajouter un commentaire…"
                rows={1}
                maxLength={500}
                style={{ minHeight: '36px', maxHeight: '96px' }}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl transition-colors disabled:opacity-40"
                aria-label="Envoyer"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PostCard ────────────────────────────────────────────────────────────────
function PostCard({
  post,
  liked,
  likeCount,
  isOwn,
  colorIdx,
  onLike,
  onDelete,
  onImageClick,
  pinned,
  currentUserId,
  currentUserAvatar,
  currentUserName,
}: {
  post: FeedPost
  liked: boolean
  likeCount: number
  isOwn: boolean
  colorIdx: number
  onLike: () => void
  onDelete: () => void
  onImageClick: (url: string) => void
  pinned: boolean
  currentUserId: string
  currentUserAvatar: string | null
  currentUserName: { prenom: string; nom: string }
}) {
  const authorName = `${post.author_prenom} ${post.author_nom}`.trim() || 'Membre'

  return (
    <div
      id={`post-${post.id}`}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${pinned ? 'border-green-200' : 'border-gray-100'}`}
    >
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
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors p-1" aria-label="Supprimer">
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {post.content && (
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
        )}

        {post.image_url && (
          <button
            onClick={() => onImageClick(post.image_url!)}
            className="block w-full mt-3 cursor-zoom-in"
            aria-label="Agrandir l'image"
          >
            <img
              src={post.image_url}
              alt=""
              className="rounded-xl w-full object-cover max-h-80 hover:opacity-95 transition-opacity"
              loading="lazy"
            />
          </button>
        )}

        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">{likeCount > 0 ? likeCount : ''}</span>
          </button>
        </div>

        <CommentSection
          postId={post.id}
          initialCount={post.comments_count}
          currentUserId={currentUserId}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
          colorIdx={colorIdx}
        />
      </div>
    </div>
  )
}

// ─── FeedClient ──────────────────────────────────────────────────────────────
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
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isPosting, startPostTransition] = useTransition()
  const [, startDeleteTransition] = useTransition()
  const [, startLikeTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxUrl])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const myName = `${currentUserName.prenom} ${currentUserName.nom}`.trim() || 'Moi'
  const canPost = (newContent.trim().length > 0 || !!selectedImage) && !isPosting

  const handlePost = () => {
    if (!canPost) return
    const content = newContent.trim()
    const fileToUpload = selectedImage
    const preview = imagePreview

    const optimisticPost: FeedPost = {
      id: `temp-${Date.now()}`,
      type: 'post',
      content,
      image_url: preview,
      is_pinned: false,
      created_at: new Date().toISOString(),
      author_id: currentUserId,
      author_prenom: currentUserName.prenom,
      author_nom: currentUserName.nom,
      author_avatar: currentUserAvatar,
      likes_count: 0,
      user_liked: false,
      comments_count: 0,
    }
    setPosts(prev => [optimisticPost, ...prev])
    setLikeCounts(prev => ({ ...prev, [optimisticPost.id]: 0 }))
    setNewContent('')
    clearImage()

    startPostTransition(async () => {
      try {
        let imageUrl: string | undefined
        if (fileToUpload) {
          const blob = await resizeImage(fileToUpload)
          const supabase = createClient()
          const path = `posts/${currentUserId}/${Date.now()}.jpg`
          const { error: uploadErr } = await supabase.storage
            .from('photos')
            .upload(path, blob, { contentType: 'image/jpeg' })
          if (!uploadErr) {
            imageUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
          }
        }
        await createPost(content, imageUrl)
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

              {/* Image preview */}
              {imagePreview && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="max-h-40 rounded-xl object-cover border border-gray-200"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    aria-label="Supprimer l'image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">{newContent.length}/2000 · Ctrl+Entrée pour publier</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50"
                    aria-label="Ajouter une photo"
                  >
                    <ImagePlus size={15} />
                    <span>Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    aria-label="Sélectionner une image"
                  />
                </div>
                <button
                  onClick={handlePost}
                  disabled={!canPost}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Publier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned posts */}
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
            onImageClick={setLightboxUrl}
            pinned
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
          />
        ))}

        {/* Empty state */}
        {regularPosts.length === 0 && pinnedPosts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center shadow-sm">
            <div className="text-5xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sois le premier à partager !</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
              Partage un souvenir, une pensée, un moment fort avec tes camarades de l&apos;UEEMT-Tokat.
            </p>
            <button
              onClick={() => textareaRef.current?.focus()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              ✍️ Créer le premier post
            </button>
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
            onImageClick={setLightboxUrl}
            pinned={false}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
          />
        ))}
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image agrandie"
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 rounded-lg bg-black/30"
            onClick={() => setLightboxUrl(null)}
            aria-label="Fermer"
          >
            <X size={22} />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-full max-h-full object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
