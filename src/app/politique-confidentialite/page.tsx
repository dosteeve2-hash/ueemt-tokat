import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Politique de confidentialité | UEEMT-Tokat',
}

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 text-sm mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Politique de confidentialité</h1>
          <p className="text-gray-400 text-sm mb-8">Dernière mise à jour : juin 2026</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">1. Données collectées</h2>
              <p>
                L'UEEMT-Tokat collecte les informations suivantes lors de votre inscription :
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Prénom et nom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone (optionnel)</li>
                <li>Filière et université</li>
                <li>Niveau d'études</li>
                <li>Date d'arrivée à Tokat</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">2. Finalité</h2>
              <p>
                Ces données sont utilisées exclusivement pour :
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Gérer votre adhésion à l'association</li>
                <li>Vous contacter pour les activités et événements</li>
                <li>Établir des statistiques anonymisées sur la communauté</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">3. Stockage</h2>
              <p>
                Vos données sont stockées sur <strong>Supabase</strong> (infrastructure en Europe) avec chiffrement des données au repos. L'accès est protégé par Row Level Security (RLS).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">4. Partage des données</h2>
              <p>
                Vos données ne sont jamais vendues ni partagées avec des tiers. Seuls les membres du bureau exécutif y ont accès dans le cadre de la gestion de l'association.
              </p>
              <p className="mt-2">
                Les profils marqués comme <em>publics</em> sont visibles par les autres membres connectés (prénom, nom, filière, bio).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">5. Vos droits</h2>
              <p>
                Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez l'administration via la page{' '}
                <Link href="/contact" className="text-green-600 hover:underline">Contact</Link> ou sur Instagram{' '}
                <a href="https://www.instagram.com/ueemt.tokat" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">@ueemt.tokat</a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">6. Cookies</h2>
              <p>
                Ce site utilise uniquement des cookies de session pour l'authentification (httpOnly, SameSite=Strict). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
