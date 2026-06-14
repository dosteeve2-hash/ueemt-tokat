'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff, CheckCircle, ArrowLeft, Users } from 'lucide-react'
import { signInWithPassword, sendPasswordReset, envoyerLienPremierAcces } from './actions'
import { createClient } from '@/lib/supabase/client'
import ChoisirQuiJeSuis from '@/components/ChoisirQuiJeSuis'

type View = 'login' | 'forgot' | 'forgot-sent' | 'premier-acces' | 'premier-acces-sent' | 'choisir'

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

function ConnexionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(
    urlError === 'lien_invalide'
      ? 'Ce lien est invalide ou a expiré. Connectez-vous avec votre mot de passe.'
      : '',
  )

  const [premierAccesEmail, setPremierAccesEmail] = useState('')
  const [premierAccesLoading, setPremierAccesLoading] = useState(false)
  const [premierAccesError, setPremierAccesError] = useState('')

  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const emailError =
    emailTouched && email.length > 0 && !isValidEmail(email)
      ? "Format d'email invalide"
      : ''

  const loginDisabled = !email.trim() || !password || loading

  const pwCriteria = [
    { label: 'Au moins 8 caractères', met: password.length >= 8 },
    { label: 'Au moins une lettre', met: /[a-zA-Z]/.test(password) },
  ]
  const showPwHints = passwordTouched && password.length > 0

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) router.replace('/dashboard') })
      .catch(() => {})
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const { error: err } = await signInWithPassword(email.trim(), password)
      if (err) {
        setError(err)
      } else {
        router.push('/feed')
      }
    } catch {
      setError('Une erreur inattendue est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const { error: err } = await sendPasswordReset(email.trim())
      if (err) {
        setError(err)
      } else {
        setView('forgot-sent')
      }
    } catch {
      setError('Une erreur inattendue est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handlePremierAcces = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!premierAccesEmail.trim()) return
    setPremierAccesLoading(true)
    setPremierAccesError('')
    try {
      const { error: err } = await envoyerLienPremierAcces(premierAccesEmail.trim())
      if (err) {
        setPremierAccesError(err)
      } else {
        setView('premier-acces-sent')
      }
    } catch {
      setPremierAccesError('Une erreur inattendue est survenue. Réessayez.')
    } finally {
      setPremierAccesLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {(view === 'forgot-sent' || view === 'premier-acces-sent') ? (
              <CheckCircle size={26} className="text-green-600" />
            ) : view === 'choisir' ? (
              <Users size={26} className="text-green-600" />
            ) : (
              <Lock size={26} className="text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {view === 'login' && 'Connexion Membres'}
            {view === 'forgot' && 'Mot de passe oublié'}
            {view === 'forgot-sent' && 'Email envoyé !'}
            {view === 'premier-acces' && 'Première connexion'}
            {view === 'premier-acces-sent' && 'Email envoyé !'}
            {view === 'choisir' && 'Choisir qui je suis'}
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            {view === 'login' && "Espace réservé aux membres de l'UEEMT-Tokat"}
            {view === 'forgot' && 'Entrez votre email pour recevoir un lien de réinitialisation'}
            {view === 'forgot-sent' && `Vérifiez votre boîte mail : ${email}`}
            {view === 'premier-acces' && 'Reçois un lien pour définir ton mot de passe'}
            {view === 'premier-acces-sent' && `Vérifiez votre boîte mail : ${premierAccesEmail}`}
            {view === 'choisir' && 'Identifie-toi sans email — crée ton mot de passe en 3 étapes'}
          </p>
        </div>

        {error && view !== 'choisir' && (
          <div className="text-sm bg-red-50 p-3 rounded-xl mb-4 space-y-1.5">
            <p className="text-red-600">{error}</p>
            {view === 'login' && error.includes('incorrect') && (
              <p className="text-gray-600 text-xs">
                Si c&apos;est ta première connexion, utilise{' '}
                <button
                  type="button"
                  onClick={() => { setView('forgot'); setError('') }}
                  className="text-green-600 font-medium hover:underline"
                >
                  Mot de passe oublié ?
                </button>{' '}
                pour en créer un.
              </p>
            )}
          </div>
        )}

        {/* ── Choisir qui je suis ── */}
        {view === 'choisir' && (
          <ChoisirQuiJeSuis onBack={() => { setView('login'); setError('') }} />
        )}

        {/* ── Login form ── */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full border rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors ${
                    emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

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
                  onBlur={() => setPasswordTouched(true)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {showPwHints && (
                <ul className="mt-2 space-y-1">
                  {pwCriteria.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        c.met ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <span className="w-3 text-center">{c.met ? '✓' : '○'}</span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setView('forgot'); setError('') }}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {loginDisabled && !loading && (email.length > 0 || password.length > 0) && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                {!email.trim()
                  ? "L'adresse email est requise."
                  : !password
                  ? 'Le mot de passe est requis.'
                  : ''}
              </p>
            )}

            <button
              type="submit"
              disabled={loginDisabled}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div className="mt-2 pt-5 border-t border-gray-100 space-y-3 text-center">
              <div>
                <p className="text-sm text-gray-500 mb-1">Première connexion sur UEEMT ?</p>
                <button
                  type="button"
                  onClick={() => {
                    setPremierAccesEmail(email)
                    setView('premier-acces')
                    setError('')
                  }}
                  className="text-sm text-green-700 hover:text-green-800 font-medium underline underline-offset-2"
                >
                  Envoyer un lien d&apos;activation →
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => { setView('choisir'); setError('') }}
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                >
                  <Users size={15} />
                  Choisir qui je suis →
                </button>
                <p className="text-xs text-gray-400 mt-0.5">Sans email — crée ton mot de passe directement</p>
              </div>
            </div>
          </form>
        )}

        {/* ── Forgot password form ── */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full border rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors ${
                    emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              {loading ? 'Envoi...' : 'Recevoir le lien de réinitialisation'}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setError('') }}
              className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm w-full py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </button>
          </form>
        )}

        {/* ── Forgot sent confirmation ── */}
        {view === 'forgot-sent' && (
          <div className="text-center space-y-4">
            <p className="text-gray-500 text-sm">
              Si cet email correspond à un compte membre, vous recevrez un lien de
              réinitialisation valable <strong className="text-gray-700">1 heure</strong>.
            </p>
            <p className="text-gray-400 text-xs">
              Vérifiez aussi votre dossier spam.
            </p>
            <button
              type="button"
              onClick={() => { setView('login'); setError('') }}
              className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm w-full py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </button>
          </div>
        )}

        {/* ── Premier accès form ── */}
        {view === 'premier-acces' && (
          <form onSubmit={handlePremierAcces} className="space-y-4">
            {premierAccesError && (
              <div className="text-sm bg-red-50 p-3 rounded-xl">
                <p className="text-red-600">{premierAccesError}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={premierAccesEmail}
                  onChange={(e) => setPremierAccesEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="votre@email.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={premierAccesLoading || !premierAccesEmail.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              {premierAccesLoading ? 'Envoi...' : "Envoyer un lien d'activation"}
            </button>

            <button
              type="button"
              onClick={() => { setView('login'); setPremierAccesError('') }}
              className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm w-full py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </button>
          </form>
        )}

        {/* ── Premier accès sent confirmation ── */}
        {view === 'premier-acces-sent' && (
          <div className="text-center space-y-4">
            <p className="text-gray-500 text-sm">
              Si ton adresse est reconnue, tu vas recevoir un email dans quelques minutes.
            </p>
            <p className="text-gray-400 text-xs">
              Vérifie aussi ton dossier spam. Le lien expire dans <strong className="text-gray-600">24h</strong>.
            </p>
            <button
              type="button"
              onClick={() => { setView('login'); setPremierAccesError('') }}
              className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm w-full py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  )
}
