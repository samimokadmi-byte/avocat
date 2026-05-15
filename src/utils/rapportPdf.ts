/**
 * rapportPdf.ts — Générateur de documents juridiques Cabinet Mokadmi
 * Papier à lettres complet avec en-tête navy, corps structuré,
 * cachet fiscal de clôture (MF + Barreau + Signature).
 *
 * Types supportés :
 *   Rapport · Avis · Mémorandum · Opinion Fiscale · Note Juridique · Consultation
 */

import jsPDF from 'jspdf'

// ── Identité cabinet ──────────────────────────────────────────────────────────
const CABINET = {
  nom:             'Maître Mokadmi Sami',
  qualite:         'Avocat au Barreau de Tunis',
  specialite:      'Droit des Affaires — Fiscal — IA',
  adresse1:        'Bloc B, Espace Tunis Monplaisir',
  adresse2:        '1073 Montplaisir, Tunis — Tunisie',
  telephone:       '+216 29 784 651',
  email:           'office@mokadmi.lawyer',
  site:            'www.mokadmi.lawyer',
  matriculeFiscal: '000/P/A/834881/F',
  barreau:         'Barreau de Tunis',
  inscription:     'Inscrit depuis 2003',
}

// ── Palette navy charte Mokadmi ───────────────────────────────────────────────
const NAVY    = [ 10,  25,  47] as [number, number, number]
const NAVYMD  = [ 30,  60, 110] as [number, number, number]
const NAVYLT  = [215, 225, 245] as [number, number, number]
const NAVYPALE= [237, 242, 252] as [number, number, number]
const DARK    = [ 20,  25,  40] as [number, number, number]
const MID     = [ 80,  80,  80] as [number, number, number]
const LIGHT   = [150, 150, 150] as [number, number, number]
const WHITE   = [255, 255, 255] as [number, number, number]
const STAMP   = [ 10,  25,  47] as [number, number, number] // couleur cachet

// ── Types de documents ────────────────────────────────────────────────────────
export const RAPPORT_TYPES = [
  { id: 'rapport',         label: 'Rapport',            prefix: 'RPT' },
  { id: 'avis',            label: 'Avis Juridique',     prefix: 'AVI' },
  { id: 'memorandum',      label: 'Mémorandum',         prefix: 'MEM' },
  { id: 'opinion_fiscale', label: 'Opinion Fiscale',    prefix: 'OPF' },
  { id: 'note_juridique',  label: 'Note Juridique',     prefix: 'NJU' },
  { id: 'consultation',    label: 'Consultation',       prefix: 'CON' },
] as const

export type RapportTypeId = typeof RAPPORT_TYPES[number]['id']

// ── Interface du document ─────────────────────────────────────────────────────
export interface RapportSection {
  titre: string
  contenu: string
}

export interface RapportData {
  id:           string
  type:         RapportTypeId
  reference:    string          // Ex : RPT-2026-001
  titre:        string
  objet:        string
  clientNom:    string
  clientRef?:   string          // Référence dossier client
  clientMF?:    string          // MF du client si applicable
  dateDoc:      string          // ISO date
  dateEcheance?: string
  confidentiel: boolean
  sections:     RapportSection[]
  conclusion?:  string
  reservations?: string        // Réserves / limites de l'avis
  createdAt:    string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(s: string): string {
  if (!s) return ''
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateCourt(s: string): string {
  if (!s) return ''
  const d = new Date(s + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getRapportType(id: RapportTypeId) {
  return RAPPORT_TYPES.find(t => t.id === id) ?? RAPPORT_TYPES[0]
}

/** Découpe un texte long en lignes selon maxWidth (jsPDF splitTextToSize) */
function splitText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[]
}

/** Ajouter du texte avec saut de page automatique */
function addTextBlock(
  doc: jsPDF,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
  pageH: number,
  marginBottom: number,
): number {
  for (const line of lines) {
    if (y + lineHeight > pageH - marginBottom) {
      doc.addPage()
      y = 40 // reprise après en-tête allégé nouvelle page
    }
    doc.text(line, x, y)
    y += lineHeight
  }
  return y
}

// ── En-tête cabinet (première page) ──────────────────────────────────────────
function drawHeader(doc: jsPDF, W: number) {
  // Bande navy supérieure
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 42, 'F')

  // Nom cabinet
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...WHITE)
  doc.text(CABINET.nom.toUpperCase(), 14, 14)

  // Qualité + spécialité
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...NAVYLT)
  doc.text(CABINET.qualite.toUpperCase(), 14, 21)
  doc.text(CABINET.specialite, 14, 27)

