'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { sendMagicLink } from './actions'
import { createClient } from '@/lib/supabase/client'

const RESEND_DELAY = 60

// Google SVG icon (inline, no dep)
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function ConnexionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(
    urlError === 'lien_invalide'
      ? 'Ce lien est invalide ou a expiré. Demandez-en un nouveau.'
      : '',
  )
  const [countdown, setCountdown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser()
      .then(({ data: { user } }) => { if (user) router.replace('/dashboard') })
      .catch(() => {})
  }, [router])

  // Countdown for resend button
  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(RESEND_DELAY)
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const { error: err } = await sendMagicLink(email.trim())
      if (err) {
        setError(err)
      } else {
        setSent(true)
        startCountdown()
      }
    } catch {
      setError('Une erreur inattendue est survenue. Reessayez.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return
    setResendLoading(true)
    setError('')
    try {
      const { error: err } = await sendMagicLink(email.trim())
      if (err) setError(err)
      else startCountdown()
    } catch {
      setError('Erreur lors du renvoi. Reessayez.')
    } finally {
      setResendLoading(false)
    }
  }

  const handleReset = () => {
    setSent(false)
    setError('')
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={26} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion Membres</h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Espace réservé aux membres de l'UEEMT-Tokat
          </p>
        </div>

        {sent ? (
          /* ── Confirmation ── */
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
            <p className="text-gray-500 text-sm mb-1">Vérifiez votre boîte mail :</p>
            <p className="font-semibold text-green-700 text-base mb-1 break-all">{email}</p>
            <p className="text-gray-400 text-xs mb-6">Le lien est valable 1 heure.</p>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl mb-4">{error}</p>
            )}

            {/* Resend */}
            <button
              onClick={handleResend}
              disabled={countdown > 0 || resendLoading}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:text-green-700 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl text-sm font-semibold transition-colors min-h-[48px] mb-3"
            >
              <RefreshCw size={15} className={resendLoading ? 'animate-spin' : ''} />
              {countdown > 0
                ? `Renvoyer dans ${countdown}s`
                : resendLoading
                ? 'Envoi...'
                : 'Renvoyer le lien'}
            </button>

            {/* Change email */}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-600 text-sm w-full py-2 transition-colors"
            >
              <ArrowLeft size={14} />
              Changer d'adresse email
            </button>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="votre@email.com"
                autoComplete="email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            >
              {loading ? 'Envoi en cours...' : 'Recevoir le lien de connexion'}
            </button>

            <p className="text-gray-400 text-xs text-center">
              Un lien magique vous sera envoyé. Aucun mot de passe requis.
            </p>

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400">ou</span>
              </div>
            </div>

            {/* Google OAuth — placeholder, prêt pour activation */}
            <div className="relative group">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl text-sm text-gray-400 cursor-not-allowed bg-gray-50 min-h-[48px]"
              >
                <GoogleIcon />
                <span>Continuer avec Google</span>
                <span className="ml-auto text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full">
                  Bientôt
                </span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                  Bientôt disponible
                </div>
              </div>
            </div>

            {/*
              TODO: activer Google OAuth
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${siteUrl}/auth/callback` },
              })
            */}
          </form>
        )}
      </div>
    </div>
  )
}

// Wrapping with Suspense is required when useSearchParams() is used in a page
export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  )
}
