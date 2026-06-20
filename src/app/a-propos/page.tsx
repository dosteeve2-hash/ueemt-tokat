'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BUREAU_MEMBERS } from '@/lib/constants'

// ─── Timeline historique enrichie depuis les documents officiels ─────────────
const TIMELINE = [
  {
    date: '4 octobre 2022',
    emoji: '🤝',
    title: 'Le premier rassemblement',
    desc: 'Une réunion historique regroupe l\'ensemble des étudiants maliens de Tokat pour la première fois. L\'idée d\'une association prend forme dans les conversations, les rires partagés et la volonté commune d\'avancer ensemble.',
  },
  {
    date: '29 octobre 2022',
    emoji: '👑',
    title: 'L\'élection du premier président',
    desc: 'À l\'unanimité, les membres fondateurs élisent leur premier président. Un moment de confiance et d\'unité qui pose les bases de ce que l\'association deviendra.',
  },
  {
    date: '2 novembre 2022',
    emoji: '🏛️',
    title: 'Fondation officielle de l\'AEMTO',
    desc: 'L\'Association des Étudiants Maliens de Tokat (AEMTO) est officiellement créée. Sous la devise "Travail – Solidarité – Réussite", une nouvelle page s\'écrit pour les Maliens de Tokat.',
  },
  {
    date: '30 décembre 2023',
    emoji: '🗳️',
    title: 'Premières élections présidentielles démocratiques',
    desc: 'L\'AEMTO tient ses premières élections présidentielles ouvertes à tous les membres. Un processus démocratique exemplaire qui témoigne de la maturité de l\'association. Manssa Makan Kouyaté est élu président.',
  },
  {
    date: '12 janvier 2024',
    emoji: '📜',
    title: 'Nouvelle Constitution',
    desc: 'Une nouvelle constitution est rédigée et adoptée, formalisant les droits et obligations de chaque membre, la structure du Bureau Exécutif, et les valeurs qui guideront l\'association pour les années à venir.',
  },
  {
    date: '19 mars 2024',
    emoji: '🔄',
    title: 'AEMTO devient UEEMT-Tokat',
    desc: 'Dans une démarche d\'unification nationale, l\'association s\'affilie au bureau central de l\'AEEMT et change officiellement de nom. L\'UEEMT-Tokat naît, plus forte et plus représentative que jamais.',
  },
  {
    date: 'Octobre 2024',
    emoji: '📸',
    title: 'Erasmus Photomarathon',
    desc: 'Des membres de l\'UEEMT-Tokat participent au 1er Fotomarathon international de l\'Université Gaziosmanpaşa. Sous le thème "Tokat par vos yeux", ils capturent leur ville d\'adoption avec un regard africain unique.',
  },
  {
    date: '2025–2026',
    emoji: '🚀',
    title: 'Consolidation & site officiel',
    desc: 'Plus de 34 membres recensés. Lancement du site officiel. Mise en place d\'un espace numérique pour la communauté : fil d\'actualité, galerie, événements, cotisations en ligne. L\'UEEMT-Tokat entre dans l\'ère digitale.',
  },
]

// ─── Valeurs ─────────────────────────────────────────────────────────────────
const VALUES = [
  {
    emoji: '🤝',
    title: 'Solidarité',
    desc: 'Ici, personne ne galère seul. Que ce soit pour une démarche administrative, un logement, ou juste un coup de blues loin de chez soi — on est là les uns pour les autres.',
  },
  {
    emoji: '📚',
    title: 'Travail',
    desc: 'Nous sommes venus à Tokat avec un objectif : réussir. Chaque membre de l\'UEEMT-Tokat est un ambassadeur de la rigueur et de l\'excellence malienne.',
  },
  {
    emoji: '🏆',
    title: 'Réussite',
    desc: 'La réussite n\'est pas individuelle. Quand l\'un de nous avance, c\'est toute la communauté qui progresse. Nous cultivons une culture de la victoire collective.',
  },
  {
    emoji: '🌍',
    title: 'Culture',
    desc: 'À des milliers de kilomètres du Mali, nous gardons vivantes nos traditions, notre musique, notre gastronomie. Notre identité est notre plus grande force.',
  },
]

const TABS = ['Notre Histoire', 'Notre Mission', 'Notre Vision'] as const
type Tab = typeof TABS[number]

