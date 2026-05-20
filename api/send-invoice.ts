/**
 * api/send-invoice.ts — Envoi de la note d'honoraires par email
 * Reçoit le PDF encodé en base64 + les métadonnées de la facture
 * Envoie via Gmail SMTP (Nodemailer) :
 *   - Email au client avec le PDF en pièce jointe
 *   - Copie de notification au cabinet
 *
 * Variables Vercel requises :
 *   GMAIL_USER     = sami.mokadmi@gmail.com
 *   GMAIL_PASSWORD = mot de passe d'application Google (16 chars)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as nodemailer from 'nodemailer'

const CABINET = {
  nom:             'Maître Mokadmi Sami',
  qualite:         'Avocat au Barreau de Tunis',
  email:           'office@mokadmi.lawyer',
  tel:             '+216 29 784 651',
  site:            'www.mokadmi.lawyer',
  adresse:         'Bloc B, Espace Tunis Monplaisir, 1073 Montplaisir, Tunis — Tunisie',
  matriculeFiscal: '000/P/A/834881/F',
  barreau:         'Barreau de Tunis — Fondé en 2003',
}

const GMAIL_USER = process.env.GMAIL_USER     ?? ''
const GMAIL_PASS = process.env.GMAIL_PASSWORD  ?? ''

// ── Template email client ─────────────────────────────────────────────────────
function buildClientHtml(
  clientName: string,
  invoiceNumber: string,
  netAmount: string,
  dateEcheance: string,
): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" style="max-width:600px;width:100%;">

  <!-- Bande supérieure navy -->
  <tr><td style="background:#0A192F;height:4px;"></td></tr>

  <!-- En-tête cabinet -->
  <tr><td style="background:#0A192F;padding:28px 40px 24px;">
    <table width="100%"><tr>
      <td>
        <p style="margin:0 0 2px;font-family:Georgia,serif;font-size:18px;color:#ffffff;font-weight:bold;letter-spacing:0.5px;">${CABINET.nom}</p>
        <p style="margin:0 0 6px;font-size:10px;color:#94b8e0;letter-spacing:2.5px;text-transform:uppercase;">${CABINET.qualite}</p>
        <p style="margin:0;font-size:10px;color:#5a8ab8;letter-spacing:1px;">MF : ${CABINET.matriculeFiscal}</p>
      </td>
    </tr></table>
  </td></tr>

  <!-- Corps -->
  <tr><td style="background:#ffffff;padding:36px 40px;">
    <p style="font-size:15px;color:#0A192F;font-family:Georgia,serif;margin:0 0 8px;">Bonjour ${clientName},</p>
    <p style="font-size:14px;color:#555;margin:0 0 24px;line-height:1.7;">
      Veuillez trouver ci-joint votre <strong>note d'honoraires N° ${invoiceNumber}</strong> en format PDF.
    </p>

    <!-- Récapitulatif -->
    <div style="background:#f2f5fb;border-left:3px solid #0A192F;padding:16px 20px;margin:0 0 28px;">
      <p style="margin:0 0 10px;font-size:10px;color:#5a8ab8;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Récapitulatif</p>
      <table style="width:100%;font-size:14px;">
        <tr>
          <td style="color:#666;padding:5px 0;border-bottom:1px solid #dfe6f5;">Numéro</td>
          <td style="color:#0A192F;font-weight:bold;text-align:right;border-bottom:1px solid #dfe6f5;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color:#666;padding:5px 0;border-bottom:1px solid #dfe6f5;">Net à payer</td>
          <td style="color:#0A192F;font-weight:bold;text-align:right;border-bottom:1px solid #dfe6f5;">${netAmount}</td>
        </tr>
        <tr>
          <td style="color:#666;padding:5px 0;">Échéance</td>
          <td style="color:#0A192F;font-weight:bold;text-align:right;">${dateEcheance}</td>
        </tr>
      </table>
    </div>

    <p style="font-size:13px;color:#666;margin:0 0 6px;line-height:1.7;">
      Pour toute question relative à cette note d'honoraires :
    </p>
    <p style="font-size:13px;margin:0 0 4px;">
      <a href="mailto:${CABINET.email}" style="color:#1e3c6e;text-decoration:none;font-weight:bold;">${CABINET.email}</a>
      &nbsp;·&nbsp;
      <a href="tel:${CABINET.tel.replace(/\s/g,'')}" style="color:#1e3c6e;text-decoration:none;">${CABINET.tel}</a>
    </p>
    <p style="font-size:12px;color:#999;margin:16px 0 0;">${CABINET.adresse}</p>
  </td></tr>

  <!-- Pied de page -->
  <tr><td style="background:#0A192F;padding:18px 40px;">
    <p style="font-size:11px;color:#5a8ab8;text-align:center;margin:0;line-height:1.8;">
      ${CABINET.nom} · ${CABINET.qualite}<br/>
      MF : <strong style="color:#94b8e0;">${CABINET.matriculeFiscal}</strong>
      &nbsp;·&nbsp;
      <a href="https://${CABINET.site}" style="color:#94b8e0;text-decoration:none;">${CABINET.site}</a>
    </p>
  </td></tr>

  <!-- Bande inférieure -->
  <tr><td style="background:#1e3c6e;height:2px;"></td></tr>

</table>
</td></tr>
</table>
</body></html>`
}

// ── Handler ────────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Méthode non autorisée' })

  const {
    pdfBase64,
    filename,
    clientEmail,
    clientName,
    invoiceNumber,
    netAmount,
    dateEcheance,
  } = req.body ?? {}

  if (!pdfBase64 || !clientEmail || !invoiceNumber) {
    return res.status(400).json({ error: 'Données manquantes (pdfBase64, clientEmail, invoiceNumber).' })
  }

  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({
      error: 'Configuration email manquante. Configurez GMAIL_USER et GMAIL_PASSWORD dans Vercel.',
    })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  })

  const pdfBuffer = Buffer.from(pdfBase64, 'base64')
  const dateEch   = dateEcheance
    ? new Date(dateEcheance + 'T12:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''

  try {
    // 1. Email au client avec PDF en pièce jointe
    await transporter.sendMail({
      from:    `"${CABINET.nom}" <${GMAIL_USER}>`,
      to:      clientEmail,
      replyTo: CABINET.email,
      subject: `Note d'honoraires N° ${invoiceNumber} — Cabinet Mokadmi`,
      html:    buildClientHtml(clientName ?? 'Client', invoiceNumber, netAmount ?? '', dateEch),
      attachments: [{
        filename:    filename ?? `NH_${invoiceNumber}.pdf`,
        content:     pdfBuffer,
        contentType: 'application/pdf',
      }],
    })

    // 2. Copie au cabinet
    await transporter.sendMail({
      from:    `"Système Cabinet" <${GMAIL_USER}>`,
      to:      CABINET.email,
      replyTo: clientEmail,
      subject: `[Copie envoi] NH ${invoiceNumber} → ${clientName} (${clientEmail})`,
      text:    `La note d'honoraires ${invoiceNumber} a été envoyée à ${clientName} (${clientEmail}).\n\nNet à payer : ${netAmount}\nÉchéance : ${dateEch}\n\n---\n${CABINET.nom} · MF : ${CABINET.matriculeFiscal}\n${CABINET.adresse}`,
      attachments: [{
        filename:    filename ?? `NH_${invoiceNumber}.pdf`,
        content:     pdfBuffer,
        contentType: 'application/pdf',
      }],
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('[send-invoice]', err)
    return res.status(500).json({ error: 'Échec de l\'envoi email. Vérifiez la configuration SMTP.' })
  }
}
