import Link from 'next/link'
import { Users, MapPin, Calendar, Award } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{background: 'linear-gradient(135deg, #0a3d1f 0%, #14A44D 40%, #0d2b14 70%, #000000 100%)'}}>
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>

        <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
          <div className="flex justify-center gap-2 mb-8">
            <span className="w-8 h-2 bg-green-500 rounded-full"></span>
            <span className="w-8 h-2 bg-yellow-400 rounded-full"></span>
            <span className="w-8 h-2 bg-red-500 rounded-full"></span>
          </div>

          <p className="text-green-300 font-semibold tracking-widest uppercase text-sm mb-4">BIENVENUE SUR</p>
          <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tight">
            UEEMT<span className="text-yellow-400">-</span>TOKAT
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-2 font-light">
            Union des Élèves et Étudiants Maliens à Tokat
          </p>
          <p className="text-green-300 italic mb-10 text-lg">Travail – Solidarité – Réussite</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/recensement" className="bg-green-500 hover:bg-green-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg">
              Se Recenser
            </Link>
            <a
              href="https://www.instagram.com/ueemt.tokat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-2 border-white/30 hover:border-white text-white px-8 py-4 rounded-xl font-semibold transition-all"
            >
              <InstagramIcon size={20} />
              @ueemt.tokat
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </section>

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
              <span className="text-2xl font-black">{value}</span>
              <span className="text-green-200 text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: '📚', title: 'Travail', desc: "L'excellence académique est notre priorité. Nous nous soutenons mutuellement dans notre parcours d'études." },
              { emoji: '🤝', title: 'Solidarité', desc: "Ensemble, nous sommes plus forts. L'UEEMT-Tokat est une famille soudée loin de chez nous." },
              { emoji: '🦁', title: 'Patriotisme', desc: "Fiers de notre héritage malien, nous portons haut les couleurs du Mali à Tokat." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <span className="text-4xl mb-4 block">{emoji}</span>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* President message */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-green-100 border-4 border-green-500 flex items-center justify-center text-4xl">
                👨‍🎓
              </div>
            </div>
            <div>
              <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Message du Président</span>
              <blockquote className="text-xl text-gray-700 italic leading-relaxed mt-3 mb-4">
                "Chers élèves et étudiants maliens de Tokat, notre association est un cadre d'unité et de solidarité. Ensemble, construisons notre avenir académique avec discipline, travail et patriotisme."
              </blockquote>
              <p className="font-bold text-gray-900">Abdoul Karim FASKOYE</p>
              <p className="text-gray-500 text-sm">Président, UEEMT-Tokat</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{background: 'linear-gradient(135deg, #14A44D, #0a7a35)'}}>
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Rejoignez la communauté UEEMT-Tokat</h2>
          <p className="text-green-100 mb-8 text-lg">Recensez-vous pour faire partie officiellement de notre association et accéder à tous nos services.</p>
          <Link href="/recensement" className="bg-white text-green-700 hover:bg-green-50 px-10 py-4 rounded-xl font-bold text-lg inline-block transition-colors shadow-lg">
            Se Recenser →
          </Link>
        </div>
      </section>
    </>
  )
}
