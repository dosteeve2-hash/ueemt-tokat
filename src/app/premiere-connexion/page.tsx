import PremiereConnexionClient from './PremiereConnexionClient'

// Ne jamais pré-rendre statiquement
export const dynamic = 'force-dynamic'

export default function PremiereConnexionPage() {
  // Les membres sont chargés côté client via /api/membres (admin client, bypasse RLS)
  return <PremiereConnexionClient />
}
