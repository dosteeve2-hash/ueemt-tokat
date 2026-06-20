export type FiliereBadge = {
  label: string
  color: string
  emoji: string
}

// Mapping basé sur les valeurs réelles de la DB (filières en turc)
const FILIERE_MAP: Array<{ keywords: string[]; badge: FiliereBadge }> = [
  {
    keywords: ['bilgisayar', 'informatique', 'computer', 'info'],
    badge: { label: 'Informatique', color: 'bg-purple-100 text-purple-700', emoji: '💻' },
  },
  {
    keywords: ['elektrik', 'elektronik', 'electr'],
    badge: { label: 'Génie Électrique', color: 'bg-yellow-100 text-yellow-700', emoji: '⚡' },
  },
  {
    keywords: ['iktisat', 'économie', 'economie', 'eco'],
    badge: { label: 'Économie', color: 'bg-green-100 text-green-700', emoji: '📊' },
  },
  {
    keywords: ['inşaat', 'insaat', 'civil', 'construction'],
    badge: { label: 'Génie Civil', color: 'bg-orange-100 text-orange-700', emoji: '🏗️' },
  },
  {
    keywords: ['işletme', 'isletme', 'gestion', 'business', 'management'],
    badge: { label: 'Gestion', color: 'bg-blue-100 text-blue-700', emoji: '💼' },
  },
  {
    keywords: ['makine', 'mécanique', 'mecanique', 'mechani'],
    badge: { label: 'Génie Mécanique', color: 'bg-slate-100 text-slate-700', emoji: '⚙️' },
  },
  {
    keywords: ['moda', 'tasarım', 'tasarim', 'mode', 'design'],
    badge: { label: 'Mode & Design', color: 'bg-pink-100 text-pink-700', emoji: '👗' },
  },
  {
    keywords: ['psikoloji', 'psycho', 'danışman', 'danisman', 'rehber'],
    badge: { label: 'Psychologie', color: 'bg-teal-100 text-teal-700', emoji: '🧠' },
  },
  {
    keywords: ['ticaret', 'lojistik', 'commerce', 'logistique', 'uluslararas'],
    badge: { label: 'Commerce & Logistique', color: 'bg-indigo-100 text-indigo-700', emoji: '🌍' },
  },
  {
    keywords: ['ziraat', 'tarım', 'tarim', 'agriculture', 'agro'],
    badge: { label: 'Agriculture', color: 'bg-lime-100 text-lime-700', emoji: '🌱' },
  },
  {
    keywords: ['hukuk', 'droit', 'law'],
    badge: { label: 'Droit', color: 'bg-amber-100 text-amber-700', emoji: '⚖️' },
  },
  {
    keywords: ['tıp', 'tip', 'medecine', 'médecine', 'pharma'],
    badge: { label: 'Médecine', color: 'bg-red-100 text-red-700', emoji: '🏥' },
  },
]

const DEFAULT_BADGE: FiliereBadge = {
  label: 'Étudiant',
  color: 'bg-gray-100 text-gray-600',
  emoji: '🎓',
}

export function getFiliereBadge(filiere: string | null | undefined): FiliereBadge {
  if (!filiere) return DEFAULT_BADGE
  const lower = filiere.toLowerCase()
  for (const { keywords, badge } of FILIERE_MAP) {
    if (keywords.some((k) => lower.includes(k))) return badge
  }
  // Retourner le badge par défaut avec le nom de filière comme label si non reconnue
  return { ...DEFAULT_BADGE, label: filiere.slice(0, 30) }
}

/** Retourne toutes les filieres distinctes des membres pour les pills de filtre */
export function getUniqueFiliereBadges(
  filieres: (string | null | undefined)[]
): Array<{ filiere: string; badge: FiliereBadge }> {
  const seen = new Map<string, FiliereBadge>()
  for (const f of filieres) {
    if (!f) continue
    const badge = getFiliereBadge(f)
    // Utiliser le label badge comme clé de déduplication
    if (!seen.has(badge.label)) {
      seen.set(badge.label, badge)
    }
  }
  return Array.from(seen.entries()).map(([, badge]) => ({ filiere: badge.label, badge }))
}
