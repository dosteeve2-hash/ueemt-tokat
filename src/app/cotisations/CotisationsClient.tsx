'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Clock, Wallet, Users, ChevronDown, ChevronUp, Loader2, AlertCircle, Bell, Download } from 'lucide-react'
import type {
  CaisseInfo,
  MaCotisation,
  HistoriqueItem,
  CotisationRow,
} from './actions'
import {
  marquerPaye,
  annulerPaiement,
  mettreAJourMontants,
  getAllCotisations,
  envoyerRappels,
} from './actions'

interface Props {
  role: string
  caisseInfo: CaisseInfo
  maCotisation: MaCotisation
  historique: HistoriqueItem[]
  allCotisations: CotisationRow[]
  isGestionnaire: boolean
  chartSlot?: React.ReactNode
}

function formatMois(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function formatTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR').format(Math.round(amount)) + ' ₺'
}

function MonStatutBadge({ paid }: { paid: boolean }) {
  if (paid) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1.5 rounded-full text-sm font-semibold">
        <CheckCircle2 size={15} /> Payé ce mois
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-semibold">
      <Clock size={15} /> En attente
    </span>
  )
}

// ─── Gestionnaire: tableau complet ───────────────────────────
function TableauCotisations({
  initial,
  cotisationMensuelle,
  montantCaisse,
  isAdmin,
}: {
  initial: CotisationRow[]
  cotisationMensuelle: number
  montantCaisse: number
  isAdmin: boolean
}) {
  const [rows, setRows] = useState<CotisationRow[]>(initial)
  const [pending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [newCaisse, setNewCaisse] = useState('')
  const [newCotis, setNewCotis] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)
  const [sendingRappel, setSendingRappel] = useState(false)
  const [rappelResult, setRappelResult] = useState<string | null>(null)

  const handleExportCSV = () => {
    const header = 'Nom,Prénom,Montant dû (₺),Montant payé (₺),Solde (₺),Statut'
    const csvRows = rows.map(r => {
      const montantPaye = r.amount ?? 0
      const solde = montantPaye - cotisationMensuelle
      const statut = r.paid ? 'À jour' : 'En retard'
      return [r.nom, r.prenom, cotisationMensuelle, montantPaye, solde, statut].join(',')
    })
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cotisations-${new Date().toISOString().slice(0, 7)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reload = () => {
    startTransition(async () => {
      const fresh = await getAllCotisations()
      setRows(fresh)
    })
  }

  const handlePayer = async (memberId: string) => {
    const amount = parseFloat(editAmount)
    if (!amount || amount <= 0) { setError('Montant invalide'); return }
    setError(null)
    setLoadingId(memberId)
    try {
      await marquerPaye(memberId, amount, editNotes || undefined)
      setEditingId(null)
      setEditAmount('')
      setEditNotes('')
      reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleAnnuler = async (memberId: string) => {
    setLoadingId(memberId)
    try {
      await annulerPaiement(memberId)
      reload()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoadingId(null)
    }
  }

  const handleSaveConfig = async () => {
    if (!newCaisse && !newCotis) return
    setSavingConfig(true)
    try {
      const caisseVal = newCaisse !== '' ? parseFloat(newCaisse) : montantCaisse
      const cotisVal = newCotis !== '' ? parseFloat(newCotis) : cotisationMensuelle
      await mettreAJourMontants(cotisVal, caisseVal)
      setNewCaisse('')
      setNewCotis('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleEnvoyerRappel = async () => {
    setSendingRappel(true)
    setRappelResult(null)
    try {
      const { sent } = await envoyerRappels()
      setRappelResult(sent > 0
        ? `✅ Rappel envoyé à ${sent} membre${sent > 1 ? 's' : ''} non payé${sent > 1 ? 's' : ''}`
        : '🎉 Tous les membres ont déjà payé ce mois !')
    } catch (e) {
      setRappelResult('❌ ' + (e as Error).message)
    } finally {
      setSendingRappel(false)
    }
  }

  const filtered = rows.filter(r => {
    const matchSearch = `${r.prenom} ${r.nom}`.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'all' ? true : filter === 'paid' ? r.paid : !r.paid
    return matchSearch && matchFilter
  })

  const paidCount = rows.filter(r => r.paid).length
  const totalRecu = rows.reduce((s, r) => s + (r.amount ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-600">{paidCount}</p>
          <p className="text-xs text-green-700 dark:text-green-400 font-medium">Ont payé</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-amber-600">{rows.length - paidCount}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">En attente</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-blue-600">{formatTRY(totalRecu)}</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">Collecté ce mois</p>
        </div>
      </div>

      {/* Actions: rappel + export CSV */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleEnvoyerRappel}
          disabled={sendingRappel}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {sendingRappel ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          Envoyer rappel cotisation
        </button>
        {isAdmin && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-[#0d1b2a] hover:bg-[#0d1b2a]/80 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Download size={14} />
            Exporter CSV
          </button>
        )}
        {rappelResult && (
          <span className="text-sm text-gray-600 dark:text-slate-300">{rappelResult}</span>
        )}
      </div>

      {/* Config caisse */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 text-sm uppercase tracking-wide">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Montant caisse (₺)</label>
            <input
              type="number"
              value={newCaisse}
              onChange={e => setNewCaisse(e.target.value)}
              placeholder="Ex: 1000"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-slate-400 block mb-1">Cotisation mensuelle (₺)</label>
            <input
              type="number"
              value={newCotis}
              onChange={e => setNewCotis(e.target.value)}
              placeholder="Ex: 50"
              className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        <button
          onClick={handleSaveConfig}
          disabled={savingConfig || (!newCaisse && !newCotis)}
          className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {savingConfig ? <Loader2 size={14} className="animate-spin inline" /> : '💾 Enregistrer'}
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un membre…"
          className="flex-1 min-w-[180px] border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {(['all', 'paid', 'unpaid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'paid' ? '✅ Payés' : '⏳ En attente'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 dark:text-slate-500">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-sm">Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-slate-700">
            {filtered.map(row => (
              <div key={row.member_id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${row.paid ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {row.prenom} {row.nom}
                    </p>
                    {row.filiere && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{row.filiere}</p>
                    )}
                  </div>
                  {row.paid ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {formatTRY(row.amount!)}
                      </span>
                      <button
                        onClick={() => setExpandedId(expandedId === row.member_id ? null : row.member_id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                        aria-label="Options"
                      >
                        {expandedId === row.member_id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(row.member_id); setEditAmount(String(cotisationMensuelle)); setEditNotes('') }}
                      disabled={!!loadingId}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      {loadingId === row.member_id ? <Loader2 size={12} className="animate-spin" /> : 'Marquer payé'}
                    </button>
                  )}
                </div>

                {/* Formulaire paiement */}
                {editingId === row.member_id && !row.paid && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        placeholder="Montant reçu (₺)"
                        className="flex-1 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => handlePayer(row.member_id)}
                        disabled={!!loadingId}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                      >
                        {loadingId === row.member_id ? <Loader2 size={14} className="animate-spin" /> : '✅ Valider'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Notes (optionnel)"
                      className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}

                {/* Détails paiement + annulation */}
                {expandedId === row.member_id && row.paid && (
                  <div className="mt-2 pt-2 border-t border-gray-50 dark:border-slate-700 flex items-center gap-4">
                    <span className="text-xs text-gray-400">
                      {row.paid_at ? new Date(row.paid_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleAnnuler(row.member_id)}
                        disabled={!!loadingId}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                      >
                        Annuler le paiement
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <div className="flex justify-center py-2">
          <Loader2 size={18} className="animate-spin text-gray-400" />
        </div>
      )}
    </div>
  )
}

// ─── Main Client ─────────────────────────────────────────────
export default function CotisationsClient({
  role,
  caisseInfo,
  maCotisation,
  historique,
  allCotisations,
  isGestionnaire,
  chartSlot,
}: Props) {
  const [caisse, setCaisse] = useState(caisseInfo)

  const roleLabel: Record<string, string> = {
    admin: 'Administrateur',
    tresorier: 'Trésorier',
    adjoint_tresorier: 'Trésorier Adjoint',
    caissier: 'Caissier',
    member: 'Membre',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="bg-green-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-1">Finances</p>
          <h1 className="text-3xl font-black">Cotisations</h1>
          {isGestionnaire && (
            <p className="text-green-200 text-sm mt-1">{roleLabel[role] ?? role}</p>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Caisse + cotisation mensuelle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Wallet size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Caisse UEEMT (₺)</p>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">
              {formatTRY(caisse.montant)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <span className="text-lg">💰</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">Cotisation mensuelle</p>
            </div>
            <p className="text-2xl font-black text-gray-900 dark:text-slate-100 mt-2">
              {formatTRY(caisse.cotisation_mensuelle)}
            </p>
          </div>
        </div>

        {/* Ma situation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span>📋</span> Ma situation — {formatMois(maCotisation.month)}
          </h2>
          <div className="flex items-center justify-between">
            <MonStatutBadge paid={maCotisation.paid} />
            {maCotisation.paid && maCotisation.amount && (
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {formatTRY(maCotisation.amount)}
                {maCotisation.paid_at && (
                  <span className="ml-2 text-gray-400 text-xs">
                    le {new Date(maCotisation.paid_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </span>
            )}
          </div>

          {!maCotisation.paid && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                ⚠️ Tu n&apos;as pas encore payé ta cotisation de{' '}
                <strong>{formatTRY(caisse.cotisation_mensuelle)}</strong> pour ce mois.
                Contacte le trésorier ou un membre du bureau pour régulariser ta situation.
              </p>
            </div>
          )}
        </div>

        {/* Historique */}
        {historique.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span>📅</span> Historique de mes paiements
            </h2>
            <div className="space-y-2">
              {historique.map(h => (
                <div
                  key={h.month}
                  className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-slate-300 capitalize">
                      {formatMois(h.month)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {formatTRY(h.amount)}
                    </span>
                    <p className="text-xs text-gray-400">
                      {new Date(h.paid_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {historique.length === 0 && !isGestionnaire && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm py-10 px-6 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-1">Aucun paiement enregistré</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Ton historique de cotisations apparaîtra ici une fois tes paiements validés.
            </p>
          </div>
        )}

        {/* Graphique cotisations (gestionnaire) */}
        {chartSlot}

        {/* Tableau gestionnaire */}
        {isGestionnaire && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Users size={18} /> Gestion des cotisations membres
            </h2>
            <TableauCotisations
              initial={allCotisations}
              cotisationMensuelle={caisse.cotisation_mensuelle}
              montantCaisse={caisse.montant}
              isAdmin={role === 'admin'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
