/**
 * api/extract-doc.ts
 * Convertit un PDF via Claude API (lecture native base64)
 * ou un DOCX via mammoth côté serveur.
 * Pas de pdf-parse, pas de pdfjs.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Clé API non configurée.' })

  try {
    const { fileBase64, mediaType, fileName } = req.body ?? {}
    if (!fileBase64) return res.status(400).json({ error: 'Fichier manquant' })

    const name = (fileName as string ?? '').toLowerCase()
    const mime = (mediaType as string ?? '')

    // DOCX → mammoth (Node.js natif, pas de problème Vercel)
    if (name.match(/\.docx?$/) || mime.includes('word') || mime.includes('officedocument')) {
      const mammoth = await import('mammoth')
      const buffer  = Buffer.from(fileBase64 as string, 'base64')
      let result: { value: string }
      try {
        result = await mammoth.extractRawText({ buffer })
      } catch {
        return res.status(422).json({
          error: 'Fichier Word illisible. Exportez-le en PDF depuis Word puis réessayez.'
        })
      }
      const text = result.value.replace(/\s{3,}/g, '\n\n').trim()
      if (!text || text.length < 30) {
        return res.status(422).json({ error: 'Document Word vide ou protégé.' })
      }
      return res.status(200).json({ text: text.substring(0, 6000), totalLength: text.length })
    }

    // PDF → Claude lit le document nativement via API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta':    'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type:       'base64',
                media_type: 'application/pdf',
                data:       fileBase64,
              },
            },
            {
              type: 'text',
              text: 'Extrais le contenu textuel de ce document. Conserve la structure : titres, parties, articles. Maximum 5000 caractères. Texte uniquement.',
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      const msg = (errData as { error?: { message?: string } }).error?.message ?? `Erreur API ${response.status}`
      return res.status(response.status).json({ error: msg })
    }

    const data = await response.json()
    const text = (data.content?.[0]?.text ?? '').trim()

    if (!text || text.length < 30) {
      return res.status(422).json({
        error: 'Le PDF est vide ou scanné (image sans texte). Activez l\'OCR avant d\'uploader.'
      })
    }

    return res.status(200).json({ text, totalLength: text.length })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ error: msg })
  }
}
