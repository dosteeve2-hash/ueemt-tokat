import { Calendar } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'

export default function ActivitesPage() {
  const placeholders = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Vie associative</p>
          <h1 className="text-4xl md:text-5xl font-black">Nos Activités</h1>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {placeholders.map((i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl flex items-center justify-center text-white font-bold text-sm"
              style={{
                background: i % 3 === 0
                  ? 'linear-gradient(135deg, #14A44D, #0a7a35)'
                  : i % 3 === 1
                  ? 'linear-gradient(135deg, #F0D100, #c4aa00)'
                  : 'linear-gradient(135deg, #CE1126, #9a0d1b)',
              }}
            >
              📸 Photo {i + 1}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center bg-gray-50 rounded-2xl p-10">
          <InstagramIcon size={40} className="text-pink-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Suivez toutes nos activités</h3>
          <p className="text-gray-600 mb-6">Découvrez nos événements, sorties et activités culturelles sur Instagram</p>
          <a
            href="https://www.instagram.com/ueemt.tokat"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <InstagramIcon size={18} />
            @ueemt.tokat
          </a>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar size={24} className="text-green-600" />
            Événements à venir
          </h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500">
            <p className="text-lg font-medium">Aucun événement planifié pour le moment.</p>
            <p className="text-sm mt-2">Restez connectés sur notre Instagram pour ne rien manquer !</p>
          </div>
        </div>
      </section>
    </div>
  )
}
