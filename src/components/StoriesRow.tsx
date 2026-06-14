'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createStory, deleteStory } from '@/app/feed/stories-actions'
import { createClient } from '@/lib/supabase/client'
import type { StoryData } from '@/app/feed/stories-actions'

const BG_OPTIONS = [
  { label: 'Navy', value: '#0F1C3F', text: '#FFFFFF' },
  { label: 'Or', value: '#D4AF37', text: '#0F1C3F' },
  { label: 'Vert', value: '#14A44D', text: '#FFFFFF' },
  { label: 'Rouge', value: '#EF4444', text: '#FFFFFF' },
  { label: 'Violet', value: '#7C3AED', text: '#FFFFFF' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "il y a quelques min"
  return `il y a ${h}h`
}

const AVATAR_COLORS = ['bg-green-600', 'bg-yellow-500', 'bg-teal-600', 'bg-blue-600', 'bg-purple-600']

function StoryAvatar({ name, avatar, idx }: { name: string; avatar: string | null; idx: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatar) return <img src={avatar} alt={name} className="w-full h-full object-cover rounded-full" />
  return (
    <div className={`w-full h-full rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold`}>
      {initials}
    </div>
  )
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────
function StoryViewer({
  stories,
  startIndex,
  onClose,
  isAdmin,
  currentUserId,
}: {
  stories: StoryData[]
  startIndex: number
  onClose: () => void
  isAdmin: boolean
  currentUserId: string
}) {
  const [idx, setIdx] = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const story = stories[idx]

  const next = useCallback(() => {
    if (idx < stories.length - 1) {
      setIdx(i => i + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }, [idx, stories.length, onClose])

  const prev = () => {
    if (idx > 0) {
      setIdx(i => i - 1)
      setProgress(0)
    }
  }

  useEffect(() => {
    setProgress(0)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          next()
          return 0
        }
        return p + 2
      })
    }, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [idx, next])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [next, onClose])

  const handleDelete = async () => {
    await deleteStory(story.id)
    onClose()
  }

  if (!story) return null

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-sm h-[80vh] max-h-[680px] rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-3 right-3 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white">
              <StoryAvatar name={`${story.author_prenom} ${story.author_nom}`} avatar={story.author_avatar} idx={0} />
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">{story.author_prenom} {story.author_nom}</p>
              <p className="text-white/60 text-[10px]">{timeAgo(story.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && story.author_id === currentUserId && (
              <button
                onClick={handleDelete}
                className="text-white/70 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Supprimer la story"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: story.bg_color }}
        >
          {story.image_url ? (
            <img
              src={story.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="px-8 text-center">
              <p
                className="text-2xl font-bold leading-snug"
                style={{ color: story.text_color }}
              >
                {story.text}
              </p>
            </div>
          )}
          {story.text && story.image_url && (
            <div className="absolute bottom-16 left-4 right-4 bg-black/50 rounded-xl px-4 py-2 text-center">
              <p className="text-white text-sm font-medium">{story.text}</p>
            </div>
          )}
        </div>

        {/* Navigation zones */}
        <button
          onClick={prev}
          className="absolute left-0 top-0 w-1/3 h-full z-20 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
          aria-label="Story précédente"
        >
          <ChevronLeft size={28} className="text-white/80 bg-black/30 rounded-full p-1" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-0 w-2/3 h-full z-20 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
          aria-label="Story suivante"
        >
          <ChevronRight size={28} className="text-white/80 bg-black/30 rounded-full p-1" />
        </button>
      </div>
    </div>
  )
}

// ─── Create Story Modal ───────────────────────────────────────────────────────
function CreateStoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [text, setText] = useState('')
  const [bgColor, setBgColor] = useState('#0F1C3F')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const selectBg = (value: string, textVal: string) => {
    setBgColor(value)
    setTextColor(textVal)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async () => {
    if (!text.trim() && !imageFile) { setError('Ajoute du texte ou une image'); return }
    setLoading(true)
    setError('')
    try {
      let imageUrl: string | undefined
      if (imageFile) {
        const supabase = createClient()
        const path = `stories/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const { error: uploadErr } = await supabase.storage
          .from('photos')
          .upload(path, imageFile, { contentType: imageFile.type })
        if (!uploadErr) {
          imageUrl = supabase.storage.from('photos').getPublicUrl(path).data.publicUrl
        }
      }
      await createStory({ imageUrl, text: text || undefined, bgColor, textColor })
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">Créer une story</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preview */}
          <div
            className="w-full h-40 rounded-xl flex items-center justify-center overflow-hidden transition-colors"
            style={{ backgroundColor: bgColor }}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <p className="text-center font-bold px-4 leading-snug" style={{ color: textColor, fontSize: '1rem' }}>
                {text || 'Aperçu de ta story'}
              </p>
            )}
          </div>

          {/* Text */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ton message (optionnel si image)"
            rows={2}
            maxLength={200}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />

          {/* Background colors */}
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2 font-medium">Couleur de fond</p>
            <div className="flex gap-2 flex-wrap">
              {BG_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => selectBg(opt.value, opt.text)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === opt.value ? 'border-green-500 scale-110' : 'border-gray-200 dark:border-slate-600'}`}
                  style={{ backgroundColor: opt.value }}
                  aria-label={opt.label}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* Image upload */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl transition-colors"
            >
              <Plus size={14} /> Ajouter une image
            </button>
            {imageFile && (
              <button
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Retirer
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Publier la story
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── StoriesRow ───────────────────────────────────────────────────────────────
interface Props {
  stories: StoryData[]
  isAdmin: boolean
  currentUserId: string
}

export default function StoriesRow({ stories: initialStories, isAdmin, currentUserId }: Props) {
  const [stories, setStories] = useState(initialStories)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const handleCreated = () => {
    // Refresh page to get new story
    window.location.reload()
  }

  if (stories.length === 0 && !isAdmin) return null

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {/* Create button for admins */}
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              aria-label="Créer une story"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 border-2 border-dashed border-green-400 flex items-center justify-center group-hover:border-green-600 transition-colors">
                <Plus size={20} className="text-green-600" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium w-14 text-center truncate">
                Story
              </span>
            </button>
          )}

          {/* Story bubbles */}
          {stories.map((story, i) => {
            const name = `${story.author_prenom} ${story.author_nom}`.trim() || 'UEEMT'
            return (
              <button
                key={story.id}
                onClick={() => setViewerIndex(i)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
                aria-label={`Story de ${name}`}
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[#0F1C3F] via-[#D4AF37] to-[#14A44D]">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-slate-900">
                    {story.image_url ? (
                      <img src={story.image_url} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: story.bg_color }}
                      >
                        <span className="text-xs font-bold px-1 text-center leading-tight" style={{ color: story.text_color }}>
                          {(story.text ?? '').slice(0, 12)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-gray-600 dark:text-slate-400 font-medium w-14 text-center truncate">
                  {story.author_prenom}
                </span>
              </button>
            )
          })}

          {stories.length === 0 && isAdmin && (
            <p className="text-sm text-gray-400 dark:text-slate-500 ml-2">
              Aucune story active — publie la première !
            </p>
          )}
        </div>
      </div>

      {viewerIndex !== null && (
        <StoryViewer
          stories={stories}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      )}

      {showCreate && (
        <CreateStoryModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
