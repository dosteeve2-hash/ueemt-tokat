export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-4 w-24 bg-green-500 rounded mb-2 animate-pulse" />
          <div className="h-8 w-48 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
                <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
