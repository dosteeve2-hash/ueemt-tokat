export default function CotisationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-3 w-32 bg-green-500 rounded mb-3 animate-pulse" />
          <div className="h-8 w-48 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Caisse info skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
              <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
              <div className="h-7 w-28 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        {/* Ma cotisation skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
          <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-3 w-32 bg-gray-100 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
        {/* Historique skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
