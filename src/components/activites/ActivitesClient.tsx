'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Image as ImageIcon, FolderOpen, ArrowRight, Plus, X, Upload, Loader2 } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'
import { createClient } from '@/lib/supabase/client'
import { createAlbum, createActivity } from '@/app/activites/actions'

interface Album {
  id: string
  titre: string
  description: string | null
  cover_url: string | null
  created_at: string
  photos: { count: number }[] | null
}

interface Activity {
  id: string
  titre: string
  description: string | null
  date: string | null
  instagram_url: string | null
  created_at: string
}

interface Props {
  albums: Album[]
  activities: Activity[]
  isAdmin: boolean
  userId: string | null
}

const COVER_GRADIENTS = [
  'from-green-600 to-green-800',
  'from-yellow-500 to-amber-600',
  'from-red-600 to-red-800',
  'from-teal-600 to-green-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
]

function photoCount(album: Album): number {
  if (!album.photos || album.photos.length === 0) return 0
  return album.photos[0].count ?? 0
}

type ModalTab = 'album' | 'activite'

export default function ActivitesClient({ albums, activities, isAdmin, userId }: Props) {
  const [activeTab, setActiveTab] = useState<'activites' | 'albums'>('activites')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<ModalTab>('album')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploadingAlbumId, setUploadingAlbumId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const targetAlbumIdRef = useRef<string | null>(null)
  const router = useRouter()

  const handleCreateAlbum = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createAlbum(fd)
        setModalOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  const handleCreateActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await createActivity(fd)
        setModalOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  const openPhotoUpload = (albumId: string) => {
    targetAlbumIdRef.current = albumId
    fileInputRef.current?.click()
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const albumId = targetAlbumIdRef.current
    if (!files.length || !albumId || !userId) return

    setUploadingAlbumId(albumId)
    setUploadProgress(`0 / ${files.length}`)
    const supabase = createClient()

    let done = 0
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `albums/${albumId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: storageErr, data } = await supabase.storage
        .from('photos')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (storageErr) continue

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)

      await supabase.from('photos').insert({
        album_id: albumId,
        url: publicUrl,
        uploaded_by: userId,
      })

      done++
      setUploadProgress(`${done} / ${files.length}`)
    }

    setUploadingAlbumId(null)
    setUploadProgress('')
    e.target.value = ''
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Vie associative</p>
          <h1 className="text-4xl md:text-5xl font-black">Nos Activités</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('activites')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'activites' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Calendar size={16} /> Événements
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'albums' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <ImageIcon size={16} /> Albums Photos
            {albums.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'albums' ? 'bg-green-500' : 'bg-gray-200 text-gray-600'}`}>
                {albums.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'activites' && (
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Les activités arrivent bientôt !</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Suivez-nous sur Instagram pour ne rien manquer en attendant la publication des événements.
                </p>
                <a
                  href="https://www.instagram.com/ueemt.tokat"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
                >
                  <InstagramIcon size={16} />
                  @ueemt.tokat
                </a>
              </div>
            ) : (
              activities.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{a.titre}</h3>
                      {a.description && (
                        <p className="text-gray-600 mt-2 leading-relaxed">{a.description}</p>
                      )}
                      {a.instagram_url && (
                        <a
                          href={a.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-sm text-pink-500 hover:text-pink-600 font-medium"
                        >
                          <InstagramIcon size={16} className="text-pink-500" />
                          Voir sur Instagram
                        </a>
                      )}
                    </div>
                    {a.date && (
                      <div className="flex-shrink-0 text-center bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                        <p className="text-2xl font-black text-green-700">
                          {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                        </p>
                        <p className="text-xs font-semibold text-green-600 uppercase">
                          {new Date(a.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(a.date).getFullYear()}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
              <InstagramIcon size={36} className="text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">Toutes nos activités sur Instagram</h3>
              <p className="text-gray-500 text-sm mb-5">Photos, vidéos et moments de vie à Tokat</p>
              <a
                href="https://www.instagram.com/ueemt.tokat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <InstagramIcon size={18} />
                @ueemt.tokat
              </a>
            </div>
          </div>
        )}

        {activeTab === 'albums' && (
          <div>
            {albums.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-5xl mb-4">📸</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">Les souvenirs arrivent bientôt !</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  {isAdmin
                    ? "Créez le premier album via le bouton + en bas de la page."
                    : "Les administrateurs publient bientôt les albums de nos événements."}
                </p>
                {!isAdmin && (
                  <Link href="/connexion" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors">
                    Se connecter
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {albums.map((album, i) => {
                  const count = photoCount(album)
                  const isUploading = uploadingAlbumId === album.id
                  return (
                    <div key={album.id} className="group relative">
                      <Link
                        href={`/activites/${album.id}`}
                        className="block bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all"
                      >
                        <div
                          className={`h-44 bg-gradient-to-br ${COVER_GRADIENTS[i % COVER_GRADIENTS.length]} relative overflow-hidden`}
                        >
                          {album.cover_url ? (
                            <img
                              src={album.cover_url}
                              alt={album.titre}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={40} className="text-white/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          {count > 0 && (
                            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                              {count} photo{count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="p-4 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                              {album.titre}
                            </h3>
                            {album.description && (
                              <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{album.description}</p>
                            )}
                            <p className="text-gray-400 text-xs mt-2">
                              {new Date(album.created_at).toLocaleDateString('fr-FR', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <ArrowRight
                            size={18}
                            className="flex-shrink-0 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all mt-0.5"
                          />
                        </div>
                      </Link>

                      {/* Admin: per-album photo upload */}
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.preventDefault(); openPhotoUpload(album.id) }}
                          disabled={isUploading}
                          className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow transition-all"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              {uploadProgress}
                            </>
                          ) : (
                            <>
                              <Upload size={12} />
                              Ajouter des photos
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input for photo upload */}
      {isAdmin && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoUpload}
        />
      )}

      {/* Admin FAB */}
      {isAdmin && (
        <button
          onClick={() => { setModalOpen(true); setError(null) }}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          title="Créer un album ou une activité"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Creation modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Nouvelle création</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal tabs */}
            <div className="flex gap-1 p-4 border-b border-gray-100">
              <button
                onClick={() => { setModalTab('album'); setError(null) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  modalTab === 'album' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📸 Nouvel album
              </button>
              <button
                onClick={() => { setModalTab('activite'); setError(null) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  modalTab === 'activite' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎉 Nouvelle activité
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {modalTab === 'album' && (
                <form onSubmit={handleCreateAlbum} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Titre de l&apos;album *
                    </label>
                    <input
                      name="titre"
                      required
                      placeholder="Soirée Cinéma 2025, Erasmus…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      placeholder="Décrivez cet album…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isPending ? 'Création…' : 'Créer l\'album'}
                  </button>
                </form>
              )}

              {modalTab === 'activite' && (
                <form onSubmit={handleCreateActivity} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Titre *
                    </label>
                    <input
                      name="titre"
                      required
                      placeholder="Tournoi d'échecs, Pique-nique…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      placeholder="Décrivez l'activité…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Date
                    </label>
                    <input
                      name="date"
                      type="date"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Lien Instagram
                    </label>
                    <input
                      name="instagram_url"
                      type="url"
                      placeholder="https://www.instagram.com/p/…"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                    {isPending ? 'Publication…' : 'Publier l\'activité'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
