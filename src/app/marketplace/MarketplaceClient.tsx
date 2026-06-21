'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Plus, Trash2, Tag, Phone, ChevronRight, Search, Filter } from 'lucide-react'
import { createListing, deleteListing } from './actions'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useModal } from '@/hooks/useModal'
import { toast } from '@/lib/toast'

export type Listing = {
  id: string
  author_id: string
  title: string
  description: string | null
  price: number | null
  currency: string
  category: string
  photos: string[]
  contact_info: string | null
  is_active: boolean
  created_at: string
  author_name: string
  author_avatar: string | null
  is_own: boolean
}

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  vente:   { label: 'Vente',    emoji: '🏷️', color: 'bg-blue-100 text-blue-700' },
  echange: { label: 'Échange',  emoji: '🔄', color: 'bg-purple-100 text-purple-700' },
  service: { label: 'Service',  emoji: '🛠️', color: 'bg-amber-100 text-amber-700' },
  don:     { label: 'Don',      emoji: '🎁', color: 'bg-green-100 text-green-700' },
}

const AVATAR_COLORS = ['bg-green-600', 'bg-yellow-500', 'bg-teal-600', 'bg-blue-600', 'bg-purple-600']

function Avatar({ name, avatar, idx = 0 }: { name: string; avatar: string | null; idx?: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  if (avatar) return <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  return (
    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${AVATAR_COLORS[idx % 5]}`}>
      {initials}
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return d < 7 ? `il y a ${d}j` : new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function ListingCard({ listing, onDelete, idx }: { listing: Listing; onDelete: (id: string) => void; idx: number }) {
  const cat = CATEGORY_LABELS[listing.category] ?? { label: listing.category, emoji: '📦', color: 'bg-gray-100 text-gray-700' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-green-200 transition-all">
      {/* Photo principale */}
      {listing.photos.length > 0 ? (
        <img
          src={listing.photos[0]}
          alt={listing.title}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-4xl">
          {cat.emoji}
        </div>
      )}

      <div className="p-4">
        {/* Badge catégorie */}
        <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${cat.color}`}>
          {cat.emoji} {cat.label}
        </span>

        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{listing.title}</h3>

        {listing.description && (
          <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-2">{listing.description}</p>
        )}

        {/* Prix */}
        {listing.price !== null && listing.price > 0 ? (
          <p className="font-black text-green-600 text-base mb-3">
            {listing.price.toLocaleString('fr-FR', { style: 'currency', currency: listing.currency, maximumFractionDigits: 0 })}
          </p>
        ) : listing.category === 'don' ? (
          <p className="font-bold text-green-600 text-sm mb-3">🎁 Gratuit</p>
        ) : listing.category === 'echange' ? (
          <p className="font-bold text-purple-600 text-sm mb-3">🔄 Échange</p>
        ) : null}

        {/* Auteur */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar name={listing.author_name} avatar={listing.author_avatar} idx={idx} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">{listing.author_name}</p>
              <p className="text-xs text-gray-400">{timeAgo(listing.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {listing.contact_info && (
              <a
                href={listing.contact_info.startsWith('http') ? listing.contact_info : `https://wa.me/${listing.contact_info.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-full font-semibold transition-colors"
              >
                <Phone size={11} />
                Contacter
              </a>
            )}
            {listing.is_own && (
              <button
                onClick={() => onDelete(listing.id)}
                className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Formulaire de création ──────────────────────────────────────────────────

function CreateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [category, setCategory] = useState('vente')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const { error: err } = await createListing(fd)
      if (err) { setError(err); return }
      toast.success('Annonce publiée !', 'Les membres peuvent maintenant la voir.')
      onSuccess()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-sm text-red-600">{error}</div>
      )}

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie *</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                category === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{val.emoji}</span>
              {val.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="category" value={category} />
      </div>

      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">Titre *</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="Ex : iPhone 13 Pro Max 256 Go, comme neuf"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          placeholder="État, détails, conditions..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />
      </div>

      {/* Prix + devise */}
      {category !== 'don' && category !== 'echange' && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-1.5">Prix</label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div className="w-24">
            <label htmlFor="currency" className="block text-sm font-semibold text-gray-700 mb-1.5">Devise</label>
            <select
              id="currency"
              name="currency"
              defaultValue="TRY"
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="TRY">TRY ₺</option>
              <option value="EUR">EUR €</option>
              <option value="USD">USD $</option>
              <option value="XOF">XOF</option>
            </select>
          </div>
        </div>
      )}

      {/* Contact */}
      <div>
        <label htmlFor="contact_info" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Contact WhatsApp / lien
        </label>
        <input
          id="contact_info"
          name="contact_info"
          type="text"
          maxLength={200}
          placeholder="Ex : +90 5XX XXX XXXX ou lien WhatsApp"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <p className="text-xs text-gray-400 mt-1">Les intéressés vous contacteront directement</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
        >
          {isPending ? 'Publication...' : 'Publier l\'annonce →'}
        </button>
      </div>
    </form>
  )
}

// ─── MarketplaceClient ───────────────────────────────────────────────────────

interface Props {
  listings: Listing[]
  currentUserId: string
}

const CATEGORIES_FILTER = [
  { value: 'all', label: 'Tout', emoji: '🛍️' },
  { value: 'vente', label: 'Vente', emoji: '🏷️' },
  { value: 'echange', label: 'Échange', emoji: '🔄' },
  { value: 'service', label: 'Service', emoji: '🛠️' },
  { value: 'don', label: 'Don', emoji: '🎁' },
]

export default function MarketplaceClient({ listings: initialListings, currentUserId }: Props) {
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [showCreate, setShowCreate] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toDeleteId, setToDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteModal = useModal()
  const [, startDeleteTransition] = useTransition()

  const handleDeleteRequest = (id: string) => {
    setToDeleteId(id)
    deleteModal.open()
  }

  const confirmDelete = () => {
    if (!toDeleteId) return
    const id = toDeleteId
    setIsDeleting(true)
    setListings(prev => prev.filter(l => l.id !== id))
    deleteModal.close()
    setToDeleteId(null)
    startDeleteTransition(async () => {
      try {
        await deleteListing(id)
        toast.success('Annonce supprimée')
      } catch {
        toast.error('Erreur lors de la suppression')
        router.refresh()
      } finally {
        setIsDeleting(false)
      }
    })
  }

  const filtered = listings.filter(l => {
    if (activeFilter !== 'all' && l.category !== activeFilter) return false
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) &&
        !(l.description ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-600 text-white py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag size={24} />
            <p className="text-green-200 text-sm uppercase tracking-widest">Espace membres</p>
          </div>
          <h1 className="text-3xl font-black">Marketplace</h1>
          <p className="text-green-200 text-sm mt-1">
            Vends, échanges, propose tes services à la communauté UEEMT-Tokat
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Bouton créer */}
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-green-300 hover:border-green-500 hover:bg-green-50 text-green-600 py-4 rounded-2xl font-bold text-sm transition-all"
          >
            <Plus size={18} />
            Publier une annonce
          </button>
        )}

        {/* Formulaire de création */}
        {showCreate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={18} className="text-green-600" />
              <h2 className="font-bold text-gray-900">Nouvelle annonce</h2>
            </div>
            <CreateForm
              onSuccess={() => { setShowCreate(false); router.refresh() }}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        )}

        {/* Filtres par catégorie */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES_FILTER.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveFilter(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === cat.value
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une annonce..."
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          />
        </div>

        {/* Grille des annonces */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center shadow-sm">
            <div className="text-5xl mb-4">🛍️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {search || activeFilter !== 'all' ? 'Aucune annonce trouvée' : 'Sois le premier à publier !'}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              {search || activeFilter !== 'all'
                ? 'Essaie d\'autres mots-clés ou filtre différent.'
                : 'Vends tes affaires, propose tes services, échange avec tes camarades.'}
            </p>
            {activeFilter !== 'all' || search ? (
              <button
                onClick={() => { setActiveFilter('all'); setSearch('') }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-sm"
              >
                Voir toutes les annonces
              </button>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold text-sm"
              >
                Publier une annonce →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((listing, i) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onDelete={handleDeleteRequest}
                idx={i}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {listings.length > 0 && (
          <p className="text-center text-xs text-gray-400">
            {filtered.length} annonce{filtered.length > 1 ? 's' : ''} • Marketplace UEEMT-Tokat
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={confirmDelete}
        title="Supprimer cette annonce ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
