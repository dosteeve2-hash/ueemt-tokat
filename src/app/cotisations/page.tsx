import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CotisationsClient from './CotisationsClient'
import {
  getCaisseInfo,
  getMaCotisation,
  getMonHistorique,
  getAllCotisations,
} from './actions'

export default async function CotisationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'member'
  const isGestionnaire = ['president', 'admin', 'tresorier', 'adjoint_tresorier', 'caissier'].includes(role)

  const [caisseInfo, maCotisation, historique, allCotisations] = await Promise.all([
    getCaisseInfo(),
    getMaCotisation(),
    getMonHistorique(),
    isGestionnaire ? getAllCotisations() : Promise.resolve([]),
  ])

  return (
    <CotisationsClient
      role={role}
      caisseInfo={caisseInfo}
      maCotisation={maCotisation}
      historique={historique}
      allCotisations={allCotisations}
      isGestionnaire={isGestionnaire}
    />
  )
}
