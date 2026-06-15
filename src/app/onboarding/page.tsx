import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from '@/components/OnboardingClient'

export default async function OnboardingPage() {
  let members: { id: string; prenom: string; nom: string; filiere: string | null; statut: string }[] = []

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/connexion')

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle()

    if (existing?.onboarding_complete) redirect('/dashboard')

    const { data } = await supabase
      .from('members')
      .select('id, prenom, nom, filiere, statut')
      .order('nom', { ascending: true })

    members = data ?? []
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
  }

  return <OnboardingClient members={members} />
}
