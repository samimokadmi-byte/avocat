/**
 * api/extract-doc.ts
 * Extrait le texte d'un PDF ou DOCX côté serveur (Node.js)
 * — évite d'envoyer le fichier brut base64 à Claude (rate limit)
 * — renvoie uniquement le texte brut tronqué à 6000 caractères
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { fileBase64, mediaType, fileName } = req.body ?? {}
    if (!fileBase64 || !mediaType) return res.status(400).json({ error: 'Fichier manquant' })

    const buffer = Buffer.from(fileBase64, 'base64')
    let text = ''

    // ── PDF ──────────────────────────────────────────────────────────────────
    if (mediaType === 'application/pdf' || (fileName as string)?.toLowerCase().endsWith('.pdf')) {
      // Extraction minimaliste : recherche les séquences de texte PDF
      // (BT ... ET blocks et Tj/TJ operators) sans dépendance lourde
      const raw = buffer.toString('latin1')

      // Extraire toutes les chaînes entre parenthèses (opérateurs Tj)
      const chunks: string[] = []
      const tjRegex = /\(([^)]{1,300})\)\s*Tj/g
      let m: RegExpExecArray | null
      while ((m = tjRegex.exec(raw)) !== null) {
        const s = m[1]
          .replace(/\\r|\\n/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
          .trim()
        if (s.length > 2) chunks.push(s)
      }

      // Extraire aussi les tableaux TJ : [(str) num (str)]
      const tjArrRegex = /\[([^\]]{1,500})\]\s*TJ/g
      while ((m = tjArrRegex.exec(raw)) !== null) {
        const inner = m[1]
        const strParts = inner.match(/\(([^)]{1,200})\)/g)
        if (strParts) {
          const s = strParts.map(p => p.slice(1, -1)).join('')
            .replace(/\\r|\\n/g, ' ')
            .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
            .trim()
          if (s.length > 2) chunks.push(s)
        }
      }

      text = chunks.join(' ').replace(/\s{3,}/g, ' ').trim()

      // Fallback si le PDF est un scan ou encodé différemment
      if (text.length < 100) {
        // Extraire les strings UTF-16 visibles
        const utf16 = buffer.toString('utf16le')
          .replace(/[^\x20-\x7E\xA0-\xFF ]/g, ' ')
          .replace(/\s{4,}/g, '\n')
          .trim()
        if (utf16.length > text.length) text = utf16
      }

      if (text.length < 50) {
        return res.status(422).json({
          error: 'Ce PDF semble être un scan (image). Il ne contient pas de texte sélectionnable. Exportez-le avec OCR activé.'
        })
      }
    }

    // ── DOCX / DOC ────────────────────────────────────────────────────────────
    else if (
      mediaType.includes('word') ||
      mediaType.includes('officedocument') ||
      (fileName as string)?.match(/\.docx?$/i)
    ) {
      const mammoth = await import('mammoth')
      const result  = await mammoth.extractRawText({ buffer })
      text = result.value.replace(/\s{3,}/g, '\n\n').trim()

      if (!text || text.length < 30) {
        return res.status(422).json({
          error: 'Le document Word est vide ou protégé en lecture.'
        })
      }
    }

    // ── Texte brut ─────────────────────────────────────────────────────────────
    else {
      text = buffer.toString('utf8').trim()
    }

    // Tronquer à 6000 caractères (~1500 tokens) pour rester sous les rate limits
    const truncated = text.length > 6000
      ? text.substring(0, 6000) + '\n[...document tronqué — premiers 6000 caractères analysés]'
      : text

    return res.status(200).json({ text: truncated, length: text.length })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur interne'
    return res.status(500).json({ error: msg })
  }
}
