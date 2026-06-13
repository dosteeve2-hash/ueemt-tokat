'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import fr from '@/i18n/messages/fr.json'
import en from '@/i18n/messages/en.json'
import tr from '@/i18n/messages/tr.json'

type Lang = 'fr' | 'en' | 'tr'
type Messages = typeof fr

const MESSAGES: Record<Lang, Messages> = { fr, en, tr }

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LangContext = createContext<LangContextValue>({
  lang: 'fr',
  setLang: () => {},
  t: (k) => k,
})

function getNestedValue(obj: unknown, keys: string[]): string {
  let curr = obj
  for (const k of keys) {
    if (curr == null || typeof curr !== 'object') return keys.join('.')
    curr = (curr as Record<string, unknown>)[k]
  }
  return typeof curr === 'string' ? curr : keys.join('.')
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('ueemt-lang') as Lang | null
    if (saved && saved in MESSAGES) setLangState(saved)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('ueemt-lang', l)
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    let str = getNestedValue(MESSAGES[lang], key.split('.'))
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LangContext)
}
