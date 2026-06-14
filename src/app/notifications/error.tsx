'use client'

export default function NotificationsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="text-5xl mb-4">🔔</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Notifications indisponibles
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Le module de notifications rencontre un problème. Le reste de l&apos;app fonctionne normalement.
        </p>
        <button
          onClick={reset}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
