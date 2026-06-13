'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Image as ImageIcon, FolderOpen, ArrowRight } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'

interface Album {
  id: string
  titre: string
  description: string | null
  cover_url: string | null
  created_at: string
  photos: { count: number }[] | null
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

const COVER_GRADIENTS = [
  'from-green-600 to-green-800',
  'from-yellow-500 to-amber-600',
  'from-red-600 to-red-800',
  'from-teal-600 to-green-700',
  'from-emerald-600 to-teal-700',
  'from-amber-500 to-orange-600',
]

function photoCount(album: Album): number {
  if (!album.photos || album.photos.length === 0) return 0
  return album.photos[0].count ?? 0
}

export default function ActivitesClient({ albums, activities }: Props) {
  const [activeTab, setActiveTab] = useState<'activites' | 'albums'>('activites')

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Vie associative</p>
          <h1 className="text-4xl md:text-5xl font-black">Nos Activités</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('activites')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'activites' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <Calendar size={16} /> Événements
          </button>
          <button
            onClick={() => setActiveTab('albums')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'albums' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
          >
            <ImageIcon size={16} /> Albums Photos
            {albums.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === 'albums' ? 'bg-green-500' : 'bg-gray-200 text-gray-600'}`}>
                {albums.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'activites' && (
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-medium">Aucune activité publiée pour le moment.</p>
                <p className="text-sm mt-2">Suivez-nous sur Instagram pour ne rien manquer !</p>
              </div>
            ) : (
              activities.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{a.titre}</h3>
                      {a.description && (
                        <p className="text-gray-600 mt-2 leading-relaxed">{a.description}</p>
                      )}
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
                      <div className="flex-shrink-0 text-center bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                        <p className="text-2xl font-black text-green-700">
                          {new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric' })}
                        </p>
                        <p className="text-xs font-semibold text-green-600 uppercase">
                          {new Date(a.date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-xs text-gray-400">{new Date(a.date).getFullYear()}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100">
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
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                <FolderOpen size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-medium">Aucun album créé pour le moment.</p>
                <p className="text-sm mt-2">Les admins peuvent créer des albums depuis leur dashboard.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {albums.map((album, i) => {
                  const count = photoCount(album)
                  return (
                    <Link
                      key={album.id}
                      href={`/activites/${album.id}`}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-green-200 transition-all"
                    >
                      <div
                        className={`h-44 bg-gradient-to-br ${COVER_GRADIENTS[i % COVER_GRADIENTS.length]} relative overflow-hidden`}
                      >
                        {album.cover_url ? (
                          <img
                            src={album.cover_url}
                            alt={album.titre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={40} className="text-white/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        {count > 0 && (
                          <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            {count} photo{count > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            {album.titre}
                          </h3>
                          {album.description && (
                            <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{album.description}</p>
                          )}
                          <p className="text-gray-400 text-xs mt-2">
                            {new Date(album.created_at).toLocaleDateString('fr-FR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <ArrowRight
                          size={18}
                          className="flex-shrink-0 text-gray-300 group-hover:text-green-600 group-hover:translate-x-1 transition-all mt-0.5"
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
