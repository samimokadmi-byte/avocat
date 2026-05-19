/**
 * extractText.ts
 * Stratégie :
 *  - DOCX/DOC → /api/extract-doc (mammoth serveur)
 *  - PDF → lecture ArrayBuffer côté client + extraction texte simple
 *          puis envoi du TEXTE (pas du base64) à /api/extract-doc
 *  - TXT/MD → FileReader direct
 * Aucun base64 PDF entier envoyé à Claude → pas de rate limit.
 */

export interface ExtractionResult {
  mode:     'text'
  text:     string
  fileName: string
}

export const SUPPORTED_TYPES = '.pdf,.docx,.doc,.txt,.md'
export const MAX_SIZE_MB     = 20

// ── Lecture helpers ─────────────────────────────────────────────────────────

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve((r.result as string).trim())
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsText(file, 'UTF-8')
  })
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve(r.result as ArrayBuffer)
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsArrayBuffer(file)
  })
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload  = () => resolve((r.result as string).split(',')[1] ?? '')
    r.onerror = () => reject(new Error('Lecture impossible'))
    r.readAsDataURL(file)
  })
}

// ── Extraction texte depuis PDF (côté client, sans librairie) ────────────────
// Lit les octets du PDF et extrait les chaînes de texte visibles.
// Méthode : cherche les blocs BT...ET et les opérateurs Tj/TJ dans le binaire.
function extractPdfTextClient(buffer: ArrayBuffer): string {
  // Décoder en latin-1 pour accéder aux octets bruts
  const bytes = new Uint8Array(buffer)
  // Convertir les 500 premiers Ko maximum
  const limit = Math.min(bytes.length, 500 * 1024)
  const chars: string[] = []
  for (let i = 0; i < limit; i++) {
    const b = bytes[i]
    // Garder seulement les caractères ASCII imprimables + espace + newline
    if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
      chars.push(String.fromCharCode(b))
    } else {
      chars.push(' ')
    }
  }
  const raw = chars.join('')

  // Extraire les chaînes entre parenthèses suivies de Tj ou dans des tableaux TJ
  const extracted: string[] = []

  // Opérateur Tj : (texte)Tj
  const tjRe = /\(([^)]{1,500})\)\s*Tj/g
  let m: RegExpExecArray | null
  while ((m = tjRe.exec(raw)) !== null) {
    const s = m[1].replace(/[\\n\\r]/g, ' ').replace(/\\/g, '').trim()
    if (s.length > 1) extracted.push(s)
  }

  // Opérateur TJ : [(str)num(str)]TJ
  const tjArrRe = /\[([^\]]{1,1000})\]\s*TJ/g
  while ((m = tjArrRe.exec(raw)) !== null) {
    const inner = m[1]
    const parts = inner.match(/\(([^)]{1,300})\)/g)
    if (parts) {
      const s = parts.map((p: string) => p.slice(1, -1)).join('').replace(/\\/g, '').trim()
      if (s.length > 1) extracted.push(s)
    }
  }

  const text = extracted.join(' ').replace(/\s{3,}/g, ' ').trim()
  return text
}

// ── Entrée publique ───────────────────────────────────────────────────────────
export async function extractFile(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase()

  // TXT / MD : lecture directe
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    const text = await readAsText(file)
    return { mode: 'text', text: text.substring(0, 6000), fileName: file.name }
  }

  // PDF : extraction côté client SANS base64 entier
  if (name.endsWith('.pdf')) {
    const buffer     = await readAsArrayBuffer(file)
    const clientText = extractPdfTextClient(buffer)

    if (clientText.length >= 200) {
      // Texte extrait côté client, on l'envoie au serveur pour nettoyage
      const res = await fetch('/api/extract-doc', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawText: clientText.substring(0, 8000), fileName: file.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur extraction')
      return { mode: 'text', text: data.text, fileName: file.name }
    }

    // PDF scanné / encodé spécialement : fallback base64 tronqué (≤120Ko)
    const full64     = await readAsBase64(file)
    const slice64    = full64.substring(0, 120 * 1024)  // ~90Ko de PDF réel
    const res2 = await fetch('/api/extract-doc', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileBase64: slice64, mediaType: 'application/pdf', fileName: file.name }),
    })
    const data2 = await res2.json()
    if (!res2.ok) throw new Error(data2.error ?? 'Erreur extraction PDF')
    if (!data2.text || data2.text.length < 30) {
      throw new Error('PDF illisible. Vérifiez qu\'il contient du texte sélectionnable (non scanné).')
    }
    return { mode: 'text', text: data2.text, fileName: file.name }
  }

  // DOCX / DOC : envoi base64 au serveur (mammoth)
  const base64    = await readAsBase64(file)
  const mediaType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  const res3 = await fetch('/api/extract-doc', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fileBase64: base64, mediaType, fileName: file.name }),
  })
  const data3 = await res3.json()
  if (!res3.ok) throw new Error(data3.error ?? 'Erreur extraction DOCX')
  if (!data3.text || data3.text.length < 30) {
    throw new Error('Document Word vide ou protégé.')
  }
  return { mode: 'text', text: data3.text, fileName: file.name }
}
