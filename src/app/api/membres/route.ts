import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('members')
      .select('id, prenom, nom, filiere')
      .order('nom')

    if (error) {
      console.error('[api/membres]', error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json(data ?? [])
  } catch (e) {
    console.error('[api/membres] catch:', e)
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
