'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User, FileText, Image, Calendar, CheckCircle, Circle } from 'lucide-react'
import ProfileTab from './ProfileTab'
import DocumentsTab from './DocumentsTab'
import PhotosTab from './PhotosTab'

interface Props {
  user: { id: string; email: string }
  profile: {
    role: string
    avatar_url: string | null
    bio: string | null
    member: {
      id: string
      prenom: string
      nom: string
      filiere: string | null
      niveau: string | null
      universite: string | null
      statut: string
      telephone: string | null
      num_etudiant: string | null
      cotisation_payee: boolean
      is_validated: boolean
    } | null
  }
  documents: {
    id: string
    name: string
    file_path: string
    file_type: string | null
    created_at: string
  }[]
  albums: { id: string; titre: string }[]
}

const TABS = [
  { id: 'profil', label: 'Mon Profil', icon: User },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'activites', label: 'Activités', icon: Calendar },
]

export default function DashboardClient({ user, profile, documents, albums }: Props) {
  const [activeTab, setActiveTab] = useState('profil')
  const member = profile.member

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-700 border-2 border-green-300 flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
            {member ? `${member.prenom[0]}${member.nom[0]}` : '?'}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black truncate">
              {member ? `${member.prenom} ${member.nom}` : 'Mon Espace'}
            </h1>
            <p className="text-green-200 text-sm truncate">{user.email}</p>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${member?.is_validated ? 'bg-green-500/30 text-green-100' : 'bg-yellow-500/30 text-yellow-100'}`}>
                {member?.is_validated ? 'Validé' : 'En attente'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${member?.cotisation_payee ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'}`}>
                Cotisation {member?.cotisation_payee ? 'payée' : 'non payée'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6">
        {/* Onboarding checklist */}
        {(!profile.bio || !profile.avatar_url) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <p className="font-bold text-amber-800 mb-3">👋 Bienvenue ! Voici tes premières étapes :</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3">
                {profile.avatar_url ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <Circle size={18} className="text-amber-400 flex-shrink-0" />}
                <span className={`text-sm ${profile.avatar_url ? 'line-through text-gray-400' : 'text-amber-800'}`}>
                  Ajoute une photo de profil
                </span>
                {!profile.avatar_url && (
                  <Link href="/profil" className="ml-auto text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-full font-semibold transition-colors whitespace-nowrap">
                    Compléter →
                  </Link>
                )}
              </li>
              <li className="flex items-center gap-3">
                {profile.bio ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <Circle size={18} className="text-amber-400 flex-shrink-0" />}
                <span className={`text-sm ${profile.bio ? 'line-through text-gray-400' : 'text-amber-800'}`}>
                  Écris une courte bio
                </span>
                {!profile.bio && (
                  <Link href="/profil" className="ml-auto text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-full font-semibold transition-colors whitespace-nowrap">
                    Compléter →
                  </Link>
                )}
              </li>
              <li className="flex items-center gap-3">
                <Circle size={18} className="text-amber-400 flex-shrink-0" />
                <span className="text-sm text-amber-800">Présente-toi dans le fil d&apos;actu</span>
                <Link href="/feed" className="ml-auto text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full font-semibold transition-colors whitespace-nowrap">
                  Dire bonjour →
                </Link>
              </li>
            </ul>
          </div>
        )}

        {/* Tabs — scrollable on mobile */}
        <div className="overflow-x-auto mb-5 sm:mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'profil' && <ProfileTab user={user} profile={profile} />}
        {activeTab === 'documents' && <DocumentsTab userId={user.id} documents={documents} />}
        {activeTab === 'photos' && <PhotosTab userId={user.id} albums={albums} />}
        {activeTab === 'activites' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p>Les activités de l'UEEMT-Tokat apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  )
}
