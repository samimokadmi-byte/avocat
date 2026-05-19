/**
 * extractText.ts
 * Délègue l'extraction de texte à la fonction serverless /api/extract-doc
 * Évite d'envoyer le fichier brut base64 directement à Claude (rate limit)
 */

export interface ExtractionResult {
  mode:     'text'
  text:     string
  fileName: string
}

export const SUPPORTED_TYPES = '.pdf,.docx,.doc,.txt,.md'
export const MAX_SIZE_MB     = 20

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve((r.result as string).split(',')[1] ?? '')
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsDataURL(file)
  })
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve((r.result as string).trim())
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsText(file, 'UTF-8')
  })
}

export async function extractFile(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase()

  // Texte brut : lecture directe, pas besoin du serveur
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    const text = await readAsText(file)
    return { mode: 'text', text: text.substring(0, 6000), fileName: file.name }
  }

  // PDF / DOCX / DOC → extraction côté serveur via /api/extract-doc
  const base64    = await readAsBase64(file)
  const mediaType = name.endsWith('.pdf')
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  const res = await fetch('/api/extract-doc', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fileBase64: base64, mediaType, fileName: file.name }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error ?? `Erreur extraction (${res.status})`)
  }

  if (!data.text || data.text.length < 30) {
    throw new Error("Document vide ou illisible. Vérifiez qu'il contient du texte sélectionnable.")
  }

  return { mode: 'text', text: data.text, fileName: file.name }
}
