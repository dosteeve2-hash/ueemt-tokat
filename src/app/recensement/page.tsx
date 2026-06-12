'use client'

import { useState } from 'react'
import Step1 from '@/components/recensement/Step1'
import Step2 from '@/components/recensement/Step2'
import Step3 from '@/components/recensement/Step3'
import SuccessScreen from '@/components/recensement/SuccessScreen'

export interface FormData {
  prenom: string
  nom: string
  email: string
  telephone: string
  date_arrivee_tokat: string
  statut: 'Étudiant' | 'Élève lycée' | 'Mezun' | ''
  filiere: string
  universite: string
  niveau: string
  num_etudiant: string
  photo_url: string
}

const initial: FormData = {
  prenom: '', nom: '', email: '', telephone: '', date_arrivee_tokat: '',
  statut: '', filiere: '', universite: '', niveau: '', num_etudiant: '', photo_url: '',
}

export default function RecensementPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(initial)
  const [memberId, setMemberId] = useState<string | null>(null)

  const update = (data: Partial<FormData>) => setFormData(prev => ({ ...prev, ...data }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-black mb-2">Recensement UEEMT-Tokat</h1>
          <p className="text-green-200">Enregistrez-vous officiellement auprès de l'association</p>

          <div className="flex items-center gap-3 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? 'bg-white text-green-700' : 'bg-green-700/50 text-green-300'
                }`}>
                  {s}
                </div>
                <span className={`text-sm hidden sm:block ${step >= s ? 'text-white' : 'text-green-400'}`}>
                  {s === 1 ? 'Infos personnelles' : s === 2 ? 'Infos académiques' : 'Confirmation'}
                </span>
                {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-white' : 'bg-green-700/50'}`} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {memberId ? (
          <SuccessScreen formData={formData} memberId={memberId} />
        ) : step === 1 ? (
          <Step1 formData={formData} update={update} onNext={() => setStep(2)} />
        ) : step === 2 ? (
          <Step2 formData={formData} update={update} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        ) : (
          <Step3 formData={formData} onBack={() => setStep(2)} onSuccess={setMemberId} />
        )}
      </div>
    </div>
  )
}
