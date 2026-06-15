'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { getMembresList, verifierIdentite, creerMotDePasseEtConnecter } from '@/app/connexion/actions'
import { useRouter } from 'next/navigation'

type Membre = { id: string; nom_complet: string; filiere: string | null }
type Step = 'liste' | 'email' | 'password'

interface ChoisirQuiJeSuisProps {
  onBack: () => void
}

export default function ChoisirQuiJeSuis({ onBack }: ChoisirQuiJeSuisProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('liste')
  const [membres, setMembres] = useState<Membre[]>([])
  const [loadingMembres, setLoadingMembres] = useState(true)
  const [selectedMembre, setSelectedMembre] = useState<Membre | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getMembresList().then(({ membres: m, error: e }) => {
      if (!e) setMembres(m)
      setLoadingMembres(false)
    })
  }, [])

  const handleBack = () => {
    if (step === 'liste') { onBack(); return }
    if (step === 'email') { setStep('liste'); setError(''); return }
    if (step === 'password') { setStep('email'); setError(''); return }
  }

  const handleSelectMembre = (membre: Membre) => {
    setSelectedMembre(membre)
    setError('')
    setStep('email')
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMembre) return
    setLoading(true)
    setError('')
    const { error: err } = await verifierIdentite(selectedMembre.id, email)
    setLoading(false)
    if (err) { setError(err); return }
    setStep('password')
  }

  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMembre) return
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await creerMotDePasseEtConnecter(selectedMembre.id, email, password)
    setLoading(false)
    if (err) { setError(err); return }
    router.push('/feed')
  }

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordTooShort = password.length > 0 && password.length < 8

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm transition-colors"
      >
        <ArrowLeft size={14} />
        Retour
      </button>

      {error && (
        <div className="bg-red-50 p-3 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Étape 1 — Grille des membres */}
      {step === 'liste' && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Qui es-tu ?</p>
          {loadingMembres ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chargement...</div>
          ) : membres.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Aucun membre trouvé.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-0.5">
              {membres.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMembre(m)}
                  className="text-left p-3 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 active:bg-green-100 transition-all text-sm"
                >
                  <div className="font-semibold text-gray-900 leading-tight text-xs sm:text-sm">
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

      {/* Étape 2 — Email de confirmation */}
      {step === 'email' && selectedMembre && (
        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Membre sélectionné</p>
            <p className="font-bold text-gray-900 text-sm">{selectedMembre.nom_complet}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Entre ton adresse email pour confirmer
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="votre@email.com"
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
          >
            {loading ? 'Vérification...' : 'Continuer →'}
          </button>
        </form>
      )}

      {/* Étape 3 — Créer le mot de passe */}
      {step === 'password' && selectedMembre && (
        <form onSubmit={handleCreatePassword} className="space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-0.5">Compte</p>
            <p className="font-bold text-gray-900 text-sm">{selectedMembre.nom_complet}</p>
            <p className="text-gray-500 text-xs mt-0.5">{email}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Crée ton mot de passe UEEMT
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
            {passwordTooShort && (
              <p className="text-amber-600 text-xs mt-1">Au moins 8 caractères requis.</p>
            )}
          </div>

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
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Les mots de passe ne correspondent pas.</p>
            )}
            {passwordsMatch && (
              <p className="text-green-600 text-xs mt-1">✓ Les mots de passe correspondent.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !password ||
              !confirmPassword ||
              password !== confirmPassword ||
              password.length < 8
            }
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
          >
            {loading ? 'Création du compte...' : 'Choisir ce mot de passe →'}
          </button>
        </form>
      )}
    </div>
  )
}
