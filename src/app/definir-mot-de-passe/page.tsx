'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function DefinirMotDePasseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Règle 5 — critères en temps réel
  const criteria = [
    { label: 'Au moins 8 caractères', met: password.length >= 8 },
    { label: 'Au moins une majuscule', met: /[A-Z]/.test(password) },
    { label: 'Au moins un chiffre', met: /[0-9]/.test(password) },
    { label: 'Les mots de passe correspondent', met: password === confirm && password.length > 0 },
  ]
  const strength = criteria.filter((c) => c.met).length
  const allMet = strength === criteria.length

  const barColor =
    strength <= 1 ? 'bg-red-400' : strength === 2 ? 'bg-orange-400' : 'bg-green-500'

  // Exchange the reset code for a session — must run on mount, client-side only
  useEffect(() => {
    if (!code) {
      setSessionError('Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.')
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setSessionError('Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.')
      } else {
        setSessionReady(true)
      }
    })
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!allMet) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/feed'), 2000)
      }
    } catch {
      setError('Une erreur inattendue est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {success ? (
              <CheckCircle size={26} className="text-green-600" />
            ) : sessionError ? (
              <AlertCircle size={26} className="text-red-500" />
            ) : (
              <Lock size={26} className="text-green-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {success ? 'Mot de passe mis à jour !' : 'Définir mon mot de passe'}
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            {success
              ? "Redirection vers le fil d'actualité…"
              : 'Choisissez un mot de passe sécurisé pour votre compte UEEMT'}
          </p>
        </div>

        {/* Session error */}
        {sessionError && (
          <div className="text-center space-y-4">
            <p className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">{sessionError}</p>
            <button
              onClick={() => router.push('/connexion')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="text-center">
            <p className="text-gray-500 text-sm">
              Vous allez être redirigé automatiquement.
            </p>
          </div>
        )}

        {/* Form (only when session is ready and no error/success) */}
        {sessionReady && !success && !sessionError && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Minimum 8 caractères"
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Répétez votre mot de passe"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Règle 5 — checklist + barre de progression */}
            {(password.length > 0 || confirm.length > 0) && (
              <div className="space-y-3">
                {/* Barre colorée */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        strength >= level ? barColor : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Checklist */}
                <ul className="space-y-1.5">
                  {criteria.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-2 text-xs transition-colors ${
                        c.met ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0 transition-colors ${
                        c.met ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {c.met ? '✓' : ''}
                      </span>
                      {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Règle 1 — disabled tant que tous les critères ne sont pas cochés */}
            <button
              type="submit"
              disabled={!allMet || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              {loading ? 'Mise à jour...' : 'Définir mon mot de passe'}
            </button>

            {!allMet && password.length > 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                {criteria.filter((c) => !c.met).length} critère
                {criteria.filter((c) => !c.met).length > 1 ? 's' : ''} restant
                {criteria.filter((c) => !c.met).length > 1 ? 's' : ''}
              </p>
            )}
          </form>
        )}

        {/* Loading state while exchanging code */}
        {!sessionReady && !sessionError && !success && (
          <div className="text-center py-4">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Vérification du lien…</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DefinirMotDePassePage() {
  return (
    <Suspense>
      <DefinirMotDePasseContent />
    </Suspense>
  )
}
