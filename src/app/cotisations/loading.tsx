export default function CotisationsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-4 w-24 bg-green-500 rounded mb-2 animate-pulse" />
          <div className="h-8 w-44 bg-green-500 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
            <div className="h-3 w-3/4 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
