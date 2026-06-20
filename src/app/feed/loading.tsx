export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-4 w-24 bg-green-500 rounded mb-2 animate-pulse" />
          <div className="h-8 w-48 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Composer skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 h-20 bg-gray-100 rounded-xl" />
          </div>
        </div>
        {/* Post cards skeletons */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="flex gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-2.5 w-20 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
              <div className="h-3 bg-gray-100 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
