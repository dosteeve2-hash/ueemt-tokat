import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { backgroundColor: '#14A44D', padding: 20, borderRadius: 8, marginBottom: 24 },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  headerSub: { color: '#d1fae5', fontSize: 11, textAlign: 'center', marginTop: 4 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 2 },
  body: { fontSize: 12, color: '#374151', lineHeight: 1.7, marginBottom: 20 },
  field: { flexDirection: 'row', marginBottom: 10, borderBottom: '1px solid #e5e7eb', paddingBottom: 6 },
  fieldLabel: { width: 140, fontWeight: 'bold', color: '#6b7280', fontSize: 11 },
  fieldValue: { flex: 1, color: '#111827', fontSize: 11 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTop: '1px solid #e5e7eb', paddingTop: 12 },
  footerText: { fontSize: 9, color: '#9ca3af', textAlign: 'center' },
  motto: { fontSize: 10, color: '#14A44D', textAlign: 'center', fontWeight: 'bold', marginTop: 4 },
})

export async function POST(req: NextRequest) {
  const { prenom, nom, filiere, universite, niveau, num_etudiant } = await req.json() as {
    prenom: string
    nom: string
    filiere?: string
    universite?: string
    niveau?: string
    num_etudiant?: string
  }
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const fieldRows: [string, string][] = [
    ['Nom complet', `${prenom} ${nom}`],
    ['Filière', filiere ?? '—'],
    ['Université / Lycée', universite ?? '—'],
    ['Niveau', niveau ?? '—'],
    ['N° Étudiant', num_etudiant ?? '—'],
    ['Date de recensement', date],
  ]

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, 'UEEMT-TOKAT'),
        React.createElement(Text, { style: styles.headerSub }, "Union des Élèves et Étudiants Maliens à Tokat")
      ),
      React.createElement(Text, { style: styles.title }, 'Attestation de Recensement'),
      React.createElement(
        Text,
        { style: styles.body },
        `Nous attestons que ${prenom} ${nom} est officiellement recensé(e) auprès de l'UEEMT-Tokat (Union des Élèves et Étudiants Maliens à Tokat).`
      ),
      React.createElement(
        View,
        { style: { marginBottom: 20 } },
        ...fieldRows.map(([label, value]) =>
          React.createElement(
            View,
            { key: label, style: styles.field },
            React.createElement(Text, { style: styles.fieldLabel }, label),
            React.createElement(Text, { style: styles.fieldValue }, value)
          )
        )
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, `Fait à Tokat, le ${date} · UEEMT-Tokat`),
        React.createElement(Text, { style: styles.motto }, 'Travail • Solidarité • Réussite')
      )
    )
  )

  const buffer = await renderToBuffer(doc)
  // Copy into a guaranteed ArrayBuffer (not SharedArrayBuffer) for TypeScript compatibility
  const ab = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(ab)
  for (let i = 0; i < buffer.length; i++) view[i] = buffer[i]!
  const blob = new Blob([ab], { type: 'application/pdf' })

  return new NextResponse(blob, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="attestation-ueemt-${nom?.toLowerCase() ?? 'membre'}.pdf"`,
    },
  })
}
