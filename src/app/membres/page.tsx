import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MembresClient from '@/components/MembresClient'

export default async function MembresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/connexion')
  }

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('nom', { ascending: true })

  const isAdmin = user.email === 'docompaore2@gmail.com'

  return <MembresClient members={members ?? []} user={user} isAdmin={isAdmin} />
}
