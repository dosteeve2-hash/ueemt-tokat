import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#14A44D',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat',
  description: "Site officiel de l'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat, Turquie. Fondée le 2 novembre 2022.",
  keywords: 'UEEMT, Maliens, Tokat, Turquie, étudiants, association',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UEEMT-Tokat',
  },
  icons: {
    apple: [
      { url: '/icons/icon-180x180.png', sizes: '180x180' },
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
    ],
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
      </head>
      <body className={inter.className}>
        <ServiceWorkerRegistration />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
