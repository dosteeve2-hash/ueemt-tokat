'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface OnlineUser {
  user_id: string
  prenom: string
  nom: string
}

export function usePresence(userId: string, prenom: string, nom: string) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<OnlineUser>()
        // Dédupliquer par user_id (plusieurs onglets possibles)
        const seen = new Set<string>()
        const users: OnlineUser[] = []
        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (!seen.has(p.user_id)) {
              seen.add(p.user_id)
              users.push(p)
            }
          }
        }
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, prenom, nom })
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, prenom, nom])

  return {
    onlineUsers,
    count: onlineUsers.length,
    // Autres membres en ligne (pas soi-même)
    others: onlineUsers.filter((u) => u.user_id !== userId),
  }
}
