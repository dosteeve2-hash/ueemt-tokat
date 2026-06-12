'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar } from '@/lib/supabase/storage'
import { CheckCircle } from 'lucide-react'

interface Props {
  user: { id: string; email: string }
  profile: {
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
    } | null
  }
}

export default function ProfileTab({ user, profile }: Props) {
  const member = profile.member
  const [bio, setBio] = useState(profile.bio ?? '')
  const [telephone, setTelephone] = useState(member?.telephone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('user_profiles')
      .update({ bio })
      .eq('id', user.id)
    if (member) {
      await supabase
        .from('members')
        .update({ telephone })
        .eq('id', member.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadAvatar(user.id, file)
    if (url) {
      const supabase = createClient()
      await supabase.from('user_profiles').update({ avatar_url: url }).eq('id', user.id)
      setAvatarUrl(url)
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold mb-5">Photo de profil</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-green-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-100 border-2 border-green-200 flex items-center justify-center text-2xl font-bold text-green-700">
                {member ? `${member.prenom[0]}${member.nom[0]}` : '?'}
              </div>
            )}
          </div>
          <div>
            <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-semibold inline-block transition-colors">
              {uploading ? 'Upload...' : 'Changer la photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
            <p className="text-gray-400 text-xs mt-1">JPG, PNG — max 5 MB</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold mb-5">Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['Prénom', member?.prenom],
            ['Nom', member?.nom],
            ['Filière', member?.filiere],
            ['Niveau', member?.niveau],
            ['Université / Lycée', member?.universite],
            ['Statut', member?.statut],
            ['N° Étudiant', member?.num_etudiant],
          ].map(([label, value]) => (
            <div key={label as string}>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label as string}</label>
              <p className="text-gray-900 font-medium text-sm">{(value as string) || '—'}</p>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Parle un peu de toi..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors"
        >
          {saved ? <><CheckCircle size={16} /> Sauvegardé !</> : saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
