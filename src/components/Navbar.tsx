'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  role: string
  avatar_url: string | null
  member: { prenom: string; nom: string } | null
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')

  useEffect(() => {
    const supabase = createClient()

    // Fetch site logo (non-blocking, falls back to /logo.jpeg)
    const fetchLogo = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'logo_url').single()
        if (data?.value) setLogoUrl(data.value)
      } catch {}
    }
    void fetchLogo()

    const fetchProfile = async (uid: string) => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('role, avatar_url, member:member_id(prenom, nom)')
          .eq('id', uid)
          .single()
        setProfile(data as Profile | null)
      } catch {}
    }

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u)
      if (u) fetchProfile(u.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/'
  }

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/a-propos', label: 'À propos' },
    { href: '/membres', label: 'Membres' },
    { href: '/activites', label: 'Activités' },
    { href: '/contact', label: 'Contact' },
  ]

  const dashboardHref = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard'
  const displayName = profile?.member
    ? `${profile.member.prenom.split(' ')[0]} ${profile.member.nom}`
    : user?.email?.split('@')[0] ?? ''

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src={logoUrl}
              alt="UEEMT-Tokat"
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
            <span className="font-bold text-lg text-green-600 hidden sm:block">UEEMT-Tokat</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-gray-700 hover:text-green-600 font-medium transition-colors text-sm">
                {l.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                <Link href={dashboardHref} className="flex items-center gap-2 text-gray-700 hover:text-green-600 text-sm font-medium">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-28 truncate">{displayName}</span>
                </Link>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Déconnexion">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/connexion" className="text-gray-500 hover:text-gray-800 text-sm">Connexion</Link>
                <Link href="/recensement" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Se Recenser
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 hover:text-green-600 hover:bg-gray-50 font-medium py-3 px-2 rounded-lg transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 hover:bg-gray-50 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={16} /> Mon Espace
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-50 font-medium py-3 px-2 rounded-lg w-full text-left transition-colors"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="block text-gray-600 hover:bg-gray-50 py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/recensement"
                    className="block bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold text-center mt-2"
                    onClick={() => setOpen(false)}
                  >
                    Se Recenser
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
