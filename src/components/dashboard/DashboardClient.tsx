'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  User, FileText, Image, Calendar, CheckCircle, Circle,
  Rss, Camera, PartyPopper, Trophy, ArrowRight,
} from 'lucide-react'
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
  { id: 'profil',     label: 'Mon Profil', icon: User },
  { id: 'documents',  label: 'Documents',  icon: FileText },
  { id: 'photos',     label: 'Photos',     icon: Image },
  { id: 'activites',  label: 'Activités',  icon: Calendar },
]

// Raccourcis d'activités — liens directs vers les sections vives du site
const ACTIVITY_SHORTCUTS = [
  {
    icon: Rss,
    emoji: '📢',
    title: 'Fil d\'actualité',
    desc: 'Posts, annonces et partages de la communauté',
    href: '/feed',
    color: 'bg-green-50 border-green-100 hover:border-green-300',
    iconColor: 'text-green-600',
  },
  {
    icon: Camera,
    emoji: '📸',
    title: 'Albums photos',
    desc: 'Souvenirs des sorties, fêtes et événements',
    href: '/activites',
    color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
    iconColor: 'text-blue-600',
  },
  {
    icon: Calendar,
    emoji: '🗓️',
    title: 'Événements',
    desc: 'Matchs, soirées ciné, repas collectifs…',
    href: '/evenements',
    color: 'bg-purple-50 border-purple-100 hover:border-purple-300',
    iconColor: 'text-purple-600',
  },
  {
    icon: Trophy,
    emoji: '🏆',
    title: 'Marketplace',
    desc: 'Annonces de vente, échange, service entre membres',
    href: '/marketplace',
    color: 'bg-amber-50 border-amber-100 hover:border-amber-300',
    iconColor: 'text-amber-600',
  },
]

// Mini stat-card — completion du profil
function ProfileCompletion({ profile }: { profile: Props['profile'] }) {
  const member = profile.member
  const checks = [
    { label: 'Photo de profil',   done: !!profile.avatar_url },
    { label: 'Bio renseignée',    done: !!profile.bio },
    { label: 'Téléphone',         done: !!member?.telephone },
    { label: 'N° étudiant',       done: !!member?.num_etudiant },
    { label: 'Filière',           done: !!member?.filiere },
  ]
  const score = checks.filter(c => c.done).length
  const pct   = Math.round((score / checks.length) * 100)
  const color  = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-gray-800 text-sm">Complétion du profil</p>
        <span className={`text-xs font-black px-2 py-0.5 rounded-full text-white ${color}`}>
          {pct}%
        </span>
      </div>
      {/* Barre de progression */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-2">
            {c.done
              ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              : <Circle     size={14} className="text-gray-300 flex-shrink-0" />}
            <span className={`text-xs ${c.done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
      {pct < 100 && (
        <Link
          href="/profil"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700"
        >
          Compléter mon profil <ArrowRight size={13} />
        </Link>
      )}
    </div>
  )
}

export default function DashboardClient({ user, profile, documents, albums }: Props) {
  const [activeTab, setActiveTab] = useState('profil')
  const [onboardingDone, setOnboardingDone] = useState(true)
  const member = profile.member

  useEffect(() => {
    try {
      const done = localStorage.getItem('ueemt_onboarding_done') === '1'
      if (profile.avatar_url && profile.bio) {
        localStorage.setItem('ueemt_onboarding_done', '1')
        setOnboardingDone(true)
      } else {
        setOnboardingDone(done)
      }
    } catch {
      setOnboardingDone(!(!profile.bio || !profile.avatar_url))
    }
  }, [profile.avatar_url, profile.bio])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-green-600 text-white py-8 sm:py-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-green-300 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-700 border-2 border-green-300 flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0">
              {member ? `${member.prenom[0]}${member.nom[0]}` : '?'}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black truncate">
              {member ? `${member.prenom} ${member.nom}` : 'Mon Espace'}
            </h1>
            <p className="text-green-200 text-sm truncate">{user.email}</p>
            <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${member?.is_validated ? 'bg-green-500/30 text-green-100' : 'bg-yellow-500/30 text-yellow-100'}`}>
                {member?.is_validated ? '✅ Validé' : '⏳ En attente'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${member?.cotisation_payee ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'}`}>
                Cotisation {member?.cotisation_payee ? '✅ payée' : '❌ non payée'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 sm:py-6">
        {/* Onboarding checklist */}
        {!onboardingDone && (!profile.bio || !profile.avatar_url) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <p className="font-bold text-amber-800 mb-3">👋 Bienvenue ! Voici tes premières étapes :</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-3">
                {profile.avatar_url
                  ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  : <Circle     size={18} className="text-amber-400 flex-shrink-0" />}
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
                {profile.bio
                  ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  : <Circle     size={18} className="text-amber-400 flex-shrink-0" />}
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

        {/* Tabs */}
        <div className="overflow-x-auto mb-5 sm:mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 min-w-max">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                  activeTab === id ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'profil' && (
          <>
            <ProfileCompletion profile={profile} />
            <ProfileTab user={user} profile={profile} />
          </>
        )}
        {activeTab === 'documents' && <DocumentsTab userId={user.id} documents={documents} />}
        {activeTab === 'photos'    && <PhotosTab userId={user.id} albums={albums} />}

        {activeTab === 'activites' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <PartyPopper size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Vie associative</h2>
                  <p className="text-xs text-gray-500">Tout ce qui se passe à l&apos;UEEMT-Tokat</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ACTIVITY_SHORTCUTS.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    className={`group flex items-start gap-3 rounded-xl border p-4 transition-all ${s.color}`}
                  >
                    <span className="text-2xl flex-shrink-0">{s.emoji}</span>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm ${s.iconColor} group-hover:underline`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-500 leading-snug mt-0.5">{s.desc}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 ml-auto mt-0.5 flex-shrink-0 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Prochaine feature : historique des activités du membre */}
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center">
              <div className="text-3xl mb-2">🚀</div>
              <p className="font-semibold text-gray-700 text-sm">Historique personnel à venir</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Tes posts, participations et cotisations apparaîtront ici dans une prochaine mise à jour.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
