import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat',
  description: "Site officiel de l'UEEMT-Tokat — Union des Élèves et Étudiants Maliens à Tokat, Turquie. Fondée le 2 novembre 2022.",
  keywords: 'UEEMT, Maliens, Tokat, Turquie, étudiants, association',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
