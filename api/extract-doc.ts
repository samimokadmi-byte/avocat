/**
 * api/extract-doc.ts
 * Extrait le texte d'un PDF ou DOCX côté serveur (Node.js)
 * PDF → pdf-parse (fiable, gère tous les encodages)
 * DOCX/DOC → mammoth
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
// pdf-parse n'a pas d'export ESM default — import namespace
import * as pdfParseModule from 'pdf-parse'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buf: Buffer, opts?: { max?: number }) => Promise<{ text: string }> =
  (pdfParseModule as any).default ?? pdfParseModule

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { fileBase64, mediaType, fileName } = req.body ?? {}
    if (!fileBase64) return res.status(400).json({ error: 'Fichier manquant' })

    const buffer = Buffer.from(fileBase64, 'base64')
    const name   = (fileName as string ?? '').toLowerCase()
    let text     = ''

    // ── PDF ──────────────────────────────────────────────────────────────────
    if ((mediaType as string)?.includes('pdf') || name.endsWith('.pdf')) {
      const data = await pdfParse(buffer, { max: 30 })
      text = data.text?.replace(/\s{3,}/g, '\n\n').trim() ?? ''

      if (!text || text.length < 50) {
        return res.status(422).json({
          error: 'Ce PDF est un scan (image sans texte). Activez l\'OCR ou convertissez-le en DOCX avant d\'uploader.'
        })
      }
    }

    // ── DOCX / DOC ────────────────────────────────────────────────────────────
    else if (name.match(/\.docx?$/) || (mediaType as string)?.includes('word') || (mediaType as string)?.includes('officedocument')) {
      const mammoth = await import('mammoth')
      const result  = await mammoth.extractRawText({ buffer })
      text = result.value.replace(/\s{3,}/g, '\n\n').trim()

      if (!text || text.length < 30) {
        return res.status(422).json({
          error: 'Le document Word est vide ou protégé. Essayez de l\'exporter en PDF.'
        })
      }
    }

    // ── Texte brut ─────────────────────────────────────────────────────────────
    else {
      text = buffer.toString('utf8').trim()
    }

    // Tronquer à 6000 caractères (~1500 tokens) pour rester sous les rate limits
    const truncated = text.length > 6000
      ? text.substring(0, 6000) + '\n[...tronqué aux 6000 premiers caractères]'
      : text

    return res.status(200).json({ text: truncated, totalLength: text.length })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    // pdf-parse lance une erreur si le fichier n'est pas un PDF valide
    if (msg.includes('Invalid PDF') || msg.includes('No password given')) {
      return res.status(422).json({
        error: 'PDF invalide ou protégé par mot de passe. Déverrouillez-le avant d\'uploader.'
      })
    }
    return res.status(500).json({ error: msg })
  }
}