export default function AProposPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Notre Histoire')
  const [expandedTimeline, setExpandedTimeline] = useState(false)

  const visibleTimeline = expandedTimeline ? TIMELINE : TIMELINE.slice(0, 4)

  return (
    <div className="min-h-screen">

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <header className="bg-green-600 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 text-[200px] leading-none select-none pointer-events-none flex items-end justify-end pr-8 pb-0 font-black">
          🦁
        </div>
        <div className="max-w-3xl mx-auto px-4 relative">
          <p className="text-green-300 text-xs uppercase tracking-widest mb-3 font-semibold">Fondée le 2 novembre 2022 · Tokat, Türkiye</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight">
            L'union fait<br />notre force.
          </h1>
          <p className="text-green-100 mt-5 text-lg sm:text-xl max-w-xl leading-relaxed">
            Nous sommes les étudiants maliens de Tokat — une famille loin de chez nous, mais jamais seule. Bienvenue dans notre histoire.
          </p>
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
              ✊ Travail
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
              🤝 Solidarité
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold">
              🏆 Réussite
            </span>
          </div>
        </div>
      </header>

      {/* ─── Intro narrative ──────────────────────────────────────────── */}
      <section className="bg-white py-14 sm:py-18">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center mb-12">
            {[
              { n: '2022', label: 'Année de fondation' },
              { n: '34+', label: 'Membres recensés' },
              { n: '1', label: 'Famille à Tokat' },
            ].map(({ n, label }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-6">
                <p className="text-4xl font-black text-green-600">{n}</p>
                <p className="text-gray-500 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 gap-1 mb-8 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 font-semibold text-sm rounded-t-lg transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-green-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Notre Histoire' && (
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 text-lg leading-relaxed">
                Tout a commencé par une simple question : <em>"Et si on créait quelque chose ensemble ?"</em>
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                En octobre 2022, une poignée d'étudiants maliens se réunit à Tokat. Ils viennent de différentes villes du Mali, étudient dans différentes facultés, mais partagent la même réalité : celle d'un étudiant africain en Turquie, loin de sa famille, navigant entre deux cultures.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                De cette réunion naît l'<strong>AEMTO</strong> — l'Association des Étudiants Maliens de Tokat. Avec une devise gravée dans le marbre : <strong>"Travail – Solidarité – Réussite"</strong>. Trois mots. Un programme de vie.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                En mars 2024, l'association s'affilie à l'AEEMT, le réseau national des Maliens en Turquie, et prend son nom actuel : <strong>UEEMT-Tokat</strong>. Un changement de nom, mais surtout une élévation : notre voix porte désormais au niveau national.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                Aujourd'hui, nous sommes plus de 34 membres. Nous organisons des événements culturels, nous défendons les droits de chaque étudiant malien à Tokat, et nous prouvons chaque jour que la distance ne brise pas les liens — elle les renforce.
              </p>
            </div>
          )}

          {activeTab === 'Notre Mission' && (
            <div className="space-y-5">
              {[
                { icon: '🤝', title: 'Créer des liens durables', desc: 'Renforcer la fraternité et la solidarité entre tous les Maliens de Tokat, qu\'ils soient lycéens, étudiants en licence ou en master.' },
                { icon: '🎭', title: 'Valoriser la culture malienne', desc: 'Faire vivre notre identité à Tokat : langues, traditions, gastronomie, musique. Être Malien à Tokat, c\'est être ambassadeur d\'une culture millénaire.' },
                { icon: '🧭', title: 'Faciliter l\'intégration', desc: 'Accueillir les nouveaux arrivants, les guider dans leurs démarches administratives, les orienter dans leur vie à Tokat. Personne ne commence seul.' },
                { icon: '🛡️', title: 'Défendre nos droits', desc: 'Être la voix collective de chaque membre face aux institutions, universités, et administrations. Ensemble, nous sommes plus forts.' },
                { icon: '🌐', title: 'Tisser des alliances', desc: 'Collaborer avec d\'autres associations d\'étudiants africains en Turquie et avec les instances du Mali pour construire des ponts entre les deux pays.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-5 bg-gray-50 rounded-2xl">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <p className="text-gray-600 text-sm mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Notre Vision' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-2xl">
                <p className="text-green-800 text-lg font-semibold italic leading-relaxed">
                  "Devenir la référence des associations étudiantes africaines en Turquie — un modèle d'organisation, de solidarité et de réussite collective."
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Notre vision va au-delà de Tokat. Nous croyons que chaque étudiant malien qui réussit en Turquie est une victoire pour le Mali tout entier. Chaque diplôme obtenu, chaque compétence acquise, chaque réseau tissé — tout cela revient un jour au bercail.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Nous voulons construire une association qui dure dans le temps. Qui transmette à chaque nouvelle génération d'étudiants la même flamme que ceux qui ont fondé l'AEMTO en 2022 : la flamme de l'entraide, du mérite et de la fierté malienne.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                {[
                  { icon: '🎓', text: 'Accompagner chaque membre vers la réussite académique et professionnelle' },
                  { icon: '🤲', text: 'Maintenir un filet de sécurité social et moral pour tous' },
                  { icon: '🇲🇱', text: 'Rester profondément connectés à notre identité malienne' },
                  { icon: '🌍', text: 'Rayonner à l\'échelle nationale via l\'AEEMT' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Valeurs ──────────────────────────────────────────────────── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-green-600 font-semibold text-xs uppercase tracking-widest">Ce qui nous guide</span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">Nos valeurs</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 hover:shadow-sm transition-all">
                <div className="text-4xl mb-3">{emoji}</div>
                <h3 className="font-black text-lg text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Timeline ─────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-green-600 font-semibold text-xs uppercase tracking-widest">Depuis 2022</span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">Notre parcours</h2>
          </div>

          <div className="relative border-l-2 border-green-100 pl-6 sm:pl-8 space-y-8">
            {visibleTimeline.map(({ date, emoji, title, desc }, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-9 sm:-left-11 w-8 h-8 rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-sm">
                  {emoji}
                </div>
                <span className="text-green-600 text-xs font-bold uppercase tracking-wider">{date}</span>
                <h3 className="font-black text-gray-900 mt-1 text-base">{title}</h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {TIMELINE.length > 4 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setExpandedTimeline(v => !v)}
                className="text-green-600 hover:text-green-700 font-semibold text-sm border border-green-200 hover:border-green-400 px-5 py-2.5 rounded-full transition-all"
              >
                {expandedTimeline ? '↑ Réduire' : `↓ Voir toute l'histoire (${TIMELINE.length - 4} événements de plus)`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ─── Bureau Exécutif ──────────────────────────────────────────── */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-green-600 font-semibold text-xs uppercase tracking-widest">Gouvernance</span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">Bureau Exécutif 2024–2025</h2>
            <p className="text-gray-500 text-sm mt-2">Élus démocratiquement par les membres de l'UEEMT-Tokat</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {BUREAU_MEMBERS.map(({ prenom, nom, role, appRole }) => (
              <div key={nom} className={`bg-white rounded-2xl border-2 p-5 text-center transition-all hover:shadow-md group ${appRole === 'president' ? 'border-yellow-300 hover:border-yellow-400' : 'border-green-100 hover:border-green-300'}`}>
                <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-white font-black text-xl mx-auto mb-3 group-hover:scale-105 transition-transform ${appRole === 'president' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
                  {prenom[0]}{nom[0]}
                </div>
                {appRole === 'president' && (
                  <div className="inline-block bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
                    👑 Président
                  </div>
                )}
                <div className="inline-block bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  {role}
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{prenom} {nom}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Archives CTA ─────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 rounded-2xl border border-gray-100 p-8">
            <div className="text-5xl flex-shrink-0">🗂️</div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-black text-gray-900 text-xl mb-1">Nos archives officielles</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Constitution, réforme de 2024, événements passés… Tous les documents officiels de l'UEEMT-Tokat sont accessibles dans notre espace archives.
              </p>
            </div>
            <Link
              href="/archives"
              className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
            >
              Voir les archives →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA Rejoindre ────────────────────────────────────────────── */}
      <section className="bg-green-600 py-14">
        <div className="max-w-xl mx-auto px-4 text-center text-white">
          <div className="text-5xl mb-4">🌟</div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Rejoins l'aventure</h2>
          <p className="text-green-100 text-base mb-6 leading-relaxed">
            Tu es malien à Tokat ? Ta place est ici. Nous t'attendons les bras ouverts — parce que c'est toujours mieux ensemble.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/recensement"
              className="bg-white text-green-700 font-bold px-6 py-3 rounded-full hover:bg-green-50 transition-colors"
            >
              Se recenser maintenant →
            </Link>
            <Link
              href="/membres"
              className="border-2 border-white/50 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              Voir la communauté
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
