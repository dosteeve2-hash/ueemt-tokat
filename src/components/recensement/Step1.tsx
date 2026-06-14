import type { FormData } from '@/app/recensement/page'

interface Props {
  formData: FormData
  update: (data: Partial<FormData>) => void
  onNext: () => void
}

export default function Step1({ formData, update, onNext }: Props) {
  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.prenom || !formData.nom || !formData.email) return
    onNext()
  }

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
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Téléphone</label>
        <input
          type="tel"
          value={formData.telephone}
          onChange={(e) => update({ telephone: e.target.value })}
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

      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors mt-4"
      >
        Continuer →
      </button>
    </form>
  )
}
