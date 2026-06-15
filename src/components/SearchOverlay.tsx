'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Users, FileText, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { globalSearch } from '@/app/search/actions'
import type { SearchResults } from '@/app/search/actions'

interface Props {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query)
        setResults(data)
      } catch {
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  const total = results
    ? results.members.length + results.posts.length + results.events.length
    : 0

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche globale"
      >
        {/* Input bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-slate-700">
          {loading
            ? <Loader2 size={18} className="text-gray-400 animate-spin flex-shrink-0" />
            : <Search size={18} className="text-gray-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un membre, un post, un événement…"
            className="flex-1 text-gray-900 dark:text-slate-100 text-base bg-transparent outline-none placeholder-gray-400 dark:placeholder-slate-500"
            aria-label="Champ de recherche"
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-lg"
            aria-label="Fermer la recherche"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Prompt when query too short */}
          {query.trim().length < 2 && (
            <div className="py-10 text-center">
              <p className="text-gray-400 dark:text-slate-500 text-sm">
                Commence à taper pour chercher…
              </p>
            </div>
          )}

          {/* No results */}
          {query.trim().length >= 2 && !loading && results && total === 0 && (
            <div className="py-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-600 dark:text-slate-300 text-sm font-medium">
                Rien trouvé pour{' '}
                <span className="font-bold">&laquo;{query}&raquo;</span>
              </p>
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-1">Essaie un autre mot-clé</p>
            </div>
          )}

          {/* Results grouped by category */}
          {results && total > 0 && (
            <div className="py-2">
              {/* Members */}
              {results.members.length > 0 && (
                <section>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={11} /> Membres
                  </p>
                  {results.members.map(m => (
                    <Link
                      key={m.id}
                      href={`/membres/${m.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {m.full_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          {m.full_name}
                        </p>
                        {m.filiere && (
                          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                            {m.filiere}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </section>
              )}

              {/* Posts */}
              {results.posts.length > 0 && (
                <section
                  className={
                    results.members.length > 0
                      ? 'border-t border-gray-50 dark:border-slate-800 mt-1'
                      : ''
                  }
                >
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={11} /> Posts
                  </p>
                  {results.posts.map(p => (
                    <Link
                      key={p.id}
                      href={`/feed#post-${p.id}`}
                      onClick={onClose}
                      className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {p.author_avatar ? (
                        <img
                          src={p.author_avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {p.author_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          {p.author_name}
                        </p>
                        <p className="text-sm text-gray-800 dark:text-slate-200 line-clamp-1">
                          {p.content.slice(0, 80)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          {new Date(p.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  ))}
                </section>
              )}

              {/* Events */}
              {results.events.length > 0 && (
                <section
                  className={
                    results.members.length > 0 || results.posts.length > 0
                      ? 'border-t border-gray-50 dark:border-slate-800 mt-1'
                      : ''
                  }
                >
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={11} /> Événements
                  </p>
                  {results.events.map(e => (
                    <Link
                      key={e.id}
                      href={`/activites/evenements/${e.id}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                        <Calendar size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {e.title}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          {e.event_date &&
                            new Date(e.event_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          {e.location && ` · ${e.location}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
