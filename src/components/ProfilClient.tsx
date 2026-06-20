'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Camera, Save, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { updateProfile, updateAvatarUrl } from '@/app/profil/actions'
import { createClient } from '@/lib/supabase/client'
import { broadcastSocialEvent } from '@/lib/broadcast'

interface Profile {
  id: string
  role: string | null
  avatar_url: string | null
  bio: string | null
  quote: string | null
  is_public: boolean
  member_id: string | null
}

interface Member {
  prenom: string
  nom: string
  filiere: string | null
  niveau: string | null
}

interface Props {
  profile: Profile | null
  member: Member | null
  userId: string
}

/** Resize an image File to max 400×400 via Canvas, returning a Blob */
async function resizeImage(file: File, maxPx = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not available')); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/jpeg', 0.88)
    }
    img.onerror = reject
    img.src = url
  })
}

export default function ProfilClient({ profile, member, userId }: Props) {
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [quote, setQuote] = useState(profile?.quote ?? '')
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? true)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  // Si le profil est déjà complet (avatar + bio), on marque l'onboarding comme terminé
  useEffect(() => {
    if (profile?.avatar_url && profile?.bio) {
      try { localStorage.setItem('ueemt_onboarding_done', '1') } catch { /* noop */ }
    }
  }, [profile?.avatar_url, profile?.bio])

  const initials = member
    ? `${member.prenom?.[0] ?? ''}${member.nom?.[0] ?? ''}`.toUpperCase()
    : '?'

  // Auto-hide toast after 3s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Taille max : 8 Mo')
      return
    }
    setUploadError(null)
    setUploading(true)

    try {
      // Resize to max 400x400 via Canvas
      const resized = await resizeImage(file, 400)

      const supabase = createClient()
      const path = `${userId}/avatar.jpg`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, resized, { contentType: 'image/jpeg', upsert: true })

      if (error) {
        setUploadError('Upload échoué. Vérifiez que le bucket "avatars" existe dans Supabase.')
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
      // Force cache bust
      const freshUrl = `${publicUrl}?t=${Date.now()}`
      setAvatarUrl(freshUrl)
      startTransition(async () => {
        await updateAvatarUrl(publicUrl)
      })
      setToast('Photo de profil mise à jour !')
    } catch {
      setUploadError('Erreur lors du redimensionnement de l\'image.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const wasProfileEmpty = !profile?.bio
    startTransition(async () => {
      await updateProfile(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)

      // Marquer l'onboarding comme terminé dès que l'utilisateur sauvegarde son profil
      try { localStorage.setItem('ueemt_onboarding_done', '1') } catch { /* noop */ }

      // Broadcast "profile completed" when bio is set for the first time
      const newBio = (fd.get('bio') as string | null)?.trim() ?? ''
      if (wasProfileEmpty && newBio.length > 0 && member) {
        void broadcastSocialEvent('profile_completed', {
          userId,
          prenom: member.prenom,
          avatarUrl: avatarUrl || null,
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/membres" className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Retour aux membres
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mb-6">Mon Profil</h1>

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
          <div className="flex items-center gap-5">
            {/* Avatar with hover overlay */}
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => !uploading && fileRef.current?.click()}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-green-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center text-white text-2xl font-black">
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className={`absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center transition-opacity duration-200 ${
                uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-xs font-medium">Upload…</span>
                  </div>
                ) : (
                  <>
                    <Camera size={18} className="text-white mb-0.5" />
                    <span className="text-white text-xs font-medium">Changer</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <p className="font-bold text-gray-900 text-lg">
                {member ? `${member.prenom} ${member.nom}` : 'Profil'}
              </p>
              {profile?.role && (
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  profile.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {profile.role === 'admin' ? 'Bureau' : 'Membre'}
                </span>
              )}
              {member?.filiere && (
                <p className="text-sm text-gray-400 mt-0.5">{member.filiere}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Cliquer sur la photo pour la changer</p>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          {uploadError && <p className="text-red-500 text-xs mt-3 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>}
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
          <div>
            <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Bio
            </label>
            {!bio && (
              <div className="mb-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700">
                ✏️ Ajoute une courte présentation pour que tes camarades te connaissent mieux !
              </div>
            )}
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              placeholder="Ex : Étudiant en génie civil à GOP, passionné de football et de musique mandingue…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
          </div>

          <div>
            <label htmlFor="quote" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Citation / devise
            </label>
            {!quote && (
              <p className="text-xs text-gray-400 mb-1.5">
                💬 Une phrase qui te représente — proverbe, citation, valeur personnelle.
              </p>
            )}
            <input
              id="quote"
              name="quote"
              type="text"
              value={quote}
              onChange={e => setQuote(e.target.value)}
              maxLength={200}
              placeholder="Ex : « L'éducation est l'arme la plus puissante. » — Mandela"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className={`text-xs mt-1 text-right ${quote.length > 180 ? 'text-orange-500' : 'text-gray-400'} ${quote.length > 195 ? 'text-red-500' : ''}`}>
              {quote.length}/200
            </p>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900">Profil public</p>
              <p className="text-xs text-gray-400 mt-0.5">Visible par les visiteurs sur la page membres</p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {isPublic ? <Eye size={13} /> : <EyeOff size={13} />}
              {isPublic ? 'Visible' : 'Masqué'}
            </button>
            <input type="hidden" name="is_public" value={isPublic.toString()} />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
          >
            <Save size={16} />
            {isPending ? 'Enregistrement…' : saved ? '✓ Enregistré !' : 'Sauvegarder'}
          </button>
        </form>

        {!profile && (
          <p className="mt-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            Aucun profil trouvé. Assure-toi d&apos;être inscrit via le formulaire de recensement.
          </p>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle size={16} className="text-green-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
