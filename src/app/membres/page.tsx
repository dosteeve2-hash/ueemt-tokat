import { createClient } from '@/lib/supabase/server'
import MembresClient from '@/components/MembresClient'

export default async function MembresPage() {
  const supabase = await createClient()

  // User is optional — page is public, no redirect
  let isAdmin = false
  try {
    const { data: { user } } = await supabase.auth.getUser()
    isAdmin = user?.email === 'docompaore2@gmail.com'
  } catch {}

  let members: {
    id: string
    prenom: string
    nom: string
    filiere: string | null
    niveau: string | null
    statut: string
    universite: string | null
    is_validated: boolean
    cotisation_payee: boolean
    photo_url: string | null
  }[] = []

  try {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('nom', { ascending: true })
    members = data ?? []
  } catch {}

  return <MembresClient members={members} isAdmin={isAdmin} />
}
