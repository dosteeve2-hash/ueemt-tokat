'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, LogOut, Rss, User, Sun, Moon, Search, Bell, Coins } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useLanguage } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import SearchOverlay from '@/components/SearchOverlay'
import NotificationBell from '@/components/NotificationBell'

const LANG_FLAGS: Record<string, string> = { fr: '🇫🇷', en: '🇬🇧', tr: '🇹🇷' }

function LangSelector() {
  const { lang, setLang } = useLanguage()
  return (
    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg px-1 py-1">
      {(['fr', 'en', 'tr'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
            lang === l
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
          }`}
          aria-label={`Langue : ${l.toUpperCase()}`}
        >
          {LANG_FLAGS[l]} {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

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
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')
  const { t } = useLanguage()

  useEffect(() => {
    const supabase = createClient()

    const fetchLogo = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('value').eq('key', 'logo_url').single()
        if (data?.value) setLogoUrl(data.value)
      } catch {}
    }
    void fetchLogo()

    let lastFetchedUid: string | null = null
    const fetchProfile = async (uid: string) => {
      if (uid === lastFetchedUid) return
      lastFetchedUid = uid
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('role, avatar_url, member:member_id(prenom, nom)')
          .eq('id', uid)
          .single()
        setProfile(data as Profile | null)
      } catch {}
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) fetchProfile(u.id)
      else { lastFetchedUid = null; setProfile(null) }
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
    { href: '/', label: t('nav.home') },
    { href: '/a-propos', label: t('nav.about') },
    { href: '/membres', label: t('nav.members') },
    { href: '/activites', label: t('nav.activities') },
    { href: '/contact', label: t('nav.contact') },
  ]

  const dashboardHref = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard'
  const displayName = profile?.member
    ? `${profile.member.prenom.split(' ')[0]} ${profile.member.nom}`
    : user?.email?.split('@')[0] ?? ''

  return (
    <>
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
              <>
                <Link
                  href="/feed"
                  className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors text-sm"
                >
                  <Rss size={14} />
                  {t('nav.feed')}
                </Link>
                <Link
                  href="/cotisations"
                  className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors text-sm"
                >
                  <Coins size={14} />
                  {t('nav.cotisations')}
                </Link>
              </>
            )}

            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-green-400 dark:hover:bg-slate-700 transition-colors"
              aria-label="Rechercher"
              title="Rechercher"
            >
              <Search size={18} />
            </button>
            {user && <NotificationBell />}
            <LangSelector />
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
                  className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 font-semibold text-sm transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                  title="Mon espace"
                >
                  <LayoutDashboard size={15} />
                  <span>Mon espace</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors p-1 text-xs font-medium"
                  title="Déconnexion"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <>
                <Link href="/connexion" className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 text-sm">
                  {t('nav.login')}
                </Link>
                <Link
                  href="/recensement"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile: search + theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Rechercher"
            >
              <Search size={20} />
            </button>
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
                    <Rss size={16} /> {t('nav.feed')}
                  </Link>
                  <Link
                    href="/cotisations"
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <Coins size={16} /> {t('nav.cotisations')}
                  </Link>
                  <Link
                    href="/notifications"
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <Bell size={16} /> Notifications
                  </Link>
                  <Link
                    href="/profil"
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <User size={16} /> {t('nav.profile')}
                  </Link>
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard size={16} /> {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 font-medium py-3 px-2 rounded-lg w-full text-left transition-colors"
                  >
                    <LogOut size={16} /> {t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/connexion"
                    className="block text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 py-3 px-2 rounded-lg"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href="/recensement"
                    className="block bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold text-center mt-2"
                    onClick={() => setOpen(false)}
                  >
                    {t('nav.register')}
                  </Link>
                </>
              )}
              {/* Language selector in mobile menu */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-400 dark:text-slate-500 px-2 mb-2 uppercase tracking-wider">Langue / Language / Dil</p>
                <LangSelector />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
    {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
  </>
  )
}
