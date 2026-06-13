'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const touchStartX = useRef<number | null>(null)

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])
  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }, [photos.length])
  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % photos.length))
  }, [photos.length])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeLightbox, goPrev, goNext])

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  // Touch swipe in lightbox
  const onLightboxTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onLightboxTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) goNext()
      else goPrev()
    }
    touchStartX.current = null
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/activites"
            className="inline-flex items-center gap-2 text-green-200 hover:text-white text-sm mb-4 sm:mb-5 transition-colors"
          >
            <ArrowLeft size={16} />
            Retour aux activités
          </Link>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">{album.titre}</h1>
          {album.description && (
            <p className="text-green-100 mt-2 max-w-2xl text-sm sm:text-base">{album.description}</p>
          )}
          <p className="text-green-200 text-sm mt-3">
            {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        {photos.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📷</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Cet album attend vos souvenirs</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Les membres peuvent ajouter leurs photos depuis leur espace personnel.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              <ImageIcon size={16} /> Ajouter une photo
            </Link>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-2 sm:gap-3 space-y-2 sm:space-y-3">
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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={onLightboxTouchStart}
          onTouchEnd={onLightboxTouchEnd}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            aria-label="Fermer"
            className="absolute top-4 right-4 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Counter */}
          <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm z-10 select-none">
            {lightboxIndex + 1} / {photos.length}
          </p>

          {/* Prev / Next — hidden on mobile (use swipe) */}
          {photos.length > 1 && (
            <>
              <button
                aria-label="Photo précédente"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 transition-colors z-10 hidden sm:flex"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                aria-label="Photo suivante"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2 sm:p-3 rounded-full hover:bg-white/10 transition-colors z-10 hidden sm:flex"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Photo */}
          <div
            className="flex flex-col items-center w-full px-4 sm:px-16 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption ?? album.titre}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {photos[lightboxIndex].caption && (
              <p className="text-white/60 text-sm mt-3 text-center px-4">
                {photos[lightboxIndex].caption}
              </p>
            )}
          </div>

          {/* Mobile swipe hint */}
          {photos.length > 1 && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs sm:hidden select-none">
              Balayez pour naviguer
            </p>
          )}
        </div>
      )}
    </div>
  )
}
