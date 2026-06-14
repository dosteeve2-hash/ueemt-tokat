'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Trash2, Megaphone, Send, Loader2, MessageCircle, ChevronDown, ChevronUp, ImagePlus, X, Share2, Check, Paperclip, FileText, FileSpreadsheet, Presentation, File } from 'lucide-react'
import { createPost, deletePost, toggleLike, addComment, deleteComment, getCommentsWithAuthors } from '@/app/feed/actions'
import { createClient } from '@/lib/supabase/client'
import type { FeedPost } from '@/app/feed/page'
import type { PostCommentData } from '@/app/feed/actions'
import type { StoryData } from '@/app/feed/stories-actions'
import StoriesRow from '@/components/StoriesRow'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/hooks/useModal'
import { toast } from '@/lib/toast'

// TODO: Pour les vidéos volumineuses en production, migrer vers Cloudflare R2 (10 GB gratuit)
// au lieu de Supabase Storage (1 GB sur free tier). Voir cloudflare.com/developer-platform/r2/

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov']
const DOC_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.pptx', '.txt']

function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0]
  return VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext))
}

function getDocIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return <FileText size={20} className="text-red-500" />
  if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet size={20} className="text-green-600" />
  if (ext === 'pptx' || ext === 'ppt') return <Presentation size={20} className="text-orange-500" />
  if (ext === 'docx' || ext === 'doc') return <FileText size={20} className="text-blue-600" />
  return <File size={20} className="text-gray-500" />
}

interface Props {
  posts: FeedPost[]
  currentUserId: string
  currentUserAvatar: string | null
  currentUserName: { prenom: string; nom: string }
  stories?: StoryData[]
  isAdmin?: boolean
}

