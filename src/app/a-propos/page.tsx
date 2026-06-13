'use client'

import { useState } from 'react'
import { BUREAU_MEMBERS } from '@/lib/constants'

const tabs = ['Présentation', 'Notre Mission', 'Notre Vision']

const tabContent: Record<string, string> = {
  'Présentation':
    "L'UEEMT-Tokat est la représentation locale à Tokat de l'Union des Élèves et Étudiants Maliens en Turquie. Active depuis le 2 novembre 2022, elle regroupe les Maliens étudiant à Tokat Gaziosmanpaşa Üniversitesi et dans les lycées de la ville. L'association joue un rôle de passerelle entre le Mali et la Turquie, favorisant l'entraide, le partage culturel et la réussite académique de ses membres.",
  'Notre Mission':
    "• Créer et renforcer les liens de fraternité entre ses membres\n• Valoriser la culture malienne en Turquie\n• Faciliter l'intégration des Maliens à Tokat\n• Défendre les intérêts des membres\n• Soutenir les membres dans leurs démarches administratives et académiques",
  'Notre Vision':
    "Devenir la référence des associations étudiantes africaines en Turquie. Accompagner chaque Malien de Tokat vers la réussite académique et professionnelle, tout en maintenant un lien fort avec la culture et les valeurs maliennes.",
}

export default function AProposPage() {
  const [activeTab, setActiveTab] = useState('Présentation')

  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-green-200 text-sm uppercase tracking-widest mb-2">Qui sommes-nous ?</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black">À Propos</h1>
          <p className="text-green-100 mt-3 text-base sm:text-lg">Fondée le 2 novembre 2022 · Tokat, Türkiye</p>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Tabs — scrollable on mobile */}
        <div className="overflow-x-auto mb-8">
          <div className="flex border-b border-gray-200 gap-1 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-5 py-3 font-semibold text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-600 hover:text-green-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
          {tabContent[activeTab]}
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-green-600 font-semibold text-sm uppercase tracking-widest">Gouvernance</span>
            <h2 className="text-2xl font-bold mt-2 text-gray-900">Bureau Exécutif</h2>
            <p className="text-gray-500 text-sm mt-1">Les 6 membres élus qui dirigent l'UEEMT-Tokat</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {BUREAU_MEMBERS.map(({ prenom, nom, role }) => (
              <div key={nom} className="bg-white rounded-2xl border-2 border-green-100 hover:border-green-400 p-5 sm:p-6 text-center transition-all hover:shadow-md group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 border-2 border-green-200 flex items-center justify-center text-white font-black text-xl sm:text-2xl mx-auto mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                  {prenom[0]}{nom[0]}
                </div>
                <div className="inline-block bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  {role}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">{prenom} {nom}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-gray-900">Notre Histoire</h2>
          <div className="relative border-l-2 border-green-200 pl-5 sm:pl-6 space-y-8">
            {[
              { date: '2 Novembre 2022', title: 'Fondation', desc: "Création officielle de l'UEEMT-Tokat avec les premiers membres fondateurs." },
              { date: '2023', title: 'Croissance', desc: "L'association atteint 20 membres et organise ses premières activités culturelles." },
              { date: '2024–2025', title: 'Consolidation', desc: "34 membres recensés. Mise en place du bureau exécutif. Lancement du site officiel." },
            ].map(({ date, title, desc }) => (
              <div key={date} className="relative">
                <div className="absolute -left-7 sm:-left-8 w-3 h-3 bg-green-500 rounded-full border-2 border-white mt-1" />
                <span className="text-green-600 text-sm font-semibold">{date}</span>
                <h3 className="font-bold text-gray-900 mt-0.5">{title}</h3>
                <p className="text-gray-600 text-sm mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
