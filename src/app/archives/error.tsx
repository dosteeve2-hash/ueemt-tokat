'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ArchivesError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Archives]', error) }, [error])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md w-full">
        <div className="text-5xl mb-4">🗂️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Les archives n&apos;ont pas pu se charger</h2>
        <p className="text-gray-500 text-sm mb-6">Vérifie ta connexion et réessaie.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
          >
            Réessayer
          </button>
          <Link href="/" className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-6 py-3 rounded-full font-semibold transition-colors">
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
