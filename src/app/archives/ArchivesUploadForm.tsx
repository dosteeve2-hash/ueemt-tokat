'use client'

import { useRef, useState, useTransition, type FormEvent } from 'react'
import { ajouterDocument } from './actions'
import { toast } from '@/lib/toast'

export default function ArchivesUploadForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await ajouterDocument(formData)
      if (result.error) {
        toast.error('Erreur', result.error)
      } else {
        toast.success('Document ajouté !', 'Il est maintenant visible dans les archives.')
        formRef.current?.reset()
        setExpanded(false)
      }
    })
  }

  if (!expanded) {
    return (
      <div className="mb-8">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          📁 Ajouter un document officiel
        </button>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-lg">📁 Ajouter un document officiel</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-slate-400 hover:text-white text-sm transition-colors"
          aria-label="Fermer le formulaire"
        >
          ✕
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">
            Titre <span className="text-red-400">*</span>
          </label>
          <input
            name="titre"
            placeholder="Ex : Procès-verbal AG du 15 mars 2025"
            required
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Catégorie */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Catégorie</label>
            <select
              name="categorie"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="juridique">⚖️ Document officiel / Juridique</option>
              <option value="annonce">📢 Annonce</option>
              <option value="evenement">🗓️ Événement</option>
              <option value="historique">🏛️ Historique</option>
              <option value="autre">📄 Autre</option>
            </select>
          </div>

          {/* Date du document */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Date du document</label>
            <input
              name="date_document"
              type="date"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">
            Description <span className="text-slate-500 font-normal">(optionnel)</span>
          </label>
          <textarea
            name="description"
            placeholder="Résumé ou contexte du document…"
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* URL fichier */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1.5">
            Lien vers le fichier <span className="text-slate-500 font-normal">(Google Drive, PDF…)</span>
          </label>
          <input
            name="fichier_url"
            type="url"
            placeholder="https://drive.google.com/…"
            maxLength={2048}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
          >
            {isPending ? 'Ajout en cours…' : 'Ajouter →'}
          </button>
        </div>
      </form>
    </div>
  )
}
