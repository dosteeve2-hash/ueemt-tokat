'use client'

import { useState } from 'react'
import type { FormData } from '@/app/recensement/page'
import { demandeInscription } from '@/app/recensement/actions'

interface Props {
  formData: FormData
  onBack: () => void
  onSuccess: () => void
}

export default function Step3({ formData, onBack, onSuccess }: Props) {
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmed) return
    setLoading(true)
    setError('')

    const result = await demandeInscription({
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone || undefined,
      date_arrivee_tokat: formData.date_arrivee_tokat || undefined,
      statut: formData.statut || undefined,
      filiere: formData.filiere || undefined,
      universite: formData.universite || undefined,
      niveau: formData.niveau || undefined,
      num_etudiant: formData.num_etudiant || undefined,
      honeypot: formData.honeypot || undefined,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }
  }

  const rows: [string, string][] = [
    ['Prénom', formData.prenom],
    ['Nom', formData.nom],
    ['Email', formData.email],
    ['Téléphone', formData.telephone || '—'],
    ['Statut', formData.statut],
    ['Filière', formData.filiere || '—'],
    ['Université/Lycée', formData.universite || '—'],
    ['Niveau', formData.niveau || '—'],
    ['N° Étudiant', formData.num_etudiant || '—'],
  ]

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Confirmation</h2>

      <div className="rounded-xl border border-gray-100 overflow-hidden mb-6">
        {rows.map(([label, value], i) => (
          <div key={label} className={`flex px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
            <span className="font-semibold text-gray-600 w-40 flex-shrink-0">{label}</span>
            <span className="text-gray-900">{value}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}

      <label className="flex items-start gap-3 cursor-pointer mb-6">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-green-600"
        />
        <span className="text-sm text-gray-700">
          Je certifie que ces informations sont exactes et j'accepte d'être recensé(e) auprès de l'UEEMT-Tokat.
        </span>
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition-colors"
        >
          ← Retour
        </button>
        <button
          type="submit"
          disabled={!confirmed || loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors"
        >
          {loading ? 'Inscription...' : "Confirmer l'inscription"}
        </button>
      </div>
    </form>
  )
}
