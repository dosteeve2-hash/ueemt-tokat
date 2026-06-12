'use client'

import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'
import { createClient } from '@/lib/supabase/client'

export default function ContactPage() {
  const [form, setForm] = useState({ nom: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom || !form.email || !form.message) {
      setError('Tous les champs sont requis.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('contacts').insert([form])
    setLoading(false)
    if (err) {
      setError('Une erreur est survenue. Réessayez.')
    } else {
      setSuccess(true)
      setForm({ nom: '', email: '', message: '' })
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Nous écrire</p>
          <h1 className="text-4xl md:text-5xl font-black">Contact</h1>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-bold mb-6">Nos coordonnées</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <InstagramIcon size={24} className="text-pink-500" />
              <div>
                <p className="font-semibold">Instagram</p>
                <a href="https://www.instagram.com/ueemt.tokat" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  @ueemt.tokat
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-semibold">Localisation</p>
                <p className="text-gray-600">Tokat, Türkiye</p>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-green-50 rounded-2xl p-6 border border-green-100">
            <p className="font-bold text-green-800 mb-1">UEEMT-Tokat</p>
            <p className="text-green-700 text-sm italic">Travail – Solidarité – Réussite</p>
            <p className="text-green-600 text-sm mt-2">Fondée le 2 novembre 2022</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Envoyer un message</h2>
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle size={48} className="text-green-500 mb-4" />
              <p className="text-xl font-bold text-gray-900">Message envoyé !</p>
              <p className="text-gray-600 mt-2">Nous vous répondrons dans les plus brefs délais.</p>
              <button onClick={() => setSuccess(false)} className="mt-6 text-green-600 underline text-sm">Envoyer un autre message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  placeholder="Votre message..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Send size={18} />
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
