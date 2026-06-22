import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Optionnel : protéger avec CRON_SECRET si appelé par Vercel Cron
  // L'endpoint reste accessible publiquement pour UptimeRobot / monitoring externe
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  const checks: Record<string, { ok: boolean; detail?: string }> = {}

  try {
    const supabase = await createClient()

    // Check 1 : DB connexion + membres
    const { data: membres, error } = await supabase
      .from('members')
      .select('id', { count: 'exact' })
      .limit(1)

    checks.database = {
      ok: !error,
      detail: error ? error.message : `${membres?.length ?? 0} membres accessibles`,
    }

    // Check 2 : Table caisse
    const { data: caisse, error: caisseError } = await supabase
      .from('caisse')
      .select('montant, cotisation_mensuelle')
      .single()

    checks.caisse = {
      ok: !caisseError && !!caisse,
      detail: caisse
        ? `${caisse.cotisation_mensuelle}₺/mois, caisse: ${caisse.montant}₺`
        : caisseError?.message,
    }

    // Check 3 : Auth Supabase accessible (getUser() — server-side JWT verify, no client trust)
    const { error: authError } = await supabase.auth.getUser()
    // An anonymous request returns a "user not found" error — that's expected and means auth is UP
    const authDown = authError && !authError.message.includes('not authenticated') && !authError.message.includes('JWT')
    checks.auth = { ok: !authDown, detail: authDown ? authError?.message : 'Auth API opérationnelle' }

  } catch (e) {
    checks.general = { ok: false, detail: String(e) }
  }

  const allOk = Object.values(checks).every(c => c.ok)

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  )
}
