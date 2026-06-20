'use client'

import { useState, useTransition } from 'react'
import { upsertRsvp } from '../actions'
import { toast } from '@/lib/toast'

interface Props {
  eventId: string
  currentResponse: 'oui' | 'non' | 'peut_etre' | null
}

const OPTIONS = [
  { value: 'oui' as const, label: 'Je suis là !', emoji: '✅', active: 'bg-green-600 text-white', idle: 'border-green-300 text-green-700 hover:bg-green-50' },
  { value: 'peut_etre' as const, label: 'Peut-être', emoji: '🤔', active: 'bg-amber-500 text-white', idle: 'border-amber-300 text-amber-700 hover:bg-amber-50' },
  { value: 'non' as const, label: 'Je ne peux pas', emoji: '❌', active: 'bg-red-500 text-white', idle: 'border-red-300 text-red-600 hover:bg-red-50' },
]

export default function EventRsvpClient({ eventId, currentResponse }: Props) {
  const [selected, setSelected] = useState<'oui' | 'non' | 'peut_etre' | null>(currentResponse)
  const [isPending, startTransition] = useTransition()

  const handleVote = (response: 'oui' | 'non' | 'peut_etre') => {
    if (isPending) return
    const optimistic = response
    setSelected(optimistic)

    startTransition(async () => {
      const { error } = await upsertRsvp(eventId, response)
      if (error) {
        toast.error('Erreur', error)
        setSelected(currentResponse)
      } else {
        const label = OPTIONS.find((o) => o.value === response)?.label ?? ''
        toast.success('Vote enregistré', label)
      }
    })
  }

  return (
    <div className="px-6 py-5 border-t border-gray-100">
      <p className="text-sm font-bold text-gray-700 mb-3">
        {selected ? 'Tu as répondu — tu peux changer :' : 'Tu viens ? Réponds maintenant :'}
      </p>
      <div className="flex gap-2 flex-wrap">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleVote(opt.value)}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all disabled:opacity-60 ${
              selected === opt.value
                ? opt.active + ' border-transparent shadow-sm'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
            }`}
          >
            <span>{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
      {selected && (
        <p className="text-xs text-gray-400 mt-2">
          Ton vote : <strong>{OPTIONS.find((o) => o.value === selected)?.emoji} {OPTIONS.find((o) => o.value === selected)?.label}</strong>
        </p>
      )}
    </div>
  )
}
