import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ArchivesRecensementClient from './ArchivesRecensementClient'
import ArchivesUploadForm from './ArchivesUploadForm'

type ArchiveDoc = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  content_summary: string | null
  category: string
  date_document: string | null
  file_url: string | null
  emoji: string | null
}

type ArchiveMembre = {
  id: string
  nom_complet: string
  filiere: string | null
  annee_arrivee: number | null
  ville_origine: string | null
  date_recensement: string
  member_id: string | null
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  juridique:  { label: 'Document officiel', color: 'bg-blue-100 text-blue-700' },
  annonce:    { label: 'Annonce',            color: 'bg-amber-100 text-amber-700' },
  evenement:  { label: 'Événement',          color: 'bg-purple-100 text-purple-700' },
  historique: { label: 'Histoire',           color: 'bg-green-100 text-green-700' },
  autre:      { label: 'Document',           color: 'bg-gray-100 text-gray-600' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const ROLES_BUREAU = ['admin', 'president', 'tresorier', 'adjoint_tresorier', 'secretaire', 'caissier']

export default async function ArchivesPage() {
  const supabase = await createClient()

  // Auth check — silently, no redirect (page is public)
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: docs }, { data: membres }] = await Promise.all([
    supabase
      .from('archive_documents')
      .select('id, title, subtitle, description, content_summary, category, date_document, file_url, emoji')
      .eq('is_public', true)
      .order('date_document', { ascending: false }),
    supabase
      .from('archive_recensement')
      .select('id, nom_complet, filiere, annee_arrivee, ville_origine, date_recensement, member_id')
      .order('date_recensement', { ascending: true }),
  ])

  let isBureau = false
  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isBureau = profile != null && ROLES_BUREAU.includes(profile.role)
  }

  const archives = (docs ?? []) as ArchiveDoc[]
  const membresRecenses = (membres ?? []) as ArchiveMembre[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-green-600 text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-8xl">🗂️</div>
        </div>
        <div className="max-w-4xl mx-auto px-4 relative">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Mémoire de l&apos;association</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black">Archives</h1>
          <p className="text-green-100 mt-3 text-base sm:text-lg max-w-xl">
            Retrouvez ici le recensement officiel des membres et les documents historiques de l&apos;UEEMT-Tokat.
          </p>
        </div>
      </header>

      {/* Stats banner */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap gap-6 text-sm text-gray-600">
          <span>📅 Fondée le <strong>2 novembre 2022</strong></span>
          <span>🧑‍🎓 <strong>{membresRecenses.length}</strong> membre{membresRecenses.length > 1 ? 's' : ''} recensé{membresRecenses.length > 1 ? 's' : ''}</span>
          <span>📜 <strong>{archives.length}</strong> document{archives.length > 1 ? 's' : ''} archivé{archives.length > 1 ? 's' : ''}</span>
          <span>🌍 Basée à <strong>Tokat, Türkiye</strong></span>
        </div>
      </div>

      {/* ── Formulaire bureau (upload document) ── */}
      {isBureau && (
        <section className="max-w-4xl mx-auto px-4 pt-8">
          <ArchivesUploadForm />
        </section>
      )}

      {/* ── Section Recensement ── */}
      <section className="max-w-4xl mx-auto px-4 pt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-xl">🧑‍🎓</div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recensement des Maliens à Tokat</h2>
            <p className="text-gray-500 text-sm">Liste officielle depuis la création de l&apos;UEEMT</p>
          </div>
        </div>

        <ArchivesRecensementClient membres={membresRecenses} />
      </section>

      {/* ── Section Documents ── */}
      {archives.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">📂</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Documents officiels</h2>
              <p className="text-gray-500 text-sm">Actes, annonces et événements historiques</p>
            </div>
          </div>

          {archives.map((doc) => {
            const cat = CATEGORY_LABELS[doc.category] ?? CATEGORY_LABELS.autre
            return (
              <article key={doc.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-2xl">
                      {doc.emoji ?? '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.color}`}>
                          {cat.label}
                        </span>
                        {doc.date_document && (
                          <span className="text-xs text-gray-400">{formatDate(doc.date_document)}</span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{doc.title}</h3>
                      {doc.subtitle && (
                        <p className="text-sm text-green-600 font-medium mt-0.5">{doc.subtitle}</p>
                      )}
                      {doc.description && (
                        <p className="text-gray-600 text-sm mt-3 leading-relaxed">{doc.description}</p>
                      )}
                      {doc.content_summary && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📋 Points clés</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{doc.content_summary}</p>
                        </div>
                      )}
                      {doc.file_url && (
                        <div className="mt-4">
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                          >
                            ⬇️ Télécharger le document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      {/* CTA membres */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-green-600 rounded-2xl p-8 text-white text-center">
          <div className="text-4xl mb-3">🌍</div>
          <h3 className="text-xl font-bold mb-2">Tu es malien à Tokat ?</h3>
          <p className="text-green-100 text-sm mb-5 max-w-sm mx-auto">
            Rejoins la communauté UEEMT-Tokat et fais partie de l&apos;histoire de notre association.
          </p>
          <Link
            href="/recensement"
            className="inline-block bg-white text-green-700 font-bold px-6 py-3 rounded-full hover:bg-green-50 transition-colors"
          >
            Se recenser →
          </Link>
        </div>
      </section>
    </div>
  )
}
