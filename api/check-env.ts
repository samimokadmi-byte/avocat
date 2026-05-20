import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Endpoint de diagnostic — NE PAS laisser en production longtemps
  return res.status(200).json({
    GMAIL_USER:     process.env.GMAIL_USER     ? '✓ présente' : '✗ MANQUANTE',
    GMAIL_PASSWORD: process.env.GMAIL_PASSWORD ? '✓ présente' : '✗ MANQUANTE',
    ANTHROPIC_KEY:  process.env.ANTHROPIC_API_KEY ? '✓ présente' : '✗ MANQUANTE',
    NODE_ENV:       process.env.NODE_ENV,
  })
}
