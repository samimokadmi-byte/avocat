import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCORS, checkRateLimit, isValidEmail, sanitize } from './_security'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCORS(req, res)) return
  if (checkRateLimit(req, res, 20)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé API non configurée.' })

  try {
    const rawPrompt = req.body?.prompt
    if (!rawPrompt || typeof rawPrompt !== 'string') return res.status(400).json({ error: 'Prompt manquant' })
    if (rawPrompt.length > 50000) return res.status(400).json({ error: 'Prompt trop long (max 50 000 chars)' })

    const prompt      = rawPrompt
    const maxTokens   = req.body?.maxTokens ?? 2000
    const safeTokens  = Math.min(Number(maxTokens) || 2000, 4096)
    const documentBase64   = req.body?.documentBase64
    const documentMediaType = req.body?.documentMediaType
    const imageBase64      = req.body?.imageBase64
    const imageMediaType   = req.body?.imageMediaType

    // Vérification clé API
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Service IA non configuré.' })

    // Construire le contenu du message
    let userContent: unknown
    if (imageBase64) {
      // Mode OCR / vision — image en base64
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: imageMediaType ?? 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: prompt },
      ]
    } else if (documentBase64) {
      // Mode document PDF natif
      userContent = [
        { type: 'document', source: { type: 'base64', media_type: documentMediaType ?? 'application/pdf', data: documentBase64 } },
        { type: 'text', text: prompt },
      ]
    } else {
      userContent = prompt
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta':  'pdfs-2024-09-25',  // activer la lecture native de PDF
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: safeTokens,
        messages:   [{ role: 'user', content: userContent }],
      }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message ?? 'Erreur API' })
    return res.status(200).json({ text: data.content?.[0]?.text ?? '' })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ error: msg })
  }
}