  // Coordonnées (droite)
  doc.setFontSize(7)
  doc.setTextColor(...NAVYLT)
  const coordX = W - 14
  doc.text(CABINET.telephone,  coordX, 14, { align: 'right' })
  doc.text(CABINET.email,      coordX, 19, { align: 'right' })
  doc.text(CABINET.adresse1,   coordX, 24, { align: 'right' })
  doc.text(CABINET.adresse2,   coordX, 29, { align: 'right' })

  // MF cabinet
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...NAVYLT)
  doc.text(`MF : ${CABINET.matriculeFiscal}`, coordX, 37, { align: 'right' })

  // Ligne de séparation sous la bande navy
  doc.setDrawColor(...NAVYMD)
  doc.setLineWidth(0.5)
  doc.line(14, 46, W - 14, 46)
}

// ── Bloc type de document ─────────────────────────────────────────────────────
function drawDocumentTag(doc: jsPDF, rapport: RapportData, W: number): number {
  const type = getRapportType(rapport.type)
  let y = 52

  // Badge type (fond bleu pâle)
  const badgeW = 52
  doc.setFillColor(...NAVYPALE)
  doc.roundedRect(14, y - 5, badgeW, 9, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...NAVYMD)
  doc.text(type.label.toUpperCase(), 14 + badgeW / 2, y + 1, { align: 'center' })

  if (rapport.confidentiel) {
    const confX = 14 + badgeW + 4
    doc.setFillColor(220, 30, 30)
    doc.roundedRect(confX, y - 5, 36, 9, 1.5, 1.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...WHITE)
    doc.text('CONFIDENTIEL', confX + 18, y + 1, { align: 'center' })
  }

  // Référence + date (droite)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...DARK)
  doc.text(rapport.reference, W - 14, y + 1, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MID)
  doc.text(`Tunis, le ${fmtDate(rapport.dateDoc)}`, W - 14, y + 7, { align: 'right' })

  y += 16

  // Titre principal
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...NAVY)
  const titreLines = splitText(doc, rapport.titre, W - 28)
  titreLines.forEach((line, i) => {
    doc.text(line, W / 2, y + i * 7, { align: 'center' })
  })
  y += titreLines.length * 7 + 4

  // Filet sous titre
  doc.setDrawColor(...NAVYMD)
  doc.setLineWidth(1.2)
  doc.line(W / 2 - 30, y, W / 2 + 30, y)
  y += 6

  // Objet
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...NAVYMD)
  doc.text('OBJET :', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  const objetLines = splitText(doc, rapport.objet, W - 42)
  objetLines.forEach((line, i) => {
    doc.text(line, 35, y + i * 5)
  })
  y += objetLines.length * 5 + 4

  // Bloc destinataire / référence dossier
  doc.setFillColor(...NAVYPALE)
  doc.rect(14, y, W - 28, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...NAVYMD)
  doc.text('DESTINATAIRE', 20, y + 6)
  doc.text('RÉFÉRENCE DOSSIER', W / 2 + 4, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...DARK)
  doc.text(rapport.clientNom, 20, y + 13)
  if (rapport.clientMF) {
    doc.setFontSize(7)
    doc.setTextColor(...MID)
    doc.text(`MF : ${rapport.clientMF}`, 20, y + 18.5)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...DARK)
  doc.text(rapport.clientRef || '—', W / 2 + 4, y + 13)

  y += 28

  // Filet de séparation corps
  doc.setDrawColor(...NAVYLT)
  doc.setLineWidth(0.3)
  doc.line(14, y, W - 14, y)
  y += 8

  return y
}

