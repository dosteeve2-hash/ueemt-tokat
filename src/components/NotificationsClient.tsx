'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Heart, MessageCircle, Megaphone, UserPlus, Wallet } from 'lucide-react'
import { markAsRead, markAllAsRead } from '@/app/notifications/actions'
import type { NotificationData } from '@/app/notifications/actions'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function NotifIcon({ type }: { type: string }) {
  if (type === 'like') return <Heart size={14} className="text-red-500" fill="currentColor" />
  if (type === 'comment') return <MessageCircle size={14} className="text-blue-500" />
  if (type === 'new_post' || type === 'announcement') return <Megaphone size={14} className="text-green-600" />
  if (type === 'new_member') return <UserPlus size={14} className="text-purple-500" />
  if (type === 'cotisation_rappel') return <Wallet size={14} className="text-amber-500" />
  return <Bell size={14} className="text-gray-400" />
}

function notifText(notif: NotificationData): string {
  const excerpt = (notif.post_content ?? '').slice(0, 50)
  const ellipsis = notif.post_content && notif.post_content.length > 50 ? '...' : ''
  if (notif.type === 'like') return 'a aimé ton post'
  if (notif.type === 'comment') return excerpt ? `a commenté : « ${excerpt}${ellipsis} »` : 'a commenté ton post'
  if (notif.type === 'new_post') return excerpt ? `a publié une annonce : « ${excerpt}${ellipsis} »` : 'a publié une annonce'
  if (notif.type === 'new_member') return 'a rejoint UEEMT-Tokat 🎉'
  if (notif.type === 'cotisation_rappel') return '💰 Rappel : ta cotisation de ce mois (50 ₺) n\'est pas encore réglée. Contacte le trésorier dès que possible.'
  return 'a fait quelque chose'
}

const AVATAR_COLORS = ['bg-green-600', 'bg-yellow-500', 'bg-teal-600', 'bg-blue-600', 'bg-purple-600']

function Avatar({ name, avatar, idx }: { name: string; avatar: string | null; idx: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatar) return <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
  return (
    <div className={`w-10 h-10 rounded-full flex-shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold`}>
      {initials}
    </div>
  )
}

interface Props {
  notifications: NotificationData[]
}

export default function NotificationsClient({ notifications: initialNotifs }: Props) {
  const router = useRouter()
  const [notifs, setNotifs] = useState(initialNotifs)
  const [, startTransition] = useTransition()

  const unreadCount = notifs.filter(n => !n.read).length

  const handleClick = (notif: NotificationData) => {
    if (!notif.read) {
      setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
      startTransition(async () => { await markAsRead(notif.id) })
    }
    if (notif.post_id) {
      router.push(`/feed#post-${notif.post_id}`)
    } else if (notif.type === 'new_member' && notif.actor_id) {
      router.push(`/membres/${notif.actor_id}`)
    }
  }

  const handleMarkAll = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    startTransition(async () => { await markAllAsRead() })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="bg-green-600 text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-1">Espace membres</p>
          <h1 className="text-3xl font-black">Notifications</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {notifs.length > 0 && unreadCount > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              <Check size={15} />
              Tout marquer comme lu
            </button>
          </div>
        )}

        {notifs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 py-16 px-6 text-center shadow-sm">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">Tout est à jour !</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              Reviens bientôt pour voir les nouveautés de la communauté.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((notif, i) => {
              const actorName = `${notif.actor_prenom} ${notif.actor_nom}`.trim() || 'Membre'
              return (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border shadow-sm text-left transition-all hover:shadow-md ${
                    notif.read
                      ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800'
                      : 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={actorName} avatar={notif.actor_avatar} idx={i} />
                    <span className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-slate-900 rounded-full p-0.5">
                      <NotifIcon type={notif.type} />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-slate-200 leading-snug">
                      <span className="font-semibold">{actorName}</span>{' '}
                      {notifText(notif)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>

                  {!notif.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" aria-label="Non lu" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
