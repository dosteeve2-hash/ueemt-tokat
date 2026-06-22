'use client'

export default function GouvernanceError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-100 dark:border-red-900/30 p-12 text-center max-w-md">
        <div className="text-5xl mb-4">⚖️</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
          Erreur de chargement
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">
          Impossible de charger la page de gouvernance. Réessaie dans quelques instants.
        </p>
        <button
          onClick={reset}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
