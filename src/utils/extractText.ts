/**
 * extractText.ts
 * Extrait le texte brut depuis un fichier uploadé :
 *   - .pdf  → pdfjs-dist (rendu page par page)
 *   - .docx → mammoth (conversion HTML → texte)
 *   - .txt / .md → lecture directe FileReader
 */

// ── PDF ───────────────────────────────────────────────────────────────────────
async function extractPdf(file: File): Promise<string> {
  // Import dynamique pour éviter d'alourdir le bundle principal
  const pdfjsLib = await import('pdfjs-dist')

  // Worker — pointer vers le CDN pour éviter la config webpack
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item: unknown) => {
        const it = item as { str?: string; hasEOL?: boolean }
        return (it.str ?? '') + (it.hasEOL ? '\n' : ' ')
      })
      .join('')
    pages.push(pageText)
  }

  return pages.join('\n\n').replace(/\s{3,}/g, '\n\n').trim()
}

// ── DOCX (Word) ───────────────────────────────────────────────────────────────
async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.replace(/\s{3,}/g, '\n\n').trim()
}

// ── Texte brut ────────────────────────────────────────────────────────────────
function extractTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).trim())
    reader.onerror = () => reject(new Error('Lecture impossible'))
    reader.readAsText(file, 'UTF-8')
  })
}

// ── Entrée publique ───────────────────────────────────────────────────────────
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.pdf')) {
    return extractPdf(file)
  }
  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    return extractDocx(file)
  }
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.rtf')) {
    return extractTxt(file)
  }

  // Fallback : essayer comme texte
  try { return extractTxt(file) }
  catch { throw new Error(`Format non supporté : ${file.name}. Utilisez PDF, DOCX ou TXT.`) }
}

export const SUPPORTED_TYPES = '.pdf,.doc,.docx,.txt,.md'
export const MAX_SIZE_MB = 20
