import Link from 'next/link'
import InstagramIcon from '@/components/InstagramIcon'

export default function Footer() {
  const navItems = [
    { label: 'Accueil', href: '/' },
    { label: 'À propos', href: '/a-propos' },
    { label: 'Membres', href: '/membres' },
    { label: 'Activités', href: '/activites' },
    { label: 'Contact', href: '/contact' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-3 text-green-400">UEEMT-Tokat</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Union des Élèves et Étudiants Maliens à Tokat.<br />
              Fondée le 2 novembre 2022.<br />
              <em className="text-yellow-400">Travail – Solidarité – Réussite</em>
            </p>
          </div>
          <div>
            <h3 className="font-bold mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {navItems.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-green-400 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-3">Suivez-nous</h3>
            <a
              href="https://www.instagram.com/ueemt.tokat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors text-sm"
            >
              <InstagramIcon size={18} />
              @ueemt.tokat
            </a>
            <p className="text-gray-500 text-xs mt-4">Tokat, Türkiye</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} UEEMT-Tokat. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
