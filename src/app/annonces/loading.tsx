export default function AnnoncesLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 w-40 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 dark:bg-slate-800/60 rounded animate-pulse" />
        </div>
        {/* Filter bar skeleton */}
        <div className="flex gap-2 mb-6">
          {[80, 64, 110, 90, 72].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-gray-200 dark:bg-slate-800 animate-pulse flex-shrink-0" style={{ width: w }} />
          ))}
        </div>
        {/* Cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5">
              <div className="flex justify-between mb-3">
                <div className="h-5 w-24 bg-gray-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-4 w-20 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded animate-pulse w-2/3" />
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
                <div className="h-3 w-28 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
