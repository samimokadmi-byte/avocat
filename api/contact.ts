/**
 * api/contact.ts — Envoi email via Gmail SMTP (Nodemailer)
 * Variables Vercel requises :
 *   GMAIL_USER     = sami.mokadmi@gmail.com
 *   GMAIL_PASSWORD = mot de passe d'application Gmail (16 caractères)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

const CABINET_EMAIL = 'office@mokadmi.lawyer'
const GMAIL_USER    = process.env.GMAIL_USER     ?? ''
const GMAIL_PASS    = process.env.GMAIL_PASSWORD  ?? ''

// ── Détection sujet → réponse personnalisée ───────────────────────────────────
function getReply(subject: string, message: string): { objet: string; intro: string; points: string[] } {
  const t = `${subject} ${message}`.toLowerCase()

  if (/lev[eé]|bspce|bsa|cap table|term sheet|seed|startup|fondateur/i.test(t)) {
    return {
      objet:  'Votre demande — Levée de fonds & BSPCE | Cabinet Mokadmi',
      intro:  'Votre demande concernant la <strong>structuration de votre levée de fonds</strong> est entre nos mains.',
      points: [
        'Cohérence et solidité de votre <strong>cap table</strong>',
        'Structure des <strong>BSPCE / BSA / stock-options</strong>',
        'Rédaction ou audit du <strong>pacte d\'associés</strong>',
        'Gouvernance pré-closing et <strong>term sheet</strong>',
        'Risques juridiques susceptibles de bloquer un closing',
      ],
    }
  }
  if (/fisc|holding|exit|optimis|patrimoin|tva|imposition|cession|plus.value/i.test(t)) {
    return {
      objet:  'Votre demande — Stratégie fiscale & Holding | Cabinet Mokadmi',
      intro:  'Votre demande concernant la <strong>stratégie fiscale ou la structuration holding</strong> est entre nos mains.',
      points: [
        'Audit de votre situation fiscale et identification des risques',
        'Structuration d\'une <strong>holding patrimoniale ou opérationnelle</strong>',
        'Optimisation à l\'exit : plus-value, réinvestissement, <strong>conventions bilatérales</strong>',
      ],
    }
  }
  if (/m&a|acquisition|rachat|fusion|due diligence|data room|earn.out|garantie/i.test(t)) {
    return {
      objet:  'Votre demande — M&A & Transactions | Cabinet Mokadmi',
      intro:  'Votre demande relative à une <strong>opération de M&A</strong> est entre nos mains.',
      points: [
        '<strong>Due diligence juridique</strong> augmentée (détection de clauses à risque)',
        'Structuration de la <strong>garantie d\'actif et de passif</strong>',
        'Négociation du prix et mécanismes d\'<strong>earn-out</strong>',
        'Closing et workflow post-acquisition',
      ],
    }
  }
  if (/\bia\b|intelligence artificielle|automati|workflow|no.code|algorithme/i.test(t)) {
    return {
      objet:  'Votre demande — Gouvernance IA & Automatisation | Cabinet Mokadmi',
      intro:  'Votre demande concernant la <strong>gouvernance IA ou l\'automatisation juridique</strong> est entre nos mains.',
      points: [
        'Déploiement de <strong>workflows juridiques automatisés</strong>',
        'Mise en conformité avec l\'<strong>IA Act européen</strong>',
        'Due diligence augmentée par IA pour <strong>contrats et data rooms</strong>',
        'Gouvernance des données et <strong>propriété intellectuelle</strong> des modèles',
      ],
    }
  }
  return {
    objet:  'Votre demande a bien été reçue | Cabinet Mokadmi',
    intro:  'Notre cabinet intervient sur trois expertises complémentaires.',
    points: [
      '<strong>Droit des affaires</strong> — levées de fonds, pactes, BSPCE, M&A',
      '<strong>Stratégie fiscale</strong> — holdings, optimisation à l\'exit, transfrontalier',
      '<strong>Gouvernance IA</strong> — automatisation juridique, conformité algorithmique',
    ],
  }
}

// ── Templates HTML ─────────────────────────────────────────────────────────────
function buildAutoReply(name: string, subject: string, message: string, objet: string, intro: string, points: string[]): string {
  const pointsHtml = points.map(p => `<li style="margin-bottom:8px;">${p}</li>`).join('')
  const msgBlock   = message
    ? `<div style="background:#111B2E;border-left:3px solid #C9A96E;padding:14px 18px;margin:20px 0;"><p style="margin:0 0 4px;font-size:11px;color:#C9A96E;text-transform:uppercase;letter-spacing:1px;">Votre message</p><p style="margin:0;font-size:13px;color:rgba(232,237,245,0.6);">${message}</p></div>`
    : ''
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#070C18;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#070C18;padding:32px 16px;"><tr><td align="center">
<table width="600" style="max-width:600px;width:100%;">
  <tr><td style="background:#C9A96E;height:3px;"></td></tr>
  <tr><td style="background:#0C1220;padding:32px 40px;">
    <p style="margin:0 0 2px;font-family:Georgia,serif;font-size:18px;color:#E8EDF5;font-weight:bold;">Maître Mokadmi Sami</p>
    <p style="margin:0 0 24px;font-size:10px;color:#C9A96E;letter-spacing:2px;text-transform:uppercase;">L'Architecte Juridique &middot; Barreau de Tunis</p>
    <p style="font-size:15px;color:#E8EDF5;font-family:Georgia,serif;line-height:1.6;margin:0 0 8px;">Bonjour ${name},</p>
    <p style="font-size:15px;color:#E8EDF5;font-family:Georgia,serif;margin:0 0 20px;">${intro}</p>
    <ul style="padding-left:20px;color:rgba(232,237,245,0.7);font-size:14px;line-height:1.8;margin:0 0 20px;">${pointsHtml}</ul>
    ${msgBlock}
    <p style="font-size:14px;color:rgba(232,237,245,0.6);margin:0 0 8px;">Nous vous répondrons personnellement sous <strong style="color:#C9A96E;">24h ouvrées</strong>.</p>
    <p style="font-size:14px;color:rgba(232,237,245,0.6);margin:0 0 28px;">Pour toute urgence : <a href="tel:+21629784651" style="color:#C9A96E;text-decoration:none;">+216 29 784 651</a></p>
    <div style="text-align:center;">
      <a href="https://www.mokadmi.lawyer/#booking" style="display:inline-block;background:#C9A96E;color:#070C18;text-decoration:none;font-size:13px;font-weight:bold;padding:14px 32px;letter-spacing:1px;">CONFIRMER MON RENDEZ-VOUS &rarr;</a>
    </div>
  </td></tr>
  <tr><td style="background:#050A14;padding:16px 40px;border-top:1px solid rgba(201,169,110,0.15);">
    <p style="font-size:11px;color:rgba(232,237,245,0.2);text-align:center;margin:0;">
      Maître Mokadmi Sami &middot; Avocat au Barreau de Tunis<br/>
      <a href="mailto:${CABINET_EMAIL}" style="color:rgba(201,169,110,0.4);text-decoration:none;">${CABINET_EMAIL}</a>
      &middot; <a href="https://www.mokadmi.lawyer" style="color:rgba(201,169,110,0.4);text-decoration:none;">www.mokadmi.lawyer</a>
    </p>
  </td></tr>
  <tr><td style="background:#C9A96E;height:2px;"></td></tr>
</table>
</td></tr></table>
</body></html>`
}

function buildNotification(name: string, email: string, company: string, subject: string, message: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-top:4px solid #C9A96E;padding:24px;">
  <h2 style="color:#C9A96E;margin:0 0 20px;">Nouvelle demande de contact</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 12px;background:#f9f9f9;color:#666;width:100px;border-bottom:1px solid #eee;">Nom</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">${name}</td></tr>
    <tr><td style="padding:8px 12px;background:#f9f9f9;color:#666;border-bottom:1px solid #eee;">Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:${email}" style="color:#C9A96E;">${email}</a></td></tr>
    <tr><td style="padding:8px 12px;background:#f9f9f9;color:#666;border-bottom:1px solid #eee;">Société</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${company || '—'}</td></tr>
    <tr><td style="padding:8px 12px;background:#f9f9f9;color:#666;border-bottom:1px solid #eee;">Sujet</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">${subject || '—'}</td></tr>
    <tr><td style="padding:8px 12px;background:#f9f9f9;color:#666;vertical-align:top;">Message</td><td style="padding:8px 12px;">${message || '—'}</td></tr>
  </table>
  <p style="margin:16px 0 0;font-size:12px;color:#999;">Répondre directement à : <a href="mailto:${email}" style="color:#C9A96E;">${email}</a></p>
</div>
</body></html>`
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { name, email, company = '', subject = '', message = '' } = req.body ?? {}
  if (!name || !email) return res.status(400).json({ error: 'Nom et email requis.' })
  if (!GMAIL_USER || !GMAIL_PASS) return res.status(500).json({ error: 'Configuration serveur manquante. Contactez-nous directement.' })

  const { objet, intro, points } = getReply(subject, message)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  })

  try {
    // 1. Auto-réponse → client
    await transporter.sendMail({
      from:    `"Maître Mokadmi Sami" <${GMAIL_USER}>`,
      to:      email,
      replyTo: CABINET_EMAIL,
      subject: objet,
      html:    buildAutoReply(name, subject, message, objet, intro, points),
    })

    // 2. Notification → cabinet
    await transporter.sendMail({
      from:    `"Formulaire Site" <${GMAIL_USER}>`,
      to:      CABINET_EMAIL,
      replyTo: email,
      subject: `[Contact] ${name} — ${subject || 'Demande générale'}`,
      html:    buildNotification(name, email, company, subject, message),
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[contact] Erreur Nodemailer:', err)
    return res.status(500).json({ error: 'Échec de l\'envoi. Veuillez réessayer.' })
  }
}
