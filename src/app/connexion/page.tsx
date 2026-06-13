'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, CheckCircle } from 'lucide-react'

export default function ConnexionPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Clear any stored session before attempting sign-in.
    // A corrupted cookie from a previous session can contain non-ASCII bytes
    // that end up in the Authorization header, causing a browser fetch error.
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // signOut may fail if there is no session — safe to ignore
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
    const redirectTo = `${siteUrl}/dashboard`

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    setLoading(false)
    if (err) {
      if (err.message.includes('ISO-8859-1') || err.message.includes('fetch')) {
        setError(
          'Erreur de connexion au navigateur. Veuillez vider vos cookies pour ce site et reessayer.'
        )
      } else {
        setError(err.message)
      }
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connexion Membres</h1>
          <p className="text-gray-500 text-sm mt-2">
            Espace reserve aux membres de l'UEEMT-Tokat
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Verifiez votre email</h2>
            <p className="text-gray-600 text-sm">
              Un lien de connexion a ete envoye a <strong>{email}</strong>. Cliquez sur
              le lien pour acceder a votre espace.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
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
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors"
            >
              {loading ? 'Envoi...' : 'Recevoir le lien de connexion'}
            </button>
            <p className="text-gray-500 text-xs text-center">
              Vous recevrez un lien magique par email pour vous connecter sans mot de passe.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
