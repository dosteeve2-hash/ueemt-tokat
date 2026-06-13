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

  try {
    const supabase = await createClient()

    const { data: a } = await supabase
      .from('albums')
      .select('id, titre, description, cover_url, created_at, photos(count)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
    albums = (a ?? []) as typeof albums

    const { data: act } = await supabase
      .from('activities')
      .select('id, titre, description, date, instagram_url, created_at')
      .order('created_at', { ascending: false })
    activities = act ?? []
  } catch {}

  return <ActivitesClient albums={albums} activities={activities} />
}
