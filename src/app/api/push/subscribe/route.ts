import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 })

  const { endpoint, keys } = await request.json() as {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return Response.json({ error: 'Données manquantes' }, { status: 400 })
  }

  await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: 'endpoint' }
  )

  return Response.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Non autorisé' }, { status: 401 })

  const { endpoint } = await request.json() as { endpoint: string }
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)

  return Response.json({ ok: true })
}
