'use client'

export default function SentryTestPage() {
  if (process.env.NODE_ENV === 'production') {
    return <div>Page non disponible</div>
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-xl font-bold">Test Sentry</h1>
      <button
        className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700"
        onClick={() => {
          throw new Error('Test Sentry UEEMT-Tokat')
        }}
      >
        Déclencher une erreur test
      </button>
    </div>
  )
}
