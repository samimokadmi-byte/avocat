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
    const { name, email, confirmToken } = req.body ?? {}
    if (!name || !email) return res.status(400).json({ error: 'Données manquantes' })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    })

    const confirmUrl = `https://www.mokadmi.lawyer/confirm?token=${confirmToken ?? ''}&email=${encodeURIComponent(String(email))}`

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:40px 16px;">
<tr><td align="center">
<table width="580" style="max-width:580px;width:100%;">
  <tr><td style="background:#1e3c6e;height:3px;"></td></tr>
  <tr><td style="background:#0A192F;padding:28px 40px 24px;">
    <p style="margin:0;font-family:Georgia,serif;font-size:17px;color:#fff;font-weight:bold;">Maître Mokadmi Sami</p>
    <p style="margin:4px 0 0;font-size:10px;color:#94b8e0;letter-spacing:2px;text-transform:uppercase;">Avocat au Barreau de Tunis</p>
  </td></tr>
  <tr><td style="background:#fff;padding:40px 40px 32px;">
    <p style="font-size:22px;color:#0A192F;font-family:Georgia,serif;margin:0 0 8px;">Bienvenue, ${String(name)}.</p>
    <p style="font-size:13px;color:#888;margin:0 0 24px;text-transform:uppercase;letter-spacing:0.5px;">Votre espace client Cabinet Mokadmi</p>
    <p style="font-size:14px;color:#444;line-height:1.8;margin:0 0 28px;">
      Votre compte a été créé avec succès. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et activer votre accès sécurisé.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:#0A192F;">
        <a href="${confirmUrl}" style="display:inline-block;padding:16px 40px;font-size:13px;color:#fff;text-decoration:none;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
          Confirmer mon adresse email →
        </a>
      </td></tr>
    </table>
    <p style="font-size:12px;color:#aaa;line-height:1.7;margin:0;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message. Le lien expire dans 48 heures.<br/>
      <a href="mailto:office@mokadmi.lawyer" style="color:#1e3c6e;text-decoration:none;">office@mokadmi.lawyer</a>
    </p>
  </td></tr>
  <tr><td style="background:#0A192F;padding:16px 40px;">
    <p style="font-size:10px;color:#4a7ab5;text-align:center;margin:0;">
      Cabinet Mokadmi · Barreau de Tunis · MF : 000/P/A/834881/F ·
      <a href="https://www.mokadmi.lawyer" style="color:#94b8e0;text-decoration:none;">www.mokadmi.lawyer</a>
    </p>
  </td></tr>
  <tr><td style="background:#1e3c6e;height:2px;"></td></tr>
</table>
</td></tr>
</table>
</body></html>`

    await transporter.sendMail({
      from:    `"Cabinet Mokadmi" <${GMAIL_USER}>`,
      to:      String(email),
      subject: 'Bienvenue — Confirmez votre espace client · Cabinet Mokadmi',
      html,
    })

    // Copie admin (non bloquante)
    transporter.sendMail({
      from:    `"Système Cabinet" <${GMAIL_USER}>`,
      to:      'office@mokadmi.lawyer',
      subject: `[Nouveau client] ${String(name)} <${String(email)}>`,
      text:    `Nouveau compte:\nNom : ${String(name)}\nEmail : ${String(email)}\nDate : ${new Date().toLocaleString('fr-FR')}`,
    }).catch(() => {})

    return res.status(200).json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[send-welcome] Error:', msg)
    return res.status(500).json({ error: msg })
  }
}
