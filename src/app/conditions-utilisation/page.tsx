import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: "Conditions d'utilisation | UEEMT-Tokat",
}

export default function ConditionsUtilisationPage() {
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
          <h1 className="text-2xl font-black text-gray-900 mb-2">Conditions d'utilisation</h1>
          <p className="text-gray-400 text-sm mb-8">Dernière mise à jour : juin 2026</p>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">1. Accès</h2>
              <p>
                L'accès à l'espace membre UEEMT-Tokat est réservé aux élèves et étudiants maliens inscrits à Tokat (Turquie). Toute inscription frauduleuse entraîne la suppression immédiate du compte.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">2. Comportement</h2>
              <p>
                Les membres s'engagent à :
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Respecter les autres membres et le bureau exécutif</li>
                <li>Ne publier aucun contenu illégal, offensant ou discriminatoire</li>
                <li>Ne pas usurper l'identité d'un autre membre</li>
                <li>Ne pas utiliser la plateforme à des fins commerciales non autorisées</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">3. Contenu publié</h2>
              <p>
                Vous restez responsable de tout contenu publié (posts, photos, commentaires). L'UEEMT-Tokat se réserve le droit de supprimer tout contenu contraire à ces conditions.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">4. Sanctions</h2>
              <p>
                En cas de violation des présentes conditions, le bureau peut suspendre ou supprimer définitivement le compte sans préavis.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">5. Disponibilité</h2>
              <p>
                La plateforme est fournie « en l'état ». L'UEEMT-Tokat ne garantit pas une disponibilité continue et ne peut être tenu responsable d'une interruption de service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-2">6. Contact</h2>
              <p>
                Pour toute question, rendez-vous sur la page{' '}
                <Link href="/contact" className="text-green-600 hover:underline">Contact</Link> ou contactez-nous sur Instagram{' '}
                <a href="https://www.instagram.com/ueemt.tokat" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">@ueemt.tokat</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
