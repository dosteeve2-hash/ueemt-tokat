'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isBureauMember, isPresident } from '@/lib/constants'

interface Member {
  id: string
  prenom: string
  nom: string
  filiere: string | null
  statut: string
}

interface Props {
  members: Member[]
}

export default function OnboardingClient({ members }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<Member | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const filtered = members.filter(
    (m) =>
      `${m.prenom} ${m.nom}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selected.id, prenom: selected.prenom, nom: selected.nom }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Erreur lors de la liaison du profil.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Erreur réseau. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            👋
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue !</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Sélectionne ton nom dans la liste des membres UEEMT-Tokat pour configurer ton profil.
          </p>
        </div>

        {selected ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                {selected.prenom[0]}{selected.nom[0]}
              </div>
              <p className="font-bold text-gray-900 text-lg">{selected.prenom} {selected.nom}</p>
              {selected.filiere && <p className="text-gray-500 text-sm">{selected.filiere}</p>}
              {isPresident(selected.prenom, selected.nom) && (
                <span className="inline-block mt-2 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  👑 Président de l&apos;UEEMT-Tokat
                </span>
              )}
              {!isPresident(selected.prenom, selected.nom) && isBureauMember(selected.prenom, selected.nom) && (
                <span className="inline-block mt-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  ⭐ Membre du Bureau Exécutif
                </span>
              )}
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition-colors"
              >
                ← Changer
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold transition-colors"
              >
                {loading ? 'Confirmation...' : "C'est moi !"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Rechercher ton nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-300 hover:bg-green-50 transition-all text-left"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                    {m.prenom[0]}{m.nom[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{m.prenom} {m.nom}</p>
                    <p className="text-gray-400 text-xs">{m.filiere ?? m.statut}</p>
                  </div>
                  {isBureauMember(m.prenom, m.nom) && (
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Bureau</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 py-6 text-sm">Aucun membre trouvé.</p>
              )}
            </div>
            <div className="border-t border-gray-100 pt-4">
              <Link
                href="/recensement"
                className="block text-center text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Je ne suis pas encore recensé → Se recenser
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
