import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCORS, checkRateLimit, isValidEmail, sanitize, requireEmailConfig } from './_security'
import * as nodemailer from 'nodemailer'

const GMAIL_USER = process.env.GMAIL_USER ?? ''
const GMAIL_PASS = process.env.GMAIL_PASSWORD ?? ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCORS(req, res)) return
  if (checkRateLimit(req, res, 20)) return
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rawEmail = req.body?.clientEmail
    const pdfBase64 = req.body?.pdfBase64
    if (!rawEmail || !pdfBase64) return res.status(400).json({ error: 'Données manquantes' })
    if (!isValidEmail(rawEmail)) return res.status(400).json({ error: 'Email invalide' })
    const clientEmail = (rawEmail as string).toLowerCase().trim()
    const clientName  = sanitize(req.body?.clientName ?? 'Client', 100)
    const riskLevel   = sanitize(req.body?.riskLevel ?? '—', 50)

    const mailConfig = requireEmailConfig(res)
    if (!mailConfig) return
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: mailConfig.user, pass: mailConfig.pass },
    })

    const level = (riskLevel ?? '').toUpperCase()
    const levelColor = level.includes('CRITIQUE') ? '#ef4444'
      : level.includes('ÉLEVÉ') ? '#f97316'
      : level.includes('MODÉRÉ') ? '#f59e0b'
      : '#10b981'

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" style="max-width:600px;width:100%;">
  <tr><td style="background:#0A192F;height:4px;"></td></tr>
  <tr><td style="background:#0A192F;padding:24px 36px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#fff;font-weight:bold;">
      Maître Mokadmi Sami
    </p>
    <p style="margin:4px 0 0;font-size:10px;color:#94b8e0;letter-spacing:2px;text-transform:uppercase;">
      Avocat au Barreau de Tunis · MF : 000/P/A/834881/F
    </p>
  </td></tr>
  <tr><td style="background:#fff;padding:32px 36px;">
    <p style="font-size:15px;color:#0A192F;font-family:Georgia,serif;margin:0 0 8px;">Bonjour ${clientName},</p>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 24px;">
      Veuillez trouver ci-joint le <strong>rapport d'analyse AFRB</strong> établi par le cabinet Mokadmi concernant votre dossier.
    </p>
    <div style="background:#f2f5fb;border-left:3px solid #0A192F;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:10px;color:#4a7ab5;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">
        Niveau de risque global
      </p>
      <p style="margin:0;font-size:20px;font-weight:bold;color:${levelColor};">${riskLevel ?? '—'}</p>
    </div>
    <p style="font-size:12px;color:#888;line-height:1.7;margin:0 0 8px;">
      Ce rapport est strictement confidentiel et établi à votre attention exclusive.
      Pour toute question : <a href="mailto:office@mokadmi.lawyer" style="color:#1e3c6e;">office@mokadmi.lawyer</a>
    </p>
  </td></tr>
  <tr><td style="background:#0A192F;padding:16px 36px;">
    <p style="font-size:10px;color:#5a8ab8;text-align:center;margin:0;">
      Maître Mokadmi Sami · Barreau de Tunis ·
      <a href="https://www.mokadmi.lawyer" style="color:#94b8e0;text-decoration:none;">www.mokadmi.lawyer</a>
    </p>
  </td></tr>
  <tr><td style="background:#1e3c6e;height:2px;"></td></tr>
</table>
</td></tr>
</table>
</body></html>`

    const date = new Date().toISOString().slice(0, 10)
    const fn   = `AFRB_${(clientName as string).replace(/\s+/g, '_')}_${date}.pdf`

    // Envoi au client
    await transporter.sendMail({
      from:    `"Cabinet Mokadmi" <${mailConfig.user}>`,
      to:      clientEmail,
      subject: `Rapport d'analyse AFRB — ${riskLevel} — Cabinet Mokadmi`,
      html,
      attachments: [{ filename: fn, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }],
    })

    // Copie au cabinet
    await transporter.sendMail({
      from:    `"Système Cabinet" <${mailConfig.user}>`,
      to:      'office@mokadmi.lawyer',
      subject: `[Copie] AFRB envoyé → ${clientName} (${clientEmail}) · ${riskLevel}`,
      text:    `Rapport AFRB envoyé à ${clientName} <${clientEmail}>.\nNiveau : ${riskLevel}\nDate : ${date}`,
      attachments: [{ filename: fn, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }],
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Erreur envoi' })
  }
}
