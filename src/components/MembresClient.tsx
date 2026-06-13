'use client'

import { Users, CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface Member {
  id: string
  prenom: string
  nom: string
  filiere: string | null
  niveau: string | null
  statut: string
  universite: string | null
  is_validated: boolean
  cotisation_payee: boolean
  photo_url: string | null
}

interface Props {
  members: Member[]
  isAdmin: boolean
}

export default function MembresClient({ members: initialMembers, isAdmin }: Props) {
  const [members, setMembers] = useState(initialMembers)

  const toggleValidation = async (id: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('members').update({ is_validated: !current }).eq('id', id)
    setMembers(members.map(m => m.id === id ? { ...m, is_validated: !current } : m))
  }

  const toggleCotisation = async (id: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('members').update({ cotisation_payee: !current }).eq('id', id)
    setMembers(members.map(m => m.id === id ? { ...m, cotisation_payee: !current } : m))
  }

  const statutColor: Record<string, string> = {
    'Étudiant': 'bg-blue-100 text-blue-700',
    'Élève lycée': 'bg-purple-100 text-purple-700',
    'Mezun': 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="min-h-screen">
      <header className="bg-green-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3">
            <Users size={32} />
            <div>
              <h1 className="text-3xl font-black">Espace Membres</h1>
              <p className="text-green-200 text-sm">
                {members.length} membres enregistrés
                {isAdmin && ' · Mode Admin'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-10">
        {isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-sm text-yellow-800">
            <strong>Mode Administrateur</strong> — Vous pouvez valider les membres et marquer les cotisations.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
                  {m.prenom[0]}{m.nom[0]}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor[m.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                  {m.statut}
                </span>
              </div>

              <h3 className="font-bold text-gray-900">{m.prenom} {m.nom}</h3>
              {m.filiere && <p className="text-gray-500 text-sm mt-0.5">{m.filiere}</p>}
              {m.niveau && <p className="text-gray-400 text-xs">{m.niveau}</p>}

              <div className="flex items-center gap-3 mt-4">
                <span className={`flex items-center gap-1 text-xs ${m.is_validated ? 'text-green-600' : 'text-orange-500'}`}>
                  {m.is_validated ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {m.is_validated ? 'Validé' : 'En attente'}
                </span>
                <span className={`flex items-center gap-1 text-xs ${m.cotisation_payee ? 'text-green-600' : 'text-red-500'}`}>
                  {m.cotisation_payee ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  Cotisation
                </span>
              </div>

              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => toggleValidation(m.id, m.is_validated)}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
                  >
                    {m.is_validated ? 'Invalider' : 'Valider'}
                  </button>
                  <button
                    onClick={() => toggleCotisation(m.id, m.cotisation_payee)}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {m.cotisation_payee ? 'Non payée' : 'Marq. payée'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
