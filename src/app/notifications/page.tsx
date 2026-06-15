import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NotificationsClient from '@/components/NotificationsClient'
import { getNotifications } from './actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifications',
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const notifications = await getNotifications()

  return <NotificationsClient notifications={notifications} />
}
