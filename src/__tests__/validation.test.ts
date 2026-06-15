import { describe, it, expect } from 'vitest'

// Mirror of the email validation used across actions.ts and Step1.tsx
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(val: string): boolean {
  return EMAIL_RE.test(val)
}

// Mirror of normalizePhone from src/components/recensement/Step1.tsx
function normalizePhone(raw: string): string | undefined {
  const cleaned = raw.replace(/[\s\-().]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return '+' + cleaned.slice(2)
  if (/^\d{7,8}$/.test(cleaned)) return '+223' + cleaned
  if (cleaned.startsWith('0') && cleaned.length === 11) return '+9' + cleaned
  return raw
}

// Mirror of the password criteria in src/app/definir-mot-de-passe/page.tsx
function getPasswordCriteria(password: string, confirm = '') {
  return {
    hasLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password === confirm && password.length > 0,
  }
}

describe('isValidEmail', () => {
  it('accepte un email valide', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
  })
  it('accepte un email avec sous-domaine', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true)
  })
  it('rejette un email sans @', () => {
    expect(isValidEmail('testexample.com')).toBe(false)
  })
  it('rejette un email sans domaine', () => {
    expect(isValidEmail('test@')).toBe(false)
  })
  it('rejette une chaîne vide', () => {
    expect(isValidEmail('')).toBe(false)
  })
  it('rejette un email avec espace', () => {
    expect(isValidEmail('test @example.com')).toBe(false)
  })
})

describe('normalizePhone', () => {
  it('normalise un numéro malien local (8 chiffres)', () => {
    expect(normalizePhone('70000000')).toBe('+22370000000')
  })
  it('normalise un numéro malien local (7 chiffres)', () => {
    expect(normalizePhone('7000000')).toBe('+2237000000')
  })
  it('normalise avec préfixe 00223', () => {
    expect(normalizePhone('0022370000000')).toBe('+22370000000')
  })
  it('laisse intact un numéro déjà au format international (+)', () => {
    expect(normalizePhone('+22370000000')).toBe('+22370000000')
  })
  it('normalise un numéro turc (0XXXXXXXXXX, 11 chiffres)', () => {
    expect(normalizePhone('05312345678')).toBe('+905312345678')
  })
  it('supprime les espaces et tirets avant normalisation', () => {
    expect(normalizePhone('70 00 00 00')).toBe('+22370000000')
  })
})

describe('getPasswordCriteria', () => {
  it('valide un mot de passe fort', () => {
    const c = getPasswordCriteria('MonPass123', 'MonPass123')
    expect(c.hasLength).toBe(true)
    expect(c.hasUppercase).toBe(true)
    expect(c.hasNumber).toBe(true)
    expect(c.matches).toBe(true)
  })
  it('rejette un mot de passe trop court', () => {
    expect(getPasswordCriteria('Ab1').hasLength).toBe(false)
  })
  it('détecte l\'absence de majuscule', () => {
    expect(getPasswordCriteria('monpass123').hasUppercase).toBe(false)
  })
  it('détecte l\'absence de chiffre', () => {
    expect(getPasswordCriteria('MonPassword').hasNumber).toBe(false)
  })
  it('détecte une non-correspondance des mots de passe', () => {
    expect(getPasswordCriteria('MonPass123', 'AutrePass').matches).toBe(false)
  })
})
