'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PUSH_ASKED_KEY = 'push_asked'
const AUTO_PROMPT_DELAY_MS = 3000

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer
}

export default function PushNotificationSetup() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const autoPromptedRef = useRef(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setSupported(true)
    setPermission(Notification.permission)

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })
  }, [])

  // Auto-prompt after login if not yet asked and permission is default
  useEffect(() => {
    if (!supported) return
    if (Notification.permission !== 'default') return
    if (typeof localStorage !== 'undefined' && localStorage.getItem(PUSH_ASKED_KEY)) return
    if (autoPromptedRef.current) return

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      // User is logged in and permission not yet asked — prompt after delay
      const timer = setTimeout(async () => {
        if (autoPromptedRef.current) return
        autoPromptedRef.current = true
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(PUSH_ASKED_KEY, 'true')
        }
        try {
          const perm = await Notification.requestPermission()
          setPermission(perm)
          if (perm !== 'granted') return
          // Auto-subscribe
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
            ),
          })
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          })
          setSubscribed(true)
        } catch {
          // Ignore — user may have dismissed or browser blocked
        }
      }, AUTO_PROMPT_DELAY_MS)

      return () => clearTimeout(timer)
    }).catch(() => {})
  }, [supported])

  const subscribe = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
        ),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      setSubscribed(true)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (!sub) return

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  if (!supported || permission === 'denied') return null

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      disabled={loading}
      title={subscribed ? 'Désactiver les notifications' : 'Activer les notifications push'}
      className={`fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
        subscribed
          ? 'bg-green-600 text-white hover:bg-green-700'
          : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 border border-gray-200 dark:border-slate-600'
      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {subscribed ? <Bell size={20} /> : <BellOff size={20} />}
    </button>
  )
}