// ── Corps du document (sections) ──────────────────────────────────────────────
function drawBody(doc: jsPDF, rapport: RapportData, startY: number, W: number, H: number): number {
  const marginB = 55  // réserver l'espace pour le cachet en bas
  const bodyW   = W - 28
  let y = startY

  // Préambule type si nécessaire
  const preambuleMap: Record<RapportTypeId, string> = {
    rapport:         `Le présent rapport a été établi à la demande de ${rapport.clientNom} et porte sur les éléments communiqués à notre cabinet dans le cadre du dossier susvisé.`,
    avis:            `Le présent avis juridique a été préparé exclusivement à l'intention de ${rapport.clientNom} sur la base des informations et documents communiqués à notre cabinet. Il ne saurait être transmis à des tiers sans notre accord écrit préalable.`,
    memorandum:      `Le présent mémorandum résume notre analyse juridique des questions soumises par ${rapport.clientNom}. Les conclusions exposées ci-après sont fondées sur le droit applicable à la date du présent document.`,
    opinion_fiscale: `La présente opinion fiscale a été préparée sur la base des dispositions du Code de l'IRPP et de l'IS, du Code de la TVA et de la doctrine administrative en vigueur à la date de sa rédaction. Elle ne constitue pas un engagement de l'Administration fiscale.`,
    note_juridique:  `La présente note juridique expose notre analyse des questions soulevées par ${rapport.clientNom}. Elle est rédigée à titre consultatif et ne se substitue pas à une décision judiciaire ou administrative.`,
    consultation:    `La présente consultation juridique est strictement confidentielle et établie à l'attention exclusive de ${rapport.clientNom}. Elle reflète notre analyse du droit applicable à la date indiquée ci-dessus.`,
  }

  // Texte préambule
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(...MID)
  const preLines = splitText(doc, preambuleMap[rapport.type], bodyW)
  y = addTextBlock(doc, preLines, 14, y, 5, H, marginB)
  y += 8

  // Sections
  for (let i = 0; i < rapport.sections.length; i++) {
    const section = rapport.sections[i]
    if (!section.titre && !section.contenu) continue

    // Numéro + titre de section
    if (y + 14 > H - marginB) { doc.addPage(); y = 40 }

    // Fond titre section
    doc.setFillColor(...NAVYPALE)
    doc.rect(14, y - 4, bodyW, 11, 'F')
    doc.setDrawColor(...NAVYMD)
    doc.setLineWidth(2)
    doc.line(14, y - 4, 14, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...NAVY)
    doc.text(`${i + 1}.  ${section.titre.toUpperCase()}`, 20, y + 4)
    y += 14

    // Contenu section
    if (section.contenu) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...DARK)
      const contentLines = splitText(doc, section.contenu, bodyW)
      y = addTextBlock(doc, contentLines, 18, y, 5.5, H, marginB)
      y += 8
    }
  }

  // Conclusion
  if (rapport.conclusion) {
    if (y + 16 > H - marginB) { doc.addPage(); y = 40 }

    doc.setFillColor(...NAVY)
    doc.rect(14, y - 4, bodyW, 11, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...WHITE)
    doc.text('CONCLUSION', 20, y + 4)
    y += 14

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    const concLines = splitText(doc, rapport.conclusion, bodyW)
    y = addTextBlock(doc, concLines, 18, y, 5.5, H, marginB)
    y += 8
  }

  // Réserves / limites
  if (rapport.reservations) {
    if (y + 16 > H - marginB) { doc.addPage(); y = 40 }

    doc.setDrawColor(...NAVYMD)
    doc.setFillColor(...NAVYPALE)
    doc.roundedRect(14, y, bodyW, 4, 0.5, 0.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...NAVYMD)
    doc.text('RÉSERVES ET LIMITES :', 18, y + 8)
    y += 12

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MID)
    const reservLines = splitText(doc, rapport.reservations, bodyW - 8)
    y = addTextBlock(doc, reservLines, 18, y, 5, H, marginB)
    y += 6
  }

  return y
}

