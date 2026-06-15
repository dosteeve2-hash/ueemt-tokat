'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import {
  Users, CheckCircle, Clock, Image as ImageIcon,
  Plus, ChevronDown, ChevronUp, Pencil, Trash2, Upload, X, Check, Settings, UserCheck, UserX,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadPhoto } from '@/lib/supabase/storage'
import { approuverMembre, refuserMembre } from '@/app/dashboard/admin/actions'
import { toast } from '@/lib/toast'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/hooks/useModal'

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
  cover_url: string | null
  created_at: string
}

interface Photo {
  id: string
  url: string
  caption: string | null
  created_at: string
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

function extractStoragePath(url: string): string {
  const marker = '/object/public/photos/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : ''
}

function extractAvatarPath(url: string): string {
  const marker = '/object/public/avatars/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : ''
}

export default function AdminDashboardClient({
  user,
  profile,
  members: initMembers,
  albums: initAlbums,
  activities: initActivities,
  stats,
}: Props) {
  const [tab, setTab] = useState<'membres' | 'albums' | 'activites' | 'params'>('membres')
  const [members, setMembers] = useState(initMembers)
  const [albums, setAlbums] = useState(initAlbums)
  const [activities, setActivities] = useState(initActivities)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [, startApprovalTransition] = useTransition()
  const refuseModal = useModal()
  const [memberToReject, setMemberToReject] = useState<Member | null>(null)

  // Album creation
  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [albumForm, setAlbumForm] = useState({ titre: '', description: '' })
  const [savingAlbum, setSavingAlbum] = useState(false)

  // Album edit
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ titre: '', description: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Album delete
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null)