type MediaMode = 'image' | 'video' | 'document' | null

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
  if (avatar) return <img src={avatar} alt={name} loading="lazy" decoding="async" className={`${cls} object-cover`} />
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
function ShareButton({ postId }: { postId: string }) {
  const [copied, setCopied] = useState(false)
  const url = `https://ueemt-tokat.vercel.app/feed#post-${postId}`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'UEEMT-Tokat', url })
        return
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors"
      aria-label="Partager ce post"
    >
      {copied ? <Check size={15} className="text-green-500" /> : <Share2 size={15} />}
      <span className="text-xs font-medium">{copied ? 'Copié !' : 'Partager'}</span>
    </button>
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

        {post.image_url && !isVideoUrl(post.image_url) && (
          <button
            onClick={() => onImageClick(post.image_url!)}
            className="block w-full mt-3 cursor-zoom-in"
            aria-label="Agrandir l'image"
          >
            <img
              src={post.image_url}
              alt=""
              loading="lazy"
              decoding="async"
              className="rounded-xl w-full object-cover max-h-80 hover:opacity-95 transition-opacity"
            />
          </button>
        )}

        {post.image_url && isVideoUrl(post.image_url) && (
          <div className="mt-3 rounded-xl overflow-hidden bg-black">
            <video
              src={post.image_url}
              controls
              muted
              loop
              playsInline
              className="w-full max-h-80 object-contain"
              preload="metadata"
            />
          </div>
        )}

        {post.document_url && post.document_name && (
          <a
            href={post.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:bg-gray-50 transition-colors group"
            aria-label={`Ouvrir ${post.document_name}`}
          >
            <div className="flex-shrink-0">{getDocIcon(post.document_name)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{post.document_name}</p>
              <p className="text-xs text-gray-400">Cliquer pour ouvrir</p>
            </div>
            <Paperclip size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
          </a>
        )}

        <div className="mt-3 flex items-center gap-4">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            <span className="text-xs font-medium">{likeCount > 0 ? likeCount : ''}</span>
          </button>
          <ShareButton postId={post.id} />
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
export default function FeedClient({ posts: initialPosts, currentUserId, currentUserAvatar, currentUserName, stories = [], isAdmin = false }: Props) {
  const router = useRouter()
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts)
  const [likedSet, setLikedSet] = useState<Set<string>>(
    new Set(initialPosts.filter(p => p.user_liked).map(p => p.id))
  )
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(
    Object.fromEntries(initialPosts.map(p => [p.id, p.likes_count]))
  )
  const [isRefreshing, setIsRefreshing] = useState(false)
  const deleteModal = useModal()
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Stale-while-revalidate: quand router.refresh() retourne de nouvelles données,
  // on swap silencieusement sans effacer les anciens posts (les posts temp restent visibles)
  const syncServerData = useCallback((freshPosts: FeedPost[]) => {
    setPosts(prev => {
      const tempPosts = prev.filter(p => p.id.startsWith('temp-'))
      if (tempPosts.length > 0) {
        return [...tempPosts, ...freshPosts.filter(p => !tempPosts.some(t => t.id === p.id))]
      }
      return freshPosts
    })
    setLikeCounts(Object.fromEntries(freshPosts.map(p => [p.id, p.likes_count])))
  }, [])

  const prevIdsRef = useRef<string>(initialPosts.map(p => p.id).join(','))
  useEffect(() => {
    const ids = initialPosts.map(p => p.id).join(',')
    if (ids === prevIdsRef.current) return
    prevIdsRef.current = ids
    syncServerData(initialPosts)
    setIsRefreshing(false)
  }, [initialPosts, syncServerData])
  const [newContent, setNewContent] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null)
  const [mediaMode, setMediaMode] = useState<MediaMode>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isPosting, startPostTransition] = useTransition()
  const [, startDeleteTransition] = useTransition()
  const [, startLikeTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightboxUrl])

  const hasDoubleExtension = (name: string) => /\.[a-z]{2,4}\.[a-z]{2,4}$/i.test(name)

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (hasDoubleExtension(file.name)) {
      setUploadError('Nom de fichier invalide.')
      e.target.value = ''
      return
    }

    if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('Vidéo trop volumineuse (max 50 MB)')
        e.target.value = ''
        return
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['mp4', 'webm', 'mov'].includes(ext)) {
        setUploadError('Format vidéo non supporté (.mp4, .webm, .mov uniquement)')
        e.target.value = ''
        return
      }
      setSelectedMedia(file)
      setMediaMode('video')
      setMediaPreview(URL.createObjectURL(file))
    } else {
      setSelectedMedia(file)
      setMediaMode('image')
      const reader = new FileReader()
      reader.onload = () => setMediaPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (hasDoubleExtension(file.name)) {
      setUploadError('Nom de fichier invalide.')
      e.target.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Document trop volumineux (max 10 MB)')
      e.target.value = ''
      return
    }
    setSelectedMedia(file)
    setMediaMode('document')
    setMediaPreview(null)
  }

  const clearMedia = () => {
    if (mediaPreview && mediaMode === 'video') URL.revokeObjectURL(mediaPreview)
    setSelectedMedia(null)
    setMediaMode(null)
    setMediaPreview(null)
    setUploadError(null)
    setUploadProgress(null)
    if (mediaInputRef.current) mediaInputRef.current.value = ''
    if (docInputRef.current) docInputRef.current.value = ''
  }

  const myName = `${currentUserName.prenom} ${currentUserName.nom}`.trim() || 'Moi'
  const canPost = (newContent.trim().length > 0 || !!selectedMedia) && !isPosting

  const handlePost = () => {
    if (!canPost) return
    const content = newContent.trim()
    const fileToUpload = selectedMedia
    const mode = mediaMode
    const preview = mediaPreview

    const optimisticPost: FeedPost = {
      id: `temp-${Date.now()}`,
      type: 'post',
      content,
      image_url: mode === 'image' ? preview : null,
      document_url: mode === 'document' ? '#' : null,
      document_name: mode === 'document' ? fileToUpload?.name ?? null : null,
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
    clearMedia()

    startPostTransition(async () => {
      try {
        let imageUrl: string | undefined
        let documentUrl: string | undefined
        let documentName: string | undefined

        if (fileToUpload && mode === 'image') {
          const blob = await resizeImage(fileToUpload)
          const supabase = createClient()
          const path = `posts/${currentUserId}/${Date.now()}.jpg`
          const { error: uploadErr } = await supabase.storage
            .from('photos')
            .upload(path, blob, { contentType: 'image/jpeg' })
          if (!uploadErr) {
            imageUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
          }
        } else if (fileToUpload && mode === 'video') {
          const supabase = createClient()
          const ext = fileToUpload.name.split('.').pop()?.toLowerCase() ?? 'mp4'
          const path = `posts/${currentUserId}/${Date.now()}.${ext}`
          setUploadProgress(0)
          const { error: uploadErr } = await supabase.storage
            .from('photos')
            .upload(path, fileToUpload, { contentType: fileToUpload.type, upsert: false })
          setUploadProgress(null)
          if (!uploadErr) {
            imageUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
          }
        } else if (fileToUpload && mode === 'document') {
          const supabase = createClient()
          const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const path = `${currentUserId}/${Date.now()}_${safeName}`
          const { error: uploadErr } = await supabase.storage
            .from('documents')
            .upload(path, fileToUpload, { contentType: fileToUpload.type, upsert: false })
          if (!uploadErr) {
            documentUrl = supabase.storage.from('documents').getPublicUrl(path).data.publicUrl
            documentName = fileToUpload.name
          }
        }

        await createPost(content, imageUrl, documentUrl, documentName)
        setIsRefreshing(true)
        router.refresh()
        toast.success('Post publié !', 'Ton post est visible par tous les membres.')
      } catch {
        setPosts(prev => prev.filter(p => p.id !== optimisticPost.id))
        toast.error('Publication échouée', 'Vérifie ta connexion et réessaie.')
      }
    })
  }

  const openDeleteModal = (postId: string) => {
    setPostToDelete(postId)
    deleteModal.open()
  }

  const confirmDelete = async () => {
    if (!postToDelete) return
    const id = postToDelete
    setIsDeleting(true)
    setPosts(prev => prev.filter(p => p.id !== id))
    deleteModal.close()
    setPostToDelete(null)
    startDeleteTransition(async () => {
      try {
        await deletePost(id)
        toast.success('Post supprimé')
      } catch {
        toast.error('Erreur lors de la suppression', 'Réessaie dans un instant.')
        router.refresh()
      } finally {
        setIsDeleting(false)
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
    startLikeTransition(async () => {
      try {
        await toggleLike(postId)
      } catch {
        toast.error('Impossible de liker pour l\'instant', 'Vérifie ta connexion.')
        setLikedSet(prev => {
          const s = new Set(prev)
          if (isLiked) s.add(postId); else s.delete(postId)
          return s
        })
        setLikeCounts(prev => ({
          ...prev,
          [postId]: isLiked ? (prev[postId] ?? 0) + 1 : Math.max(0, (prev[postId] ?? 1) - 1),
        }))
      }
    })
  }

  const pinnedPosts = posts.filter(p => p.is_pinned)
  const regularPosts = posts.filter(p => !p.is_pinned)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-12 relative overflow-hidden">
        {isRefreshing && (
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/20">
            <div className="h-full bg-white/70 animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-1">Espace membres</p>
          <h1 className="text-3xl font-black">Fil d&apos;actualité</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Stories */}
        {(stories.length > 0 || isAdmin) && (
          <StoriesRow stories={stories} isAdmin={isAdmin} currentUserId={currentUserId} />
        )}

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
              {mediaPreview && mediaMode === 'image' && (
                <div className="relative mt-2 inline-block">
                  <img
                    src={mediaPreview}
                    alt="Aperçu"
                    className="max-h-40 rounded-xl object-cover border border-gray-200"
                  />
                  <button
                    onClick={clearMedia}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    aria-label="Supprimer l'image"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Video preview */}
              {mediaPreview && mediaMode === 'video' && (
                <div className="relative mt-2 rounded-xl overflow-hidden bg-black border border-gray-200">
                  <video
                    src={mediaPreview}
                    muted
                    playsInline
                    controls
                    className="max-h-40 w-full object-contain"
                  />
                  <button
                    onClick={clearMedia}
                    className="absolute top-1 right-1 bg-gray-800/80 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    aria-label="Supprimer la vidéo"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Document preview */}
              {mediaMode === 'document' && selectedMedia && (
                <div className="mt-2 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <div className="flex-shrink-0">{getDocIcon(selectedMedia.name)}</div>
                  <span className="text-sm text-gray-700 truncate flex-1">{selectedMedia.name}</span>
                  <button
                    onClick={clearMedia}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Supprimer le document"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Upload progress bar */}
              {uploadProgress !== null && (
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-300 animate-pulse"
                    style={{ width: '80%' }}
                  />
                </div>
              )}

              {uploadError && (
                <p className="mt-1 text-xs text-red-500">{uploadError}</p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-400 mr-1">{newContent.length}/2000</p>
                  <button
                    type="button"
                    onClick={() => { if (!mediaMode) mediaInputRef.current?.click() }}
                    disabled={!!mediaMode}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Ajouter une photo ou vidéo"
                    title="Photo / Vidéo (max 50 MB)"
                  >
                    <ImagePlus size={15} />
                    <span>Média</span>
                  </button>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    onChange={handleMediaSelect}
                    className="hidden"
                    aria-label="Sélectionner une image ou vidéo"
                  />
                  <button
                    type="button"
                    onClick={() => { if (!mediaMode) docInputRef.current?.click() }}
                    disabled={!!mediaMode}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Ajouter un document"
                    title="Document PDF/DOCX/XLSX (max 10 MB)"
                  >
                    <Paperclip size={15} />
                    <span>Document</span>
                  </button>
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.pptx,.txt"
                    onChange={handleDocSelect}
                    className="hidden"
                    aria-label="Sélectionner un document"
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
            onDelete={() => openDeleteModal(post.id)}
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
            onDelete={() => openDeleteModal(post.id)}
            onImageClick={setLightboxUrl}
            pinned={false}
            currentUserId={currentUserId}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
          />
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        title="Supprimer ce post ?"
        description="Cette action est irréversible. Le post et ses commentaires seront définitivement supprimés."
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={isDeleting}
      />

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
