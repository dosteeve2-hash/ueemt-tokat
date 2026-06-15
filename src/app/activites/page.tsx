import { createClient } from '@/lib/supabase/server'
import ActivitesClient from '@/components/activites/ActivitesClient'

export default async function ActivitesPage() {
  let albums: {
    id: string
    titre: string
    description: string | null
    cover_url: string | null
    created_at: string
    photos: { count: number }[] | null
  }[] = []
  let activities: {
    id: string
    titre: string
    description: string | null
    date: string | null
    instagram_url: string | null
    created_at: string
  }[] = []
  let events: {
    id: string
    title: string
    description: string | null
    location: string | null
    event_date: string
    end_date: string | null
    image_url: string | null
    created_at: string
  }[] = []
  let isAdmin = false
  let userId: string | null = null

  try {
    const supabase = await createClient()

    const [{ data: a }, { data: act }, { data: { user } }] = await Promise.all([
      supabase
        .from('albums')
        .select('id, titre, description, cover_url, created_at, photos(count)')
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('activities')
        .select('id, titre, description, date, instagram_url, created_at')
        .order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])

    albums = (a ?? []) as typeof albums
    activities = act ?? []
    userId = user?.id ?? null

    // Events — graceful if table doesn't exist yet
    try {
      const { data: evData } = await supabase
        .from('events')
        .select('id, title, description, location, event_date, end_date, image_url, created_at')
        .eq('is_published', true)
        .order('event_date', { ascending: true })
      events = evData ?? []
    } catch { /* table not yet migrated */ }

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }
  } catch {}

  return (
    <ActivitesClient
      albums={albums}
      activities={activities}
      events={events}
      isAdmin={isAdmin}
      userId={userId}
    />
  )
}
