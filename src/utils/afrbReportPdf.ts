/**
 * afrbReportPdf.ts — Génère un rapport PDF complet d'une analyse AFRB
 */
import jsPDF from 'jspdf'
import type { AFRBAnalysis } from '../components/AFRBTool'

const NAVY    = [ 10,  25,  47] as [number, number, number]
const NAVYMD  = [ 30,  60, 110] as [number, number, number]
const NAVYLT  = [215, 225, 245] as [number, number, number]
const WHITE   = [255, 255, 255] as [number, number, number]
const DARK    = [ 20,  25,  40] as [number, number, number]
const MID     = [ 90,  90,  90] as [number, number, number]
const CREAM   = [242, 245, 251] as [number, number, number]

const RISK_COLORS: Record<string, [number, number, number]> = {
  'Faible':   [ 16, 185, 129],
  'Modéré':  [245, 158,  11],
  'Élevé':   [249, 115,  22],
  'Critique': [239,  68,  68],
}

function riskColor(level: string): [number, number, number] {
  return Object.entries(RISK_COLORS).find(([k]) => level?.includes(k))?.[1] ?? RISK_COLORS['Modéré']
}

function addTextWrapped(
  doc: jsPDF, text: string,
  x: number, y: number, maxW: number, lineH: number,
  pageH: number, marginB = 20
): number {
  const lines = doc.splitTextToSize(text, maxW) as string[]
  for (const line of lines) {
    if (y + lineH > pageH - marginB) { doc.addPage(); y = 30 }
    doc.text(line, x, y)
    y += lineH
  }
  return y
}

async function loadLogo(): Promise<string | null> {
  try {
    const res  = await fetch('/logo_processed.png')
    const blob = await res.blob()
    return await new Promise(resolve => {
      const r = new FileReader()
      r.onloadend = () => resolve(r.result as string)
      r.readAsDataURL(blob)
    })
  } catch { return null }
}

