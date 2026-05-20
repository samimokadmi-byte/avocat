import type { VercelRequest, VercelResponse } from '@vercel/node'
import * as nodemailer from 'nodemailer'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const GMAIL_USER = process.env.GMAIL_USER ?? ''
  const GMAIL_PASS = process.env.GMAIL_PASSWORD ?? ''

  if (!GMAIL_USER || !GMAIL_PASS) {
    return res.status(500).json({ error: 'Variables GMAIL_USER ou GMAIL_PASSWORD manquantes dans Vercel.' })
  }

  try {
    const { clientEmail, clientName, riskLevel, pdfBase64 } = req.body ?? {}
    if (!clientEmail || !pdfBase64) return res.status(400).json({ error: 'Données manquantes' })

    const level = String(riskLevel ?? '—')
    const levelColor = level.includes('Critique') ? '#ef4444'
      : level.includes('levé') ? '#f97316'
      : level.includes('Mod') ? '#f59e0b'
      : '#10b981'

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    })

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:32px 16px;">
<tr><td align="center">
<table width="580" style="max-width:580px;width:100%;">
  <tr><td style="background:#1e3c6e;height:3px;"></td></tr>
  <tr><td style="background:#0A192F;padding:24px 36px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:16px;color:#fff;font-weight:bold;">Maître Mokadmi Sami</p>
    <p style="margin:4px 0 0;font-size:10px;color:#94b8e0;letter-spacing:2px;text-transform:uppercase;">Avocat au Barreau de Tunis · MF : 000/P/A/834881/F</p>
  </td></tr>
  <tr><td style="background:#fff;padding:32px 36px;">
    <p style="font-size:15px;color:#0A192F;font-family:Georgia,serif;margin:0 0 8px;">Bonjour ${String(clientName)},</p>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:0 0 24px;">Veuillez trouver ci-joint le rapport d'analyse AFRB établi par le cabinet Mokadmi concernant votre dossier.</p>
    <div style="background:#f2f5fb;border-left:3px solid #0A192F;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:10px;color:#4a7ab5;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Niveau de risque global</p>
      <p style="margin:0;font-size:20px;font-weight:bold;color:${levelColor};">${level}</p>
    </div>
    <p style="font-size:12px;color:#888;line-height:1.7;margin:0;">
      Ce rapport est strictement confidentiel.<br/>
      <a href="mailto:office@mokadmi.lawyer" style="color:#1e3c6e;">office@mokadmi.lawyer</a>
    </p>
  </td></tr>
  <tr><td style="background:#0A192F;padding:16px 36px;">
    <p style="font-size:10px;color:#5a8ab8;text-align:center;margin:0;">Cabinet Mokadmi · <a href="https://www.mokadmi.lawyer" style="color:#94b8e0;text-decoration:none;">www.mokadmi.lawyer</a></p>
  </td></tr>
  <tr><td style="background:#1e3c6e;height:2px;"></td></tr>
</table>
</td></tr>
</table>
</body></html>`

    const date = new Date().toISOString().slice(0, 10)
    const fn   = `AFRB_${String(clientName).replace(/\s+/g, '_')}_${date}.pdf`

    await transporter.sendMail({
      from:    `"Cabinet Mokadmi" <${GMAIL_USER}>`,
      to:      String(clientEmail),
      subject: `Rapport d'analyse AFRB — ${level} — Cabinet Mokadmi`,
      html,
      attachments: [{ filename: fn, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }],
    })

    // Copie cabinet
    transporter.sendMail({
      from:    `"Système Cabinet" <${GMAIL_USER}>`,
      to:      'office@mokadmi.lawyer',
      subject: `[Copie] AFRB → ${String(clientName)} · ${level}`,
      text:    `Rapport envoyé à ${String(clientName)} <${String(clientEmail)}>\nNiveau : ${level}`,
      attachments: [{ filename: fn, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }],
    }).catch(() => {})

    return res.status(200).json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-afrb] Error:', msg)
    return res.status(500).json({ error: msg })
  }
}
