'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── createEvent ─────────────────────────────────────────────────────────────

export async function createEvent(data: {
  title: string
  description?: string
  event_date: string
  event_type: 'match' | 'activite' | 'reunion' | 'sortie' | 'autre'
  location?: string
  min_players?: number
}): Promise<{ error: string | null; id: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.', id: null }

  const title = data.title?.trim()
  if (!title || title.length > 200) return { error: 'Titre invalide (1–200 caractères).', id: null }

  const eventDate = new Date(data.event_date)
  if (isNaN(eventDate.getTime())) return { error: 'Date invalide.', id: null }
  if (eventDate < new Date()) return { error: 'La date doit être dans le futur.', id: null }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      created_by: user.id,
      title,
      description: data.description?.trim() || null,
      event_date: eventDate.toISOString(),
      event_type: data.event_type ?? 'autre',
      location: data.location?.trim() || null,
      min_players: data.event_type === 'match' ? (data.min_players ?? 10) : null,
      is_published: true,
    })
    .select('id')
    .single()

  if (error || !event) {
    console.error('[createEvent]', error?.message)
    return { error: 'Erreur lors de la création. Réessaie.', id: null }
  }

  revalidatePath('/evenements')
  return { error: null, id: event.id as string }
}

// ─── upsertRsvp ─────────────────────────────────────────────────────────────

export async function upsertRsvp(
  eventId: string,
  response: 'oui' | 'non' | 'peut_etre',
): Promise<{ error: string | null }> {
  if (!eventId) return { error: 'Événement invalide.' }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('event_rsvps')
    .upsert(
      { event_id: eventId, user_id: user.id, response, updated_at: new Date().toISOString() },
      { onConflict: 'event_id,user_id' },
    )

  if (error) {
    console.error('[upsertRsvp]', error.message)
    return { error: 'Erreur lors du vote. Réessaie.' }
  }

  revalidatePath(`/evenements/${eventId}`)
  revalidatePath('/evenements')
  return { error: null }
}

// ─── cancelEvent ─────────────────────────────────────────────────────────────

export async function cancelEvent(eventId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('events')
    .update({ is_cancelled: true })
    .eq('id', eventId)
    .eq('created_by', user.id) // ownership check

  if (error) {
    console.error('[cancelEvent]', error.message)
    return { error: 'Erreur lors de l\'annulation.' }
  }

  revalidatePath('/evenements')
  return { error: null }
}
