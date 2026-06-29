import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CotisationsClient from './CotisationsClient'
import CotisationsChartLoader from './CotisationsChartLoader'
import {
  getCaisseInfo,
  getMaCotisation,
  getMonHistorique,
  getAllCotisations,
} from './actions'

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5 h-[320px] animate-pulse">
      <div className="h-5 w-48 bg-gray-200 dark:bg-slate-700 rounded mb-5" />
      <div className="h-[240px] bg-gray-100 dark:bg-slate-700/50 rounded-xl" />
    </div>
  )
}

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
  const isGestionnaire = ['admin', 'tresorier', 'adjoint_tresorier', 'caissier'].includes(role)

  const chartSlot = isGestionnaire ? (
    <Suspense fallback={<ChartSkeleton />}>
      <CotisationsChartLoader />
    </Suspense>
  ) : null

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
      chartSlot={chartSlot}
    />
  )
}
