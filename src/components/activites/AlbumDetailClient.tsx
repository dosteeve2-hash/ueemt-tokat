'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'

interface Photo {
  id: string
  url: string
  caption: string | null
  created_at: string
}

interface Album {
  id: string
  titre: string
  description: string | null
  cover_url: string | null
  created_at: string
}

interface Props {
  album: Album
  photos: Photo[]
}

export default function AlbumDetailClient({ album, photos }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }, [photos.length])

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length))
  }, [photos.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeLightbox, goPrev, goNext])

  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/activites"
            className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm mb-5 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour aux activités
          </Link>
          <h1 className="text-3xl md:text-4xl font-black">{album.titre}</h1>
          {album.description && (
            <p className="text-green-100 mt-2 max-w-2xl">{album.description}</p>
          )}
          <p className="text-green-200 text-sm mt-3">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {photos.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-200" />
            <p className="text-lg font-medium">Aucune photo dans cet album.</p>
            <p className="text-sm mt-1">Les membres peuvent en ajouter depuis leur dashboard.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative w-full overflow-hidden rounded-xl bg-gray-100 block hover:ring-2 hover:ring-green-500 transition-all break-inside-avoid"
              >
                <img
                  src={photo.url}
                  alt={photo.caption ?? album.titre}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium">{photo.caption}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            aria-label="Fermer"
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
          >
            <X size={24} />
          </button>

          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            {lightboxIndex + 1} / {photos.length}
          </p>

          {photos.length > 1 && (
            <>
              <button
                aria-label="Photo précédente"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                aria-label="Photo suivante"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-10"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          <div
            className="flex flex-col items-center max-w-5xl w-full px-16 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption ?? album.titre}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {photos[lightboxIndex].caption && (
              <p className="text-white/60 text-sm mt-3 text-center">
                {photos[lightboxIndex].caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
