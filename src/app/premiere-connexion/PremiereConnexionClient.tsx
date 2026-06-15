'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock, Eye, EyeOff, Search, CheckCircle, Loader2 } from 'lucide-react'
import { creerCompteEtConnecter } from './actions'

type Membre = { id: string; nom_complet: string; filiere: string | null }
type Step = 'liste' | 'password' | 'succes'

interface Props {
  membres: Membre[]
  loadError?: boolean
}

export default function PremiereConnexionClient({ membres, loadError = false }: Props) {
  const router = useRouter()

  const [step, setStep] = useState<Step>('liste')
  const [query, setQuery] = useState('')
  const [selectedMembre, setSelectedMembre] = useState<Membre | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchRef = useRef<HTMLInputElement>(null)

  // Focus le champ recherche à l'ouverture
  useEffect(() => {
    if (step === 'liste') searchRef.current?.focus()
  }, [step])

  // Redirect après succès
  useEffect(() => {
    if (step === 'succes') {
      const t = setTimeout(() => router.push('/feed'), 1800)
      return () => clearTimeout(t)
    }
  }, [step, router])

  const filtered = membres.filter((m) =>
    m.nom_complet.toLowerCase().includes(query.toLowerCase()) ||
    (m.filiere ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  // ─── Critères mot de passe ────────────────────────────────────────────────

  const criteria = [
    { label: 'Au moins 8 caractères', met: password.length >= 8 },
    { label: 'Une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Un chiffre', met: /[0-9]/.test(password) },
    { label: 'Les mots de passe correspondent', met: password.length > 0 && password === confirmPassword },
  ]
  const allCriteriaMet = criteria.every((c) => c.met)

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSelectMembre = (m: Membre) => {
    setSelectedMembre(m)
    setError('')
    setStep('password')
  }

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMembre || !allCriteriaMet) return
    setLoading(true)
    setError('')
    const { error: err } = await creerCompteEtConnecter(selectedMembre.id, password)
    setLoading(false)
    if (err) { setError(err); return }
    setStep('succes')
  }

  const handleBack = () => {
    setError('')
    if (step === 'password') { setStep('liste'); return }
    router.push('/connexion')
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'succes' ? (
              <CheckCircle size={26} className="text-green-600" />
            ) : (
              <Lock size={26} className="text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'liste' && 'Créer mon compte'}
            {step === 'password' && 'Créer mon compte'}
            {step === 'succes' && 'Compte créé !'}
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            {step === 'liste' && 'Tu es déjà recensé ? Choisis ton nom et crée ton mot de passe.'}
            {step === 'password' && 'Choisis un mot de passe sécurisé'}
            {step === 'succes' && 'Tu vas être redirigé(e) vers le fil...'}
          </p>
        </div>

        {/* Indicateur d'étapes */}
        {step !== 'succes' && (
          <div className="flex items-center gap-2 mb-6">
            {(['liste', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step === s
                      ? 'bg-green-600 text-white'
                      : step === 'password' && s === 'liste'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 1 && (
                  <div className={`flex-1 h-px transition-colors ${
                    step === 'password' ? 'bg-green-300' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bouton retour */}
        {step !== 'succes' && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            {step === 'liste' ? 'Retour à la connexion' : 'Retour'}
          </button>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {/* ── Étape 1 — Liste des membres ── */}
        {step === 'liste' && (
          <div className="space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Recherche ton nom..."
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {loadError ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="font-semibold text-gray-700">Problème de connexion</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Impossible de charger la liste. Réessaie dans quelques instants.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-semibold"
                >
                  Réessayer
                </button>
              </div>
            ) : membres.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium text-gray-500">Aucun membre inscrit</p>
                <p className="text-xs mt-1">Commence par te recenser, puis reviens ici.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Aucun résultat pour &quot;{query}&quot;
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-0.5">
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMembre(m)}
                    className="text-left p-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 active:bg-green-100 transition-all text-sm"
                  >
                    <div className="font-semibold text-gray-900 leading-tight text-xs sm:text-sm truncate">
                      {m.nom_complet}
                    </div>
                    {m.filiere && (
                      <div className="text-gray-400 text-xs mt-0.5 truncate">{m.filiere}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Étape 2 — Mot de passe ── */}
        {step === 'password' && selectedMembre && (
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Membre sélectionné</p>
              <p className="font-bold text-gray-900 text-sm">{selectedMembre.nom_complet}</p>
              {selectedMembre.filiere && (
                <p className="text-gray-500 text-xs mt-0.5">{selectedMembre.filiere}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Checklist critères */}
            {(password.length > 0 || confirmPassword.length > 0) && (
              <ul className="space-y-1.5 bg-gray-50 rounded-xl p-3">
                {criteria.map((c) => (
                  <li
                    key={c.label}
                    className={`flex items-center gap-2 text-xs transition-colors ${
                      c.met ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <span className="w-4 text-center font-bold">{c.met ? '✓' : '○'}</span>
                    {c.label}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="submit"
              disabled={loading || !allCriteriaMet}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px] flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Création du compte...' : 'Créer mon compte →'}
            </button>
          </form>
        )}

        {/* ── Étape 3 — Succès ── */}
        {step === 'succes' && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🎉</div>
            <p className="text-gray-700 font-semibold">
              Bienvenue, {selectedMembre?.nom_complet?.split(' ')[0]} !
            </p>
            <p className="text-gray-500 text-sm">
              Ton compte a été créé. Redirection en cours...
            </p>
            <Loader2 size={22} className="animate-spin text-green-600 mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
}
