export default function MembresLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="h-4 w-20 bg-green-500 rounded mb-2 animate-pulse" />
          <div className="h-8 w-40 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-3" />
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-1.5" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
