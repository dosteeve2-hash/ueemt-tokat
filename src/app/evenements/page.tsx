import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, MapPin, Users, Plus, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

const TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  match:    { label: 'Match', emoji: '⚽', color: 'bg-green-100 text-green-700' },
  activite: { label: 'Activité', emoji: '🎉', color: 'bg-blue-100 text-blue-700' },
  reunion:  { label: 'Réunion', emoji: '🗣️', color: 'bg-amber-100 text-amber-700' },
  sortie:   { label: 'Sortie', emoji: '🚌', color: 'bg-purple-100 text-purple-700' },
  autre:    { label: 'Autre', emoji: '📌', color: 'bg-gray-100 text-gray-700' },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default async function EvenementsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion?redirect=/evenements')

  const now = new Date().toISOString()

  // Charger événements à venir + passés récents
  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_date, event_type, location, min_players, is_confirmed, is_cancelled, created_by')
      .eq('is_published', true)
      .eq('is_cancelled', false)
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(20),
    supabase
      .from('events')
      .select('id, title, event_date, event_type, is_confirmed, is_cancelled')
      .eq('is_published', true)
      .lt('event_date', now)
      .order('event_date', { ascending: false })
      .limit(5),
  ])

  // Compter les RSVPs pour les événements à venir
  const upcomingIds = (upcoming ?? []).map((e) => e.id as string)
  const { data: rsvps } = upcomingIds.length > 0
    ? await supabase.from('event_rsvps').select('event_id, response').in('event_id', upcomingIds)
    : { data: [] }

  // Grouper les RSVPs par event_id
  const rsvpMap = new Map<string, { oui: number; non: number; peut_etre: number; myResponse: string | null }>()
  for (const r of (rsvps ?? [])) {
    const key = r.event_id as string
    if (!rsvpMap.has(key)) rsvpMap.set(key, { oui: 0, non: 0, peut_etre: 0, myResponse: null })
    const entry = rsvpMap.get(key)!
    if (r.response === 'oui') entry.oui++
    else if (r.response === 'non') entry.non++
    else if (r.response === 'peut_etre') entry.peut_etre++
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Événements & Matchs</h1>
            <p className="text-gray-500 text-sm mt-1">Organise et rejoins les activités de l&apos;association</p>
          </div>
          <Link
            href="/evenements/nouveau"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus size={16} />
            Proposer
          </Link>
        </div>

        {/* Événements à venir */}
        <section className="mb-10">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">À venir</h2>

          {(upcoming ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">🗓️</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Aucun événement prévu</h3>
              <p className="text-gray-500 text-sm mb-6">Sois le premier à proposer un match ou une activité !</p>
              <Link
                href="/evenements/nouveau"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-sm inline-block transition-colors"
              >
                Proposer un événement →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(upcoming ?? []).map((evt) => {
                const meta = TYPE_LABELS[evt.event_type as string] ?? TYPE_LABELS.autre
                const counts = rsvpMap.get(evt.id as string) ?? { oui: 0, non: 0, peut_etre: 0, myResponse: null }
                const isMatch = evt.event_type === 'match'
                const minP = evt.min_players as number | null
                const quorum = isMatch && minP ? counts.oui >= minP : false

                return (
                  <Link
                    key={evt.id as string}
                    href={`/evenements/${evt.id}`}
                    className="block bg-white rounded-2xl border border-gray-100 hover:border-green-300 hover:shadow-sm p-5 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">{meta.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                          {evt.is_confirmed && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-600 text-white">
                              ✅ Confirmé
                            </span>
                          )}
                          {isMatch && minP && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${quorum ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {quorum ? <><Trophy size={10} className="inline mr-1" />On joue !</> : `${counts.oui}/${minP} joueurs`}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 truncate">{evt.title as string}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatDate(evt.event_date as string)} à {formatTime(evt.event_date as string)}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {evt.location as string}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Users size={12} />
                          <span className="text-green-600 font-bold">{counts.oui}</span>
                          {counts.peut_etre > 0 && <span className="text-amber-500">+{counts.peut_etre}?</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Événements passés */}
        {(past ?? []).length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Passés</h2>
            <div className="space-y-2">
              {(past ?? []).map((evt) => {
                const meta = TYPE_LABELS[evt.event_type as string] ?? TYPE_LABELS.autre
                return (
                  <Link
                    key={evt.id as string}
                    href={`/evenements/${evt.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-xl">{meta.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-700">{evt.title as string}</p>
                      <p className="text-xs text-gray-400">{formatDate(evt.event_date as string)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
