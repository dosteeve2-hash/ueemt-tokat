'use client'

import { CheckCircle, Download, ArrowRight } from 'lucide-react'
import Link from 'next/link'
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-gray-900 mb-3">Tu es dans la famille !</h2>
      <p className="text-gray-600 mb-6">
        Bienvenue <strong>{formData.prenom} {formData.nom}</strong> dans l&apos;UEEMT-Tokat !
        Ton recensement est bien enregistré.
      </p>

      {/* Étape suivante — immédiate, pas d'admin requis */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 text-left">
        <p className="font-bold text-green-800 text-sm mb-1">✅ Étape suivante — Crée ton compte maintenant</p>
        <p className="text-green-700 text-sm mb-4">
          Tu peux accéder à l&apos;espace membre immédiatement. Choisis ton nom dans la liste et définis ton mot de passe.
        </p>
        <Link
          href="/premiere-connexion"
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors text-sm"
        >
          Créer mon compte maintenant
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Cotisation */}
      <div className="bg-amber-50 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold">Cotisation annuelle : 50 TL</p>
        <p className="text-amber-700 mt-1">À régler auprès du bureau de l&apos;association.</p>
      </div>

      {/* Attestation */}
      <button
        onClick={downloadAttestation}
        disabled={downloading}
        className="flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700 hover:text-green-700 px-8 py-3.5 rounded-xl font-semibold mx-auto transition-all text-sm disabled:opacity-60"
      >
        <Download size={16} />
        {downloading ? 'Génération...' : 'Télécharger l\'attestation provisoire'}
      </button>
    </div>
  )
}
