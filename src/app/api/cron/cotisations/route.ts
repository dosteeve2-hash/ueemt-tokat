import { createClient } from '@/lib/supabase/server'

// Sécurité : ce endpoint n'est accessible que par Vercel Cron via CRON_SECRET
// Configurer CRON_SECRET dans les variables d'env Vercel

function currentMonthDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Non autorisé' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const month = currentMonthDate()

    // Récupérer tous les membres validés
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .eq('is_validated', true)

    if (membersError || !members?.length) {
      return Response.json({ sent: 0, message: 'Aucun membre trouvé' })
    }

    const memberIds = members.map(m => m.id)

    // Ceux qui ont déjà payé ce mois
    const { data: paid } = await supabase
      .from('cotisation_payments')
      .select('member_id')
      .in('member_id', memberIds)
      .eq('month', month)

    const paidIds = new Set((paid ?? []).map(p => p.member_id))
    const unpaidMemberIds = memberIds.filter(id => !paidIds.has(id))

    if (!unpaidMemberIds.length) {
      return Response.json({ sent: 0, message: 'Tous les membres ont déjà payé' })
    }

    // Trouver les user_profiles des membres non payés
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id')
      .in('member_id', unpaidMemberIds)

    if (!profiles?.length) {
      return Response.json({ sent: 0, message: 'Aucun profil trouvé pour les membres non payés' })
    }

    // Insérer les notifications in-app
    const notifInserts = profiles.map(p => ({
      user_id: p.id,
      type: 'cotisation_rappel',
      actor_id: null,
      post_id: null,
    }))

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifInserts)

    if (notifError) {
      console.error('[cron:cotisations] insert notifs failed:', notifError.code)
      return Response.json({ error: 'Erreur insertion notifications' }, { status: 500 })
    }

    return Response.json({
      sent: notifInserts.length,
      month,
      message: `Rappels envoyés à ${notifInserts.length} membre(s)`,
    })
  } catch (e) {
    console.error('[cron:cotisations]', e)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
