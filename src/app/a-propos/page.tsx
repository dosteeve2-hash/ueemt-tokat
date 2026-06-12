'use client'

import { useState } from 'react'

const tabs = ['Présentation', 'Notre Mission', 'Notre Vision']

const tabContent: Record<string, string> = {
  'Présentation': "L'UEEMT-Tokat est la représentation locale à Tokat de l'Union des Élèves et Étudiants Maliens en Turquie. Active depuis 2022, elle regroupe les Maliens étudiant à Tokat Gaziosmanpaşa Üniversitesi et dans les lycées de la ville. L'association joue un rôle de passerelle entre le Mali et la Turquie, favorisant l'entraide, le partage culturel et la réussite académique de ses membres.",
  'Notre Mission': "• Créer et renforcer les liens de fraternité entre ses membres\n• Valoriser la culture malienne en Turquie\n• Faciliter l'intégration des Maliens à Tokat\n• Défendre les intérêts des membres\n• Soutenir les membres dans leurs démarches administratives et académiques",
  'Notre Vision': "Devenir la référence des associations étudiantes africaines en Turquie. Accompagner chaque Malien de Tokat vers la réussite académique et professionnelle, tout en maintenant un lien fort avec la culture et les valeurs maliennes.",
}

const bureau = [
  { role: 'Président', nom: 'Abdoul Karim FASKOYE', emoji: '👨‍💼' },
  { role: 'Chargé de Communication', nom: 'Steeve Donald Compaoré', emoji: '📢' },
  { role: 'Chargée de Communication', nom: 'Fanta Traoré', emoji: '📢' },
  { role: 'Secrétaire Général', nom: '— (à compléter)', emoji: '📋' },
  { role: 'Trésorier', nom: '— (à compléter)', emoji: '💰' },
  { role: 'Chargé des Affaires Culturelles', nom: '— (à compléter)', emoji: '🎭' },
]

export default function AProposPage() {
  const [activeTab, setActiveTab] = useState('Présentation')

  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Qui sommes-nous ?</p>
          <h1 className="text-4xl md:text-5xl font-black">À Propos</h1>
          <p className="text-green-100 mt-3 text-lg">Fondée le 2 novembre 2022 · Tokat, Türkiye</p>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex border-b border-gray-200 mb-8 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-semibold text-sm rounded-t-lg transition-colors ${
                activeTab === tab
                  ? 'bg-green-600 text-white border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
          {tabContent[activeTab]}
        </div>
      </section>

      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10 text-gray-900">Bureau Exécutif</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bureau.map(({ role, nom, emoji }) => (
              <div key={role + nom} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <span className="text-4xl mb-3 block">{emoji}</span>
                <p className="text-green-600 font-semibold text-xs uppercase tracking-wide mb-1">{role}</p>
                <p className="text-gray-900 font-bold">{nom}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
