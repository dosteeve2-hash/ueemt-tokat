export default function MembresLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="h-3 w-32 bg-green-500 rounded mb-3 animate-pulse" />
          <div className="h-8 w-44 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Search bar skeleton */}
        <div className="h-11 bg-white rounded-xl border border-gray-100 shadow-sm mb-6 animate-pulse" />
        {/* Member card grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
              <div className="h-2 bg-gray-100 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
