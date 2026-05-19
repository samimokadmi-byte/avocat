/**
 * api/extract-doc.ts
 * Gère uniquement DOCX (mammoth) et rawText (nettoyage).
 * PDF traité entièrement côté navigateur via pdfjs-dist.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { rawText, fileBase64, mediaType, fileName } = req.body ?? {}

    // Mode 1 : texte brut déjà extrait → nettoyage simple
    if (rawText) {
      const cleaned = (rawText as string).replace(/\s{3,}/g, '\n').trim().substring(0, 6000)
      return res.status(200).json({ text: cleaned })
    }

    if (!fileBase64) return res.status(400).json({ error: 'Fichier manquant' })

    const name = (fileName as string ?? '').toLowerCase()
    const mime = (mediaType as string ?? '')

    // Mode 2 : DOCX / DOC via mammoth
    if (name.match(/\.docx?$/) || mime.includes('word') || mime.includes('officedocument')) {
      const mammoth = await import('mammoth')
      const buffer  = Buffer.from(fileBase64 as string, 'base64')
      let result: { value: string }
      try {
        result = await mammoth.extractRawText({ buffer })
      } catch {
        return res.status(422).json({
          error: 'Fichier Word illisible. Exportez-le en PDF depuis Word.'
        })
      }
      const text = result.value.replace(/\s{3,}/g, '\n\n').trim()
      if (!text || text.length < 30) return res.status(422).json({ error: 'Document Word vide.' })
      return res.status(200).json({ text: text.substring(0, 6000) })
    }

    return res.status(400).json({ error: 'Format non supporté. Utilisez PDF, DOCX ou TXT.' })

  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur interne' })
  }
}
