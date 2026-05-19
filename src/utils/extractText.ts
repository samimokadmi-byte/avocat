/**
 * extractText.ts — Extraction texte navigateur via pdfjs-dist legacy (sans worker)
 * DOCX → mammoth serveur | TXT → FileReader | PDF → pdfjs inline browser
 */

export interface ExtractionResult {
  mode: 'text'
  text: string
  fileName: string
}

export const SUPPORTED_TYPES = '.pdf,.docx,.doc,.txt,.md'
export const MAX_SIZE_MB     = 20

// ── Helpers FileReader ────────────────────────────────────────────────────────
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

// ── Extraction PDF via pdfjs-dist legacy (inline, sans worker) ────────────────
async function extractPdfBrowser(file: File): Promise<string> {
  // Import du build legacy qui supporte le mode sans worker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.mjs')

  // Désactiver le web worker → exécution inline dans le thread principal
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const arrayBuffer = await readAsArrayBuffer(file)
  const uint8       = new Uint8Array(arrayBuffer)

  // Timeout 45s pour les gros PDFs
  const loadingTask = pdfjsLib.getDocument({ data: uint8 })
  const pdf = await Promise.race([
    loadingTask.promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => { loadingTask.destroy(); reject(new Error('Délai dépassé (45s). Essayez un fichier plus petit.')) }, 45000)
    ),
  ])

  const texts: string[] = []
  const maxPages = Math.min(pdf.numPages, 30)

  for (let i = 1; i <= maxPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = content.items.map((item: any) => item.str ?? '').join(' ')
    if (pageText.trim().length > 2) texts.push(pageText.trim())
  }

  const full = texts.join('\n\n').replace(/\s{3,}/g, '\n\n').trim()

  if (full.length < 50) {
    throw new Error(
      'Ce PDF ne contient pas de texte sélectionnable (document scanné ou image). ' +
      'Activez l\'OCR lors de l\'export ou copiez-collez le texte manuellement.'
    )
  }

  return full.substring(0, 8000)
}

// ── Entrée publique ────────────────────────────────────────────────────────────
export async function extractFile(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase()

  // TXT / MD : lecture directe
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    const text = await readAsText(file)
    return { mode: 'text', text: text.substring(0, 6000), fileName: file.name }
  }

  // PDF : extraction navigateur via pdfjs (aucun envoi base64)
  if (name.endsWith('.pdf')) {
    const text = await extractPdfBrowser(file)
    return { mode: 'text', text, fileName: file.name }
  }

  // DOCX / DOC : envoi base64 au serveur (mammoth Node.js)
  const base64    = await readAsBase64(file)
  const mediaType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

  const res = await fetch('/api/extract-doc', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fileBase64: base64, mediaType, fileName: file.name }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Erreur extraction DOCX')
  if (!data.text || data.text.length < 30) {
    throw new Error('Document Word vide ou protégé.')
  }
  return { mode: 'text', text: data.text, fileName: file.name }
}
