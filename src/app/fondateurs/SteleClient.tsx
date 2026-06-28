'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, Star } from 'lucide-react'
import { uploadFounderPhoto } from '@/lib/supabase/storage'
import { saveFounderPhotoUrl } from './actions'
import type { FounderKey, FounderPhotos } from './actions'

// ─── Données des fondateurs ───────────────────────────────────────────────────
const FONDATEURS = [
  {
    key: 'zack' as const,
    nom: 'Zakaria BENGALY',
    surnom: 'Zack',
    titre: 'Membre Fondateur & 1er Président',
    mandat: 'Nov. 2022 – Déc. 2023',
    statut: 'fondateur' as const,
    description:
      "Il a convoqué en octobre 2022 le premier rassemblement des étudiants maliens de Tokat. Élu à l'unanimité premier président le 29 octobre 2022, il fonde officiellement l'AEMTO le 2 novembre 2022 — l'acte de naissance de ce qui deviendrait l'UEEMT-Tokat.",
    citation: "L'UEEMT-Tokat, c'est d'abord son rêve.",
    photo: '/presidents/zakaria-bengaly.jpeg',
    uploadable: false,
  },
  {
    key: 'mansa' as const,
    nom: 'Mansa Makan KOUYATÉ',
    surnom: 'Mansa',
    titre: '2ème Président',
    mandat: 'Jan. 2024 – 2024',
    statut: 'ancien' as const,
    description:
      "Il a consolidé les fondations de l'union et renforcé la cohésion entre les membres lors des premières élections démocratiques.",
    citation: null,
    photo: null,
    uploadable: true,
  },
  {
    key: 'idy' as const,
    nom: 'Idriss Ali ONGOÏBA',
    surnom: 'Idy',
    titre: '3ème Président',
    mandat: '2024 – 2025',
    statut: 'ancien' as const,
    description:
      "Sous sa direction, l'UEEMT a continué de grandir et de se structurer, portant haut les valeurs fondatrices.",
    citation: null,
    photo: null,
    uploadable: true,
  },
] as const

type FondateurKey = (typeof FONDATEURS)[number]['key']

