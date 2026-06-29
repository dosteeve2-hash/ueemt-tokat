'use client'

import { useEffect, useState, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'

/**
 * ScrollToTopButton — bouton flottant "retour en haut"
 * Apparaît après 300px de scroll, disparaît en haut de page.
 * Intègre un raccourci clavier Alt+↑ pour l'accessibilité.
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false)
  const [scrollPercent, setScrollPercent] = useState(0)

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const pct = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0

    setVisible(scrollTop > 300)
    setScrollPercent(pct)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Raccourci clavier : Alt + ArrowUp
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault()
        scrollToTop()
      }
    },
    [scrollToTop]
  )

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleScroll, handleKeyDown])

  if (!visible) return null

  // Calcul du stroke-dashoffset pour l'anneau de progression
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const strokeOffset = circumference - (scrollPercent / 100) * circumference

  return (
    <button
      onClick={scrollToTop}
      aria-label="Retourner en haut de la page (Alt + ↑)"
      title="Retourner en haut (Alt + ↑)"
      className="fixed bottom-20 right-4 md:bottom-8 md:right-6 z-50 w-11 h-11 rounded-full
        bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-600
        flex items-center justify-center transition-all duration-300
        hover:scale-110 hover:shadow-xl hover:border-green-400
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      {/* Anneau de progression SVG */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox="0 0 44 44"
        aria-hidden="true"
      >
        {/* Piste de fond */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-200 dark:text-slate-600"
        />
        {/* Piste de progression */}
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="2"
          className="text-green-500 transition-all duration-150"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeOffset,
            stroke: '#16a34a',
          }}
        />
      </svg>

      {/* Icône flèche */}
      <ArrowUp
        size={16}
        className="relative z-10 text-green-600 dark:text-green-400"
        strokeWidth={2.5}
      />
    </button>
  )
}
