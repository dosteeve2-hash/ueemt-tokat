export default function ProfilLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-3 w-24 bg-green-500 rounded mb-3 animate-pulse" />
          <div className="h-8 w-40 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Avatar skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        {/* Form fields skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-3 w-20 bg-gray-100 rounded mb-2" />
              <div className="h-10 bg-gray-100 rounded-xl w-full" />
            </div>
          ))}
          <div>
            <div className="h-3 w-12 bg-gray-100 rounded mb-2" />
            <div className="h-24 bg-gray-100 rounded-xl w-full" />
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-full" />
        </div>
      </div>
    </div>
  )
}
