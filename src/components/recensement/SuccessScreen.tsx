'use client'

import { CheckCircle, Download } from 'lucide-react'
import type { FormData } from '@/app/recensement/page'
import { useState } from 'react'

interface Props {
  formData: FormData
}

export default function SuccessScreen({ formData }: Props) {
  const [downloading, setDownloading] = useState(false)

  const downloadAttestation = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/attestation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          filiere: formData.filiere,
          universite: formData.universite,
          niveau: formData.niveau,
          num_etudiant: formData.num_etudiant,
        }),
      })
      if (!res.ok) throw new Error('Erreur PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attestation-ueemt-${formData.nom.toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Erreur lors de la génération du PDF. Réessayez.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
      <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
      <h2 className="text-2xl font-black text-gray-900 mb-3">Inscription réussie !</h2>
      <p className="text-gray-600 mb-2">
        Bienvenue <strong>{formData.prenom} {formData.nom}</strong> dans la famille UEEMT-Tokat !
      </p>
      <p className="text-gray-500 text-sm mb-8">
        Votre inscription est en attente de validation par l'administration. Vous serez contacté(e) prochainement.
      </p>

      <div className="bg-green-50 rounded-xl p-4 mb-8 text-sm text-green-800">
        <p className="font-semibold">Cotisation : 50 TL</p>
        <p className="text-green-700 mt-1">Contactez l'équipe sur Instagram pour régler votre cotisation.</p>
      </div>

      <button
        onClick={downloadAttestation}
        disabled={downloading}
        className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-8 py-4 rounded-xl font-bold mx-auto transition-colors"
      >
        <Download size={20} />
        {downloading ? 'Génération...' : 'Télécharger mon attestation provisoire'}
      </button>
    </div>
  )
}
