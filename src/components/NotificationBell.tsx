'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { getUnreadCount } from '@/app/notifications/actions'

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const n = await getUnreadCount()
      setCount(n)
    } catch {}
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <Link
      href="/notifications"
      className="relative p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-green-400 dark:hover:bg-slate-700 transition-colors"
      aria-label={`Notifications${count > 0 ? ` (${count} non lues)` : ''}`}
      title="Notifications"
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
