import { createClient } from '@/lib/supabase/server'
import PremiereConnexionClient from './PremiereConnexionClient'

// Ne jamais pré-rendre statiquement — les membres doivent être chargés en live
export const dynamic = 'force-dynamic'

export default async function PremiereConnexionPage() {
  // La RLS autorise la lecture publique de la table members (policy "Public read members")
  // → pas besoin du service role key, le client anon suffit
  const supabase = await createClient()

  let membres: Array<{ id: string; nom_complet: string; filiere: string | null }> = []
  let loadError = false

  const { data, error } = await supabase
    .from('members')
    .select('id, prenom, nom, filiere')
    .eq('is_active', true)
    .order('nom')

  if (error) {
    console.error('[premiere-connexion] erreur chargement membres:', error.message, error.code)
    loadError = true
  } else {
    membres = (data ?? []).map((m) => ({
      id: m.id as string,
      nom_complet: `${(m.prenom as string) ?? ''} ${(m.nom as string) ?? ''}`.trim(),
      filiere: m.filiere as string | null,
    }))
  }

  return <PremiereConnexionClient membres={membres} loadError={loadError} />
}
