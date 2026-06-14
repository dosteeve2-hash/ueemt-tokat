import { createClient as createAdminClient } from '@supabase/supabase-js'
import PremiereConnexionClient from './PremiereConnexionClient'

// Ne jamais pré-rendre statiquement — les membres doivent être chargés en live
export const dynamic = 'force-dynamic'

const stripBom = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

export default async function PremiereConnexionPage() {
  const serviceKey = stripBom(process.env.SUPABASE_SERVICE_ROLE_KEY)
  const supabaseUrl = stripBom(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const hasValidServiceKey = serviceKey.startsWith('eyJ')

  let membres: Array<{ id: string; nom_complet: string; filiere: string | null }> = []

  if (hasValidServiceKey) {
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await admin
      .from('members')
      .select('id, nom_complet, filiere')
      .eq('is_active', true)
      .order('nom_complet')

    if (error) {
      console.error('[premiere-connexion] erreur chargement membres:', error)
    } else {
      membres = (data ?? []) as Array<{ id: string; nom_complet: string; filiere: string | null }>
    }
  }

  return <PremiereConnexionClient membres={membres} />
}