  // Album photos
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null)
  const [albumPhotos, setAlbumPhotos] = useState<Record<string, Photo[]>>({})
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({})
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({})
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null)
  const [editCaptionId, setEditCaptionId] = useState<string | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Activity creation
  const [showActForm, setShowActForm] = useState(false)
  const [actForm, setActForm] = useState({ titre: '', description: '', date: '', instagram_url: '' })
  const [savingAct, setSavingAct] = useState(false)

  // Site settings (params tab)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')
  const [heroTitle, setHeroTitle] = useState('UEEMT-TOKAT')
  const [heroSubtitle, setHeroSubtitle] = useState("Union des Élèves et Étudiants Maliens à Tokat")
  const [heroTagline, setHeroTagline] = useState('Travail – Solidarité – Réussite')
  const [heroPhotos, setHeroPhotos] = useState<string[]>([])
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingHeroPhoto, setUploadingHeroPhoto] = useState(false)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const heroPhotoFileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Load settings when params tab opens
  useEffect(() => {
    if (tab !== 'params' || settingsLoaded || loadingSettings) return
    setLoadingSettings(true)
    const load = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('key, value')
        if (data) {
          const map = Object.fromEntries(data.map((r) => [r.key, r.value ?? '']))
          if (map.logo_url) setLogoUrl(map.logo_url)
          if (map.hero_title) setHeroTitle(map.hero_title)
          if (map.hero_subtitle) setHeroSubtitle(map.hero_subtitle)
          if (map.hero_tagline) setHeroTagline(map.hero_tagline)
          if (map.hero_photo_urls) {
            try { setHeroPhotos(JSON.parse(map.hero_photo_urls) as string[]) } catch {}
          }
        }
      } finally {
        setSettingsLoaded(true)
        setLoadingSettings(false)
      }
    }
    void load()
  }, [tab, settingsLoaded, loadingSettings])

  // ── Helpers ────────────────────────────────────────────────────
  const upsertSetting = async (key: string, value: string) => {
    await supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
  }

  // ── Members ───────────────────────────────────────────────────
  const handleApprouver = (id: string) => {
    setApprovingId(id)
    startApprovalTransition(async () => {
      const { error } = await approuverMembre(id)
      if (error) {
        toast.error('Erreur lors de l\'approbation', error)
      } else {
        setMembers((m) => m.map((x) => (x.id === id ? { ...x, is_validated: true } : x)))
        toast.success('Membre approuvé !', 'Un email d\'accès lui a été envoyé.')
      }
      setApprovingId(null)
    })
  }

  const openRefuseModal = (member: Member) => {
    setMemberToReject(member)
    refuseModal.open()
  }

  const handleRefuser = () => {
    if (!memberToReject) return
    const id = memberToReject.id
    refuseModal.close()
    setMemberToReject(null)
    setRejectingId(id)
    startApprovalTransition(async () => {
      const { error } = await refuserMembre(id)
      if (error) {
        toast.error('Erreur', 'Impossible de refuser ce membre pour l\'instant.')
        setRejectingId(null)
      } else {
        setMembers((m) => m.filter((x) => x.id !== id))
        toast.info('Demande refusée')
        setRejectingId(null)
      }
    })
  }

  const toggleCotisation = async (id: string, current: boolean) => {
    await supabase.from('members').update({ cotisation_payee: !current }).eq('id', id)
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, cotisation_payee: !current } : x)))
  }

  // ── Albums CRUD ───────────────────────────────────────────────
  const createAlbum = async () => {
    if (!albumForm.titre.trim()) return
    setSavingAlbum(true)
    const { data } = await supabase
      .from('albums')
      .insert({ ...albumForm, created_by: user.id })
      .select()
      .single()
    if (data) setAlbums([data as Album, ...albums])
    setAlbumForm({ titre: '', description: '' })
    setShowAlbumForm(false)
    setSavingAlbum(false)
  }

  const startEditAlbum = (album: Album) => {
    setEditingAlbumId(album.id)
    setEditForm({ titre: album.titre, description: album.description ?? '' })
  }

  const saveEditAlbum = async (albumId: string) => {
    if (!editForm.titre.trim()) return
    setSavingEdit(true)
    await supabase
      .from('albums')
      .update({ titre: editForm.titre, description: editForm.description || null })
      .eq('id', albumId)
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === albumId ? { ...a, titre: editForm.titre, description: editForm.description || null } : a
      )
    )
    setEditingAlbumId(null)
    setSavingEdit(false)
  }

  const deleteAlbum = async (albumId: string) => {
    const photos = albumPhotos[albumId] ?? []
    for (const p of photos) {
      const path = extractStoragePath(p.url)
      if (path) await supabase.storage.from('photos').remove([path])
    }
    await supabase.from('albums').delete().eq('id', albumId)
    setAlbums((prev) => prev.filter((a) => a.id !== albumId))
    setDeletingAlbumId(null)
    if (expandedAlbumId === albumId) setExpandedAlbumId(null)
  }

  // ── Photos management ─────────────────────────────────────────
  const toggleExpand = async (albumId: string) => {
    if (expandedAlbumId === albumId) { setExpandedAlbumId(null); return }
    setExpandedAlbumId(albumId)
    if (!albumPhotos[albumId]) {
      setLoadingPhotos((prev) => ({ ...prev, [albumId]: true }))
      const { data } = await supabase
        .from('photos')
        .select('id, url, caption, created_at')
        .eq('album_id', albumId)
        .order('created_at', { ascending: true })
      setAlbumPhotos((prev) => ({ ...prev, [albumId]: (data ?? []) as Photo[] }))
      setLoadingPhotos((prev) => ({ ...prev, [albumId]: false }))
    }
  }

  const handleUploadPhotos = async (albumId: string, files: FileList) => {
    setUploadingPhotos((prev) => ({ ...prev, [albumId]: true }))
    const newPhotos: Photo[] = []
    for (const file of Array.from(files)) {
      const url = await uploadPhoto(albumId, file)
      if (url) {
        const caption = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
        const { data } = await supabase
          .from('photos')
          .insert({ album_id: albumId, url, caption, uploaded_by: user.id })
          .select()
          .single()
        if (data) {
          newPhotos.push(data as Photo)
          if (!albums.find((a) => a.id === albumId)?.cover_url) {
            await supabase.from('albums').update({ cover_url: url }).eq('id', albumId)
            setAlbums((prev) =>
              prev.map((a) => (a.id === albumId && !a.cover_url ? { ...a, cover_url: url } : a))
            )
          }
        }
      }
    }
    setAlbumPhotos((prev) => ({ ...prev, [albumId]: [...(prev[albumId] ?? []), ...newPhotos] }))
    setUploadingPhotos((prev) => ({ ...prev, [albumId]: false }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const deletePhoto = async (photo: Photo, albumId: string) => {
    setDeletingPhotoId(photo.id)
    const path = extractStoragePath(photo.url)
    if (path) await supabase.storage.from('photos').remove([path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setAlbumPhotos((prev) => ({
      ...prev,
      [albumId]: (prev[albumId] ?? []).filter((p) => p.id !== photo.id),
    }))
    setDeletingPhotoId(null)
  }

  const startEditCaption = (photo: Photo) => {
    setEditCaptionId(photo.id)
    setCaptionDraft(photo.caption ?? '')
  }

  const saveCaption = async (photoId: string, albumId: string) => {
    await supabase.from('photos').update({ caption: captionDraft || null }).eq('id', photoId)
    setAlbumPhotos((prev) => ({
      ...prev,
      [albumId]: (prev[albumId] ?? []).map((p) =>
        p.id === photoId ? { ...p, caption: captionDraft || null } : p
      ),
    }))
    setEditCaptionId(null)
  }

  // ── Activities ────────────────────────────────────────────────
  const createActivity = async () => {
    if (!actForm.titre.trim()) return
    setSavingAct(true)
    const { data } = await supabase
      .from('activities')
      .insert({
        titre: actForm.titre,
        description: actForm.description || null,
        date: actForm.date || null,
        instagram_url: actForm.instagram_url || null,
        created_by: user.id,
      })
      .select()
      .single()
    if (data) setActivities([data as Activity, ...activities])
    setActForm({ titre: '', description: '', date: '', instagram_url: '' })
    setShowActForm(false)
    setSavingAct(false)
  }

  // ── Settings ─────────────────────────────────────────────────
  const saveHeroText = async () => {
    setSavingSettings(true)
    try {
      await upsertSetting('hero_title', heroTitle)
      await upsertSetting('hero_subtitle', heroSubtitle)
      await upsertSetting('hero_tagline', heroTagline)
      toast.success('Textes sauvegardés !', 'La page d\'accueil est mise à jour.')
    } catch {
      toast.error('Erreur lors de la sauvegarde', 'Réessaie dans un instant.')
    } finally {
      setSavingSettings(false)
    }
  }

  const uploadLogo = async (file: File) => {
    setUploadingLogo(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `site/logo.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
      await upsertSetting('logo_url', data.publicUrl)
      toast.success('Logo mis à jour !')
    } else {
      toast.error('Erreur upload logo', 'Vérifie le format du fichier.')
    }
    setUploadingLogo(false)
    if (logoFileRef.current) logoFileRef.current.value = ''
  }

  const uploadHeroPhoto = async (file: File) => {
    setUploadingHeroPhoto(true)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `hero/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('photos').upload(path, file)
    if (!error) {
      const { data } = supabase.storage.from('photos').getPublicUrl(path)
      const newPhotos = [...heroPhotos, data.publicUrl]
      setHeroPhotos(newPhotos)
      await upsertSetting('hero_photo_urls', JSON.stringify(newPhotos))
    }
    setUploadingHeroPhoto(false)
    if (heroPhotoFileRef.current) heroPhotoFileRef.current.value = ''
  }

  const removeHeroPhoto = async (url: string) => {
    const newPhotos = heroPhotos.filter((p) => p !== url)
    setHeroPhotos(newPhotos)
    await upsertSetting('hero_photo_urls', JSON.stringify(newPhotos))
    // Also remove from storage if it's a hero/ photo
    const path = extractStoragePath(url)
    if (path.startsWith('hero/')) {
      await supabase.storage.from('photos').remove([path])
    }
  }

  const statCards = [
    { label: 'Total membres', value: stats.totalMembers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'En attente', value: stats.pending, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Cotisation payée', value: stats.cotisationPaid, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ]

  const TABS = [
    { id: 'membres', label: 'Membres' },
    { id: 'albums', label: 'Albums' },
    { id: 'activites', label: 'Activités' },
    { id: 'params', label: 'Paramètres', icon: Settings },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white py-8 sm:py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-green-300 text-xs uppercase tracking-widest mb-1">Dashboard Admin</p>
          <h1 className="text-2xl sm:text-3xl font-black">
            {profile.member ? `${profile.member.prenom} ${profile.member.nom}` : 'Bureau Exécutif'}
          </h1>
          <p className="text-green-200 text-sm">{user.email}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex sm:block items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div className="sm:mt-3">
                <p className="text-2xl sm:text-3xl font-black text-gray-900">{value}</p>
                <p className="text-gray-500 text-sm">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto mb-6">
          <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 min-w-max">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  tab === id ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {id === 'params' && <Settings size={14} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── MEMBRES ── */}
        {tab === 'membres' && (() => {
          const pending = members.filter(m => !m.is_validated)
          const validated = members.filter(m => m.is_validated)
          return (
            <div className="space-y-6">
              {/* Inscriptions en attente */}
              {pending.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock size={14} /> Inscriptions en attente ({pending.length})
                  </h2>
                  <div className="space-y-3">
                    {pending.map((m) => (
                      <div key={m.id} className="bg-white rounded-xl border border-orange-100 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">
                            {m.prenom[0]}{m.nom[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{m.prenom} {m.nom}</p>
                            <p className="text-gray-400 text-xs truncate">{m.filiere ?? m.statut}</p>
                            {m.universite && <p className="text-gray-400 text-xs">{m.universite}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleApprouver(m.id)}
                              disabled={approvingId === m.id || rejectingId === m.id}
                              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-bold min-h-[36px] transition-colors"
                            >
                              <UserCheck size={13} />
                              {approvingId === m.id ? 'Envoi...' : 'Approuver'}
                            </button>
                            <button
                              onClick={() => openRefuseModal(m)}
                              disabled={approvingId === m.id || rejectingId === m.id}
                              className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 disabled:opacity-60 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold min-h-[36px] transition-colors"
                            >
                              <UserX size={13} />
                              {rejectingId === m.id ? '...' : 'Refuser'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Membres validés */}
              <div>
                {pending.length > 0 && (
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle size={14} /> Membres validés ({validated.length})
                  </h2>
                )}
                <div className="space-y-3">
                  {validated.map((m) => (
                    <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                          {m.prenom[0]}{m.nom[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{m.prenom} {m.nom}</p>
                          <p className="text-gray-400 text-xs truncate">{m.filiere ?? m.statut}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">Validé</span>
                          <button
                            onClick={() => toggleCotisation(m.id, m.cotisation_payee)}
                            className={`text-xs px-2 py-1.5 rounded-lg border font-medium min-h-[36px] ${m.cotisation_payee ? 'border-green-200 text-green-600 bg-green-50' : 'border-red-200 text-red-500'}`}
                          >
                            Cotis.
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {validated.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                      Aucun membre validé pour l'instant.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── ALBUMS ── */}
        {tab === 'albums' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAlbumForm(!showAlbumForm)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors min-h-[44px]"
              >
                <Plus size={16} /> Nouvel album
              </button>
            </div>

            {showAlbumForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <input
                  placeholder="Titre de l'album *"
                  value={albumForm.titre}
                  onChange={(e) => setAlbumForm({ ...albumForm, titre: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  placeholder="Description (optionnel)"
                  value={albumForm.description}
                  onChange={(e) => setAlbumForm({ ...albumForm, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowAlbumForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold min-h-[44px]">
                    Annuler
                  </button>
                  <button onClick={createAlbum} disabled={savingAlbum} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 min-h-[44px]">
                    {savingAlbum ? 'Création...' : 'Créer'}
                  </button>
                </div>
              </div>
            )}

            {albums.length === 0 && !showAlbumForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
                <ImageIcon size={40} className="mx-auto mb-3 text-gray-200" />
                <p className="text-sm">Aucun album. Créez-en un pour commencer.</p>
              </div>
            )}

            {albums.map((album) => (
              <div key={album.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5">
                  {editingAlbumId === album.id ? (
                    <div className="space-y-3">
                      <input
                        value={editForm.titre}
                        onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description (optionnel)"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingAlbumId(null)} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm min-h-[36px]">
                          <X size={14} /> Annuler
                        </button>
                        <button onClick={() => saveEditAlbum(album.id)} disabled={savingEdit} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-60 min-h-[36px]">
                          <Check size={14} /> Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 sm:gap-4">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.titre} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={24} className="text-green-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm">{album.titre}</p>
                        {album.description && <p className="text-gray-500 text-xs mt-0.5">{album.description}</p>}
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(album.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEditAlbum(album)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Modifier">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeletingAlbumId(album.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                          <Trash2 size={15} />
                        </button>
                        <button
                          onClick={() => toggleExpand(album.id)}
                          className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          {expandedAlbumId === album.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span className="hidden sm:inline">Photos</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {deletingAlbumId === album.id && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="text-sm font-semibold text-red-700 mb-3">
                        Supprimer « {album.titre} » ? Toutes les photos seront supprimées.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setDeletingAlbumId(null)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm min-h-[44px]">
                          Annuler
                        </button>
                        <button onClick={() => deleteAlbum(album.id)} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-600 min-h-[44px]">
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {expandedAlbumId === album.id && (
                  <div className="border-t border-gray-100 p-4 sm:p-5 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm font-semibold text-gray-700">
                        Photos ({(albumPhotos[album.id] ?? []).length})
                      </p>
                      <label className={`flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[36px] ${uploadingPhotos[album.id] ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-green-700'}`}>
                        {uploadingPhotos[album.id] ? (
                          <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Upload...</>
                        ) : (
                          <><Upload size={13} />Ajouter</>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingPhotos[album.id]}
                          onChange={(e) => e.target.files && handleUploadPhotos(album.id, e.target.files)}
                        />
                      </label>
                    </div>

                    {loadingPhotos[album.id] ? (
                      <p className="text-center text-sm text-gray-400 py-6">Chargement...</p>
                    ) : (albumPhotos[album.id] ?? []).length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-6">Aucune photo.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {(albumPhotos[album.id] ?? []).map((photo) => (
                          <div key={photo.id} className="group relative">
                            <div className="aspect-square overflow-hidden rounded-lg bg-gray-200">
                              <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                              <button onClick={() => startEditCaption(photo)} className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded text-xs backdrop-blur-sm">
                                <Pencil size={11} /> Légende
                              </button>
                              <button onClick={() => deletePhoto(photo, album.id)} disabled={deletingPhotoId === photo.id} className="flex items-center gap-1 bg-red-500/80 hover:bg-red-600 text-white px-2 py-1 rounded text-xs disabled:opacity-60">
                                <Trash2 size={11} />
                                {deletingPhotoId === photo.id ? '...' : 'Suppr.'}
                              </button>
                            </div>
                            {editCaptionId === photo.id && (
                              <div className="absolute inset-0 bg-white rounded-lg p-2 flex flex-col gap-1.5 shadow-lg z-10">
                                <input
                                  value={captionDraft}
                                  onChange={(e) => setCaptionDraft(e.target.value)}
                                  placeholder="Légende..."
                                  className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <button onClick={() => setEditCaptionId(null)} className="flex-1 border border-gray-200 text-gray-500 py-1 rounded text-xs">✕</button>
                                  <button onClick={() => saveCaption(photo.id, album.id)} className="flex-1 bg-green-600 text-white py-1 rounded text-xs font-bold">✓</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ACTIVITES ── */}
        {tab === 'activites' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowActForm(!showActForm)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 min-h-[44px]"
              >
                <Plus size={16} /> Nouvelle activité
              </button>
            </div>

            {showActForm && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <input placeholder="Titre *" value={actForm.titre} onChange={(e) => setActForm({ ...actForm, titre: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <textarea placeholder="Description" value={actForm.description} onChange={(e) => setActForm({ ...actForm, description: e.target.value })}
                  rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <input type="date" value={actForm.date} onChange={(e) => setActForm({ ...actForm, date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input placeholder="Lien Instagram (optionnel)" value={actForm.instagram_url} onChange={(e) => setActForm({ ...actForm, instagram_url: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-3">
                  <button onClick={() => setShowActForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold min-h-[44px]">Annuler</button>
                  <button onClick={createActivity} disabled={savingAct} className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 min-h-[44px]">
                    {savingAct ? 'Création...' : 'Publier'}
                  </button>
                </div>
              </div>
            )}

            {activities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">Aucune activité publiée.</div>
            ) : (
              <div className="space-y-3">
                {activities.map((a) => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">{a.titre}</p>
                        {a.description && <p className="text-gray-500 text-sm mt-1">{a.description}</p>}
                      </div>
                      {a.date && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg flex-shrink-0">
                          {new Date(a.date).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PARAMÈTRES ── */}
        {tab === 'params' && (
          <div className="space-y-6">
            {loadingSettings && (
              <div className="text-center py-8 text-gray-400 text-sm">Chargement des paramètres...</div>
            )}

            {!loadingSettings && (
              <>
                {/* Logo */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Logo de l'association</h3>
                  <div className="flex items-center gap-5 flex-wrap">
                    <img src={logoUrl} alt="Logo actuel" className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                    <div>
                      <label className={`flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors min-h-[44px] ${uploadingLogo ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        {uploadingLogo ? (
                          <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Upload...</>
                        ) : (
                          <><Upload size={16} />Changer le logo</>
                        )}
                        <input
                          ref={logoFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingLogo}
                          onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                        />
                      </label>
                      <p className="text-gray-400 text-xs mt-2">JPEG, PNG — sera visible dans la navbar</p>
                    </div>
                  </div>
                </div>

                {/* Hero text */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Texte de la page d'accueil</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Titre principal</label>
                      <input
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        placeholder="UEEMT-TOKAT"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Sous-titre</label>
                      <input
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Slogan</label>
                      <input
                        value={heroTagline}
                        onChange={(e) => setHeroTagline(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <button
                      onClick={saveHeroText}
                      disabled={savingSettings}
                      className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-60 transition-colors min-h-[44px]"
                    >
                      {savingSettings ? 'Sauvegarde...' : 'Sauvegarder les textes'}
                    </button>
                  </div>
                </div>

                {/* Hero photos */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                    <div>
                      <h3 className="font-bold text-gray-900">Photos du slideshow (accueil)</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{heroPhotos.length} photo{heroPhotos.length !== 1 ? 's' : ''} active{heroPhotos.length !== 1 ? 's' : ''}</p>
                    </div>
                    <label className={`flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-green-700 transition-colors min-h-[44px] ${uploadingHeroPhoto ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      {uploadingHeroPhoto ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Upload...</>
                      ) : (
                        <><Upload size={16} />Ajouter une photo</>
                      )}
                      <input
                        ref={heroPhotoFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingHeroPhoto}
                        onChange={(e) => e.target.files?.[0] && uploadHeroPhoto(e.target.files[0])}
                      />
                    </label>
                  </div>

                  {heroPhotos.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
                      <ImageIcon size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Aucune photo. Uploadez-en pour activer le slideshow.</p>
                      <p className="text-xs mt-1">Sans photo, l'accueil affiche le fond dégradé vert.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {heroPhotos.map((url) => (
                        <div key={url} className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                          <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => removeHeroPhoto(url)}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                              title="Retirer du slideshow"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={refuseModal.isOpen}
        onClose={refuseModal.close}
        onConfirm={handleRefuser}
        title={memberToReject ? `Refuser ${memberToReject.prenom} ${memberToReject.nom} ?` : 'Refuser ce membre ?'}
        description="Cette action est irréversible. La demande d'inscription sera définitivement refusée."
        confirmLabel="Refuser"
        confirmVariant="danger"
        isLoading={!!rejectingId}
      />
    </div>
  )
}
