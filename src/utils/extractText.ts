/**
 * extractText.ts
 * Extraction de texte depuis un document uploadé.
 *
 * Stratégie :
 *   PDF  → base64 envoyé directement à Claude (lecture native)
 *   DOCX → mammoth (extraction texte brut)
 *   DOC  → mammoth avec fallback message clair
 *   TXT/MD → FileReader UTF-8
 */

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ExtractionResult {
  mode:          'document' | 'text'  // 'document' = envoyer à Claude, 'text' = texte brut
  text?:         string               // mode text
  base64?:       string               // mode document
  mediaType?:    string               // MIME type pour Claude
  fileName:      string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve((r.result as string).trim())
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsText(file, 'UTF-8')
  })
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => {
      const dataUrl = r.result as string
      // Extraire la partie base64 après la virgule
      resolve(dataUrl.split(',')[1] ?? '')
    }
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsDataURL(file)
  })
}

function readAsArrayBuffer(fileOrBlob: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsArrayBuffer(fileOrBlob)
  })
}

// ── Détection par magic bytes ──────────────────────────────────────────────────
async function detectFormat(file: File): Promise<'pdf' | 'zip' | 'text'> {
  const buf   = await readAsArrayBuffer(file.slice(0, 8))
  const bytes = new Uint8Array(buf)
  if (bytes[0] === 0x25 && bytes[1] === 0x50) return 'pdf' // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) return 'zip' // PK (DOCX/ZIP)
  return 'text'
}

// ── Extraction principale ─────────────────────────────────────────────────────
export async function extractFile(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase()
  const fmt  = await detectFormat(file)

  // ── PDF → base64 pour Claude API (lecture native) ─────────────────────────
  if (fmt === 'pdf' || name.endsWith('.pdf')) {
    const base64 = await readAsBase64(file)
    return {
      mode:      'document',
      base64,
      mediaType: 'application/pdf',
      fileName:  file.name,
    }
  }

  // ── DOCX → mammoth ─────────────────────────────────────────────────────────
  if (fmt === 'zip' || name.endsWith('.docx') || name.endsWith('.doc')) {
    const mammoth     = await import('mammoth')
    const arrayBuffer = await readAsArrayBuffer(file)
    let result: { value: string }

    try {
      result = await mammoth.extractRawText({ arrayBuffer })
    } catch {
      throw new Error(
        'Ce fichier Word ne peut pas être lu directement. ' +
        'Enregistrez-le en PDF depuis Word (Fichier → Exporter → PDF) et réessayez.'
      )
    }

    const text = result.value.replace(/\s{3,}/g, '\n\n').trim()
    if (!text || text.length < 30) {
      throw new Error('Le document Word semble vide ou protégé en lecture.')
    }

    return { mode: 'text', text, fileName: file.name }
  }

  // ── Texte brut (TXT, MD, RTF…) ────────────────────────────────────────────
  const text = await readAsText(file)
  if (!text || text.length < 20) {
    throw new Error('Le fichier est vide ou illisible.')
  }
  return { mode: 'text', text, fileName: file.name }
}

export const SUPPORTED_TYPES = '.pdf,.docx,.doc,.txt,.md'
export const MAX_SIZE_MB     = 20


