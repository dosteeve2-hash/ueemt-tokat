import { describe, it, expect, beforeEach } from 'vitest'

// Mirror of checkEmailRateLimit from src/app/recensement/actions.ts
const emailRateLimitMap = new Map<string, { count: number; firstAttempt: number }>()

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now()
  const entry = emailRateLimitMap.get(email)
  if (!entry || now - entry.firstAttempt > 3_600_000) {
    emailRateLimitMap.set(email, { count: 1, firstAttempt: now })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// Mirror of checkLoginRateLimit from src/app/connexion/actions.ts
const loginRateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkLoginRateLimit(email: string): boolean {
  const key = email.toLowerCase()
  const now = Date.now()
  const entry = loginRateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    loginRateLimitMap.set(key, { count: 1, resetAt: now + 900_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

describe('checkEmailRateLimit (inscription)', () => {
  beforeEach(() => {
    emailRateLimitMap.clear()
  })

  it('autorise les 3 premières tentatives', () => {
    expect(checkEmailRateLimit('test@example.com')).toBe(true)
    expect(checkEmailRateLimit('test@example.com')).toBe(true)
    expect(checkEmailRateLimit('test@example.com')).toBe(true)
  })

  it('bloque la 4ème tentative', () => {
    checkEmailRateLimit('test@example.com')
    checkEmailRateLimit('test@example.com')
    checkEmailRateLimit('test@example.com')
    expect(checkEmailRateLimit('test@example.com')).toBe(false)
  })

  it('des emails différents ne se bloquent pas mutuellement', () => {
    checkEmailRateLimit('a@example.com')
    checkEmailRateLimit('a@example.com')
    checkEmailRateLimit('a@example.com')
    expect(checkEmailRateLimit('b@example.com')).toBe(true)
  })

  it('réinitialise le compteur après la fenêtre d\'1 heure', () => {
    checkEmailRateLimit('test@example.com')
    checkEmailRateLimit('test@example.com')
    checkEmailRateLimit('test@example.com')
    // Simuler expiration en forçant firstAttempt dans le passé
    emailRateLimitMap.set('test@example.com', {
      count: 3,
      firstAttempt: Date.now() - 3_700_000,
    })
    expect(checkEmailRateLimit('test@example.com')).toBe(true)
  })
})

describe('checkLoginRateLimit (connexion)', () => {
  beforeEach(() => {
    loginRateLimitMap.clear()
  })

  it('autorise les 5 premières tentatives', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkLoginRateLimit('user@example.com')).toBe(true)
    }
  })

  it('bloque la 6ème tentative', () => {
    for (let i = 0; i < 5; i++) checkLoginRateLimit('user@example.com')
    expect(checkLoginRateLimit('user@example.com')).toBe(false)
  })

  it('normalise l\'email en minuscules', () => {
    checkLoginRateLimit('User@Example.com')
    checkLoginRateLimit('User@Example.com')
    checkLoginRateLimit('User@Example.com')
    checkLoginRateLimit('User@Example.com')
    checkLoginRateLimit('User@Example.com')
    // 6ème tentative avec casse différente — doit quand même être bloqué
    expect(checkLoginRateLimit('user@example.com')).toBe(false)
  })
})
