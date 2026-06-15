export const BUREAU_MEMBERS = [
  { prenom: 'Abdoul Karim', nom: 'FASKOYE', role: 'Président' },
  { prenom: 'Mamadou Bassirou', nom: 'DIAKITE', role: 'Secrétaire Général' },
  { prenom: 'Steeve Donald', nom: 'COMPAORÉ', role: 'Adjoint Trésorier' },
  { prenom: 'Ousmane', nom: 'COULIBALY', role: 'Trésorier' },
  { prenom: 'Zakaria', nom: 'BENGALY', role: 'Conseiller' },
  { prenom: 'Idrissa Aly', nom: 'ONGOIBA', role: 'Conseiller' },
]

export function isBureauMember(prenom: string, nom: string): boolean {
  return BUREAU_MEMBERS.some(
    (b) =>
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
