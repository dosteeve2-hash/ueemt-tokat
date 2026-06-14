export default function NotificationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-3 w-28 bg-green-500 rounded mb-3 animate-pulse" />
          <div className="h-8 w-44 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3 p-4">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
