'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { Camera, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { updateProfile, updateAvatarUrl } from '@/app/profil/actions'
import { createClient } from '@/lib/supabase/client'

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

export default function ProfilClient({ profile, member, userId }: Props) {
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [quote, setQuote] = useState(profile?.quote ?? '')
  const [isPublic, setIsPublic] = useState(profile?.is_public ?? true)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = member
    ? `${member.prenom?.[0] ?? ''}${member.nom?.[0] ?? ''}`.toUpperCase()
    : '?'

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Taille max : 2 Mo')
      return
    }
    setUploadError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar.${ext}`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (error) {
        setUploadError('Upload échoué. Crée le bucket "avatars" dans Supabase Dashboard (public).')
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(data.path)
      setAvatarUrl(publicUrl)
      startTransition(async () => { await updateAvatarUrl(publicUrl) })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateProfile(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
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
            <div className="relative flex-shrink-0">
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
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full p-1.5 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                aria-label="Changer la photo"
              >
                <Camera size={14} />
              </button>
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
              {uploading && <p className="text-xs text-green-600 mt-1">Upload en cours…</p>}
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
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              placeholder="Quelques mots sur toi, ta filière, tes centres d'intérêt…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
          </div>

          <div>
            <label htmlFor="quote" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Citation / devise
            </label>
            <input
              id="quote"
              name="quote"
              type="text"
              value={quote}
              onChange={e => setQuote(e.target.value)}
              maxLength={200}
              placeholder="Ta citation préférée ou ta devise…"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
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
    </div>
  )
}
