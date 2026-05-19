import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé API non configurée.' })

  try {
    const { prompt, maxTokens = 2000, documentBase64, documentMediaType, imageBase64, imageMediaType } = req.body ?? {}
    if (!prompt) return res.status(400).json({ error: 'Prompt manquant' })

    const safeTokens = Math.min(Number(maxTokens) || 2000, 4096)

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
