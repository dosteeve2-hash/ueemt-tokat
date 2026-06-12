import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/connexion')

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*, member:member_id(id, prenom, nom, filiere, niveau, universite, statut, telephone, num_etudiant, cotisation_payee, is_validated)')
      .eq('id', user.id)
      .single()

    if (!profile) redirect('/onboarding')

    if (profile.role === 'admin') redirect('/dashboard/admin')

    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    const { data: albums } = await supabase
      .from('albums')
      .select('*, photos(count)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    return (
      <DashboardClient
        user={{ id: user.id, email: user.email ?? '' }}
        profile={profile}
        documents={documents ?? []}
        albums={albums ?? []}
      />
    )
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
    redirect('/connexion')
  }
}
