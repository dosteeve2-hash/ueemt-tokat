'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, LogOut, Rss, User, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  role: string
  avatar_url: string | null
  member: { prenom: string; nom: string } | null
}

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8" />
  const isDark = resolvedTheme === 'dark'
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-green-400 dark:hover:bg-slate-700 transition-colors"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')

  useEffect(() => {
    const supabase = createClient()

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
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
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
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors text-sm"
              >
                {l.label}
              </Link>
            ))}

            {user && (
              <Link
                href="/feed"
                className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors text-sm"
              >
                <Rss size={14} />
                Fil d&apos;actu
              </Link>
            )}

            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700">
                <Link
                  href="/profil"
                  className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 text-sm font-medium"
                  title="Mon profil"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-24 truncate">{displayName}</span>
                </Link>
                <Link
                  href={dashboardHref}
                  className="text-gray-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1"
                  title="Mon espace"
                >
                  <LayoutDashboard size={16} />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors p-1"
                  title="Déconnexion"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/connexion" className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 text-sm">
                  Connexion
                </Link>
                <Link
                  href="/recensement"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Se Recenser
                </Link>
              </>
            )}
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 dark:border-slate-700 py-4 flex flex-col gap-1 bg-white dark:bg-slate-900">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg transition-colors"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 dark:border-slate-700 mt-2 pt-2">
              {user ? (
                <>
                  <Link
                    href="/feed"
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <Rss size={16} /> Fil d&apos;actualité
                  </Link>
                  <Link
                    href="/profil"
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <User size={16} /> Mon Profil
                  </Link>
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={16} /> Mon Espace
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 font-medium py-3 px-2 rounded-lg w-full text-left transition-colors"
                  >
                    <LogOut size={16} /> Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="block text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 py-3 px-2 rounded-lg"
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
