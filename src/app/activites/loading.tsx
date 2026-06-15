export default function ActivitesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-3 w-28 bg-green-500 rounded mb-3 animate-pulse" />
          <div className="h-8 w-40 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Albums grid skeleton */}
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
