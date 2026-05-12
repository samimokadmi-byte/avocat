/**
 * invoicePdf.ts — Générateur PDF facture avec en-tête Cabinet Mokadmi
 * Utilise jsPDF + jspdf-autotable (pas de html2canvas = pas de dépendance DOM)
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, CURRENCIES, computeAmounts, fmtAmount } from '../components/BillingModule'

// ── Identité du cabinet ────────────────────────────────────────────────────────
const CABINET = {
  nom:             'Maître Mokadmi Sami',
  qualite:         'Avocat — Droit des Affaires, Fiscal & IA',
  adresse1:        'Bloc B, Espace Tunis Monplaisir',
  adresse2:        '1073 Montplaisir, Tunis — Tunisie',
  telephone:       '+216 29 784 651',
  email:           'office@mokadmi.lawyer',
  site:            'www.mokadmi.lawyer',
  matriculeFiscal: '1234567 A/M/000',   // ← à mettre à jour avec le vrai MF
  barreauTunis:    'Barreau de Tunis',
}

// ── Palette couleurs (PDF = RGB) ───────────────────────────────────────────────
const GOLD  = [201, 169, 110] as [number, number, number]  // #C9A96E
const DARK  = [7,  12,  24]  as [number, number, number]   // #070C18
const LIGHT = [230, 220, 200] as [number, number, number]  // off-white
const GREY  = [130, 120, 100] as [number, number, number]  // texte secondaire
const LINE  = [40,  45,  60] as [number, number, number]   // séparateur

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'BROUILLON',
  envoyee:   'ENVOYÉE',
  payee:     'PAYÉE',
  en_retard: 'EN RETARD',
}

function formatDate(s: string): string {
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * Convertit une image depuis une URL publique en base64 (pour jsPDF)
 * On charge le logo via un <img> temporaire.
 */
