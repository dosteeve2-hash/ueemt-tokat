'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import InstagramIcon from '@/components/InstagramIcon'

interface Props {
  photos: string[]
  title: string
  subtitle: string
  tagline: string
}

export default function HeroSlideshow({ photos, title, subtitle, tagline }: Props) {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const hasPhotos = photos.length > 0

  // Auto-advance
  useEffect(() => {
    if (photos.length < 2) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % photos.length), 5000)
    return () => clearInterval(timer)
  }, [photos.length])

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || photos.length < 2) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      setCurrent((c) => (dx < 0 ? (c + 1) % photos.length : (c - 1 + photos.length) % photos.length))
    }
    touchStartX.current = null
  }

  // Split title on first dash for yellow accent
  const dashIdx = title.indexOf('-')
  const titleLeft = dashIdx >= 0 ? title.slice(0, dashIdx) : title
  const titleRight = dashIdx >= 0 ? title.slice(dashIdx + 1) : ''

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background images (crossfade) */}
      {hasPhotos ? (
        photos.map((url, i) => (
          <img
            key={url}
            src={url}
            alt=""
            aria-hidden
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: i === current ? 1 : 0 }}
          />
        ))
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #0a3d1f 0%, #14A44D 40%, #0d2b14 70%, #000000 100%)',
          }}
        />
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: hasPhotos ? 'rgba(10, 61, 31, 0.70)' : undefined }}
      />

      {/* Decorative pattern (gradient-only mode) */}
      {!hasPhotos && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto w-full">
        <div className="flex justify-center gap-2 mb-6 sm:mb-8">
          <span className="w-8 h-2 bg-green-500 rounded-full" />
          <span className="w-8 h-2 bg-yellow-400 rounded-full" />
          <span className="w-8 h-2 bg-red-500 rounded-full" />
        </div>
        <p className="text-green-300 font-semibold tracking-widest uppercase text-xs sm:text-sm mb-3 sm:mb-4">
          BIENVENUE SUR
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-3 sm:mb-4 tracking-tight leading-none">
          {titleRight ? (
            <>
              {titleLeft}
              <span className="text-yellow-400">-</span>
              {titleRight}
            </>
          ) : (
            title
          )}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-2 font-light px-2">{subtitle}</p>
        <p className="text-green-300 italic mb-8 sm:mb-10 text-base sm:text-lg">{tagline}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            href="/connexion"
            className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:scale-105 shadow-lg inline-flex items-center justify-center min-h-[52px]"
          >
            Se connecter →
          </Link>
          <a
            href="https://www.instagram.com/ueemt.tokat"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-xl font-semibold transition-all min-h-[52px]"
          >
            <InstagramIcon size={20} />
            @ueemt.tokat
          </a>
        </div>
        <div className="mt-4">
          <Link
            href="/recensement"
            className="text-green-300 hover:text-white text-sm underline underline-offset-2 transition-colors"
          >
            Nouveau membre ? Se recenser →
          </Link>
        </div>
      </div>

      {/* Slide dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  )
}
