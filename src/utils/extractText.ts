/**
 * extractText.ts
 * Extrait le texte brut depuis un fichier uploadé.
 * Formats : .pdf · .docx · .txt · .md · .rtf
 * Fallback : lecture texte brut pour tout autre format
 */

// ── Lecture texte brut ────────────────────────────────────────────────────────
function readAsText(file: File, encoding = 'UTF-8'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).trim())
    reader.onerror = () => reject(new Error('Lecture impossible'))
    reader.readAsText(file, encoding)
  })
}

// ── Lecture ArrayBuffer ───────────────────────────────────────────────────────
function readAsArrayBuffer(fileOrBlob: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Lecture impossible'))
    reader.readAsArrayBuffer(fileOrBlob)
  })
}

// ── PDF via pdfjs-dist ────────────────────────────────────────────────────────
async function extractPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await readAsArrayBuffer(file)
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text    = content.items
      .map((item: unknown) => {
        const it = item as { str?: string; hasEOL?: boolean }
        return (it.str ?? '') + (it.hasEOL ? '\n' : ' ')
      })
      .join('')
    pages.push(text)
  }
  return pages.join('\n\n').replace(/\s{3,}/g, '\n\n').trim()
}

// ── DOCX via mammoth ──────────────────────────────────────────────────────────
async function extractDocx(file: File): Promise<string> {
  // Vérifier la signature ZIP (DOCX = ZIP) — les 4 premiers octets = PK\x03\x04
  const header = await readAsArrayBuffer(file.slice(0, 4))
  const bytes  = new Uint8Array(header)
  const isZip  = bytes[0] === 0x50 && bytes[1] === 0x4B   // 'PK'

  if (!isZip) {
    throw new Error(
      'Ce fichier n\'est pas un DOCX valide (format Word 2007+). ' +
      'Convertissez-le en PDF ou en DOCX depuis Word, puis réessayez.'
    )
  }

  const mammoth     = await import('mammoth')
  const arrayBuffer = await readAsArrayBuffer(file)
  const result      = await mammoth.extractRawText({ arrayBuffer })

  if (!result.value || result.value.trim().length < 20) {
    throw new Error('Le document Word semble vide ou protégé en lecture.')
  }

  return result.value.replace(/\s{3,}/g, '\n\n').trim()
}

// ── Détection par magic bytes ──────────────────────────────────────────────────
async function detectFormat(file: File): Promise<'pdf' | 'docx' | 'text'> {
  const header = await readAsArrayBuffer(file.slice(0, 8))
  const bytes  = new Uint8Array(header)

  // PDF : %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'pdf'
  }
  // ZIP (DOCX/XLSX) : PK
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
    return 'docx'
  }
  return 'text'
}

// ── Entrée publique ───────────────────────────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  let text   = ''

  try {
    // 1. Détecter le vrai format via magic bytes (ignore l'extension)
    const fmt = await detectFormat(file)

    if (fmt === 'pdf' || name.endsWith('.pdf')) {
      text = await extractPdf(file)
    } else if (fmt === 'docx' || name.endsWith('.docx')) {
      text = await extractDocx(file)
    } else if (name.endsWith('.doc')) {
      // .doc (ancien Word binaire) : non supporté par mammoth
      throw new Error(
        'Le format .doc (Word 97-2003) n\'est pas supporté. ' +
        'Ouvrez le fichier dans Word puis enregistrez-le en PDF ou en .docx.'
      )
    } else {
      // TXT, MD, RTF, etc.
      text = await readAsText(file)
    }
  } catch (e) {
    // Re-lancer avec message français clair
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    throw new Error(msg)
  }

  if (!text || text.trim().length < 30) {
    throw new Error(
      'Le document est vide, illisible ou protégé. ' +
      'Assurez-vous qu\'il contient du texte sélectionnable (non scanné).'
    )
  }

  return text.trim()
}

export const SUPPORTED_TYPES = '.pdf,.docx,.txt,.md,.rtf'
export const MAX_SIZE_MB     = 20

