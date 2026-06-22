'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, Eye, EyeOff, Search, CheckCircle, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { creerCompteAvecEmailEtMotDePasse } from './actions'
import { broadcastSocialEvent } from '@/lib/broadcast'
import { createClient } from '@/lib/supabase/client'

type Membre = { id: string; prenom: string; nom: string; nom_complet: string; filiere: string | null }
type Step = 'liste' | 'email' | 'password' | 'succes'

const STEPS: Step[] = ['liste', 'email', 'password']

export default function PremiereConnexionClient() {
  const router = useRouter()

  const [membres, setMembres] = useState<Membre[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loadingMembres, setLoadingMembres] = useState(true)

  const [step, setStep] = useState<Step>('liste')
  const [query, setQuery] = useState('')
  const [selectedMembre, setSelectedMembre] = useState<Membre | null>(null)
  const [emailSaisi, setEmailSaisi] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const fetchMembres = async () => {
    setLoadingMembres(true)
    setLoadError(false)
    try {
      const res = await fetch('/api/membres')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json() as Array<{ id: string; prenom: string; nom: string; filiere: string | null }>
      if (!Array.isArray(data)) throw new Error('Format inattendu')
      setMembres(
        data.map((m) => ({
          id: m.id,
          prenom: m.prenom ?? '',
          nom: m.nom ?? '',
          nom_complet: `${m.prenom ?? ''} ${m.nom ?? ''}`.trim(),
          filiere: m.filiere,
        }))
      )
    } catch {
      setLoadError(true)
    } finally {
      setLoadingMembres(false)
    }
  }

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) router.replace('/feed') })
      .catch(() => {})
  }, [router])

  useEffect(() => { void fetchMembres() }, [])

  useEffect(() => {
    if (step === 'liste' && !loadingMembres) searchRef.current?.focus()
    if (step === 'email') setTimeout(() => emailRef.current?.focus(), 50)
    if (step === 'password') setTimeout(() => passwordRef.current?.focus(), 50)
  }, [step, loadingMembres])

  useEffect(() => {
    if (step === 'succes') {
      const t = setTimeout(() => router.push('/feed'), 2000)
      return () => clearTimeout(t)
    }
  }, [step, router])

  const filtered = membres.filter((m) =>
    m.nom_complet.toLowerCase().includes(query.toLowerCase()) ||
    (m.filiere ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailSaisi.trim())

  const criteria = [
    { label: 'Au moins 8 caractères', met: password.length >= 8 },
    { label: 'Une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Un chiffre', met: /[0-9]/.test(password) },
    { label: 'Les mots de passe correspondent', met: password.length > 0 && password === confirmPassword },
  ]
  const allCriteriaMet = criteria.every((c) => c.met)

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectMembre = (m: Membre) => {
    setSelectedMembre(m)
    setError('')
    setStep('email')
  }

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailValid) return
    setError('')
    setStep('password')
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMembre || !allCriteriaMet) return
    setLoading(true)
    setError('')
    const { error: err } = await creerCompteAvecEmailEtMotDePasse(
      selectedMembre.id,
      emailSaisi.trim(),
      password,
    )
    setLoading(false)
    if (err) { setError(err); return }

    // Lier le profil membre (non-bloquant)
    try {
      await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMembre.id,
          prenom: selectedMembre.prenom,
          nom: selectedMembre.nom,
        }),
      })
    } catch { /* non-bloquant */ }

    void broadcastSocialEvent('new_member', {
      userId: selectedMembre.id,
      prenom: selectedMembre.prenom,
    })
    setStep('succes')
  }

  const handleBack = () => {
    setError('')
    if (step === 'email') { setStep('liste'); return }
    if (step === 'password') { setStep('email'); return }
    router.push('/connexion')
  }

  const stepIndex = STEPS.indexOf(step)

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full max-w-md">

        {/* Onglets Se connecter / Créer mon compte */}
        {step !== 'succes' && (
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7 gap-1">
            <Link
              href="/connexion"
              className="flex-1 py-2.5 text-center rounded-lg font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Se connecter
            </Link>
            <div className="flex-1 py-2.5 text-center rounded-lg font-bold text-sm bg-white shadow-sm text-gray-900">
              Créer mon compte
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'succes' ? (
              <CheckCircle size={26} className="text-green-600" />
            ) : step === 'password' ? (
              <ShieldCheck size={26} className="text-green-600" />
            ) : step === 'email' ? (
              <Mail size={26} className="text-green-600" />
            ) : (
              <Lock size={26} className="text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'liste' && 'Créer mon compte'}
            {step === 'email' && 'Entre ton email'}
            {step === 'password' && 'Choisis un mot de passe'}
            {step === 'succes' && 'Compte créé !'}
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            {step === 'liste' && 'Tu es déjà recensé(e) ? Choisis ton nom pour commencer.'}
            {step === 'email' && 'C\'est l\'adresse que tu utiliseras pour te connecter.'}
            {step === 'password' && `Email confirmé — crée ton mot de passe sécurisé.`}
            {step === 'succes' && 'Tu vas être redirigé(e) vers le fil...'}
          </p>
        </div>

        {/* Indicateur d'étapes (3 étapes) */}
        {step !== 'succes' && (
          <div className="flex items-center gap-1 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                    i < stepIndex
                      ? 'bg-green-100 text-green-700'
                      : i === stepIndex
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px transition-colors ${
                    i < stepIndex ? 'bg-green-300' : 'bg-gray-100'
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
            Retour
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

            {loadingMembres ? (
              <div className="text-center py-10">
                <Loader2 size={28} className="animate-spin text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Chargement de la liste...</p>
              </div>
            ) : loadError ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">⚠️</div>
                <p className="font-semibold text-gray-700">Problème de connexion</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Impossible de charger la liste. Réessaie dans quelques instants.
                </p>
                <button
                  type="button"
                  onClick={() => void fetchMembres()}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-sm font-semibold"
                >
                  Réessayer
                </button>
              </div>
            ) : membres.length === 0 ? (
              <div className="rounded-2xl border p-10 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun membre recensé</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                  Commence par compléter le recensement, puis reviens ici créer ton compte.
                </p>
                <a
                  href="/recensement"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-full font-semibold text-sm inline-block"
                >
                  Se recenser →
                </a>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <div className="text-3xl">🔍</div>
                <p className="text-gray-700 font-semibold text-sm">Aucun résultat pour &quot;{query}&quot;</p>
                <p className="text-gray-400 text-xs max-w-xs mx-auto">
                  Essaie avec ton prénom ou ton nom seul. Si tu n&apos;es pas encore recensé(e),
                  remplis d&apos;abord le formulaire ci-dessous.
                </p>
                <a
                  href="/recensement"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full text-xs font-semibold transition-colors"
                >
                  Se recenser d&apos;abord →
                </a>
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

        {/* ── Étape 2 — Email ── */}
        {step === 'email' && selectedMembre && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Membre sélectionné</p>
              <p className="font-bold text-gray-900 text-sm">{selectedMembre.nom_complet}</p>
              {selectedMembre.filiere && (
                <p className="text-gray-500 text-xs mt-0.5">{selectedMembre.filiere}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Ton adresse email
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Saisis l&apos;adresse que tu veux utiliser pour te connecter à UEEMT-Tokat.
              </p>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={emailRef}
                  type="email"
                  value={emailSaisi}
                  onChange={(e) => setEmailSaisi(e.target.value)}
                  className={`w-full border rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors ${
                    emailSaisi && !emailValid ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="ton.email@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!emailValid}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              Continuer →
            </button>
          </form>
        )}

        {/* ── Étape 3 — Mot de passe ── */}
        {step === 'password' && selectedMembre && (
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Compte à créer</p>
              <p className="font-bold text-gray-900 text-sm">{selectedMembre.nom_complet}</p>
              <p className="text-green-600 text-xs mt-0.5 truncate">{emailSaisi.trim()}</p>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="••••••••"
                  autoComplete="new-password"
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

            {/* Checklist */}
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

        {/* ── Étape 4 — Succès ── */}
        {step === 'succes' && (
          <div className="text-center space-y-4 py-4">
            <div className="text-5xl">🎉</div>
            <p className="text-gray-900 font-black text-lg">
              Bienvenue, {selectedMembre?.prenom} !
            </p>
            <p className="text-green-600 font-semibold text-sm">
              Ton compte est activé. Tu fais partie de la famille UEEMT-Tokat !
            </p>
            <p className="text-gray-400 text-xs">Redirection vers le fil d&apos;actualité...</p>
            <Loader2 size={22} className="animate-spin text-green-600 mx-auto" />
          </div>
        )}
      </div>
    </div>
  )
}
