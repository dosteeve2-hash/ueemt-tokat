import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfilClient from '@/components/ProfilClient'

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, avatar_url, bio, quote, is_public, member_id')
    .eq('id', user.id)
    .maybeSingle()

  let member: { prenom: string; nom: string; filiere: string | null; niveau: string | null } | null = null
  if (profile?.member_id) {
    const { data } = await supabase
      .from('members')
      .select('prenom, nom, filiere, niveau')
      .eq('id', profile.member_id)
      .single()
    member = data
  }

  return <ProfilClient profile={profile} member={member} userId={user.id} />
}
