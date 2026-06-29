'use client'

import { useEffect } from 'react'

export default function AnnoncesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center max-w-sm">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">
          Impossible de charger les annonces
        </h3>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
          Une erreur est survenue. Réessaie dans quelques instants.
        </p>
        <button
          onClick={reset}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
