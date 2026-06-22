export default function GouvernanceLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24">
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-56 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 w-20 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <div className="h-12 bg-green-100 dark:bg-green-900/20 rounded-xl animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
