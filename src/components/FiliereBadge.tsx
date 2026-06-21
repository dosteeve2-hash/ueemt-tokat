import { getFiliereBadge } from '@/lib/filiereBadge'

interface Props {
  filiere: string | null | undefined
  size?: 'sm' | 'md'
  showEmoji?: boolean
}

export default function FiliereBadge({ filiere, size = 'sm', showEmoji = true }: Props) {
  const badge = getFiliereBadge(filiere)

  const sizeClass = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-3 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${badge.color} ${sizeClass}`}
      title={filiere ?? undefined}
    >
      {showEmoji && <span>{badge.emoji}</span>}
      <span>{badge.label}</span>
    </span>
  )
}
