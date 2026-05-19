/**
 * api/_security.ts
 * Utilitaires de sécurité partagés entre toutes les fonctions serverless.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

// ── CORS restrictif ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://www.mokadmi.lawyer',
  'https://mokadmi.lawyer',
  'https://avocat-navy.vercel.app',
  'http://localhost:5173',
]

export function setCORS(req: VercelRequest, res: VercelResponse): boolean {
  const origin  = (req.headers.origin ?? '') as string
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  res.setHeader('Access-Control-Allow-Origin', allowed)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Vary', 'Origin')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true   // caller doit retourner
  }
  return false
}

// ── Rate limiting simple (in-memory, par IP, par minute) ──────────────────────
const rateLimitMap = new Map<string, { count: number; reset: number }>()

export function checkRateLimit(req: VercelRequest, res: VercelResponse, max = 10): boolean {
  const ip  = (req.headers['x-forwarded-for'] as string ?? '').split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const key = ip
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + 60_000 })
    return false  // OK
  }

  entry.count++
  if (entry.count > max) {
    res.setHeader('Retry-After', '60')
    res.status(429).json({ error: 'Trop de requêtes. Réessayez dans 1 minute.' })
    return true   // bloqué
  }
  return false
}

// ── Validation email ──────────────────────────────────────────────────────────
export function isValidEmail(email: unknown): email is string {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

// ── Sanitisation chaîne (prévention injection header) ────────────────────────
export function sanitize(s: unknown, maxLen = 500): string {
  if (typeof s !== 'string') return ''
  return s.replace(/[\r\n\t<>]/g, ' ').trim().slice(0, maxLen)
}

// ── Vérification API key Anthropic présente ───────────────────────────────────
export function requireApiKey(res: VercelResponse): string | null {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) { res.status(500).json({ error: 'Service IA non configuré.' }); return null }
  return key
}

// ── Vérification config email ─────────────────────────────────────────────────
export function requireEmailConfig(res: VercelResponse): { user: string; pass: string } | null {
  const user = process.env.GMAIL_USER     ?? ''
  const pass = process.env.GMAIL_PASSWORD ?? ''
  if (!user || !pass) {
    res.status(500).json({ error: 'Service email non configuré.' })
    return null
  }
  return { user, pass }
}
