/**
 * invoicePdf.ts — Note d'honoraires Cabinet Mokadmi
 * Papier en-tête blanc professionnel : logo, adresse, MF cabinet
 * Formule fiscale tunisienne : HT × 13% TVA → TTC × 10% retenue
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Invoice, computeAmounts, fmtAmount } from '../components/BillingModule'

// ── Identité du cabinet ────────────────────────────────────────────────────────
const CABINET = {
  nom:             'Maître Mokadmi Sami',
  qualite:         'Avocat au Barreau de Tunis',
  specialite:      'Droit des Affaires — Fiscal — IA',
  adresse1:        'Bloc B, Espace Tunis Monplaisir',
  adresse2:        '1073 Montplaisir, Tunis — Tunisie',
  telephone:       '+216 29 784 651',
  email:           'office@mokadmi.lawyer',
  site:            'www.mokadmi.lawyer',
  matriculeFiscal: '1234567/A/M/000',  // ← Mettre à jour avec le vrai MF
  barreau:         'Barreau de Tunis — Fondé en 2003',
}

// ── Palette (fond blanc, accent doré) ─────────────────────────────────────────
const GOLD    = [180, 145,  80] as [number, number, number]  // doré sobre
const DARK    = [ 20,  25,  40] as [number, number, number]  // quasi-noir
const MID     = [ 80,  80,  80] as [number, number, number]  // gris moyen
const LIGHT   = [140, 140, 140] as [number, number, number]  // gris clair
const WHITE   = [255, 255, 255] as [number, number, number]
const CREAM   = [252, 251, 248] as [number, number, number]  // fond crème léger
const GOLDLT  = [245, 235, 210] as [number, number, number]  // doré très pâle

const STATUS_COLORS: Record<string, [number,number,number]> = {
  brouillon: [160, 155, 145],
  envoyee:   [ 60, 120, 210],
  payee:     [ 40, 160,  80],
  en_retard: [210,  60,  60],
}
const STATUS_LABELS: Record<string, string> = {
  brouillon: 'BROUILLON',
  envoyee:   'ENVOYEE',
  payee:     'PAYEE',
  en_retard: 'EN RETARD',
}

function fmtDate(s: string): string {
  return new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

async function loadBase64(src: string): Promise<string | null> {
  try {
    const res  = await fetch(src)
    const blob = await res.blob()
    return await new Promise<string>(resolve => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function downloadInvoicePdf(
  invoice: Invoice,
  userName: string,
  userCompany?: string,
  dossierName?: string,
): Promise<void> {
  const { ht, tva, ttc, retenue, timbre, net } = computeAmounts(invoice)

  const clientNom   = invoice.clientName    || userName
  const clientMF    = invoice.clientMF      || ''
  const clientAddr  = invoice.clientAddress || userCompany || ''
  const showMention = invoice.mentionRetenue !== false && invoice.retenueRate > 0

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()   // 210mm
  const H = doc.internal.pageSize.getHeight()  // 297mm

  // ── FOND BLANC ───────────────────────────────────────────────────────────────
  doc.setFillColor(...WHITE)
  doc.rect(0, 0, W, H, 'F')

  // ── BANDE EN-TÊTE DORÉE (haut) ───────────────────────────────────────────────
  doc.setFillColor(...GOLD)
  doc.rect(0, 0, W, 28, 'F')

  // ── LOGO ─────────────────────────────────────────────────────────────────────
  const logoBase64 = await loadBase64('/logo_processed.png')
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 8, 3, 22, 22)
  }

  // ── NOM CABINET (sur bande dorée) ────────────────────────────────────────────
  const txtX = logoBase64 ? 34 : 14
  doc.setFont('times', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...WHITE)
  doc.text(CABINET.nom, txtX, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 248, 230)  // blanc cassé sur doré
  doc.text(CABINET.qualite,    txtX, 17)
  doc.text(CABINET.specialite, txtX, 21.5)

  // ── COORDONNÉES CABINET (droite de la bande) ──────────────────────────────────
  doc.setFontSize(6.5)
  doc.setTextColor(255, 248, 230)
  const rX = W - 8
  doc.text(CABINET.adresse1,  rX, 8,    { align: 'right' })
  doc.text(CABINET.adresse2,  rX, 12.5, { align: 'right' })
  doc.text(CABINET.telephone, rX, 17,   { align: 'right' })
  doc.text(CABINET.email,     rX, 21.5, { align: 'right' })
  doc.text(CABINET.site,      rX, 26,   { align: 'right' })

  // ── BANDE MATRICULE FISCAL ────────────────────────────────────────────────────
  doc.setFillColor(...CREAM)
  doc.rect(0, 28, W, 8, 'F')
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.4)
  doc.line(0, 28, W, 28)
  doc.line(0, 36, W, 36)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...MID)
  doc.text(`Matricule fiscal : ${CABINET.matriculeFiscal}`, 14, 33.5)
  doc.text(CABINET.barreau, W - 14, 33.5, { align: 'right' })

  // ── TITRE NOTE D'HONORAIRES ───────────────────────────────────────────────────
  const titleY = 48
  doc.setFont('times', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...DARK)
  doc.text("NOTE D'HONORAIRES", 14, titleY)

  // Numéro facture
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(`N° ${invoice.number}`, 14, titleY + 7)

  // Badge statut (droite)
  const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status.toUpperCase()
  const badgeClr    = STATUS_COLORS[invoice.status] ?? GOLD
  const badgeW = 28, badgeH = 6
  doc.setFillColor(...badgeClr)
  doc.roundedRect(W - 14 - badgeW, titleY - 4.5, badgeW, badgeH, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...WHITE)
  doc.text(statusLabel, W - 14 - badgeW / 2, titleY, { align: 'center' })

  // Séparateur fin
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.25)
  doc.line(14, titleY + 10, W - 14, titleY + 10)

  // ── BLOC CLIENT & DATES ───────────────────────────────────────────────────────
  const infoY = titleY + 16

  // Cadre FACTURÉ À (gauche)
  doc.setFillColor(...CREAM)
  doc.rect(14, infoY - 4, 86, 32, 'F')
  doc.setDrawColor(...GOLDLT)
  doc.setLineWidth(0.3)
  doc.rect(14, infoY - 4, 86, 32)
  // Bordure gauche colorée
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.2)
  doc.line(14, infoY - 4, 14, infoY + 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...GOLD)
  doc.text('FACTURE À', 19, infoY + 1)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text(clientNom, 19, infoY + 7)

  let clientY = infoY + 12
  if (clientAddr) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MID)
    doc.text(clientAddr, 19, clientY)
    clientY += 4.5
  }
  if (clientMF) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...MID)
    doc.text(`Matricule fiscal : ${clientMF}`, 19, clientY)
    clientY += 4
  }
  if (dossierName) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    doc.setTextColor(...LIGHT)
    doc.text(`Réf. dossier : ${dossierName}`, 19, clientY)
  }

  // Cadre DATES (droite)
  const datesX = W - 100
  doc.setFillColor(...CREAM)
  doc.rect(datesX, infoY - 4, 86, 32, 'F')
  doc.setDrawColor(...GOLDLT)
  doc.setLineWidth(0.3)
  doc.rect(datesX, infoY - 4, 86, 32)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.2)
  doc.line(datesX, infoY - 4, datesX, infoY + 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(...GOLD)
  doc.text('INFORMATIONS', datesX + 5, infoY + 1)

  const infoRows = [
    { label: "Date d'émission",  value: fmtDate(invoice.dateEmission) },
    { label: "Date d'échéance",  value: fmtDate(invoice.dateEcheance) },
    { label: 'Devise',           value: 'Dinar Tunisien (DT)' },
  ]
  infoRows.forEach(({ label, value }, i) => {
    const rowY = infoY + 7 + i * 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...LIGHT)
    doc.text(label, datesX + 5, rowY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...DARK)
    doc.text(value, datesX + 81, rowY, { align: 'right' })
  })

  // ── TABLEAU PRESTATIONS ───────────────────────────────────────────────────────
  const tableY = infoY + 38

  autoTable(doc, {
    startY: tableY,
    margin: { left: 14, right: 14 },
    head: [[
      { content: 'Description de la prestation', styles: { halign: 'left' } },
      { content: 'Qté',                           styles: { halign: 'right' } },
      { content: 'PU HT (DT)',                    styles: { halign: 'right' } },
      { content: 'Total HT (DT)',                 styles: { halign: 'right' } },
    ]],
    body: invoice.lines.map(l => [
      l.description || '—',
      { content: String(l.quantity),                          styles: { halign: 'right' } },
      { content: fmtAmount(l.unitPrice, invoice.currency),    styles: { halign: 'right' } },
      { content: fmtAmount(l.quantity * l.unitPrice, invoice.currency), styles: { halign: 'right', fontStyle: 'bold' } },
    ]),
    headStyles: {
      fillColor:   GOLD,
      textColor:   WHITE,
      fontStyle:   'bold',
      fontSize:    8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 5, right: 5 },
    },
    bodyStyles: {
      fillColor:   WHITE,
      textColor:   DARK,
      fontSize:    8.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
    },
    alternateRowStyles: {
      fillColor: CREAM,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 16 },
      2: { cellWidth: 34 },
      3: { cellWidth: 38, fontStyle: 'bold' },
    },
    tableLineColor: GOLDLT,
    tableLineWidth: 0.2,
    theme: 'grid',
  })

  // ── TOTAUX ────────────────────────────────────────────────────────────────────
  // @ts-ignore
  const afterTable: number = doc.lastAutoTable.finalY + 8

  const fmt3 = (n: number) => fmtAmount(n, invoice.currency)
  const totW = 88
  const totX = W - 14 - totW

  const rows: Array<{ label: string; value: string; highlight?: boolean; red?: boolean }> = [
    { label: 'Montant HT',                                  value: `${fmt3(ht)} DT` },
    { label: `TVA ${invoice.tvaRate} %`,                    value: `${fmt3(tva)} DT` },
    { label: 'Montant TTC',                                 value: `${fmt3(ttc)} DT`, highlight: true },
    ...(invoice.retenueRate > 0
      ? [{ label: `Retenue à la source ${invoice.retenueRate} %`, value: `− ${fmt3(retenue)} DT`, red: true }]
      : []),
    ...(invoice.timbreFiscal > 0
      ? [{ label: 'Timbre fiscal', value: `+ ${fmt3(timbre)} DT` }]
      : []),
  ]

  // Fond crème pour la zone totaux
  doc.setFillColor(...CREAM)
  doc.rect(totX - 2, afterTable - 3, totW + 4, rows.length * 8 + 18, 'F')
  doc.setDrawColor(...GOLDLT)
  doc.setLineWidth(0.2)
  doc.rect(totX - 2, afterTable - 3, totW + 4, rows.length * 8 + 18)

  rows.forEach((row, i) => {
    const rY = afterTable + i * 8

    if (row.highlight) {
      doc.setFillColor(...GOLDLT)
      doc.rect(totX - 2, rY - 4, totW + 4, 8, 'F')
    }

    doc.setFont('helvetica', row.highlight ? 'bold' : 'normal')
    doc.setFontSize(row.highlight ? 8.5 : 7.5)
    const clr: [number,number,number] = row.red ? [180, 40, 40] : row.highlight ? DARK : MID
    doc.setTextColor(...clr)
    doc.text(row.label, totX, rY)
    doc.setFont('helvetica', row.highlight ? 'bold' : 'normal')
    doc.text(row.value, totX + totW, rY, { align: 'right' })
  })

  // Net à payer — encadré doré
  const netY = afterTable + rows.length * 8 + 2
  doc.setFillColor(...GOLD)
  doc.rect(totX - 2, netY - 2, totW + 4, 10, 'F')
  doc.setFont('times', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...WHITE)
  doc.text('Net à payer', totX + 2, netY + 5)
  doc.text(`${fmt3(net)} DT`, totX + totW, netY + 5, { align: 'right' })

  // ── MENTION RETENUE (sur fond crème avec bordure gauche rouge) ────────────────
  let nextY = netY + 18

  if (showMention) {
    doc.setFillColor(255, 245, 245)
    doc.rect(14, nextY - 3, W - 28, 13, 'F')
    doc.setDrawColor(180, 40, 40)
    doc.setLineWidth(1.5)
    doc.line(14, nextY - 3, 14, nextY + 10)
    doc.setLineWidth(0.2)
    doc.setDrawColor(220, 190, 190)
    doc.rect(14, nextY - 3, W - 28, 13)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(180, 40, 40)
    doc.text('Mention légale :', 18, nextY + 2)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(6.5)
    doc.setTextColor(...MID)
    const mentionTxt = `Prière nous délivrer une attestation de retenue à la source comportant le montant de la retenue opérée (${fmt3(retenue)} DT).`
    const mentionLines = doc.splitTextToSize(mentionTxt, W - 75)
    doc.text(mentionLines, 18 + 22, nextY + 2)

    nextY += 19
  }

  // ── NOTES ────────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    doc.setFillColor(...CREAM)
    doc.rect(14, nextY - 2, W - 28, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...GOLD)
    doc.text('Notes :', 18, nextY + 3)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...MID)
    const noteLines = doc.splitTextToSize(invoice.notes, W - 46)
    doc.text(noteLines, 35, nextY + 3)
    nextY += 18
  }

  // ── PIED DE PAGE ─────────────────────────────────────────────────────────────
  const footY = 280
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.line(14, footY, W - 14, footY)

  doc.setFillColor(...CREAM)
  doc.rect(0, footY, W, 17, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(...MID)
  doc.text(
    `${CABINET.nom} · ${CABINET.barreau}`,
    W / 2, footY + 5, { align: 'center' }
  )
  doc.text(
    `${CABINET.adresse1}, ${CABINET.adresse2} · Tél : ${CABINET.telephone}`,
    W / 2, footY + 9.5, { align: 'center' }
  )
  doc.setTextColor(...GOLD)
  doc.text(
    `${CABINET.email} · ${CABINET.site} · MF : ${CABINET.matriculeFiscal}`,
    W / 2, footY + 14, { align: 'center' }
  )

  // Numéro page
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...LIGHT)
  doc.text('1 / 1', W - 14, footY + 9, { align: 'right' })

  // ── ENREGISTREMENT ────────────────────────────────────────────────────────────
  const filename = `NH_${invoice.number.replace(/[\/\s]/g, '-')}_${clientNom.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
