'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, LayoutDashboard, LogOut, Rss, User, Sun, Moon, Search, Coins, CalendarDays, Bell, Home, Users, ChevronRight, ShoppingBag } from 'lucide-react'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [logoUrl, setLogoUrl] = useState('/logo.jpeg')
  const { t } = useLanguage()
  const pathname = usePathname()

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

  // Fermer la sidebar quand on change de page
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    window.location.href = '/'
  }

  const publicLinks = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/a-propos', label: t('nav.about'), icon: ChevronRight },
    { href: '/archives', label: 'Archives', icon: ChevronRight },
    { href: '/membres', label: t('nav.members'), icon: Users },
    { href: '/activites', label: t('nav.activities'), icon: ChevronRight },
    { href: '/contact', label: t('nav.contact'), icon: ChevronRight },
  ]

  const memberLinks = [
    { href: '/feed', label: t('nav.feed'), icon: Rss },
    { href: '/membres', label: t('nav.members'), icon: Users },
    { href: '/evenements', label: 'Événements', icon: CalendarDays },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/cotisations', label: t('nav.cotisations'), icon: Coins },
    { href: '/activites', label: t('nav.activities'), icon: ChevronRight },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profil', label: t('nav.profile'), icon: User },
  ]

  const dashboardHref = (profile?.role === 'admin' || profile?.role === 'president') ? '/dashboard/admin' : '/dashboard'
  const displayName = profile?.member
    ? `${profile.member.prenom.split(' ')[0]} ${profile.member.nom}`
    : user?.email?.split('@')[0] ?? ''

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href)

  // Bottom nav links (mobile only)
  const bottomNavLinks = user ? [
    { href: '/feed', label: 'Fil', icon: Rss },
    { href: '/membres', label: 'Membres', icon: Users },
    { href: dashboardHref, label: 'Mon espace', icon: LayoutDashboard },
    { href: '/profil', label: 'Profil', icon: User },
  ] : [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/membres', label: 'Membres', icon: Users },
    { href: '/connexion', label: 'Connexion', icon: User },
  ]

  return (
    <>
      {/* ─── Topbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={user ? '/feed' : '/'} className="flex items-center gap-3 flex-shrink-0">
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
              {(user ? memberLinks.slice(0, 3) : publicLinks).map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(l.href)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  {l.label}
                </Link>
              ))}

              {user && (
                <>
                  <Link href="/cotisations" className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive('/cotisations') ? 'text-green-600' : 'text-gray-700 dark:text-slate-300 hover:text-green-600'}`}>
                    <Coins size={14} />{t('nav.cotisations')}
                  </Link>
                </>
              )}

              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-green-600 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-green-400 dark:hover:bg-slate-700 transition-colors"
                aria-label="Rechercher"
              >
                <Search size={18} />
              </button>
              {user && <NotificationBell />}
              <LangSelector />
              <ThemeToggle />

              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-slate-700">
                  <Link href="/profil" className="flex items-center gap-2 text-gray-700 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400 text-sm font-medium" title="Mon profil">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-24 truncate">{displayName}</span>
                  </Link>
                  <Link href={dashboardHref} className="flex items-center gap-1.5 text-gray-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 font-semibold text-sm transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800" title="Mon espace">
                    <LayoutDashboard size={15} />
                    <span>Mon espace</span>
                  </Link>
                  <button onClick={handleSignOut} className="flex items-center gap-1 text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors p-1 text-xs font-medium" title="Déconnexion">
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/connexion" className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 text-sm">{t('nav.login')}</Link>
                  <Link href="/recensement" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">{t('nav.register')}</Link>
                </>
              )}
            </div>

            {/* Mobile: search + theme + hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" aria-label="Rechercher">
                <Search size={20} />
              </button>
              <ThemeToggle />
              <button
                className="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setSidebarOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── Sidebar mobile (slide depuis la gauche) ─────────────────────── */}
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menu de navigation"
      >
        {/* Header sidebar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-800">
          <Link href={user ? '/feed' : '/'} className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img src={logoUrl} alt="UEEMT-Tokat" className="w-9 h-9 rounded-full object-cover" />
            <span className="font-bold text-green-600 text-base">UEEMT-Tokat</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {/* Profil utilisateur si connecté */}
        {user && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 bg-green-50 dark:bg-slate-800/50">
            <Link href="/profil" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-green-200" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-green-200">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">{displayName}</p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium capitalize">
                  {profile?.role === 'president' ? '👑 Président' : profile?.role === 'admin' ? '⭐ Bureau' : '👤 Membre'}
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Liens de navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {(user ? memberLinks : publicLinks).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              {label}
            </Link>
          ))}

          {user && (
            <Link
              href={dashboardHref}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(dashboardHref)
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-green-600'
              }`}
            >
              <LayoutDashboard size={18} className="flex-shrink-0" />
              Mon espace
            </Link>
          )}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-slate-800 space-y-3">
          <LangSelector />
          {user ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950 text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              Se déconnecter
            </button>
          ) : (
            <div className="space-y-2">
              <Link href="/connexion" onClick={() => setSidebarOpen(false)} className="block w-full text-center px-4 py-2.5 rounded-xl border border-green-600 text-green-600 font-semibold text-sm hover:bg-green-50 transition-colors">
                Se connecter
              </Link>
              <Link href="/recensement" onClick={() => setSidebarOpen(false)} className="block w-full text-center px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors">
                Se recenser
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Bottom navigation bar (mobile uniquement) ───────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch">
          {bottomNavLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
                isActive(href)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive(href) ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {isActive(href) && (
                <div className="w-4 h-0.5 rounded-full bg-green-600 dark:bg-green-400 mt-0.5" />
              )}
            </Link>
          ))}
          {/* Bouton menu "Plus" */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-gray-500 dark:text-slate-400 hover:text-green-600 transition-colors"
          >
            <Menu size={22} strokeWidth={1.75} />
            <span className="text-[10px] font-medium leading-none">Plus</span>
          </button>
        </div>
      </nav>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}
