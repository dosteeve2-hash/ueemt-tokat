'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/a-propos', label: 'À propos' },
    { href: '/membres', label: 'Membres' },
    { href: '/activites', label: 'Activités' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="UEEMT-Tokat" width={40} height={40} className="rounded-full object-cover" />
            <span className="font-bold text-lg text-green-600 hidden sm:block">UEEMT-Tokat</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-gray-700 hover:text-green-600 font-medium transition-colors text-sm">
                {l.label}
              </Link>
            ))}
            <Link href="/connexion" className="text-gray-500 hover:text-gray-800 text-sm">Connexion</Link>
            <Link href="/recensement" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Se Recenser
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-gray-100 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-gray-700 hover:text-green-600 font-medium py-2" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link href="/connexion" className="text-gray-500 py-2" onClick={() => setOpen(false)}>Connexion</Link>
            <Link href="/recensement" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold text-center" onClick={() => setOpen(false)}>
              Se Recenser
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
