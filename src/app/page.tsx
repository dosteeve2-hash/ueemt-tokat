import Link from 'next/link'
import Image from 'next/image'
import { Users, MapPin, Calendar, Award } from 'lucide-react'
import { BUREAU_MEMBERS } from '@/lib/constants'
import HeroSlideshow from '@/components/HeroSlideshow'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86_400_000)
  if (d < 1) return "aujourd'hui"
  if (d < 7) return `il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default async function HomePage() {
  let heroPhotos: string[] = []
  let heroTitle = 'UEEMT-TOKAT'
  let heroSubtitle = "Union des Élèves et Étudiants Maliens à Tokat"
  let heroTagline = 'Travail – Solidarité – Réussite'
  let isLoggedIn = false

  // ─── Données hero + auth (client anon) ───────────────────────────────────
  try {
    const supabase = await createClient()
    const [{ data: settings }, { data: { user } }] = await Promise.all([
      supabase.from('site_settings').select('key, value'),
      supabase.auth.getUser(),
    ])
    isLoggedIn = !!user
    if (settings) {
      const map = Object.fromEntries(settings.map((r) => [r.key, r.value ?? '']))
      if (map.hero_title) heroTitle = map.hero_title
      if (map.hero_subtitle) heroSubtitle = map.hero_subtitle
      if (map.hero_tagline) heroTagline = map.hero_tagline
      if (map.hero_photo_urls) {
        try { heroPhotos = JSON.parse(map.hero_photo_urls) as string[] } catch {}
      }
    }
  } catch {}

  // ─── Données publiques (admin client, bypass RLS) ─────────────────────────
  let memberCount = 36
  let recentPhotos: Array<{ id: string; url: string; caption: string | null }> = []
  let recentPosts: Array<{ id: string; content: string; created_at: string; prenom: string | null; nom: string | null }> = []
  let memberAvatars: Array<{ id: string; prenom: string; nom: string }> = []

  try {
    const admin = createAdminClient()

    const [
      { count },
      { data: photos },
      { data: posts },
      { data: members },
    ] = await Promise.all([
      admin.from('members').select('*', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('photos').select('id, url, caption').order('created_at', { ascending: false }).limit(6),
      admin.from('posts').select('id, content, created_at, author_id').order('created_at', { ascending: false }).limit(3),
      admin.from('members').select('id, prenom, nom').eq('is_active', true).order('created_at', { ascending: false }).limit(8),
    ])

    if (count) memberCount = count
    if (photos) recentPhotos = photos as typeof recentPhotos
    if (members) memberAvatars = members as typeof memberAvatars

    // Enrichir les posts avec les noms d'auteurs
    if (posts && posts.length > 0) {
      const authorIds = posts.map((p) => p.author_id as string).filter(Boolean)
      const { data: profiles } = await admin
        .from('user_profiles')
        .select('id, member_id')
        .in('id', authorIds)

      const memberIds = (profiles ?? []).map((p) => p.member_id as string).filter(Boolean)
      const { data: postMembers } = memberIds.length > 0
        ? await admin.from('members').select('id, prenom, nom').in('id', memberIds)
        : { data: [] }

      const profileMap = new Map((profiles ?? []).map((p) => [p.id as string, p.member_id as string]))
      const memberMap = new Map((postMembers ?? []).map((m) => [m.id as string, { prenom: m.prenom as string, nom: m.nom as string }]))

      recentPosts = posts.map((p) => {
        const memberId = profileMap.get(p.author_id as string)
        const author = memberId ? memberMap.get(memberId) : null
        return {
          id: p.id as string,
          content: p.content as string,
          created_at: p.created_at as string,
          prenom: author?.prenom ?? null,
          nom: author?.nom ?? null,
        }
      })
    }
  } catch {}

  const AVATAR_COLORS = ['bg-green-600', 'bg-yellow-500', 'bg-teal-600', 'bg-blue-600', 'bg-purple-600', 'bg-red-500', 'bg-indigo-600', 'bg-orange-500']

  return (
    <>
      <HeroSlideshow
        photos={heroPhotos}
        title={heroTitle}
        subtitle={heroSubtitle}
        tagline={heroTagline}
      />

      {/* Stats bar */}
      <section className="bg-green-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {[
            { icon: Users, value: String(memberCount), label: 'Membres' },
            { icon: MapPin, value: '1', label: 'Ville' },
            { icon: Calendar, value: 'Depuis 2022', label: 'Fondée' },
            { icon: Award, value: 'Tokat', label: 'Türkiye' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon size={24} className="text-green-200" />
              <span className="text-xl sm:text-2xl font-black">{value}</span>
              <span className="text-green-200 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section membres actifs ── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Communauté</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900">
              {memberCount} membres actifs à Tokat
            </h2>
            <p className="text-gray-500 text-sm mt-2">Maliens unis, loin du pays mais jamais seuls.</p>
          </div>

          {memberAvatars.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {memberAvatars.map((m, i) => (
                <div
                  key={m.id}
                  title={`${m.prenom} ${m.nom}`}
                  className={`w-12 h-12 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {(m.prenom?.[0] ?? '').toUpperCase()}{(m.nom?.[0] ?? '').toUpperCase()}
                </div>
              ))}
              {memberCount > memberAvatars.length && (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                  +{memberCount - memberAvatars.length}
                </div>
              )}
            </div>
          ) : null}

          <div className="text-center">
            <Link
              href="/membres"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold inline-block transition-colors"
            >
              Voir tous les membres →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section dernières photos ── */}
      {recentPhotos.length > 0 && (
        <section className="py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Galerie</span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900">Nos derniers moments</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {recentPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-200 group">
                  <Image
                    src={photo.url}
                    alt={photo.caption ?? 'Photo UEEMT'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/activites"
                className="bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 rounded-full font-semibold inline-block transition-colors"
              >
                Voir tous les albums →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Section posts récents ── */}
      {recentPosts.length > 0 ? (
        <section className="py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-8">
              <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Actualités</span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900">Dernières nouvelles</h2>
            </div>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {post.prenom?.[0]?.toUpperCase() ?? 'U'}{post.nom?.[0]?.toUpperCase() ?? 'E'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {post.prenom && post.nom ? `${post.prenom} ${post.nom}` : 'Membre UEEMT'}
                      </p>
                      <p className="text-gray-400 text-xs">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                    {post.content?.slice(0, 150)}{(post.content?.length ?? 0) > 150 ? '…' : ''}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm mb-4">Connecte-toi pour voir tous les posts, liker et commenter.</p>
              <Link
                href="/connexion"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-semibold inline-block transition-colors"
              >
                Rejoins-nous pour voir plus →
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-14 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="rounded-2xl border p-16 text-center">
              <div className="text-5xl mb-4">📰</div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">Le fil d&apos;actu arrive bientôt</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Les membres partagent bientôt leurs actualités. Rejoins la communauté !
              </p>
              <Link href="/recensement" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold inline-block">
                Se recenser →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Values */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12 text-gray-900">Nos Valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              { emoji: '📚', title: 'Travail', desc: "L'excellence académique est notre priorité. Nous nous soutenons mutuellement dans notre parcours d'études." },
              { emoji: '🤝', title: 'Solidarité', desc: "Ensemble, nous sommes plus forts. L'UEEMT-Tokat est une famille soudée loin de chez nous." },
              { emoji: '🦁', title: 'Patriotisme', desc: "Fiers de notre héritage malien, nous portons haut les couleurs du Mali à Tokat." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <span className="text-4xl mb-4 block">{emoji}</span>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bureau Exécutif */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Leadership</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-gray-900">Notre Bureau Exécutif</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {BUREAU_MEMBERS.map(({ prenom, nom, role }) => (
              <div key={nom} className="bg-white rounded-2xl border-2 border-green-100 hover:border-green-400 p-4 sm:p-5 text-center transition-all hover:shadow-md group">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-600 border-2 border-green-200 flex items-center justify-center text-white font-black text-base sm:text-lg mx-auto mb-2 sm:mb-3 group-hover:scale-105 transition-transform">
                  {prenom[0]}{nom[0]}
                </div>
                <p className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{prenom}</p>
                <p className="font-bold text-gray-900 text-xs sm:text-sm">{nom}</p>
                <p className="text-green-600 text-xs font-semibold mt-1">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* President message */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center text-3xl sm:text-4xl">
                👨‍🎓
              </div>
            </div>
            <div className="text-center sm:text-left">
              <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Message du Président</span>
              <blockquote className="text-lg sm:text-xl text-gray-700 italic leading-relaxed mt-3 mb-4">
                "Chers élèves et étudiants maliens de Tokat, notre association est un cadre d'unité et de solidarité. Ensemble, construisons notre avenir académique avec discipline, travail et patriotisme."
              </blockquote>
              <p className="font-bold text-gray-900">Abdoul Karim FASKOYE</p>
              <p className="text-gray-500 text-sm">Président, UEEMT-Tokat</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — adaptive selon statut de connexion */}
      <section className="py-16 sm:py-20" style={{ background: 'linear-gradient(135deg, #14A44D, #0a7a35)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          {isLoggedIn ? (
            <>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Bienvenue dans ta communauté</h2>
              <p className="text-green-100 mb-8 text-base sm:text-lg">Explore l'espace membre, partage tes moments et retrouve tes camarades.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/feed" className="bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-bold text-base inline-block transition-colors shadow-lg">
                  📰 Voir le fil d&apos;actu
                </Link>
                <Link href="/activites" className="bg-green-700/50 hover:bg-green-700/70 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-base inline-block transition-colors">
                  🎉 Explorer les activités
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Espace membres UEEMT-Tokat</h2>
              <p className="text-green-100 mb-8 text-base sm:text-lg">Tu es déjà membre ? Connecte-toi pour accéder à l&apos;espace communautaire.</p>
              <Link href="/connexion" className="bg-white text-green-700 hover:bg-green-50 px-8 sm:px-10 py-4 rounded-xl font-bold text-base sm:text-lg inline-block transition-colors shadow-lg">
                Se connecter →
              </Link>
              <div className="mt-4">
                <Link href="/recensement" className="text-green-200 hover:text-white text-sm underline underline-offset-2 transition-colors">
                  Nouveau membre ? Se recenser
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  )
}
