/**
 * Input sanitization utilities for UEEMT-Tokat.
 * Used in Server Actions and API Routes to clean user-provided data.
 *
 * Note: Supabase uses parameterized queries (.eq(), .insert(), etc.) which
 * prevent SQL injection. These utilities address XSS and business logic validation.
 *
 * Note: rate limiting is in-memory (Map) — resets on Vercel cold start.
 * Acceptable for a 34-member association; for larger scale use Upstash Redis.
 */

/** Strip leading/trailing whitespace, prevent basic HTML injection, enforce max length */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Prevent basic HTML injection
}

/** Normalize and validate email addresses */
export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase().slice(0, 254)
}

/** Validate that a required field is non-empty after trimming */
export function validateRequired(value: string, fieldName: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} est requis`)
  }
}

/** Validate and sanitize a URL (must start with https:// or http://) */
export function sanitizeUrl(input: string, maxLength = 2048): string | null {
  const trimmed = input.trim().slice(0, maxLength)
  if (!trimmed) return null
  if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) return null
  return trimmed
}

/** Sanitize a filename — strip path traversal and unsafe characters */
export function sanitizeFilename(input: string, maxLength = 255): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[/\\<>:"|?*]/g, '_') // Replace path-unsafe chars
    .replace(/\.\./g, '_')          // Prevent path traversal
}
