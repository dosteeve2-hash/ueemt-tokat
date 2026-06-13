import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

function stripBom(s: string) {
  return s.replace(/^﻿/, '')
}

const vapidPublicKey = stripBom(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '')
const vapidPrivateKey = stripBom(process.env.VAPID_PRIVATE_KEY ?? '')

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:docompaore2@gmail.com', vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: Request) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ error: 'VAPID non configuré' }, { status: 500 })
  }

  const body = await request.json() as { title?: string; message?: string; url?: string }
  const title = body.title ?? 'UEEMT-Tokat'
  const message = body.message ?? 'Nouveau message dans le fil d\'actu'
  const url = body.url ?? '/feed'

  const supabase = await createClient()

  // Need service role to read all subscriptions (not just own)
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (!subscriptions?.length) return Response.json({ sent: 0 })

  const payload = JSON.stringify({ title, body: message, url })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  return Response.json({ sent, total: subscriptions.length })
}
