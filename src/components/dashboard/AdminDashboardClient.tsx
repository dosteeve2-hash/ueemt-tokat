'use client'

import { useState } from 'react'
import { Users, CheckCircle, XCircle, Clock, Image, Plus, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Member {
  id: string
  prenom: string
  nom: string
  filiere: string | null
  niveau: string | null
  statut: string
  universite: string | null
  is_validated: boolean
  cotisation_payee: boolean
}

interface Album {
  id: string
  titre: string
  description: string | null
}

interface Activity {
  id: string
  titre: string
  description: string | null
  date: string | null
  created_at: string
}

interface Props {
  user: { id: string; email: string }
  profile: { role: string; member: { prenom: string; nom: string } | null }
  members: Member[]
  albums: Album[]
  activities: Activity[]
  stats: { totalMembers: number; pending: number; cotisationPaid: number }
}

export default function AdminDashboardClient({ user, profile, members: init, albums: initAlbums, activities: initActivities, stats }: Props) {
  const [tab, setTab] = useState<'membres' | 'albums' | 'activites'>('membres')
  const [members, setMembers] = useState(init)
  const [albums, setAlbums] = useState(initAlbums)
  const [activities, setActivities] = useState(initActivities)

  // New album form
  const [albumForm, setAlbumForm] = useState({ titre: '', description: '' })
  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [savingAlbum, setSavingAlbum] = useState(false)

  // New activity form
  const [actForm, setActForm] = useState({ titre: '', description: '', date: '', instagram_url: '' })
  const [showActForm, setShowActForm] = useState(false)
  const [savingAct, setSavingAct] = useState(false)

  const supabase = createClient()

  const toggleValidation = async (id: string, current: boolean) => {
    await supabase.from('members').update({ is_validated: !current }).eq('id', id)
    setMembers(members.map((m) => m.id === id ? { ...m, is_validated: !current } : m))
  }

  const toggleCotisation = async (id: string, current: boolean) => {
    await supabase.from('members').update({ cotisation_payee: !current }).eq('id', id)
    setMembers(members.map((m) => m.id === id ? { ...m, cotisation_payee: !current } : m))
  }

  const createAlbum = async () => {
    if (!albumForm.titre.trim()) return
    setSavingAlbum(true)
    const { data } = await supabase.from('albums').insert({ ...albumForm, created_by: user.id }).select().single()
    if (data) setAlbums([data, ...albums])
    setAlbumForm({ titre: '', description: '' })
    setShowAlbumForm(false)
    setSavingAlbum(false)
  }

  const createActivity = async () => {
    if (!actForm.titre.trim()) return
    setSavingAct(true)
    const payload = {
      titre: actForm.titre,
      description: actForm.description || null,
      date: actForm.date || null,
      instagram_url: actForm.instagram_url || null,
      created_by: user.id,
    }
    const { data } = await supabase.from('activities').insert(payload).select().single()
    if (data) setActivities([data, ...activities])
    setActForm({ titre: '', description: '', date: '', instagram_url: '' })
    setShowActForm(false)
    setSavingAct(false)
  }

  const statCards = [
    { label: 'Total membres', value: stats.totalMembers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'En attente validation', value: stats.pending, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Cotisation payée', value: stats.cotisationPaid, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-green-300 text-sm uppercase tracking-widest mb-1">Dashboard Admin</p>
          <h1 className="text-3xl font-black">
            {profile.member ? `${profile.member.prenom} ${profile.member.nom}` : 'Bureau Exécutif'}
          </h1>
          <p className="text-green-200 text-sm">{user.email}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-black text-gray-900">{value}</p>
              <p className="text-gray-500 text-sm">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
          {(['membres', 'albums', 'activites'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {t === 'membres' ? 'Membres' : t === 'albums' ? 'Albums Photos' : 'Activités'}
            </button>
          ))}
        </div>

        {tab === 'membres' && (
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                  {m.prenom[0]}{m.nom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">{m.prenom} {m.nom}</p>
                  <p className="text-gray-400 text-xs truncate">{m.filiere ?? m.statut}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${m.is_validated ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                    {m.is_validated ? 'Validé' : 'En attente'}
                  </span>
                  <button
                    onClick={() => toggleValidation(m.id, m.is_validated)}
                    className="text-xs border border-gray-200 px-2 py-1 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    {m.is_validated ? <XCircle size={14} /> : <CheckCircle size={14} />}
                  </button>
                  <button
                    onClick={() => toggleCotisation(m.id, m.cotisation_payee)}
                    className={`text-xs px-2 py-1 rounded-lg border ${m.cotisation_payee ? 'border-green-200 text-green-600' : 'border-red-200 text-red-500'}`}
                  >
                    Cotis.
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'albums' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowAlbumForm(!showAlbumForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">
                <Plus size={16} /> Nouvel album
              </button>
            </div>
            {showAlbumForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <input placeholder="Titre de l'album" value={albumForm.titre} onChange={(e) => setAlbumForm({ ...albumForm, titre: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Description (optionnel)" value={albumForm.description} onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-3">
                  <button onClick={() => setShowAlbumForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold">Annuler</button>
                  <button onClick={createAlbum} disabled={savingAlbum} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold disabled:opacity-60">
                    {savingAlbum ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                    <Image size={20} className="text-green-600" />
                  </div>
                  <p className="font-bold text-gray-900">{a.titre}</p>
                  {a.description && <p className="text-gray-500 text-sm mt-1">{a.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'activites' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowActForm(!showActForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">
                <Plus size={16} /> Nouvelle activité
              </button>
            </div>
            {showActForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <input placeholder="Titre *" value={actForm.titre} onChange={(e) => setActForm({ ...actForm, titre: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <textarea placeholder="Description" value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <input type="date" value={actForm.date} onChange={(e) => setActForm({ ...actForm, date: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Lien post Instagram (optionnel)" value={actForm.instagram_url} onChange={(e) => setActForm({ ...actForm, instagram_url: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-3">
                  <button onClick={() => setShowActForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold">Annuler</button>
                  <button onClick={createActivity} disabled={savingAct} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-bold disabled:opacity-60">
                    {savingAct ? 'Création...' : 'Publier'}
                  </button>
                </div>
              </div>
            )}
            {activities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                Aucune activité publiée.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{a.titre}</p>
                        {a.description && <p className="text-gray-500 text-sm mt-1">{a.description}</p>}
                      </div>
                      {a.date && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{new Date(a.date).toLocaleDateString('fr-FR')}</span>}
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
