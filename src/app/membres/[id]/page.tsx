import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Calendar, Award } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function MembreProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('members')
    .select('id, prenom, nom, filiere, niveau, statut, universite, created_at')
    .eq('id', id)
    .eq('is_validated', true)
    .maybeSingle()

  if (!member) notFound()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, avatar_url, bio, quote')
    .eq('member_id', id)
    .eq('is_public', true)
    .maybeSingle()

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

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="h-24 bg-gradient-to-r from-green-600 to-green-700" />

          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4">
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
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
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
      </div>
    </div>
  )
}
