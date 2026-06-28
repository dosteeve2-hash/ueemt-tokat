import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getFounderPhotos } from './actions'
import SteleClient from './SteleClient'

export const metadata: Metadata = {
  title: 'Stèle des Fondateurs',
  description: 'Hommage aux présidents et fondateurs de l\'UEEMT-Tokat',
}

export default async function FondateursPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userRole: string | null = null
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = data?.role ?? null
  }

  const founderPhotos = await getFounderPhotos()

  const canEdit = userRole !== null && ['admin', 'president', 'tresorier'].includes(userRole)

  return (
    <SteleClient
      founderPhotos={founderPhotos}
      canEdit={canEdit}
    />
  )
}