// ── Cachet fiscal de clôture ──────────────────────────────────────────────────
function drawCachet(doc: jsPDF, rapport: RapportData, H: number, W: number) {
  const cachetY = H - 50

  // Ligne de séparation avant cachet
  doc.setDrawColor(...NAVYMD)
  doc.setLineWidth(0.5)
  doc.line(14, cachetY - 4, W - 14, cachetY - 4)

  // ── Zone signature (gauche) ───────────────────────────────────────────────
  const sigX = 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MID)
  doc.text('Fait à Tunis, le', sigX, cachetY + 4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(fmtDate(rapport.dateDoc), sigX + 28, cachetY + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MID)
  doc.text('Signature et cachet :', sigX, cachetY + 11)

  // Ligne de signature
  doc.setDrawColor(...NAVYLT)
  doc.setLineWidth(0.4)
  doc.line(sigX, cachetY + 26, sigX + 68, cachetY + 26)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...LIGHT)
  doc.text(CABINET.nom, sigX, cachetY + 31)

  // ── Cachet fiscal (droite) — rectangle arrondi style tampon ──────────────
  const cW = 90, cH = 42
  const cX = W - 14 - cW
  const cY = cachetY - 2

  // Fond cachet (bleu très pâle)
  doc.setFillColor(...NAVYPALE)
  doc.roundedRect(cX, cY, cW, cH, 2, 2, 'F')

  // Bordure double style cachet officiel
  doc.setDrawColor(...STAMP)
  doc.setLineWidth(1.5)
  doc.roundedRect(cX, cY, cW, cH, 2, 2, 'S')
  doc.setLineWidth(0.4)
  doc.roundedRect(cX + 2.5, cY + 2.5, cW - 5, cH - 5, 1.5, 1.5, 'S')

  // ── Contenu du cachet ────────────────────────────────────────────────────
  const cx = cX + cW / 2  // centre X

  // Nom cabinet
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...NAVY)
  doc.text(CABINET.nom.toUpperCase(), cx, cY + 9, { align: 'center' })

  // Qualité
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...NAVYMD)
  doc.text(CABINET.qualite.toUpperCase(), cx, cY + 14.5, { align: 'center' })

  // Filet interne
  doc.setDrawColor(...NAVYLT)
  doc.setLineWidth(0.3)
  doc.line(cX + 6, cY + 17, cX + cW - 6, cY + 17)

  // Matricule fiscal (encadré)
  doc.setFillColor(...NAVY)
  doc.roundedRect(cX + 8, cY + 19, cW - 16, 8, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...WHITE)
  doc.text(`MF : ${CABINET.matriculeFiscal}`, cx, cY + 24.5, { align: 'center' })

  // Barreau
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...NAVYMD)
  doc.text(`${CABINET.barreau} · ${CABINET.inscription}`, cx, cY + 32, { align: 'center' })

  // Date du document
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(6.5)
  doc.setTextColor(...LIGHT)
  doc.text(`${rapport.reference}  ·  ${fmtDateCourt(rapport.dateDoc)}`, cx, cY + 37.5, { align: 'center' })
}

// ── Pied de page (toutes les pages) ──────────────────────────────────────────
function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number, W: number, H: number) {
  doc.setFillColor(...NAVY)
  doc.rect(0, H - 8, W, 8, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...NAVYLT)
  doc.text(
    `${CABINET.nom}  ·  ${CABINET.qualite}  ·  MF : ${CABINET.matriculeFiscal}  ·  ${CABINET.site}`,
    W / 2, H - 3.5, { align: 'center' }
  )
  // Numéro de page
  doc.setFont('helvetica', 'bold')
  doc.text(`${pageNum} / ${totalPages}`, W - 14, H - 3.5, { align: 'right' })
}

// ── Filigrane CONFIDENTIEL ────────────────────────────────────────────────────
function drawWatermark(doc: jsPDF, W: number, H: number) {
  doc.saveGraphicsState?.()
  doc.setGState?.(doc.GState?.({ opacity: 0.06 }) as never)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(60)
  doc.setTextColor(10, 25, 47)
  doc.text('CONFIDENTIEL', W / 2, H / 2, { align: 'center', angle: 45 })
  doc.restoreGraphicsState?.()
}

// ── Entrée publique — téléchargement ─────────────────────────────────────────
export async function downloadRapportPdf(rapport: RapportData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Première page
  drawHeader(doc, W)
  const bodyStart = drawDocumentTag(doc, rapport, W)
  drawBody(doc, rapport, bodyStart, W, H)

  // Cachet sur la DERNIÈRE page
  const totalPagesNow = (doc.internal as { pages: unknown[] }).pages.length - 1
  // Aller à la dernière page pour le cachet
  doc.setPage(totalPagesNow)
  drawCachet(doc, rapport, H, W)

  // Pied de page sur toutes les pages + filigrane si confidentiel
  const total = (doc.internal as { pages: unknown[] }).pages.length - 1
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    if (rapport.confidentiel) drawWatermark(doc, W, H)
    drawPageFooter(doc, p, total, W, H)
  }

  const filename = `${rapport.reference.replace(/\//g, '-')}_${rapport.clientNom.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}

// ── Entrée publique — base64 (pour envoi email) ───────────────────────────────
export async function generateRapportBase64(rapport: RapportData): Promise<string> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  drawHeader(doc, W)
  const bodyStart = drawDocumentTag(doc, rapport, W)
  drawBody(doc, rapport, bodyStart, W, H)

  const totalPagesNow = (doc.internal as { pages: unknown[] }).pages.length - 1
  doc.setPage(totalPagesNow)
  drawCachet(doc, rapport, H, W)

  const total = (doc.internal as { pages: unknown[] }).pages.length - 1
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    if (rapport.confidentiel) drawWatermark(doc, W, H)
    drawPageFooter(doc, p, total, W, H)
  }

  return doc.output('datauristring').split(',')[1]
}
