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

// ── Générateur du cachet circulaire (Canvas → PNG → jsPDF) ───────────────────
function buildStampCanvas(reference: string, dateDoc: string): HTMLCanvasElement {
  const S = 600                    // taille canvas px
  const canvas = document.createElement('canvas')
  canvas.width = S; canvas.height = S
  const ctx = canvas.getContext('2d')!
  const cx = S / 2, cy = S / 2

  // Rayons (en px canvas)
  const R    = 268   // bord extérieur
  const R1   = 253   // bord intérieur du double anneau
  const R2   = 238   // limite bande «MAÎTRE» / zone intérieure
  const R3   = 180   // limite bande «AVOCAT» / zone centrale
  const R4   = 165   // bord intérieur de la zone «AVOCAT»
  const LINE = 52    // demi-hauteur des lignes de séparation (px depuis cy)

  const NAVY    = '#0A192F'
  const NAVYMD  = '#1e3c6e'
  const NAVYLT  = '#4a7ab5'
  const WHITE   = '#ffffff'
  const CREAM   = '#f2f5fb'

  ctx.clearRect(0, 0, S, S)

  // ── Helper : arc band rempli ──────────────────────────────────────────────
  function arcBand(rOut: number, rIn: number, a0: number, a1: number, color: string, ccw = false) {
    ctx.beginPath()
    ctx.arc(cx, cy, rOut, a0, a1, ccw)
    ctx.arc(cx, cy, rIn,  a1, a0, !ccw)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }

  // ── Helper : texte le long d'un arc ──────────────────────────────────────
  // angle0..angle1 = canvas angles (0=droite, sens horaire positif en canvas y-bas)
  // flip=true  → texte lisible depuis l'extérieur au bas de cercle
  function arcText(
    text: string, r: number,
    a0: number, a1: number,
    size: number, color: string,
    weight = 'bold', flip = false
  ) {
    ctx.save()
    ctx.font = `${weight} ${size}px "Arial Narrow", Arial, Helvetica, sans-serif`
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.textAlign    = 'left'

    const chars = text.split('')
    const cw    = chars.map(c => ctx.measureText(c).width)
    const total = cw.reduce((a, b) => a + b, 0)
    const circ  = 2 * Math.PI * r
    const span  = a1 - a0                         // arc disponible (rad)
    const need  = (total / circ) * 2 * Math.PI    // arc requis

    let angle = a0 + (span - need) / 2            // centrer dans l'arc

    for (let i = 0; i < chars.length; i++) {
      const ca = (cw[i] / circ) * 2 * Math.PI
      const mid = angle + ca / 2

      ctx.save()
      ctx.translate(cx, cy)
      // rotation : mid + π/2 aligne tangentiellement (sens horaire = lecture normale)
      ctx.rotate(flip ? mid - Math.PI / 2 : mid + Math.PI / 2)
      ctx.translate(0, -r)
      ctx.fillText(chars[i], -cw[i] / 2, 0)
      ctx.restore()

      angle += ca
    }
    ctx.restore()
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. Fond blanc complet du cercle
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.fillStyle = WHITE; ctx.fill()

  // 2. Bande «MAÎTRE MOKADMI SAMI» (arc top, entre R2 et R)
  //    Top arc : de π (9h) à 2π=0 (3h) en passant par 12h — anticlockwise=true
  arcBand(R2, R * 0.01, Math.PI, 0, WHITE, true)   // reset fond haut
  arcBand(R,  R2,        Math.PI, 0, NAVY,  true)   // bande navy top (9h → 3h par le haut)

  // 3. Bande «AVOCAT AU BARREAU DE TUNIS» (arc top intérieur, entre R3 et R2)
  //    Légèrement plus claire pour la distinction visuelle
  arcBand(R2, R3, Math.PI, 0, NAVYMD, true)

  // 4. Bande «BARREAU DE TUNIS» (arc bas, entre R3 et R)
  //    Bottom arc : de 0 (3h) à π (9h) en passant par 6h — anticlockwise=false
  arcBand(R, R3, 0, Math.PI, NAVY, false)

  // 5. Zone centrale blanche
  ctx.beginPath(); ctx.arc(cx, cy, R4, 0, Math.PI*2)
  ctx.fillStyle = WHITE; ctx.fill()

  // 6. Lignes de séparation horizontales (doubles)
  const lx0 = cx - Math.sqrt(R3*R3 - LINE*LINE) + 8
  const lx1 = cx + Math.sqrt(R3*R3 - LINE*LINE) - 8
  ;[1, -1].forEach(sign => {
    const y = cy + sign * LINE
    ctx.strokeStyle = NAVY; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.moveTo(lx0, y); ctx.lineTo(lx1, y); ctx.stroke()
    ctx.strokeStyle = NAVYLT; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(lx0, y + sign*5); ctx.lineTo(lx1, y + sign*5); ctx.stroke()
  })

  // 7. Anneaux extérieurs (double cercle)
  ctx.strokeStyle = NAVY
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI*2); ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy, R1, 0, Math.PI*2); ctx.stroke()

  // Cercle intérieur de séparation
  ctx.lineWidth = 1.5
  ctx.strokeStyle = NAVY
  ctx.beginPath(); ctx.arc(cx, cy, R3, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy, R3 - 5, 0, Math.PI*2)
  ctx.strokeStyle = NAVYLT; ctx.lineWidth = 0.8; ctx.stroke()

  // ─── 8. Textes arc ───────────────────────────────────────────────────────

  // «MAÎTRE MOKADMI SAMI» — bande top externe (sur NAVY = texte blanc)
  // Canvas top arc : a0 = π+0.15, a1 = 2π-0.15 = -0.15 (en allant CCW donc l'ordre est inversé)
  // Pour arcText qui va de a0→a1 avec sens horaire :
  //   On passe a0=π+0.15 (peu après 9h) et a1=2π-0.15 (peu avant 3h) en passant par 12h
  //   Comme les angles canvas croissent dans le sens horaire, et 12h = -π/2 = 3π/2 :
  //   On écrit de gauche à droite en passant par le haut en utilisant des angles négatifs
  const TOP_A0 = Math.PI + 0.18      // juste après 9h
  const TOP_A1 = 2 * Math.PI - 0.18  // juste avant 3h (= -0.18)
  // Rayon milieu de la bande MAÎTRE
  const rMaitre = (R + R2) / 2 + 6
  arcText(
    'MAÎTRE MOKADMI SAMI',
    rMaitre,
    TOP_A0, TOP_A1,
    34, WHITE, 'bold'
  )

  // «AVOCAT AU BARREAU DE TUNIS» — bande top intérieure
  const rAvocat = (R2 + R3) / 2 + 4
  const AV_A0 = Math.PI + 0.5
  const AV_A1 = 2 * Math.PI - 0.5
  arcText(
    'AVOCAT AU BARREAU DE TUNIS',
    rAvocat,
    AV_A0, AV_A1,
    21, CREAM, 'bold'
  )

  // «BARREAU DE TUNIS» — bande bas (flip=true)
  const rBarreau = (R + R3) / 2 + 6
  const BOT_A0 = 0.35     // peu après 3h
  const BOT_A1 = Math.PI - 0.35  // peu avant 9h
  arcText(
    'BARREAU DE TUNIS',
    rBarreau,
    BOT_A0, BOT_A1,
    34, WHITE, 'bold', true
  )

  // ─── 9. Textes centre ────────────────────────────────────────────────────
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'

  // MF
  ctx.font      = `bold 30px "Arial Narrow", Arial, Helvetica, sans-serif`
  ctx.fillStyle = NAVY
  ctx.fillText(`MF : ${CABINET.matriculeFiscal}`, cx, cy - 14)

  // Inscription
  ctx.font      = `bold 25px "Arial Narrow", Arial, Helvetica, sans-serif`
  ctx.fillStyle = NAVYMD
  ctx.fillText(`INSCRIT DEPUIS ${CABINET.inscription.replace(/\D/g, '')}`, cx, cy + 18)

  // ─── 10. Référence + date (sous le cachet, en dehors du cercle) ──────────
  ctx.font      = `500 22px "Arial Narrow", Arial, Helvetica, sans-serif`
  ctx.fillStyle = NAVYLT
  ctx.fillText(`${reference}  ·  ${fmtDateCourt(dateDoc)}`, cx, cy + R + 28)

  return canvas
}

