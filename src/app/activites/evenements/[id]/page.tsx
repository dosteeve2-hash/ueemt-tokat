import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, MapPin, Clock, ArrowLeft } from 'lucide-react'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: event } = await supabase
      .from('events')
      .select('id, title, description, location, event_date, end_date, image_url, created_at')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (!event) notFound()

    const startDate = new Date(event.event_date)
    const endDate = event.end_date ? new Date(event.end_date) : null

    const formatFull = (d: Date) =>
      d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    return (
      <div className="min-h-screen bg-white">
        {/* Header image / gradient */}
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-green-600 to-green-800 overflow-hidden">
          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
            <Link
              href="/activites"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={16} /> Retour aux activités
            </Link>
            <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Info strip */}
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-3xl mx-auto px-4 py-4 flex flex-wrap gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-green-800">
              <Calendar size={16} className="text-green-600" />
              <span className="text-sm font-semibold capitalize">{formatFull(startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-green-800">
              <Clock size={16} className="text-green-600" />
              <span className="text-sm font-semibold">
                {formatTime(startDate)}
                {endDate && ` → ${formatTime(endDate)}`}
              </span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-green-800">
                <MapPin size={16} className="text-green-600" />
                <span className="text-sm font-semibold">{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="max-w-3xl mx-auto px-4 py-10">
          {event.description ? (
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
          ) : (
            <p className="text-gray-400 italic">Aucune description disponible.</p>
          )}

          <div className="mt-10 pt-6 border-t border-gray-100">
            <Link
              href="/activites"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm transition-colors"
            >
              <ArrowLeft size={16} /> Retour aux activités
            </Link>
          </div>
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
