'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type ArchiveMembre = {
  id: string
  nom_complet: string
  filiere: string | null
  annee_arrivee: number | null
  ville_origine: string | null
  date_recensement: string
  member_id: string | null
}

interface Props {
  membres: ArchiveMembre[]
}

function formatYear(d: string) {
  return new Date(d).getFullYear()
}

export default function ArchivesRecensementClient({ membres }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return membres
    return membres.filter(
      (m) =>
        m.nom_complet.toLowerCase().includes(q) ||
        (m.filiere ?? '').toLowerCase().includes(q) ||
        (m.ville_origine ?? '').toLowerCase().includes(q)
    )
  }, [membres, query])

  if (membres.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center mb-8">
        <div className="text-5xl mb-4">🧑‍🎓</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Recensement en cours de constitution</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Les membres seront listés ici après validation.
        </p>
        <Link
          href="/recensement"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
        >
          Se recenser →
        </Link>
      </div>
    )
  }

  return (
    <div className="mb-8">
      {/* Compteur + barre de recherche */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-5">
        <span className="text-sm font-semibold text-gray-700">
          {filtered.length === membres.length
            ? `${membres.length} membre${membres.length > 1 ? 's' : ''} recensé${membres.length > 1 ? 's' : ''}`
            : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''} sur ${membres.length}`}
        </span>
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom ou filière…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              aria-label="Effacer la recherche"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-semibold">Aucun résultat pour &ldquo;{query}&rdquo;</p>
          <button onClick={() => setQuery('')} className="mt-3 text-green-600 text-sm underline">
            Effacer la recherche
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nom complet</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Filière</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Depuis</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.id}
                  className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-green-50/40 ${
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  }`}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    {m.member_id ? (
                      <Link
                        href={`/membres/${m.member_id}`}
                        className="font-semibold text-gray-900 hover:text-green-700 transition-colors"
                      >
                        {m.nom_complet}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-900">{m.nom_complet}</span>
                    )}
                    {/* Filière visible sur mobile */}
                    {m.filiere && (
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden line-clamp-1">{m.filiere}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {m.filiere ? (
                      <span className="line-clamp-1">{m.filiere}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {formatYear(m.date_recensement)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
