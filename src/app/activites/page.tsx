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

    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }
  } catch {}

  return <ActivitesClient albums={albums} activities={activities} isAdmin={isAdmin} userId={userId} />
}
