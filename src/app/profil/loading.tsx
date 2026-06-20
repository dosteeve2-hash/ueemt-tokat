export default function ProfilLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 py-12">
        <div className="max-w-2xl mx-auto px-4 flex gap-4 items-center animate-pulse">
          <div className="w-20 h-20 rounded-full bg-green-500 flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-green-500 rounded" />
            <div className="h-4 w-24 bg-green-400 rounded" />
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-3 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
