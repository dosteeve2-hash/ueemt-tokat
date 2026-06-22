'use client'

import { useState, useTransition } from 'react'
import { soumettreProposition, voterProposition, changerStatutProposition } from './actions'
import { toast } from '@/lib/toast'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PropositionRow = {
  id: string
  titre: string
  description: string
  type: string
  soumis_par: string | null
  statut: 'en_attente' | 'approuvee' | 'rejetee'
  votes_pour: number
  votes_contre: number
  created_at: string
  auteur_prenom?: string
  auteur_nom?: string
}

export type VoteRow = {
  proposition_id: string
  vote: 'pour' | 'contre' | 'abstention'
}

interface GouvClientProps {
  propositions: PropositionRow[]
  mesVotes: VoteRow[]
  roleActuel: string
  userId: string
}

const TYPES_LABELS: Record<string, string> = {
  modification_site: '🌐 Site web',
  modification_regles: '📜 Règles',
  evenement: '🎉 Événement',
  autre: '💡 Autre',
}

const ROLES_BUREAU = ['admin', 'president', 'tresorier', 'adjoint_tresorier', 'secretaire', 'caissier']

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

// ─── Carte Proposition ───────────────────────────────────────────────────────

function PropositionCard({
  prop,
  monVote,
  roleActuel,
  userId,
}: {
  prop: PropositionRow
  monVote?: VoteRow
  roleActuel: string
  userId: string
}) {
  const [isPending, startTransition] = useTransition()
  const canClose = ['admin', 'president'].includes(roleActuel) && prop.statut === 'en_attente'
  const canVote = prop.statut === 'en_attente' && !monVote
  const totalVotes = prop.votes_pour + prop.votes_contre

  const handleVote = (vote: 'pour' | 'contre' | 'abstention') => {
    startTransition(async () => {
      const result = await voterProposition(prop.id, vote)
      if (result.error) toast.error('Erreur', result.error)
      else toast.success('Vote enregistré !')
    })
  }

  const handleClose = (statut: 'approuvee' | 'rejetee') => {
    startTransition(async () => {
      const result = await changerStatutProposition(prop.id, statut)
      if (result.error) toast.error('Erreur', result.error)
      else toast.success(statut === 'approuvee' ? '✅ Proposition approuvée' : '❌ Proposition rejetée')
    })
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 ${
      prop.statut === 'en_attente'
        ? 'border-yellow-200 dark:border-yellow-800/50'
        : prop.statut === 'approuvee'
        ? 'border-green-200 dark:border-green-800/50'
        : 'border-red-200 dark:border-red-800/50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-gray-400 dark:text-slate-500 font-medium">
            {TYPES_LABELS[prop.type] ?? prop.type}
          </span>
          <h3 className="font-bold text-gray-900 dark:text-slate-100 mt-0.5 text-base leading-tight">{prop.titre}</h3>
        </div>
        <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
          prop.statut === 'en_attente'
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
            : prop.statut === 'approuvee'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
        }`}>
          {prop.statut === 'en_attente' ? '⏳ En attente' : prop.statut === 'approuvee' ? '✅ Approuvée' : '❌ Rejetée'}
        </span>
      </div>

      <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">{prop.description}</p>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mb-4">
        <span>
          {prop.auteur_prenom
            ? `Soumis par ${prop.auteur_prenom} ${prop.auteur_nom ?? ''}`
            : 'Soumis par un membre du bureau'}
          {' · '}
          {formatDate(prop.created_at)}
        </span>
        {totalVotes > 0 && (
          <span>{totalVotes} vote{totalVotes > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Barre de votes */}
      {totalVotes > 0 && (
        <div className="mb-4">
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700">
            {prop.votes_pour > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${(prop.votes_pour / totalVotes) * 100}%` }}
              />
            )}
            {prop.votes_contre > 0 && (
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${(prop.votes_contre / totalVotes) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-slate-500 mt-1">
            <span className="text-green-600 dark:text-green-400 font-medium">{prop.votes_pour} pour</span>
            <span className="text-red-500 dark:text-red-400 font-medium">{prop.votes_contre} contre</span>
          </div>
        </div>
      )}

      {/* Mon vote actuel */}
      {monVote && (
        <div className={`text-xs font-semibold rounded-lg px-3 py-2 mb-3 text-center ${
          monVote.vote === 'pour'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : monVote.vote === 'contre'
            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-50 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
        }`}>
          Tu as voté : {monVote.vote === 'pour' ? '✅ Pour' : monVote.vote === 'contre' ? '❌ Contre' : '🤷 Abstention'}
        </div>
      )}

      {/* Boutons de vote */}
      {canVote && (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote('pour')}
            disabled={isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            ✅ Pour
          </button>
          <button
            onClick={() => handleVote('contre')}
            disabled={isPending}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            ❌ Contre
          </button>
          <button
            onClick={() => handleVote('abstention')}
            disabled={isPending}
            className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-slate-300 text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            🤷 Abstention
          </button>
        </div>
      )}

      {/* Boutons de clôture (admin/président) */}
      {canClose && totalVotes > 0 && (
        <div className="mt-3 flex gap-2 border-t border-gray-100 dark:border-slate-700 pt-3">
          <button
            onClick={() => handleClose('approuvee')}
            disabled={isPending}
            className="flex-1 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 disabled:opacity-50 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
          >
            Approuver
          </button>
          <button
            onClick={() => handleClose('rejetee')}
            disabled={isPending}
            className="flex-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 disabled:opacity-50 text-red-600 dark:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 transition-colors"
          >
            Rejeter
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Formulaire nouvelle proposition ─────────────────────────────────────────

function NouvellePropositionForm() {
  const [isPending, startTransition] = useTransition()
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('autre')
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await soumettreProposition(titre, description, type)
      if (result.error) {
        toast.error('Erreur', result.error)
      } else {
        toast.success('Proposition soumise !', 'Les membres du bureau peuvent maintenant voter.')
        setTitre('')
        setDescription('')
        setType('autre')
        setOpen(false)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
      >
        <span className="text-lg">+</span>
        Nouvelle proposition
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800/50 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-gray-900 dark:text-slate-100">Nouvelle proposition</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 text-xl leading-none">×</button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
          Type
        </label>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="modification_site">🌐 Modification du site</option>
          <option value="modification_regles">📜 Modification des règles</option>
          <option value="evenement">🎉 Événement</option>
          <option value="autre">💡 Autre</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
          Titre <span className="font-normal text-gray-400">({titre.length}/200)</span>
        </label>
        <input
          type="text"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          maxLength={200}
          placeholder="Ex : Ajouter une page FAQ"
          required
          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
          Description <span className="font-normal text-gray-400">({description.length}/2000)</span>
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Explique le contexte, les objectifs, les bénéfices attendus..."
          required
          className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || titre.length < 5 || description.length < 10}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
        >
          {isPending ? 'Envoi…' : 'Soumettre au vote'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function GouvClient({ propositions, mesVotes, roleActuel, userId }: GouvClientProps) {
  const voteMap = Object.fromEntries(mesVotes.map(v => [v.proposition_id, v]))
  const enAttente = propositions.filter(p => p.statut === 'en_attente')
  const resolues = propositions.filter(p => p.statut !== 'en_attente')
  const canSubmit = ROLES_BUREAU.includes(roleActuel)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">⚖️</span>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">Gouvernance</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Propositions et votes du bureau — {roleActuel === 'conseil_sages' ? 'Conseil des Sages' : 'Bureau actif'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400">{enAttente.length}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">en attente</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-green-700 dark:text-green-400">
                {resolues.filter(p => p.statut === 'approuvee').length}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">approuvées</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-black text-red-500 dark:text-red-400">
                {resolues.filter(p => p.statut === 'rejetee').length}
              </p>
              <p className="text-xs text-red-400 dark:text-red-500">rejetées</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {/* Formulaire nouvelle proposition */}
        {canSubmit && <NouvellePropositionForm />}

        {/* Propositions en attente */}
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block" />
            Propositions en attente de vote
          </h2>
          {enAttente.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-12 text-center">
              <div className="text-4xl mb-3">🗳️</div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-1">Aucune proposition en attente</h3>
              <p className="text-gray-500 dark:text-slate-400 text-sm">
                {canSubmit
                  ? 'Soumets la première proposition au vote !'
                  : 'Les membres du bureau soumettront bientôt des propositions.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {enAttente.map(prop => (
                <PropositionCard
                  key={prop.id}
                  prop={prop}
                  monVote={voteMap[prop.id]}
                  roleActuel={roleActuel}
                  userId={userId}
                />
              ))}
            </div>
          )}
        </section>

        {/* Propositions résolues */}
        {resolues.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-4">
              Historique des décisions
            </h2>
            <div className="space-y-4">
              {resolues.map(prop => (
                <PropositionCard
                  key={prop.id}
                  prop={prop}
                  monVote={voteMap[prop.id]}
                  roleActuel={roleActuel}
                  userId={userId}
                />
              ))}
            </div>
          </section>
        )}

        {/* Info pour conseil_sages */}
        {roleActuel === 'conseil_sages' && (
          <div className="bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-2xl p-5 text-center">
            <div className="text-3xl mb-2">🏛️</div>
            <p className="text-slate-300 font-semibold text-sm mb-1">Conseil des Sages</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              En tant que membre du Conseil des Sages, tu peux voter sur les propositions
              et consulter l'historique des décisions de l'union.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
