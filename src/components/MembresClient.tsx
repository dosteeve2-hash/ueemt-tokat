'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import type { MembreCard } from '@/app/membres/page'

interface Props {
  membres: MembreCard[]
  isAdmin: boolean
  currentUserId: string | null
}

const AVATAR_COLORS = [
  'bg-green-600', 'bg-yellow-500', 'bg-red-600', 'bg-teal-600',
  'bg-emerald-600', 'bg-amber-500', 'bg-blue-600', 'bg-purple-600',
]

export default function MembresClient({ membres, isAdmin, currentUserId }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Communauté</p>
          <h1 className="text-4xl md:text-5xl font-black">Nos Membres</h1>
          <p className="text-green-100 mt-3 text-lg">
            {membres.length} membre{membres.length !== 1 ? 's' : ''} recensé{membres.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center text-sm text-amber-700">
          Mode admin — Gérez les membres depuis le{' '}
          <Link href="/dashboard/admin" className="font-semibold underline">tableau de bord</Link>.
        </div>
      )}

      {currentUserId && (
        <div className="bg-green-50 border-b border-green-100 px-4 py-3 text-center text-sm text-green-700">
          <Link href="/profil" className="font-semibold hover:underline">Compléter mon profil</Link>
          {' '}·
          <Link href="/feed" className="font-semibold hover:underline ml-1">Voir le fil d&apos;actualité</Link>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-10">
        {membres.length === 0 ? (
          <div className="bg-green-50 rounded-2xl border border-green-100 p-16 text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">La famille arrive bientôt !</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Les membres rejoignent progressivement notre espace. Bienvenue dans la famille UEEMT-Tokat !
            </p>
            <a
              href="/recensement"
              className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Se recenser maintenant
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {membres.map((m, i) => (
              <Link
                key={m.id}
                href={`/membres/${m.id}`}
                className="group bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md hover:border-green-200 transition-all"
              >
                <div className="mx-auto mb-3 w-16 h-16">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={`${m.prenom} ${m.nom}`}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-green-100 group-hover:ring-green-300 transition-all"
                    />
                  ) : (
                    <div
                      className={`w-16 h-16 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xl font-black ring-2 ring-transparent group-hover:ring-green-200 transition-all`}
                    >
                      {m.prenom?.[0]?.toUpperCase()}{m.nom?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <p className="font-bold text-gray-900 text-sm leading-tight group-hover:text-green-700 transition-colors">
                  {m.prenom} {m.nom}
                </p>

                {m.role ? (
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    m.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.role === 'admin' ? 'Bureau' : 'Membre'}
                  </span>
                ) : null}

                {m.filiere && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{m.filiere}</p>
                )}

                {m.bio && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{m.bio}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
