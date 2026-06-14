import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from '@/components/dashboard/AdminDashboardClient'

export default async function AdminDashboardPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/connexion')

    const { data: rawProfile } = await supabase
      .from('user_profiles')
      .select('role, member:member_id(prenom, nom)')
      .eq('id', user.id)
      .single()

    if (!rawProfile) redirect('/onboarding')
    if (rawProfile.role !== 'admin') redirect('/dashboard')

    const memberData = Array.isArray(rawProfile.member) ? rawProfile.member[0] ?? null : rawProfile.member as { prenom: string; nom: string } | null
    const profile = { role: rawProfile.role as string, member: memberData }

    const { data: members } = await supabase
      .from('members')
      .select('*')
      .order('nom', { ascending: true })

    const { data: albums } = await supabase
      .from('albums')
      .select('*, photos(count)')
      .order('created_at', { ascending: false })

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })

    const totalMembers = members?.length ?? 0
    const pending = members?.filter((m) => !m.is_validated).length ?? 0
    const cotisationPaid = members?.filter((m) => m.cotisation_payee).length ?? 0

    return (
      <AdminDashboardClient
        user={{ id: user.id, email: user.email ?? '' }}
        profile={profile}
        members={members ?? []}
        albums={albums ?? []}
        activities={activities ?? []}
        stats={{ totalMembers, pending, cotisationPaid }}
      />
    )
  } catch (e: unknown) {
    if (typeof (e as { digest?: string }).digest === 'string' && (e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    redirect('/connexion')
  }
}
