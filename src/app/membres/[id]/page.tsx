import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Calendar, Award, Mail, Lock, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('members')
    .select('prenom, nom')
    .eq('id', id)
    .eq('is_validated', true)
    .maybeSingle()

  if (!member) return { title: 'Membre introuvable | UEEMT-Tokat' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('avatar_url')
    .eq('member_id', id)
    .maybeSingle()

  const name = `${member.prenom} ${member.nom}`
  return {
    title: `Profil de ${name} | UEEMT-Tokat`,
    openGraph: {
      title: `Profil de ${name} | UEEMT-Tokat`,
      description: `Découvrez le profil de ${name}, membre de l'UEEMT-Tokat.`,
      images: profile?.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
  }
}

export default async function MembreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('members')
    .select('id, prenom, nom, filiere, niveau, statut, universite, created_at')
    .eq('id', id)
    .eq('is_validated', true)
    .maybeSingle()

  if (!member) notFound()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, avatar_url, bio, quote, is_public')
    .eq('member_id', id)
    .maybeSingle()

  // Redirect owner to their own edit page
  if (user && profile && user.id === profile.id) {
    redirect('/profil')
  }

  // Private profile guard
  if (profile && !profile.is_public) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Ce profil est privé</h2>
        <p className="text-gray-400 text-sm mb-6 max-w-xs">
          Ce membre a choisi de ne pas rendre son profil public.
        </p>
        <Link
          href="/membres"
          className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
        >
          <ArrowLeft size={15} /> Retour aux membres
        </Link>
      </div>
    )
  }

  // Fetch recent posts if member has a public profile
  let recentPosts: { id: string; content: string | null; image_url: string | null; created_at: string }[] = []
  if (profile?.is_public) {
    const { data } = await supabase
      .from('posts')
      .select('id, content, image_url, created_at')
      .eq('author_id', profile.id)
      .eq('type', 'post')
      .order('created_at', { ascending: false })
      .limit(3)
    recentPosts = data ?? []
  }

  const initials = `${member.prenom?.[0] ?? ''}${member.nom?.[0] ?? ''}`.toUpperCase()
  const memberSince = new Date(member.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/membres"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Retour aux membres
        </Link>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="h-24 bg-gradient-to-r from-green-600 to-green-700" />

          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4 flex items-end justify-between">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${member.prenom} ${member.nom}`}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-3xl font-black ring-4 ring-white shadow-sm">
                  {initials}
                </div>
              )}

              {user && (
                <Link
                  href={`/contact?membre=${encodeURIComponent(`${member.prenom} ${member.nom}`)}`}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  <Mail size={14} />
                  Envoyer un message
                </Link>
              )}
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-gray-900">
                  {member.prenom} {member.nom}
                </h1>
                {profile?.role && (
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    profile.role === 'admin'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {profile.role === 'admin' ? 'Bureau' : 'Membre'}
                  </span>
                )}
              </div>
            </div>

            {profile?.quote && (
              <blockquote className="mt-4 pl-4 border-l-4 border-green-300 text-gray-600 italic text-sm leading-relaxed">
                &ldquo;{profile.quote}&rdquo;
              </blockquote>
            )}

            {profile?.bio && (
              <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio}</p>
            )}

            {!profile && (
              <p className="mt-4 text-gray-400 text-sm italic">Ce membre n&apos;a pas encore complété son profil.</p>
            )}

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {member.filiere && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <GraduationCap size={16} className="text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Filière</p>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{member.filiere}</p>
                  </div>
                </div>
              )}
              {member.niveau && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <Award size={16} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Niveau</p>
                    <p className="text-sm font-semibold text-gray-900">{member.niveau}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Calendar size={16} className="text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Membre depuis</p>
                  <p className="text-sm font-semibold text-gray-900">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent posts */}
        {recentPosts.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={14} /> Posts récents
            </h2>
            <div className="space-y-3">
              {recentPosts.map(p => (
                <Link
                  key={p.id}
                  href={`/feed#post-${p.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-green-200 hover:shadow-sm transition-all"
                >
                  {p.content && (
                    <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{p.content}</p>
                  )}
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt=""
                      className="mt-2 rounded-lg w-full object-cover max-h-40"
                      loading="lazy"
                    />
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(p.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </Link>
              ))}
            </div>
            <Link
              href="/feed"
              className="inline-block mt-3 text-xs text-green-600 hover:text-green-700 font-medium"
            >
              Voir le fil d&apos;actualité →
            </Link>
          </div>
        )}

        {/* No posts CTA when profile exists but no posts */}
        {profile?.is_public && recentPosts.length === 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-3">✍️</div>
            <p className="text-gray-500 text-sm">Ce membre n&apos;a pas encore publié de post.</p>
            <Link
              href="/feed"
              className="inline-block mt-3 text-xs text-green-600 hover:text-green-700 font-medium"
            >
              Voir le fil d&apos;actualité →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
