import type { VercelRequest, VercelResponse } from '@vercel/node'
import { setCORS, checkRateLimit, isValidEmail, sanitize, requireEmailConfig } from './_security'
import * as nodemailer from 'nodemailer'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCORS(req, res)) return
  if (checkRateLimit(req, res, 20)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const rawName  = req.body?.name
    const rawEmail = req.body?.email
    const confirmToken = req.body?.confirmToken

    if (!rawName || !rawEmail) return res.status(400).json({ error: 'Données manquantes' })
    if (!isValidEmail(rawEmail)) return res.status(400).json({ error: 'Email invalide' })

    const name  = sanitize(rawName, 100)
    const email = (rawEmail as string).toLowerCase().trim()

    const mailConfig = requireEmailConfig(res)
    if (!mailConfig) return

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: mailConfig.user, pass: mailConfig.pass },
    })

    const confirmUrl = `https://www.mokadmi.lawyer/confirm?token=${confirmToken}&email=${encodeURIComponent(email)}`

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#eef1f7;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:40px 16px;">
<tr><td align="center">
<table width="580" style="max-width:580px;width:100%;">

  <!-- Top border -->
  <tr><td style="background:#1e3c6e;height:3px;border-radius:3px 3px 0 0;"></td></tr>

  <!-- Header -->
  <tr><td style="background:#0A192F;padding:28px 40px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <p style="margin:0;font-family:Georgia,serif;font-size:17px;color:#ffffff;font-weight:bold;letter-spacing:0.5px;">
            Maître Mokadmi Sami
          </p>
          <p style="margin:4px 0 0;font-size:10px;color:#94b8e0;letter-spacing:2px;text-transform:uppercase;">
            Avocat au Barreau de Tunis
          </p>
        </td>
        <td align="right">
          <p style="margin:0;font-size:10px;color:#4a7ab5;">www.mokadmi.lawyer</p>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:40px 40px 32px;">
    <p style="font-size:22px;color:#0A192F;font-family:Georgia,serif;margin:0 0 8px;font-weight:normal;">
      Bienvenue, ${name}.
    </p>
    <p style="font-size:13px;color:#888;margin:0 0 28px;letter-spacing:0.5px;text-transform:uppercase;">
      Votre espace client Cabinet Mokadmi
    </p>

    <p style="font-size:14px;color:#444;line-height:1.8;margin:0 0 24px;">
      Votre compte a été créé avec succès. Pour activer votre accès sécurisé et commencer
      à utiliser votre espace client, veuillez confirmer votre adresse email en cliquant
      sur le bouton ci-dessous.
    </p>

    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
      <tr>
        <td style="background:#0A192F;border-radius:0;">
          <a href="${confirmUrl}"
             style="display:inline-block;padding:16px 40px;font-size:13px;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
            Confirmer mon adresse email →
          </a>
        </td>
      </tr>
    </table>

    <!-- Services -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;background:#f2f5fb;padding:20px 24px;">
      <tr>
        <td>
          <p style="font-size:11px;color:#4a7ab5;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">
            Votre espace client vous permet de :
          </p>
          <p style="font-size:13px;color:#555;margin:0 0 6px;line-height:1.7;">
            ⚖ Suivre l'avancement de vos dossiers en temps réel
          </p>
          <p style="font-size:13px;color:#555;margin:0 0 6px;line-height:1.7;">
            📄 Déposer et consulter vos documents juridiques
          </p>
          <p style="font-size:13px;color:#555;margin:0 0 6px;line-height:1.7;">
            🛡 Utiliser Shield — Générateur de contrats freelance
          </p>
          <p style="font-size:13px;color:#555;margin:0;line-height:1.7;">
            🔍 Analyser vos pactes d'actionnaires avec le Moteur AFRB
          </p>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#aaa;line-height:1.7;margin:0;">
      Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message.
      Le lien expire dans <strong>48 heures</strong>.<br/>
      Pour toute question : <a href="mailto:office@mokadmi.lawyer" style="color:#1e3c6e;text-decoration:none;">office@mokadmi.lawyer</a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#0A192F;padding:18px 40px;">
    <p style="font-size:10px;color:#4a7ab5;text-align:center;margin:0;line-height:1.7;">
      Cabinet Mokadmi · Barreau de Tunis · MF : 000/P/A/834881/F<br/>
      Bloc B, Espace Tunis Monplaisir · 1073 Montplaisir, Tunis<br/>
      <a href="https://www.mokadmi.lawyer" style="color:#94b8e0;text-decoration:none;">www.mokadmi.lawyer</a>
    </p>
  </td></tr>

  <!-- Bottom border -->
  <tr><td style="background:#1e3c6e;height:2px;border-radius:0 0 3px 3px;"></td></tr>

</table>
</td></tr>
</table>
</body>
</html>`

    await transporter.sendMail({
      from:    `"Cabinet Mokadmi" <${mailConfig.user}>`,
      to:      email,
      subject: 'Bienvenue — Confirmez votre espace client · Cabinet Mokadmi',
      html,
    })

    // Notif admin
    await transporter.sendMail({
      from:    `"Système Cabinet" <${mailConfig.user}>`,
      to:      'office@mokadmi.lawyer',
      subject: `[Nouveau client] ${name} <${email}>`,
      text:    `Nouveau compte créé :\nNom : ${name}\nEmail : ${email}\nDate : ${new Date().toLocaleString('fr-FR')}`,
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    // Ne pas bloquer l'inscription si l'email échoue
    console.error('Welcome email error:', err)
    return res.status(200).json({ success: false, warning: 'Email non envoyé' })
  }
}