// ── Cachet fiscal de clôture ──────────────────────────────────────────────────
function drawCachet(doc: jsPDF, rapport: RapportData, H: number, W: number) {
  const cachetY = H - 64

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
  doc.text('Signature et cachet :', sigX, cachetY + 12)

  // Ligne de signature
  doc.setDrawColor(...NAVYLT)
  doc.setLineWidth(0.4)
  doc.line(sigX, cachetY + 30, sigX + 65, cachetY + 30)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  doc.setTextColor(...LIGHT)
  doc.text(CABINET.nom, sigX, cachetY + 35)

  // ── Cachet circulaire (droite) — Canvas → PNG → jsPDF ──────────────────
  try {
    const stampCanvas = buildStampCanvas(rapport.reference, rapport.dateDoc)
    const stampPng    = stampCanvas.toDataURL('image/png')

    // Taille dans le PDF : 58mm × 58mm, positionné à droite
    const stampSize = 58
    const stampX    = W - 14 - stampSize
    const stampY    = cachetY - 6
    doc.addImage(stampPng, 'PNG', stampX, stampY, stampSize, stampSize)
  } catch (e) {
    // Fallback minimal si canvas non disponible
    console.warn('[cachet] Canvas non disponible, fallback texte', e)
    const cX = W - 14 - 45
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...NAVY)
    doc.text(`MF : ${CABINET.matriculeFiscal}`, cX, cachetY + 10)
    doc.text(CABINET.barreau, cX, cachetY + 18)
  }
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
