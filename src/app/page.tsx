import Link from 'next/link'
import { Users, MapPin, Calendar, Award } from 'lucide-react'
import { BUREAU_MEMBERS } from '@/lib/constants'
import HeroSlideshow from '@/components/HeroSlideshow'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  let heroPhotos: string[] = []
  let heroTitle = 'UEEMT-TOKAT'
  let heroSubtitle = "Union des Élèves et Étudiants Maliens à Tokat"
  let heroTagline = 'Travail – Solidarité – Réussite'
  let isLoggedIn = false

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
            { icon: Users, value: '34', label: 'Membres' },
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Rejoignez la communauté UEEMT-Tokat</h2>
              <p className="text-green-100 mb-8 text-base sm:text-lg">Recensez-vous pour faire partie officiellement de notre association et accéder à tous nos services.</p>
              <Link href="/recensement" className="bg-white text-green-700 hover:bg-green-50 px-8 sm:px-10 py-4 rounded-xl font-bold text-base sm:text-lg inline-block transition-colors shadow-lg">
                Se Recenser →
              </Link>
            </>
          )}
        </div>
      </section>
    </>
  )
}