// ─── Photo avec fallback ──────────────────────────────────────────────────────
function FounderPhoto({
  src,
  nom,
  size = 'md',
  ring = 'ring-amber-400/60',
}: {
  src: string | null
  nom: string
  size?: 'lg' | 'md'
  ring?: string
}) {
  const [failed, setFailed] = useState(false)
  const cls = size === 'lg'
    ? 'w-32 h-32 sm:w-40 sm:h-40 text-5xl'
    : 'w-24 h-24 text-3xl'

  if (!src || failed) {
    return (
      <div
        className={`${cls} mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-amber-400/50 ring-2 ${ring} flex items-center justify-center select-none`}
      >
        <span role="img" aria-label={nom}>👤</span>
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={nom}
      className={`${cls} mx-auto rounded-full object-cover object-top border-2 border-amber-400/50 ring-2 ${ring} shadow-lg shadow-amber-400/10`}
      onError={() => setFailed(true)}
    />
  )
}

// ─── Bouton upload photo ──────────────────────────────────────────────────────
function UploadPhotoButton({
  founderKey,
  onUploaded,
}: {
  founderKey: FounderKey
  onUploaded: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const url = await uploadFounderPhoto(founderKey, file)
      if (!url) throw new Error('Upload échoué')
      const res = await saveFounderPhotoUrl(founderKey, url)
      if (!res.success) throw new Error(res.error ?? 'Erreur serveur')
      onUploaded(url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="mt-3 flex flex-col items-center gap-1">
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Camera size={12} />
        )}
        {uploading ? 'Upload…' : 'Changer la photo'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && (
        <p className="text-red-400 text-xs mt-1 text-center">{error}</p>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  founderPhotos: FounderPhotos
  canEdit: boolean
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SteleClient({ founderPhotos, canEdit }: Props) {
  // State local pour les URLs uploadées (remplace les valeurs initiales)
  const [photos, setPhotos] = useState<Record<string, string | null>>({
    mansa: founderPhotos.mansa,
    idy: founderPhotos.idy,
  })

  const getPhoto = (f: (typeof FONDATEURS)[number]) => {
    if (f.uploadable) return photos[f.key] ?? null
    return f.photo
  }

  const fondateur = FONDATEURS[0]
  const successeurs = FONDATEURS.slice(1)

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 pt-16 pb-12 px-4">
        {/* Glow décoratif */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-400/5 rounded-full blur-3xl" />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-amber-400/8 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Drapeau Mali */}
          <div className="flex justify-center gap-1 mb-6">
            <div className="h-1.5 w-10 bg-green-500 rounded" />
            <div className="h-1.5 w-10 bg-yellow-400 rounded" />
            <div className="h-1.5 w-10 bg-red-500 rounded" />
          </div>

          <span className="inline-block bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            🏛️ Mémoire &amp; Honneur
          </span>

          <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 leading-tight">
            Stèle des Fondateurs
          </h1>
          <p className="text-slate-400 mt-4 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            À ceux qui ont eu le courage de bâtir quelque chose là où il n&apos;y avait rien.
            L&apos;UEEMT-Tokat leur doit son existence.
          </p>

          <p className="mt-6 text-slate-500 text-sm italic">
            Fondée le 2 novembre 2022 · Tokat, Türkiye
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* ── Grand hommage au Fondateur ─────────────────────────────────── */}
        <section>
          <div className="relative">
            {/* Badge flottant */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
              <span className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 text-xs font-black px-5 py-2 rounded-full shadow-xl shadow-amber-400/30 tracking-wide">
                <Star size={12} fill="currentColor" /> PRÉSIDENT FONDATEUR
              </span>
            </div>

            {/* Card fondateur */}
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-800/60 border border-amber-400/30 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-amber-400/5 backdrop-blur">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">

                {/* Photo */}
                <div className="flex-shrink-0 text-center">
                  <FounderPhoto
                    src={fondateur.photo}
                    nom={fondateur.nom}
                    size="lg"
                    ring="ring-amber-400/50"
                  />
                  <div className="mt-3 inline-block bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-1">
                    <span className="text-amber-300 text-xs font-mono font-semibold">{fondateur.mandat}</span>
                  </div>
                </div>

                {/* Texte */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-block bg-slate-700/60 rounded-lg px-2 py-0.5 mb-2">
                    <span className="text-amber-400/70 text-xs font-bold uppercase tracking-widest">
                      {fondateur.surnom}
                    </span>
                  </div>
                  <h2 className="text-white font-black text-2xl sm:text-3xl leading-tight">
                    {fondateur.nom}
                  </h2>
                  <p className="text-amber-400 text-sm font-semibold mt-1 mb-5">{fondateur.titre}</p>

                  <p className="text-slate-300 text-base leading-relaxed mb-5">
                    {fondateur.description}
                  </p>

                  {fondateur.citation && (
                    <blockquote className="border-l-2 border-amber-400 pl-4 mb-5">
                      <p className="text-amber-300/80 italic text-sm font-medium">
                        &ldquo;{fondateur.citation}&rdquo;
                      </p>
                    </blockquote>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {[
                      '1er rassemblement · Oct. 2022',
                      'Élu à l\'unanimité · 29 oct. 2022',
                      'Fondation officielle · 2 nov. 2022',
                      '"Travail – Solidarité – Réussite"',
                    ].map((fact, i) => (
                      <span
                        key={i}
                        className="bg-slate-700/80 border border-slate-600/60 text-slate-300 text-xs px-3 py-1.5 rounded-full"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>

                  <p className="mt-5 text-xs text-slate-500 italic">
                    Membre du Conseil des Sages · Conseiller du bureau actuel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Séparateur ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Leurs successeurs</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* ── Successeurs (Mansa & Idy) ──────────────────────────────────── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {successeurs.map((f) => (
              <div
                key={f.key}
                className="relative bg-slate-800/60 border border-slate-700/60 hover:border-amber-400/30 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/5 group"
              >
                {/* Badge statut */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-slate-700 border border-slate-600 text-slate-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {f.titre}
                  </span>
                </div>

                {/* Photo */}
                <div className="mt-4 mb-4">
                  <FounderPhoto
                    src={getPhoto(f)}
                    nom={f.nom}
                    size="md"
                    ring="ring-amber-400/30 group-hover:ring-amber-400/50"
                  />
                </div>

                {/* Upload (visible si canEdit + uploadable) */}
                {canEdit && f.uploadable && (
                  <UploadPhotoButton
                    founderKey={f.key as FounderKey}
                    onUploaded={(url) => setPhotos(prev => ({ ...prev, [f.key]: url }))}
                  />
                )}

                <div className="mt-4">
                  <div className="text-xs text-slate-500 font-mono mb-1">{f.mandat}</div>
                  <h3 className="text-white font-black text-xl leading-tight">{f.nom}</h3>
                  <p className="text-amber-400/70 text-xs font-semibold mt-1 mb-4">{f.titre}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{f.description}</p>
                  {f.citation && (
                    <blockquote className="mt-4 border-l-2 border-amber-400/40 pl-3 text-left">
                      <p className="text-amber-300/60 italic text-xs">&ldquo;{f.citation}&rdquo;</p>
                    </blockquote>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/50">
                  <span className="text-slate-600 text-xs italic">Conseil des Sages</span>
                </div>
              </div>
            ))}
          </div>

          {/* Info upload pour non-admins */}
          {!canEdit && (
            <p className="text-center text-slate-600 text-xs mt-6 italic">
              Les membres du bureau peuvent ajouter les photos manquantes depuis leur compte.
            </p>
          )}
        </section>

        {/* ── Devise ─────────────────────────────────────────────────────── */}
        <section className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 text-center">
          <div className="flex justify-center gap-1 mb-5">
            <div className="h-1 w-8 bg-green-500 rounded" />
            <div className="h-1 w-8 bg-yellow-400 rounded" />
            <div className="h-1 w-8 bg-red-500 rounded" />
          </div>
          <p className="text-white text-lg font-bold italic mb-2">
            &ldquo;Travail – Solidarité – Réussite&rdquo;
          </p>
          <p className="text-slate-500 text-sm">
            Trois présidents. Une seule vision. Un seul héritage.
          </p>
          <p className="text-slate-600 text-xs mt-4">
            Les présidents sortants forment le Conseil des Sages de l&apos;UEEMT-Tokat.
          </p>
        </section>
      </div>
    </div>
  )
}