async function loadImageAsBase64(src: string): Promise<string | null> {
  try {
    const res  = await fetch(src)
    const blob = await res.blob()
    return await new Promise<string>(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(
  invoice: Invoice,
  userName: string,
  userCompany?: string,
  dossierName?: string,
): Promise<void> {
  const sym  = CURRENCIES[invoice.currency]?.symbol ?? invoice.currency
  const { ht, tva, ttc, retenue, timbre, net } = computeAmounts(invoice)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()   // 210
  const H   = doc.internal.pageSize.getWidth() * Math.SQRT2 // ≈297

  // ── Fond sombre ─────────────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(0, 0, W, H, 'F')

  // ── Bande dorée top ─────────────────────────────────────────────────────────
  doc.setFillColor(...GOLD)
  doc.rect(0, 0, W, 1.2, 'F')

  // ── Logo (top-left) ─────────────────────────────────────────────────────────
  let logoY = 12
  const logoSize = 22

  const logoBase64 = await loadImageAsBase64('/logo_processed.png')
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, logoY, logoSize, logoSize)
  }

  // ── Nom du cabinet (à droite du logo) ───────────────────────────────────────
  const textX = logoBase64 ? 14 + logoSize + 5 : 14
  doc.setFont('times', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...LIGHT)
  doc.text(CABINET.nom, textX, logoY + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GREY)
  doc.text(CABINET.qualite, textX, logoY + 12)
  doc.text(CABINET.barreauTunis, textX, logoY + 16)

  // ── Coordonnées cabinet (top-right) ─────────────────────────────────────────
  doc.setFontSize(7)
  doc.setTextColor(...GREY)
  const coordX = W - 14
  doc.text(CABINET.adresse1,       coordX, logoY + 5,  { align: 'right' })
  doc.text(CABINET.adresse2,       coordX, logoY + 9,  { align: 'right' })
  doc.text(CABINET.telephone,      coordX, logoY + 14, { align: 'right' })
  doc.setTextColor(...GOLD)
  doc.text(CABINET.email,          coordX, logoY + 18, { align: 'right' })
  doc.setTextColor(...GREY)
  doc.text(CABINET.site,           coordX, logoY + 22, { align: 'right' })

  // ── Séparateur doré ──────────────────────────────────────────────────────────
  const sepY = 40
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  doc.line(14, sepY, W - 14, sepY)

  // ── Matricule fiscal ─────────────────────────────────────────────────────────
  doc.setFontSize(6.5)
  doc.setTextColor(...GREY)
  doc.text(`Matricule fiscal : ${CABINET.matriculeFiscal}`, 14, sepY + 4.5)

  // ── Titre + Numéro facture ───────────────────────────────────────────────────
  const titleY = sepY + 14
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...LIGHT)
  doc.text("NOTE D'HONORAIRES", 14, titleY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GOLD)
  doc.text(`N° ${invoice.number}`, 14, titleY + 7)

  // Badge statut
  const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status.toUpperCase()
  const badgeX = W - 14
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)

  const statusColors: Record<string, [number,number,number]> = {
    brouillon: [130, 120, 100],
    envoyee:   [96,  165, 250],
    payee:     [74,  222, 128],
    en_retard: [248, 113, 113],
  }
  const badgeColor = statusColors[invoice.status] ?? GOLD
  const badgeW = 30, badgeH = 6.5
  doc.setFillColor(...badgeColor)
  doc.roundedRect(badgeX - badgeW, titleY - 4, badgeW, badgeH, 1, 1, 'F')
  doc.text(statusLabel, badgeX - badgeW / 2, titleY, { align: 'center' })

  // ── Bloc Facturation & Dates ─────────────────────────────────────────────────
  const infoY = titleY + 16
  doc.setFillColor(...LINE)
  doc.rect(14, infoY - 5, 80, 26, 'F')
  doc.rect(W - 94, infoY - 5, 80, 26, 'F')

  // Client
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GOLD)
  doc.text('FACTURÉ À', 18, infoY)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...LIGHT)
  doc.text(userName, 18, infoY + 5.5)

  if (userCompany) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GREY)
    doc.text(userCompany, 18, infoY + 10)
  }
  if (dossierName) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(...GREY)
    doc.text(`Dossier : ${dossierName}`, 18, userCompany ? infoY + 14 : infoY + 10)
  }

  // Dates
  const dateX = W - 90
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...GOLD)
  doc.text('DATES', dateX + 4, infoY)

  const dateRows = [
    ['Date d\'émission', formatDate(invoice.dateEmission)],
    ['Date d\'échéance', formatDate(invoice.dateEcheance)],
    ['Devise',          `${invoice.currency} (${sym})`],
  ]
  dateRows.forEach(([label, val], i) => {
    const rowY = infoY + 5.5 + i * 5.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GREY)
    doc.text(label, dateX + 4, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...LIGHT)
    doc.text(val, dateX + 76, rowY, { align: 'right' })
  })

  // ── Tableau des prestations ──────────────────────────────────────────────────
  const tableStartY = infoY + 30

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: 14, right: 14 },
    head: [[
      { content: 'Description', styles: { halign: 'left' } },
      { content: 'Qté/h',       styles: { halign: 'right' } },
      { content: `PU HT (${sym})`, styles: { halign: 'right' } },
      { content: `Total HT (${sym})`, styles: { halign: 'right' } },
    ]],
    body: invoice.lines.map(l => [
      l.description || '—',
      { content: String(l.quantity),                          styles: { halign: 'right' } },
      { content: fmtAmount(l.unitPrice, invoice.currency),    styles: { halign: 'right' } },
      { content: fmtAmount(l.quantity * l.unitPrice, invoice.currency), styles: { halign: 'right' } },
    ]),
    headStyles: {
      fillColor:  GOLD,
      textColor:  DARK,
      fontStyle:  'bold',
      fontSize:   8,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    bodyStyles: {
      fillColor:  [15, 22, 40] as [number,number,number],
      textColor:  LIGHT,
      fontSize:   8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: [22, 30, 55] as [number,number,number],
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 18 },
      2: { cellWidth: 32 },
      3: { cellWidth: 35, fontStyle: 'bold' },
    },
    tableLineColor: LINE,
    tableLineWidth: 0.2,
    theme: 'grid',
  })

  // ── Totaux ───────────────────────────────────────────────────────────────────
  const afterTableY: number = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  const totaux: Array<{ label: string; value: string; highlight?: boolean; red?: boolean; green?: boolean }> = [
    { label: 'Montant HT',  value: fmtAmount(ht, invoice.currency) },
  ]
  if (invoice.tvaRate > 0)     totaux.push({ label: `TVA (${invoice.tvaRate} %)`, value: fmtAmount(tva, invoice.currency) })
  totaux.push({ label: 'Montant TTC', value: fmtAmount(ttc, invoice.currency), highlight: true })
  if (invoice.retenueRate > 0) totaux.push({ label: `Retenue à la source (${invoice.retenueRate} %)`, value: `– ${fmtAmount(retenue, invoice.currency)}`, red: true })
  if (invoice.timbreFiscal > 0) totaux.push({ label: 'Timbre fiscal', value: `+ ${fmtAmount(timbre, invoice.currency)}`, green: true })

  const rowH  = 6.5
  const totW  = 90
  const totX  = W - 14 - totW

  totaux.forEach((row, i) => {
    const rowY = afterTableY + i * rowH
    const isBold = row.highlight

    // Fond de ligne TTC
    if (isBold) {
      doc.setFillColor(...LINE)
      doc.rect(totX, rowY - 4.5, totW, rowH, 'F')
    }

    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.setFontSize(isBold ? 8.5 : 7.5)
    const color: [number,number,number] = row.red ? [220, 80, 80] : row.green ? [80, 200, 120] : isBold ? LIGHT : GREY
    doc.setTextColor(...color)
    doc.text(row.label, totX + 3,      rowY)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal')
    doc.text(row.value, totX + totW - 3, rowY, { align: 'right' })
  })

  // Ligne Net à payer
  const netY = afterTableY + totaux.length * rowH + 3
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  doc.line(totX, netY - 2, totX + totW, netY - 2)

  doc.setFillColor(...GOLD)
  doc.rect(totX, netY, totW, 9, 'F')
  doc.setFont('times', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text('Net à payer',          totX + 4,         netY + 6)
  doc.text(fmtAmount(net, invoice.currency), totX + totW - 3, netY + 6, { align: 'right' })

  // ── Notes ────────────────────────────────────────────────────────────────────
  let currentY = netY + 20

  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text('NOTES', 14, currentY)
    currentY += 4

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GREY)
    const noteLines = doc.splitTextToSize(invoice.notes, W - 28)
    doc.text(noteLines, 14, currentY)
    currentY += noteLines.length * 4 + 6
  }

  // ── Pied de page ─────────────────────────────────────────────────────────────
  const footerY = 282
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  doc.line(14, footerY - 4, W - 14, footerY - 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...GREY)
  doc.text(
    `${CABINET.nom} · ${CABINET.barreauTunis} · ${CABINET.adresse1}, ${CABINET.adresse2}`,
    W / 2, footerY,
    { align: 'center' }
  )
  doc.text(
    `Tél : ${CABINET.telephone} · ${CABINET.email} · MF : ${CABINET.matriculeFiscal}`,
    W / 2, footerY + 4.5,
    { align: 'center' }
  )

  // Numéro de page
  doc.setTextColor(...GOLD)
  doc.text(`Page 1 / 1`, W - 14, footerY + 4.5, { align: 'right' })

  // ── Bande dorée bottom ───────────────────────────────────────────────────────
  doc.setFillColor(...GOLD)
  doc.rect(0, 296, W, 1.2, 'F')

  // ── Sauvegarde ───────────────────────────────────────────────────────────────
  const filename = `Facture_${invoice.number.replace(/\//g, '-')}_Mokadmi.pdf`
  doc.save(filename)
}
