'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Megaphone, Filter, AlertTriangle, Info, CalendarDays, MessageSquare, Plus } from 'lucide-react'
import type { Annonce } from './page'

type Categorie = 'toutes' | Annonce['categorie']

const CATEGORIES: { key: Categorie; label: string; emoji: string; color: string; icon: React.ElementType }[] = [
  { key: 'toutes', label: 'Toutes', emoji: '📋', color: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200', icon: Filter },
  { key: 'urgent', label: 'Urgent', emoji: '🔴', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
  { key: 'info', label: 'Info administrative', emoji: '🔵', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Info },
  { key: 'evenement', label: 'Événement', emoji: '🟢', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: CalendarDays },
  { key: 'general', label: 'Général', emoji: '⚪', color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300', icon: MessageSquare },
]

function getBadge(cat: Annonce['categorie']) {
  return CATEGORIES.find((c) => c.key === cat) ?? CATEGORIES[4]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface Props {
  annonces: Annonce[]
  isAdmin: boolean
}

export default function AnnoncesClient({ annonces, isAdmin }: Props) {
  const [activeFilter, setActiveFilter] = useState<Categorie>('toutes')

  const filtered = useMemo(() => {
    if (activeFilter === 'toutes') return annonces
    return annonces.filter((a) => a.categorie === activeFilter)
  }, [annonces, activeFilter])

  const countByCategorie = useMemo(() => {
    const map: Record<string, number> = { toutes: annonces.length }
    for (const a of annonces) {
      map[a.categorie] = (map[a.categorie] ?? 0) + 1
    }
    return map
  }, [annonces])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone size={22} className="text-green-600" />
              <h1 className="text-2xl font-black text-gray-900 dark:text-slate-50">Annonces</h1>
            </div>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Communications officielles du bureau UEEMT-Tokat
            </p>
          </div>
          {isAdmin && (
            <Link
              href="/feed"
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={15} />
              Publier
            </Link>
          )}
        </div>

        {/* ── Filtres catégories ────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map(({ key, label, emoji, color }) => {
            const count = countByCategorie[key] ?? 0
            const isActive = activeFilter === key
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                  isActive
                    ? `${color} border-current shadow-sm scale-105`
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                {count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${isActive ? 'bg-white/40' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Liste des annonces ────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-16 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-50 mb-2">
              {activeFilter === 'toutes'
                ? 'Aucune annonce pour l\'instant'
                : `Aucune annonce dans "${CATEGORIES.find((c) => c.key === activeFilter)?.label}"`}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              {activeFilter === 'toutes'
                ? 'Le bureau publiera bientôt les premières annonces officielles.'
                : 'Essaie une autre catégorie ou reviens plus tard.'}
            </p>
            {activeFilter !== 'toutes' ? (
              <button
                onClick={() => setActiveFilter('toutes')}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
              >
                Voir toutes les annonces
              </button>
            ) : (
              <Link
                href="/feed"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors"
              >
                📰 Voir le fil d&apos;actu
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((annonce) => {
              const badge = getBadge(annonce.categorie)
              return (
                <article
                  key={annonce.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm transition-all"
                >
                  {/* Badge catégorie */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.color}`}>
                      <badge.icon size={11} />
                      {badge.label}
                    </span>
                    <time className="text-xs text-gray-400 dark:text-slate-500">
                      {formatDate(annonce.created_at)}
                    </time>
                  </div>

                  {/* Contenu */}
                  <p className="text-gray-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">
                    {annonce.content}
                  </p>

                  {/* Auteur */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
                    {annonce.author_avatar ? (
                      <img
                        src={annonce.author_avatar}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {annonce.author_prenom.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                      {annonce.author_prenom} {annonce.author_nom}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold ml-auto">
                      Bureau UEEMT
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
