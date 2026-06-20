export const BUREAU_MEMBERS = [
  { prenom: 'Abdoul Karim', nom: 'FASKOYE', role: 'Président', appRole: 'president' as const },
  { prenom: 'Mamadou Bassirou', nom: 'DIAKITE', role: 'Secrétaire Général', appRole: 'admin' as const },
  { prenom: 'Steeve Donald', nom: 'COMPAORÉ', role: 'Adjoint Trésorier', appRole: 'admin' as const },
  { prenom: 'Ousmane', nom: 'COULIBALY', role: 'Trésorier', appRole: 'admin' as const },
  { prenom: 'Zakaria', nom: 'BENGALY', role: 'Conseiller', appRole: 'admin' as const },
  { prenom: 'Idrissa Aly', nom: 'ONGOIBA', role: 'Conseiller', appRole: 'admin' as const },
]

export function isBureauMember(prenom: string, nom: string): boolean {
  return BUREAU_MEMBERS.some(
    (b) =>
      b.prenom.toLowerCase() === prenom.toLowerCase() &&
      b.nom.toLowerCase() === nom.toLowerCase()
  )
}

export function isPresident(prenom: string, nom: string): boolean {
  return BUREAU_MEMBERS.some(
    (b) =>
      b.appRole === 'president' &&
      b.prenom.toLowerCase() === prenom.toLowerCase() &&
      b.nom.toLowerCase() === nom.toLowerCase()
  )
}

export function getBureauRole(prenom: string, nom: string): string | null {
  const found = BUREAU_MEMBERS.find(
    (b) =>
      b.prenom.toLowerCase() === prenom.toLowerCase() &&
      b.nom.toLowerCase() === nom.toLowerCase()
  )
  return found?.role ?? null
}

/** Retourne 'president' | 'admin' | 'member' */
export function getAppRole(prenom: string, nom: string): 'president' | 'admin' | 'member' {
  const found = BUREAU_MEMBERS.find(
    (b) =>
      b.prenom.toLowerCase() === prenom.toLowerCase() &&
      b.nom.toLowerCase() === nom.toLowerCase()
  )
  return found?.appRole ?? 'member'
}
