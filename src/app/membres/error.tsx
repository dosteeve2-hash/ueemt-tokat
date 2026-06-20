'use client'

import { useEffect } from 'react'

export default function MembresError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[Membres]', error) }, [error])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md w-full">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Liste des membres indisponible</h2>
        <p className="text-gray-500 text-sm mb-6">Impossible de charger les membres pour l'instant.</p>
        <button onClick={reset} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors">Réessayer</button>
      </div>
    </div>
  )
}
