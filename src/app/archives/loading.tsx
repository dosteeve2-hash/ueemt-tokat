export default function ArchivesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero skeleton */}
      <div className="bg-green-600 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-4 w-32 bg-green-500 rounded-full mb-3 animate-pulse" />
          <div className="h-10 w-64 bg-green-500 rounded-xl mb-3 animate-pulse" />
          <div className="h-5 w-96 bg-green-500/70 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats bar skeleton */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-4 flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Recensement section skeleton */}
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="h-8 w-72 bg-gray-200 rounded-xl mb-6 animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="h-4 w-6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
