'use client'

import { createClient } from './supabase/client'

export type SocialEventType = 'profile_completed' | 'new_member' | 'new_post'

export interface SocialPayload {
  userId: string
  prenom: string
  avatarUrl?: string | null
}

/**
 * Broadcast a social activity event to all connected members via Supabase Realtime.
 * Fire-and-forget — never throws.
 */
export async function broadcastSocialEvent(
  eventType: SocialEventType,
  payload: SocialPayload,
): Promise<void> {
  try {
    const supabase = createClient()
    const channel = supabase.channel('social-activity-bc')

    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void channel
            .send({ type: 'broadcast', event: eventType, payload })
            .finally(() => {
              void supabase.removeChannel(channel)
              resolve()
            })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          void supabase.removeChannel(channel)
          resolve()
        }
      })
    })
  } catch {
    // Never crash the UI for a social broadcast failure
  }
}
