'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Users, Trophy } from 'lucide-react'
import { createEvent } from '../actions'
import { toast } from '@/lib/toast'

const TYPES = [
  { value: 'match', label: 'Match de foot', emoji: '⚽', desc: 'Organisation d\'un match avec vote des joueurs' },
  { value: 'activite', label: 'Activité', emoji: '🎉', desc: 'Soirée, sport, barbecue...' },
  { value: 'reunion', label: 'Réunion', emoji: '🗣️', desc: 'Réunion de l\'association' },
  { value: 'sortie', label: 'Sortie', emoji: '🚌', desc: 'Excursion, visite, voyage...' },
  { value: 'autre', label: 'Autre', emoji: '📌', desc: 'Autre type d\'événement' },
] as const

export default function NouvelEvenementPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [eventType, setEventType] = useState<typeof TYPES[number]['value']>('match')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('18:00')
  const [location, setLocation] = useState('')
  const [minPlayers, setMinPlayers] = useState(10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !eventDate) return

    const datetimeStr = `${eventDate}T${eventTime}:00`

    startTransition(async () => {
      const { error, id } = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: datetimeStr,
        event_type: eventType,
        location: location.trim() || undefined,
        min_players: eventType === 'match' ? minPlayers : undefined,
      })

      if (error) {
        toast.error('Erreur', error)
      } else {
        toast.success('Événement créé !', 'Les membres vont être notifiés.')
        router.push(`/evenements/${id}`)
      }
    })
  }

  // Date minimale = aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">

        <Link href="/evenements" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6 transition-colors">
          <ArrowLeft size={14} />
          Retour aux événements
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h1 className="text-xl font-black text-gray-900 mb-6">Proposer un événement</h1>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Type d'événement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Type d&apos;événement</label>
              <div className="grid grid-cols-1 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setEventType(t.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      eventType === t.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{t.emoji}</span>
                    <div>
                      <p className={`font-semibold text-sm ${eventType === t.value ? 'text-green-700' : 'text-gray-800'}`}>
                        {t.label}
                      </p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {eventType === 'match' ? 'Titre du match' : 'Titre de l\'événement'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={eventType === 'match' ? 'Ex: Match UEEMT vs Camerounais' : 'Ex: Soirée BBQ chez Moussa'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                maxLength={200}
              />
            </div>

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar size={13} className="inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={today}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Heure</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Lieu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin size={13} className="inline mr-1" />
                Lieu (optionnel)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={eventType === 'match' ? 'Ex: Stade de Tokat' : 'Ex: Campus, Bağlar...'}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Nombre min de joueurs (match uniquement) */}
            {eventType === 'match' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Trophy size={13} className="inline mr-1" />
                  Nombre minimum de joueurs pour jouer
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={4}
                    max={22}
                    step={1}
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(Number(e.target.value))}
                    className="flex-1 accent-green-600"
                  />
                  <span className="text-green-700 font-bold w-8 text-center">{minPlayers}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le match sera confirmé quand {minPlayers} joueurs auront voté ✅
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description (optionnelle)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Infos supplémentaires, conditions, règles..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                href="/evenements"
                className="flex-1 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold text-sm text-center transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isPending || !title.trim() || !eventDate}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold text-sm transition-colors"
              >
                {isPending ? 'Création...' : 'Proposer l\'événement →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
