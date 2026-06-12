'use client'

import { useState } from 'react'
import { Calendar, Image as ImageIcon, FolderOpen } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'

interface Album {
  id: string
  titre: string
  description: string | null
  cover_url: string | null
  created_at: string
}

interface Activity {
  id: string
  titre: string
  description: string | null
  date: string | null
  instagram_url: string | null
  created_at: string
}

interface Props {
  albums: Album[]
  activities: Activity[]
}

const PLACEHOLDER_COLORS = [
  'from-green-600 to-green-800',
  'from-yellow-500 to-yellow-700',
  'from-red-600 to-red-800',
  'from-green-700 to-teal-800',
  'from-emerald-600 to-green-700',
  'from-amber-500 to-orange-600',
]

export default function ActivitesClient({ albums, activities }: Props) {
  const [activeTab, setActiveTab] = useState<'activites' | 'albums'>('activites')

  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Vie associative</p>
          <h1 className="text-4xl md:text-5xl font-black">Nos Activités</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('activites')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'activites' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Calendar size={16} /> Événements
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'albums' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ImageIcon size={16} /> Albums Photos
          </button>
        </div>

        {activeTab === 'activites' && (
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-medium">Aucune activité publiée pour le moment.</p>
                <p className="text-sm mt-2">Suivez-nous sur Instagram pour ne rien manquer !</p>
              </div>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{a.titre}</h3>
                      {a.description && <p className="text-gray-600 mt-2 leading-relaxed">{a.description}</p>}
                      {a.instagram_url && (
                        <a
                          href={a.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-sm text-pink-500 hover:text-pink-600 font-medium"
                        >
                          <InstagramIcon size={16} className="text-pink-500" />
                          Voir sur Instagram
                        </a>
                      )}
                    </div>
                    {a.date && (
                      <div className="flex-shrink-0 text-center bg-green-50 rounded-xl px-4 py-3">
                        <p className="text-2xl font-black text-green-700">
                          {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                        </p>
                        <p className="text-xs font-semibold text-green-600 uppercase">
                          {new Date(a.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(a.date).getFullYear()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <InstagramIcon size={36} className="text-pink-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">Toutes nos activités sur Instagram</h3>
              <p className="text-gray-500 text-sm mb-5">Photos, vidéos et moments de vie à Tokat</p>
              <a
                href="https://www.instagram.com/ueemt.tokat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <InstagramIcon size={18} />
                @ueemt.tokat
              </a>
            </div>
          </div>
        )}

        {activeTab === 'albums' && (
          <div>
            {albums.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                <FolderOpen size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-medium">Aucun album créé pour le moment.</p>
                <p className="text-sm mt-2">Les admins peuvent créer des albums depuis leur dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album, i) => (
                  <div key={album.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                    <div
                      className={`h-40 bg-gradient-to-br ${PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length]} flex items-center justify-center relative`}
                    >
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.titre} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={40} className="text-white/50" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{album.titre}</h3>
                      {album.description && <p className="text-gray-500 text-sm mt-1">{album.description}</p>}
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(album.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
