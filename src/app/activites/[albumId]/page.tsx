import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AlbumDetailClient from '@/components/activites/AlbumDetailClient'

export default async function AlbumDetailPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = await params

  try {
    const supabase = await createClient()

    const { data: album } = await supabase
      .from('albums')
      .select('id, titre, description, cover_url, created_at')
      .eq('id', albumId)
      .eq('is_public', true)
      .single()

    if (!album) notFound()

    const { data: photos } = await supabase
      .from('photos')
      .select('id, url, caption, created_at')
      .eq('album_id', albumId)
      .order('created_at', { ascending: true })

    return <AlbumDetailClient album={album} photos={photos ?? []} />
  } catch {
    notFound()
  }
}
