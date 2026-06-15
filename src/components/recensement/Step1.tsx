'use client'

import { useState } from 'react'
import type { FormData } from '@/app/recensement/page'

interface Props {
  formData: FormData
  update: (data: Partial<FormData>) => void
  onNext: () => void
}

function isValidEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

// Règle 6 — normalise les formats: +223, 00223, local 7-8 chiffres, turc 0XXXXXXXXXX
function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return '+' + cleaned.slice(2)
  if (/^\d{7,8}$/.test(cleaned)) return '+223' + cleaned
  if (cleaned.startsWith('0') && cleaned.length === 11) return '+9' + cleaned
  return raw.trim()
}

export default function Step1({ formData, update, onNext }: Props) {
  const [emailTouched, setEmailTouched] = useState(false)

  const emailError =
    emailTouched && formData.email.length > 0 && !isValidEmail(formData.email)
      ? "Format d'email invalide"
      : emailTouched && !formData.email.trim()
      ? 'Email requis'
      : ''

  const isFormValid =
    formData.prenom.trim().length > 0 &&
    formData.nom.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    isValidEmail(formData.email)

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setEmailTouched(true)
    if (!isFormValid) return
    onNext()
  }

  const handlePhoneBlur = () => {
    if (formData.telephone.trim()) {
      update({ telephone: normalizePhone(formData.telephone) })
    }
  }

  const filledSomething = formData.prenom || formData.nom || formData.email

  return (
    <form onSubmit={handleNext} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Informations personnelles</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom *</label>
          <input
            type="text"
            value={formData.prenom}
            onChange={(e) => update({ prenom: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="Votre prénom"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom *</label>
          <input
            type="text"
            value={formData.nom}
            onChange={(e) => update({ nom: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="Votre nom de famille"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => update({ email: e.target.value })}
          onBlur={() => setEmailTouched(true)}
          className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm transition-colors ${
            emailError ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
          placeholder="votre@email.com"
        />
        {emailError && (
          <p className="text-red-500 text-xs mt-1">{emailError}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Téléphone
          <span className="ml-1.5 text-xs font-normal text-gray-400">+223, 00223 ou local acceptés</span>
        </label>
        <input
          type="tel"
          value={formData.telephone}
          onChange={(e) => update({ telephone: e.target.value })}
          onBlur={handlePhoneBlur}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="+90 5XX XXX XX XX"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date d'arrivée à Tokat</label>
        <input
          type="date"
          value={formData.date_arrivee_tokat}
          onChange={(e) => update({ date_arrivee_tokat: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {/* Honeypot — ne pas remplir */}
      <input
        type="text"
        name="website"
        value={formData.honeypot}
        onChange={(e) => update({ honeypot: e.target.value })}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
      />

      {/* Règle 1 — expliquer ce qui manque, affiché seulement si l'utilisateur a commencé */}
      {!isFormValid && filledSomething && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          {!formData.prenom.trim()
            ? 'Le prénom est requis.'
            : !formData.nom.trim()
            ? 'Le nom est requis.'
            : !formData.email.trim()
            ? "L'email est requis."
            : "Veuillez entrer une adresse email valide."}
        </p>
      )}

      <button
        type="submit"
        disabled={!isFormValid}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors mt-4"
      >
        Continuer →
      </button>
    </form>
  )
}
