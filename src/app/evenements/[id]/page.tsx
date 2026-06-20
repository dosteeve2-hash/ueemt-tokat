import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, ArrowLeft, Trophy, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import EventRsvpClient from './EventRsvpClient'

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  match:    { label: 'Match de foot', emoji: '⚽' },
  activite: { label: 'Activité', emoji: '🎉' },
  reunion:  { label: 'Réunion', emoji: '🗣️' },
  sortie:   { label: 'Sortie', emoji: '🚌' },
  autre:    { label: 'Événement', emoji: '📌' },
}

function formatFull(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  // Charger l'événement
  const { data: evt } = await supabase
    .from('events')
    .select('id, title, description, event_date, event_type, location, min_players, is_confirmed, is_cancelled, created_by, created_at')
    .eq('id', id)
    .single()

  if (!evt) notFound()

  // Charger les RSVPs + profils des votants
  const { data: rsvps } = await supabase
    .from('event_rsvps')
    .select('user_id, response, updated_at')
    .eq('event_id', id)

  const voterIds = (rsvps ?? []).map((r) => r.user_id as string)
  const { data: profiles } = voterIds.length > 0
    ? await supabase
        .from('user_profiles')
        .select('id, avatar_url, member:member_id(prenom, nom)')
        .in('id', voterIds)
    : { data: [] }

  type MemberRef = { prenom: string; nom: string } | null
  const profileMap = new Map(
    (profiles ?? []).map((p) => {
      const m = Array.isArray(p.member) ? (p.member[0] as MemberRef) : (p.member as MemberRef)
      return [
        p.id as string,
        {
          avatar_url: p.avatar_url as string | null,
          name: m ? `${m.prenom} ${m.nom}` : 'Membre',
          initials: m ? `${m.prenom[0]}${m.nom[0]}` : '??',
        },
      ]
    })
  )

  const oui = (rsvps ?? []).filter((r) => r.response === 'oui')
  const nonR = (rsvps ?? []).filter((r) => r.response === 'non')
  const peut = (rsvps ?? []).filter((r) => r.response === 'peut_etre')
  const myRsvp = (rsvps ?? []).find((r) => r.user_id === user.id)
  const isMatch = evt.event_type === 'match'
  const minP = evt.min_players as number | null
  const quorum = isMatch && minP ? oui.length >= minP : false
  const isPast = new Date(evt.event_date as string) < new Date()
  const meta = TYPE_LABELS[evt.event_type as string] ?? TYPE_LABELS.autre

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <Link href="/evenements" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
          <ArrowLeft size={14} />
          Retour aux événements
        </Link>

        {/* Card principale */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">

          {/* Header */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 text-white">
            <div className="flex items-start gap-3">
              <span className="text-4xl">{meta.emoji}</span>
              <div>
                <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-1">{meta.label}</p>
                <h1 className="text-xl font-black leading-tight">{evt.title as string}</h1>
                {(evt.is_cancelled as boolean) && (
                  <span className="inline-block mt-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ❌ Annulé
                  </span>
                )}
                {(evt.is_confirmed as boolean) && !(evt.is_cancelled as boolean) && (
                  <span className="inline-block mt-2 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                    ✅ Confirmé
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4 text-sm text-green-100">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>{formatFull(evt.event_date as string)} à {formatTime(evt.event_date as string)}</span>
              </div>
              {evt.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{evt.location as string}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {evt.description && (
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-gray-700 text-sm leading-relaxed">{evt.description as string}</p>
            </div>
          )}

          {/* Compteur match */}
          {isMatch && minP && (
            <div className={`px-6 py-4 border-b border-gray-100 ${quorum ? 'bg-green-50' : 'bg-amber-50'}`}>
              <div className="flex items-center gap-3">
                <Trophy size={20} className={quorum ? 'text-green-600' : 'text-amber-500'} />
                <div>
                  <p className={`font-bold text-sm ${quorum ? 'text-green-700' : 'text-amber-700'}`}>
                    {quorum
                      ? `✅ On joue ! ${oui.length}/${minP} joueurs confirmés`
                      : `${oui.length}/${minP} joueurs — encore ${minP - oui.length} à confirmer`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Minimum {minP} joueurs requis pour que le match ait lieu
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Vote RSVP — composant client */}
          {!isPast && !(evt.is_cancelled as boolean) && (
            <EventRsvpClient
              eventId={id}
              currentResponse={(myRsvp?.response as 'oui' | 'non' | 'peut_etre' | undefined) ?? null}
            />
          )}

          {isPast && (
            <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-500">
              Événement passé — vote clôturé
            </div>
          )}
        </div>

        {/* Qui est là */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={16} />
            Participants ({oui.length} ✅  {peut.length} 🤔  {nonR.length} ❌)
          </h2>

          {oui.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Je suis là ✅</p>
              <div className="flex flex-wrap gap-2">
                {oui.map((r) => {
                  const p = profileMap.get(r.user_id as string)
                  return (
                    <div key={r.user_id as string} className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {p?.initials ?? '?'}
                      </div>
                      <span className="text-xs font-medium text-green-800">{p?.name ?? 'Membre'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {peut.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">Peut-être 🤔</p>
              <div className="flex flex-wrap gap-2">
                {peut.map((r) => {
                  const p = profileMap.get(r.user_id as string)
                  return (
                    <div key={r.user_id as string} className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">
                        {p?.initials ?? '?'}
                      </div>
                      <span className="text-xs font-medium text-amber-800">{p?.name ?? 'Membre'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {oui.length === 0 && peut.length === 0 && nonR.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">Sois le premier à répondre !</p>
          )}
        </div>
      </div>
    </div>
  )
}
