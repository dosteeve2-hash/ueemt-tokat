'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Trash2, Upload, FolderOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadPhoto } from '@/lib/supabase/storage'

interface Album {
  id: string
  titre: string
}

interface Photo {
  id: string
  url: string
  caption: string | null
  album_id: string
  created_at: string
}

interface Props {
  userId: string
  albums: Album[]
}

export default function PhotosTab({ userId, albums }: Props) {
  const [myPhotos, setMyPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id ?? '')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('photos')
        .select('id, url, caption, album_id, created_at')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false })
      setMyPhotos(data ?? [])
      setLoading(false)
    }
    load()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedAlbumId) return
    setUploading(true)
    const files = Array.from(e.target.files)

    for (const file of files) {
      const url = await uploadPhoto(selectedAlbumId, file)
      if (url) {
        const caption = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
        const { data } = await supabase
          .from('photos')
          .insert({ album_id: selectedAlbumId, url, caption, uploaded_by: userId })
          .select()
          .single()
        if (data) setMyPhotos((prev) => [data as Photo, ...prev])
      }
    }

    e.target.value = ''
    setUploading(false)
  }

  const handleDelete = async (photo: Photo) => {
    setDeleting(photo.id)
    await supabase.from('photos').delete().eq('id', photo.id)
    setMyPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    setDeleting(null)
  }

  const albumName = (id: string) => albums.find((a) => a.id === id)?.titre ?? 'Album'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Upload size={18} className="text-green-600" />
          Ajouter des photos
        </h3>

        {albums.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun album disponible pour le moment.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              className="flex-1 min-w-48 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.titre}
                </option>
              ))}
            </select>
            <label
              className={`inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                uploading || !selectedAlbumId
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-green-700'
              }`}
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <ImageIcon size={16} />
                  Choisir photos
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={!selectedAlbumId || uploading}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FolderOpen size={18} className="text-green-600" />
          Mes photos ({myPhotos.length})
        </h3>

        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Chargement...</div>
        ) : myPhotos.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
            <ImageIcon size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm">Vous n'avez pas encore uploadé de photos.</p>
            <p className="text-xs mt-1 text-gray-300">Choisissez un album et ajoutez vos premières photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {myPhotos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(photo)}
                    disabled={deleting === photo.id}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    {deleting === photo.id ? '...' : 'Supprimer'}
                  </button>
                </div>
                <div className="mt-1.5 space-y-0.5">
                  {photo.caption && (
                    <p className="text-xs text-gray-700 font-medium truncate">{photo.caption}</p>
                  )}
                  <p className="text-xs text-gray-400">{albumName(photo.album_id)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
