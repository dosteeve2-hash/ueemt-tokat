'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import type { SocialPayload, SocialEventType } from '@/lib/broadcast'

/**
 * Subscribes to social activity broadcasts and shows subtle toast notifications
 * to encourage members to engage (complete profile, post, welcome newcomers).
 *
 * @param currentUserId - suppress toasts for own actions
 */
export function useSocialActivity(currentUserId: string) {
  useEffect(() => {
    if (!currentUserId) return

    const supabase = createClient()

    const channel = supabase
      .channel('social-activity')
      .on(
        'broadcast',
        { event: 'profile_completed' },
        ({ payload }: { payload: SocialPayload }) => {
          if (payload.userId === currentUserId) return
          const prenom = payload.prenom || 'Un membre'
          toast.info(
            `🌟 ${prenom} vient de compléter son profil !`,
          )
        },
      )
      .on(
        'broadcast',
        { event: 'new_member' },
        ({ payload }: { payload: SocialPayload }) => {
          if (payload.userId === currentUserId) return
          const prenom = payload.prenom || 'Un nouveau membre'
          toast.success(
            `🎉 ${prenom} vient de rejoindre l'UEEMT !`,
          )
        },
      )
      .on(
        'broadcast',
        { event: 'new_post' },
        ({ payload }: { payload: SocialPayload }) => {
          if (payload.userId === currentUserId) return
          const prenom = payload.prenom || 'Un membre'
          toast.info(
            `📝 ${prenom} vient de partager quelque chose`,
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [currentUserId])
}
