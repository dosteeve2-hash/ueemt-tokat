'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getFiliereBadge, getUniqueFiliereBadges } from '@/lib/filiereBadge'
import type { MembreCard, MembresStats } from '@/app/membres/page'

interface Props {
  membres: MembreCard[]
  isAdmin: boolean
  currentUserId: string | null
  stats: MembresStats
}

const AVATAR_COLORS = [
  'bg-green-600',
  'bg-yellow-500',
  'bg-red-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-amber-500',
  'bg-blue-600',
  'bg-purple-600',
]

type StatutFilter = 'tous' | 'actif' | 'inactif'

export default function MembresClient({ membres, isAdmin, currentUserId, stats }: Props) {
  const [activeFiliere, setActiveFiliere] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous')

  // Filière pills uniques depuis les membres
  const filierePills = useMemo(
    () => getUniqueFiliereBadges(membres.map((m) => m.filiere)),
    [membres]
  )

  const filtered = useMemo(() => {
    let result = membres

    if (statutFilter === 'actif') result = result.filter((m) => m.isActive)
    if (statutFilter === 'inactif') result = result.filter((m) => !m.isActive)

    if (activeFiliere) {
      result = result.filter((m) => getFiliereBadge(m.filiere).label === activeFiliere)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (m) =>
          `${m.prenom} ${m.nom}`.toLowerCase().includes(q) ||
          `${m.nom} ${m.prenom}`.toLowerCase().includes(q)
      )
    }

    return result
  }, [membres, activeFiliere, search, statutFilter])

  const hasActiveFilters =
    activeFiliere !== null || search.trim() !== '' || statutFilter !== 'tous'

  function resetFilters() {
    setActiveFiliere(null)
    setSearch('')
    setStatutFilter('tous')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero Header ── */}
      <header className="bg-[#0d1b2a] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-[#c9a84c] text-sm uppercase tracking-widest mb-2 font-semibold">
            Communauté
          </p>
          <h1 className="text-4xl md:text-5xl font-black mb-8">Nos Membres</h1>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-black text-[#c9a84c]">{stats.total}</p>
              <p className="text-xs text-white/60 mt-1">Total</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-3xl font-black text-[#00b4d8]">{stats.actifs}</p>
              <p className="text-xs text-white/60 mt-1">Actifs</p>
            </div>
            {isAdmin ? (
              <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-3xl font-black text-amber-400">{stats.pending}</p>
                <p className="text-xs text-white/60 mt-1">En attente</p>
              </div>
            ) : (
              <div className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
                <p className="text-3xl font-black text-white/50">
                  {stats.total - stats.actifs}
                </p>
                <p className="text-xs text-white/60 mt-1">Inactifs</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Bandeau admin */}
      {isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-700">
          Mode admin — Gérez les membres depuis le{' '}
          <Link href="/dashboard/admin" className="font-semibold underline">
            tableau de bord
          </Link>
          .
        </div>
      )}

      {/* Bandeau connecté */}
      {currentUserId && (
        <div className="bg-[#0d1b2a]/5 border-b border-[#0d1b2a]/10 px-4 py-3 text-center text-sm text-gray-600">
          <Link href="/profil" className="font-semibold hover:underline">
            Compléter mon profil
          </Link>
          {' · '}
          <Link href="/feed" className="font-semibold hover:underline">
            Fil d&apos;actualité
          </Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Barre de filtres ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm space-y-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#00b4d8] focus:border-transparent transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                aria-label="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Statut filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium shrink-0">Statut :</span>
            {(
              [
                { key: 'tous', label: `Tous (${membres.length})` },
                { key: 'actif', label: `Actifs (${stats.actifs})` },
                { key: 'inactif', label: `Inactifs (${stats.total - stats.actifs})` },
              ] as { key: StatutFilter; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatutFilter(key)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  statutFilter === key
                    ? 'bg-[#0d1b2a] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filière pills */}
          {filierePills.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium shrink-0">Filière :</span>
              <button
                onClick={() => setActiveFiliere(null)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  activeFiliere === null
                    ? 'bg-[#0d1b2a] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              {filierePills.map(({ filiere, badge }) => {
                const count = membres.filter(
                  (m) => getFiliereBadge(m.filiere).label === filiere
                ).length
                const isActive = activeFiliere === filiere
                return (
                  <button
                    key={filiere}
                    onClick={() => setActiveFiliere(isActive ? null : filiere)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                      isActive
                        ? `${badge.color} ring-2 ring-offset-1 ring-current shadow-sm`
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{badge.emoji}</span>
                    <span>{filiere}</span>
                    <span className={`${isActive ? 'opacity-60' : 'text-gray-400'}`}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Résultats + reset */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-800">{filtered.length}</strong>{' '}
                résultat{filtered.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={resetFilters}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>

        {/* ── Contenu principal ── */}
        {membres.length === 0 ? (
          /* Empty state global — aucun membre en DB */
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">La famille arrive bientôt !</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Les membres rejoignent progressivement notre espace. Bienvenue dans la famille
              UEEMT-Tokat !
            </p>
            <a
              href="/recensement"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Se recenser maintenant
            </a>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state filtres */
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun résultat</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Aucun membre ne correspond à cette recherche. Essaie d&apos;autres filtres.
            </p>
            <button
              onClick={resetFilters}
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Voir tous les membres
            </button>
          </div>
        ) : (
          /* Grille membres */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((m, i) => {
              const badge = getFiliereBadge(m.filiere)
              const initials =
                `${m.prenom?.[0] ?? ''}${m.nom?.[0] ?? ''}`.toUpperCase()

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md hover:border-gray-200 transition-all flex flex-col"
                >
                  {/* Avatar */}
                  <div className="mx-auto mb-3 w-16 h-16 shrink-0">
                    {m.avatarUrl ? (
                      <img
                        src={m.avatarUrl}
                        alt={`${m.prenom} ${m.nom}`}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full ${
                          AVATAR_COLORS[i % AVATAR_COLORS.length]
                        } flex items-center justify-center text-white text-xl font-black`}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Nom complet */}
                  <p className="font-bold text-gray-900 text-sm leading-tight">
                    {m.prenom} {m.nom}
                  </p>

                  {/* Badge rôle */}
                  {m.role ? (
                    <span
                      className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.role === 'admin'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {m.role === 'admin' ? 'Bureau' : 'Membre'}
                    </span>
                  ) : null}

                  {/* Badge filière */}
                  <div className="mt-2 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${badge.color}`}
                    >
                      <span>{badge.emoji}</span>
                      <span className="truncate max-w-[90px]">{badge.label}</span>
                    </span>
                  </div>

                  {/* Ville */}
                  {m.ville && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center justify-center gap-1">
                      <svg
                        className="w-3 h-3 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">{m.ville}</span>
                    </p>
                  )}

                  {/* Indicateur actif/inactif */}
                  <div className="mt-1.5 flex items-center justify-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        m.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="text-xs text-gray-400">
                      {m.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Spacer pour pousser le CTA vers le bas */}
                  <div className="flex-1" />

                  {/* CTA Voir profil */}
                  <Link
                    href={`/membres/${m.id}`}
                    className="mt-3 block w-full text-center text-xs font-semibold py-2 px-3 rounded-xl transition-opacity bg-[#0d1b2a] hover:opacity-80 text-white"
                  >
                    Voir profil
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
