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
const NAVY    = [ 20,  55, 115] as [number, number, number]  // bleu plus clair
const NAVYMD  = [ 45,  95, 160] as [number, number, number]
const NAVYLT  = [215, 225, 245] as [number, number, number]
const NAVYPALE= [237, 242, 252] as [number, number, number]
const DARK    = [ 20,  25,  40] as [number, number, number]
const MID     = [ 80,  80,  80] as [number, number, number]
const LIGHT   = [150, 150, 150] as [number, number, number]
const WHITE   = [255, 255, 255] as [number, number, number]
// (STAMP supprimé — cachet désormais rendu via Canvas)

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
  reference:    string
  titre:        string
  objet:        string
  clientNom:    string
  clientRef?:   string
  clientMF?:    string
  clientId?:    string          // lien vers le compte client
  dateDoc:      string
  dateEcheance?: string
  confidentiel: boolean
  sections:     RapportSection[]
  conclusion?:  string
  reservations?: string
  status:       'draft' | 'pending_request' | 'in_progress' | 'sent'  // statut du workflow
  requestedBy?: 'admin' | 'client' | 'email' | 'messagerie'
  linkedDocId?: string          // ID du document injecté dans l'espace client
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

// ── Cachet circulaire — dessin natif jsPDF (sans canvas) ─────────────────────
function drawCachet(doc: jsPDF, rapport: RapportData, H: number, W: number) {
  const cachetY = H - 64

  // Ligne de séparation
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
  doc.text('Signature et cachet :', sigX, cachetY + 12)
  doc.setDrawColor(...NAVYLT)
  doc.setLineWidth(0.4)
  doc.line(sigX, cachetY + 30, sigX + 65, cachetY + 30)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...LIGHT)
  doc.text(CABINET.nom, sigX, cachetY + 35)

  // ── Cachet circulaire (droite) — dessin natif jsPDF ───────────────────────
  const R  = 20    // rayon extérieur (mm)
  const R1 = 18.8  // rayon bord intérieur du double anneau
  const RB = 12.5  // rayon limite bandes / zone centrale
  const cX = W - 14 - R     // centre X du cachet
  const cY = cachetY + R - 4 // centre Y du cachet

  // ── 1. Disque navy complet ────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.circle(cX, cY, R1, 'F')

  // ── 2. Zone centrale blanche ──────────────────────────────────────────────
  doc.setFillColor(255, 255, 255)
  doc.circle(cX, cY, RB, 'F')

  // ── 3. Lignes de séparation ───────────────────────────────────────────────
  const SEP  = 4.2
  const linW = Math.sqrt(RB * RB - SEP * SEP)
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.3)
  ;[-1, 1].forEach((s: number) => {
    const ly = cY + s * SEP
    doc.line(cX - linW, ly, cX + linW, ly)
  })

  // ── 4. Cercles (double anneau + bord zone centrale) ───────────────────────
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.9); doc.circle(cX, cY, R,  'S')
  doc.setLineWidth(0.3); doc.circle(cX, cY, R1, 'S')
  doc.setLineWidth(0.25); doc.circle(cX, cY, RB + 0.3, 'S')

  // ── 5. Helper texte en arc ────────────────────────────────────────────────
  // theta = angle canvas en degrés (0=droite, 90=bas, 180=gauche, 270=haut)
  // flip=false → texte sur arc supérieur (lisible de l'extérieur)
  // flip=true  → texte sur arc inférieur (lisible de l'extérieur)
  const arcText = (
    text: string, r: number,
    a0deg: number, a1deg: number,
    fontSize: number, rgb: [number, number, number],
    flip = false
  ) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(fontSize)
    doc.setTextColor(...rgb)
    const n    = text.length
    const span = a1deg - a0deg
    const step = span / (n + 1)
    for (let i = 0; i < n; i++) {
      const theta = a0deg + step * (i + 1)          // degrés, canvas convention
      const rad   = theta * Math.PI / 180
      const x     = cX + r * Math.cos(rad)
      const y     = cY + r * Math.sin(rad)
      // Rotation pour que le caractère soit tangent au cercle, lisible de l'extérieur
      const angle = flip ? (theta - 90) : (270 - theta)
      doc.text(text[i], x, y, { angle, align: 'center' })
    }
  }

  // ── 6. Textes arc ─────────────────────────────────────────────────────────
  const rBand = (R1 + RB) / 2   // milieu de la bande navy

  // TOP : «MAÎTRE MOKADMI SAMI» — de 205° à 335° via 270° (haut)
  arcText('MAÎTRE MOKADMI SAMI', rBand, 205, 335, 5.2, [255, 255, 255])

  // TOP intérieur : «AVOCAT AU BARREAU DE TUNIS»
  arcText('AVOCAT AU BARREAU DE TUNIS', RB + 1.8, 218, 322, 3.4, [215, 225, 245])

  // ── 7. Textes centraux ────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(5.2)
  doc.setTextColor(...NAVY)
  doc.text(`MF : ${CABINET.matriculeFiscal}`, cX, cY - 1.5, { align: 'center' })

  doc.setFontSize(4.2)
  doc.setTextColor(...NAVYMD)
  doc.text('INSCRIT DEPUIS 2003', cX, cY + 2.5, { align: 'center' })

  // ── 8. Référence + date sous le cachet ────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(...NAVYLT)
  doc.text(
    `${rapport.reference}  ·  ${fmtDateCourt(rapport.dateDoc)}`,
    cX, cY + R + 4, { align: 'center' }
  )
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
