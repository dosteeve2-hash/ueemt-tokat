import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import PushNotificationSetup from '@/components/PushNotificationSetup'
import { Toaster } from 'sonner'
import ScrollToTopButton from '@/components/ScrollToTopButton'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#14A44D',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://ueemt-tokat.vercel.app'),
  title: {
    default: 'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat',
    template: '%s | UEEMT-Tokat',
  },
  description: "Site officiel de l'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat, Turquie. Réseau, actualités et ressources pour les étudiants maliens. Fondée le 2 novembre 2022.",
  keywords: ['UEEMT', 'Tokat', 'Mali', 'étudiants maliens', 'association', 'Turquie', 'Gaziosmanpaşa', 'GOP'],
  authors: [{ name: 'UEEMT-Tokat' }],
  creator: 'UEEMT-Tokat',
  manifest: '/manifest.json',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://ueemt-tokat.vercel.app',
    siteName: 'UEEMT-Tokat',
    title: 'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat',
    description: "Site officiel de l'UEEMT-Tokat — réseau des étudiants maliens à Tokat, Turquie.",
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'UEEMT-Tokat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UEEMT-Tokat',
    description: "Réseau des étudiants maliens à Tokat, Turquie.",
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UEEMT-Tokat',
  },
  icons: {
    // Route dynamique : reflète toujours le logo courant de Supabase site_settings
    apple: [
      { url: '/api/pwa-icon', sizes: '180x180' },
      { url: '/api/pwa-icon', sizes: '152x152' },
    ],
    icon: [
      { url: '/api/pwa-icon', sizes: '192x192' },
      { url: '/api/pwa-icon', sizes: '32x32' },
      { url: '/api/pwa-icon', sizes: '16x16' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Icône PWA dynamique — reflète le logo courant de Supabase site_settings */}
        <link rel="apple-touch-icon" href="/api/pwa-icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/api/pwa-icon" />
        <link rel="apple-touch-icon" sizes="152x152" href="/api/pwa-icon" />
        <link rel="preconnect" href="https://ybjrmvvkasohslgsrhzh.supabase.co" />
        <link rel="dns-prefetch" href="https://ybjrmvvkasohslgsrhzh.supabase.co" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <LanguageProvider>
            <ServiceWorkerRegistration />
            <Navbar />
            <main className="pb-16 md:pb-0">{children}</main>
            <PushNotificationSetup />
            <Footer />
            <ScrollToTopButton />
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              duration={3500}
              toastOptions={{
                classNames: {
                  toast: 'font-sans text-sm',
                },
              }}
            />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