export async function downloadAFRBReport(analysis: AFRBAnalysis): Promise<void> {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const H    = doc.internal.pageSize.getHeight()

  // ── En-tête navy ────────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 42, 'F')

  const logo = await loadLogo()
  const txtX = logo ? 30 : 14
  if (logo) doc.addImage(logo, 'PNG', 6, 3, 20, 20)

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(...WHITE)
  doc.text('Maître Mokadmi Sami'.toUpperCase(), txtX, 13)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...NAVYLT)
  doc.text('Avocat au Barreau de Tunis', txtX, 20)
  doc.text('Droit des Affaires — Fiscal — IA', txtX, 26)

  const rx = W - 14
  doc.setFontSize(7); doc.setTextColor(...NAVYLT)
  doc.text('www.mokadmi.lawyer', rx, 11, { align: 'right' })
  doc.text('office@mokadmi.lawyer',  rx, 17, { align: 'right' })
  doc.setFont('helvetica', 'bold')
  doc.text('MF : 000/P/A/834881/F', rx, 39, { align: 'right' })

  // ── Titre rapport ────────────────────────────────────────────────────────────
  let y = 54

  // Badge AFRB
  doc.setFillColor(...NAVYLT)
  doc.roundedRect(14, y - 5, 38, 9, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...NAVY)
  doc.text('ANALYSE AFRB', 14 + 19, y + 1, { align: 'center' })

  // Niveau de risque global
  const level = analysis.result?.risk_matrix.overall_risk_level ?? '—'
  const rc    = riskColor(level)
  doc.setFillColor(...rc)
  doc.roundedRect(58, y - 5, 50, 9, 1.5, 1.5, 'F')
  doc.setTextColor(...WHITE)
  doc.text(`RISQUE : ${level.toUpperCase()}`, 58 + 25, y + 1, { align: 'center' })

  // Référence et date
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MID)
  doc.text(new Date(analysis.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), W - 14, y + 1, { align: 'right' })

  y += 14
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...NAVY)
  doc.text('Rapport d\'Analyse — Classification des Risques Juridiques', W / 2, y, { align: 'center' })
  y += 6

  // Filet
  doc.setDrawColor(...NAVYMD); doc.setLineWidth(0.8)
  doc.line(W / 2 - 40, y, W / 2 + 40, y)
  y += 8

  // Destinataire / Scénario résumé
  doc.setFillColor(...CREAM)
  doc.rect(14, y, W - 28, 20, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVYMD)
  doc.text('CLIENT', 20, y + 6); doc.text('DATE D\'ANALYSE', W / 2, y + 6)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK)
  doc.text(analysis.clientName, 20, y + 14)
  doc.text(new Date(analysis.createdAt).toLocaleDateString('fr-FR'), W / 2, y + 14)
  y += 28

  const Section = (title: string): number => {
    if (y + 14 > H - 20) { doc.addPage(); y = 25 }
    doc.setFillColor(...CREAM)
    doc.rect(14, y - 4, W - 28, 11, 'F')
    doc.setDrawColor(...NAVYMD); doc.setLineWidth(2)
    doc.line(14, y - 4, 14, y + 7)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...NAVY)
    doc.text(title.toUpperCase(), 20, y + 4)
    y += 14
    return y
  }

  const Body = (text: string): number => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK)
    y = addTextWrapped(doc, text || '—', 18, y, W - 36, 5.5, H)
    y += 6
    return y
  }

  const SubLabel = (label: string): void => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVYMD)
    doc.text(label, 18, y); y += 6
  }

  // ── 1. Contexte ────────────────────────────────────────────────────────────
  Section('I. Contexte & Observations')
  SubLabel('Résumé du contexte')
  Body(analysis.result?.case_context_summary ?? '')
  SubLabel('Faits & clauses identifiées')
  Body(analysis.result?.observations ?? '')
  SubLabel('Inférences juridiques')
  Body(analysis.result?.inferences ?? '')
  SubLabel('Scénarios de crise')
  Body(analysis.result?.hypotheses ?? '')

  // ── 2. Matrice de risques ──────────────────────────────────────────────────
  Section('II. Matrice de Risques')
  const matrixItems = [
    ['Risque global', level],
    ['Conformité', analysis.result?.risk_matrix.compliance_risk_level ?? ''],
    ['Exposition juridique', analysis.result?.risk_matrix.legal_exposure_level ?? ''],
    ['Impact opérationnel', analysis.result?.risk_matrix.operational_risk_level ?? ''],
  ]
  for (const [label, val] of matrixItems) {
    const rc2 = riskColor(val)
    doc.setFillColor(...rc2)
    doc.roundedRect(18, y - 3, 4, 4, 0.5, 0.5, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK)
    doc.text(label, 26, y + 1)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MID)
    y = addTextWrapped(doc, val, 26, y + 6, W - 44, 5, H)
    y += 3
  }

  // ── 3. Classification AFRB ─────────────────────────────────────────────────
  Section('III. Classification AFRB')
  SubLabel(`Domaine : ${analysis.result?.afrb_classification.field ?? ''}`)
  Body(analysis.result?.afrb_classification.strategy ?? '')
  SubLabel('Clauses à risque')
  const flags = (analysis.result?.afrb_classification.risk_flags ?? '').split(/[·•\-\n]/).filter(f => f.trim())
  for (const flag of flags) {
    if (y + 6 > H - 20) { doc.addPage(); y = 25 }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(220, 60, 60)
    doc.text(`▸ ${flag.trim()}`, 20, y); y += 6
  }
  y += 4

  // ── 4. Plan d'action ──────────────────────────────────────────────────────
  Section('IV. Plan d\'Action Recommandé')
  SubLabel('Priorités immédiates avant signature')
  Body(analysis.result?.recommended_actions.immediate_next_steps ?? '')
  SubLabel('Checklist documentaire')
  Body(analysis.result?.recommended_actions.documentation_checklist ?? '')

  if (y + 18 > H - 20) { doc.addPage(); y = 25 }
  doc.setFillColor(254, 242, 242)
  doc.rect(18, y - 2, W - 36, 4, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(180, 30, 30)
  doc.text('DEAL-BREAKERS :', 20, y + 2); y += 10
  Body(analysis.result?.recommended_actions.escalation_thresholds ?? '')

  // ── Pied de page toutes les pages ─────────────────────────────────────────
  const totalPages = (doc.internal as { pages: unknown[] }).pages.length - 1
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFillColor(...NAVY)
    doc.rect(0, H - 8, W, 8, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...NAVYLT)
    doc.text(
      `Maître Mokadmi Sami · Avocat au Barreau de Tunis · MF : 000/P/A/834881/F · www.mokadmi.lawyer`,
      W / 2, H - 3.5, { align: 'center' }
    )
    doc.setFont('helvetica', 'bold')
    doc.text(`${p} / ${totalPages}`, W - 14, H - 3.5, { align: 'right' })
  }

  const fn = `AFRB_${analysis.clientName.replace(/\s+/g, '_')}_${new Date(analysis.createdAt).toISOString().slice(0, 10)}.pdf`
  doc.save(fn)
}

export async function generateAFRBBase64(analysis: AFRBAnalysis): Promise<string> {
  // Même logique mais retourne base64 pour envoi email
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  doc.setFillColor(...NAVY); doc.rect(0, 0, W, 30, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...WHITE)
  doc.text('RAPPORT ANALYSE AFRB — Cabinet Mokadmi', W / 2, 12, { align: 'center' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...NAVYLT)
  doc.text(`Client : ${analysis.clientName}`, W / 2, 20, { align: 'center' })
  doc.text(`Date : ${new Date(analysis.createdAt).toLocaleDateString('fr-FR')}`, W / 2, 26, { align: 'center' })

  let y = 40
  const addLine = (label: string, val: string) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...NAVYMD)
    doc.text(label, 14, y); y += 6
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...DARK)
    const lines = doc.splitTextToSize(val || '—', W - 30) as string[]
    lines.forEach(l => { doc.text(l, 18, y); y += 5.5 })
    y += 4
  }

  addLine('Niveau de risque global :', analysis.result?.risk_matrix.overall_risk_level ?? '—')
  addLine('Contexte :', analysis.result?.case_context_summary ?? '')
  addLine('Classification AFRB :', analysis.result?.afrb_classification.field ?? '')
  addLine('Stratégie :', analysis.result?.afrb_classification.strategy ?? '')
  addLine('Deal-breakers :', analysis.result?.recommended_actions.escalation_thresholds ?? '')

  return doc.output('datauristring').split(',')[1]
}
