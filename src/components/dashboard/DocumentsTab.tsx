'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadDocument, getDocumentUrl, deleteDocument } from '@/lib/supabase/storage'
import { FileText, Download, Trash2, Plus } from 'lucide-react'

interface Doc {
  id: string
  name: string
  file_path: string
  file_type: string | null
  created_at: string
}

interface Props {
  userId: string
  documents: Doc[]
}

export default function DocumentsTab({ userId, documents: initial }: Props) {
  const [docs, setDocs] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [docName, setDocName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleUpload = async () => {
    if (!selectedFile || !docName.trim()) return
    setUploading(true)
    const path = await uploadDocument(userId, selectedFile)
    if (path) {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .insert({ user_id: userId, name: docName, file_path: path, file_type: selectedFile.type })
        .select()
        .single()
      if (data) setDocs([data, ...docs])
    }
    setUploading(false)
    setShowForm(false)
    setDocName('')
    setSelectedFile(null)
  }

  const handleDownload = async (doc: Doc) => {
    const url = await getDocumentUrl(doc.file_path)
    if (url) window.open(url, '_blank')
  }

  const handleDelete = async (doc: Doc) => {
    if (!confirm(`Supprimer "${doc.name}" ?`)) return
    await deleteDocument(doc.file_path)
    const supabase = createClient()
    await supabase.from('documents').delete().eq('id', doc.id)
    setDocs(docs.filter((d) => d.id !== doc.id))
  }

  const typeIcon: Record<string, string> = {
    'application/pdf': '📄',
    'image/jpeg': '🖼️',
    'image/png': '🖼️',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mes Documents</h2>
          <p className="text-sm text-gray-500">Kimlik, certificats, relevés — stockés en privé.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <input
            type="text"
            placeholder="Nom du document (ex: Certificat de scolarité)"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-semibold file:bg-green-50 file:text-green-700"
          />
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold">Annuler</button>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !docName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-bold"
            >
              {uploading ? 'Upload...' : 'Uploader'}
            </button>
          </div>
        </div>
      )}

      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <FileText size={36} className="mx-auto mb-3" />
          <p>Aucun document enregistré.</p>
          <p className="text-sm mt-1">Ajoutez votre kimlik, certificats, relevés...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-4">
              <span className="text-2xl">{typeIcon[doc.file_type ?? ''] ?? '📎'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{doc.name}</p>
                <p className="text-gray-400 text-xs">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <button onClick={() => handleDownload(doc)} className="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50">
                <Download size={16} />
              </button>
              <button onClick={() => handleDelete(doc)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
