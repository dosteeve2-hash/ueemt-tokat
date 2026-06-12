import type { FormData } from '@/app/recensement/page'

interface Props {
  formData: FormData
  update: (data: Partial<FormData>) => void
  onNext: () => void
  onBack: () => void
}

export default function Step2({ formData, update, onNext, onBack }: Props) {
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.statut) return
    onNext()
  }

  return (
    <form onSubmit={handleNext} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Informations académiques</h2>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Statut *</label>
        <div className="grid grid-cols-3 gap-3">
          {(['Étudiant', 'Élève lycée', 'Mezun'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => update({ statut: s })}
              className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                formData.statut === s
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Filière / Spécialité</label>
        <input
          type="text"
          value={formData.filiere}
          onChange={(e) => update({ filiere: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="ex: Bilgisayar Mühendisliği"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Université / Lycée</label>
        <input
          type="text"
          value={formData.universite}
          onChange={(e) => update({ universite: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="ex: Tokat Gaziosmanpaşa Üniversitesi"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Niveau / Classe</label>
        <input
          type="text"
          value={formData.niveau}
          onChange={(e) => update({ niveau: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="ex: 3ème année"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">N° Étudiant / Kimlik</label>
        <input
          type="text"
          value={formData.num_etudiant}
          onChange={(e) => update({ num_etudiant: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="Votre numéro d'étudiant"
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold transition-colors"
        >
          ← Retour
        </button>
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors"
        >
          Continuer →
        </button>
      </div>
    </form>
  )
}
