/**
 * api/contact.ts — Fonction serverless Vercel
 *
 * Envoie deux emails pour chaque soumission du formulaire de contact :
 *  1. Notification interne → office@mokadmi.lawyer
 *  2. Auto-réponse personnalisée → client (selon le sujet mentionné)
 *
 * Variable d'environnement requise dans Vercel :
 *   RESEND_API_KEY → créer un compte gratuit sur resend.com (100 emails/jour)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Identité cabinet ──────────────────────────────────────────────────────────
const CABINET = {
  nom:    'Maître Mokadmi Sami',
  email:  'office@mokadmi.lawyer',
  tel:    '+216 29 784 651',
  site:   'www.mokadmi.lawyer',
  adresse:'Bloc B, Espace Tunis Monplaisir — 1073 Tunis',
}

// ── Détection du sujet et réponse adaptée ─────────────────────────────────────
function detecterSujet(subject: string, message: string): {
  tag: string
  objet: string
  corps: string
} {
  const texte = `${subject} ${message}`.toLowerCase()

  // Levée de fonds / BSPCE / Capital-risque
  if (/levée|lev.e|seed|série|serie|bspce|bsa|cap table|term sheet|investisseur|startup|fondateur/i.test(texte)) {
    return {
      tag: 'Levée de fonds & Ingénierie capitalistique',
      objet: 'Votre demande — Architecture de levée de fonds | Cabinet Mokadmi',
      corps: `
        <p>Votre demande concernant la <strong>structuration de votre levée de fonds</strong> a bien été reçue.</p>
        <p>Ce type de mission nécessite une intervention rapide et structurée. Voici ce que nous analysons en priorité lors du diagnostic :</p>
        <ul>
          <li>Cohérence et solidité de votre <strong>cap table</strong></li>
          <li>Structure des <strong>BSPCE / BSA / stock-options</strong> existants</li>
          <li>Rédaction ou audit du <strong>pacte d'associés</strong></li>
          <li>Gouvernance pré-closing et <strong>term sheet</strong></li>
          <li>Risques juridiques susceptibles de bloquer un closing</li>
        </ul>
        <p>Notre première intervention peut avoir lieu sous <strong>48 à 72h</strong> selon les urgences en cours.</p>
      `,
    }
  }

  // Fiscalité / Holding / Optimisation
  if (/fiscal|holding|tva|imposition|optimis|patrimoin|exit|cession|plus.value|transfrontalier|convention/i.test(texte)) {
    return {
      tag: 'Stratégie fiscale & Gouvernance holding',
      objet: 'Votre demande — Optimisation fiscale & Structuration | Cabinet Mokadmi',
      corps: `
        <p>Votre demande concernant la <strong>stratégie fiscale ou la structuration holding</strong> a bien été reçue.</p>
        <p>Notre approche en matière de gouvernance fiscale repose sur trois axes :</p>
        <ul>
          <li>Audit de votre situation fiscale actuelle et identification des risques</li>
          <li>Structuration d'une <strong>holding patrimoniale ou opérationnelle</strong> adaptée</li>
          <li>Optimisation à l'<strong>exit</strong> : plus-value, réinvestissement, conventions bilatérales</li>
        </ul>
        <p>Nous travaillons exclusivement sur des architectures fiscales <strong>pérennes et conformes</strong> — sans optimisation agressive à risque.</p>
      `,
    }
  }

  // M&A / Acquisition / Due diligence
  if (/m&a|acquisition|cession|rachat|fusion|due diligence|data room|earn.out|garantie|gap|valorisation/i.test(texte)) {
    return {
      tag: 'M&A & Transactions',
      objet: 'Votre demande — M&A & Structuration de transaction | Cabinet Mokadmi',
      corps: `
        <p>Votre demande relative à une <strong>opération de M&A ou d'acquisition</strong> a bien été reçue.</p>
        <p>Notre intervention couvre l'intégralité du cycle transactionnel :</p>
        <ul>
          <li><strong>Due diligence juridique</strong> augmentée (détection automatisée de clauses à risque)</li>
          <li>Structuration de la <strong>garantie d'actif et de passif</strong></li>
          <li>Négociation du prix et des mécanismes d'<strong>earn-out</strong></li>
          <li>Sécurisation de la <strong>propriété intellectuelle</strong> et des actifs immatériels</li>
          <li>Closing et workflow post-acquisition</li>
        </ul>
        <p>La réactivité est essentielle dans ce type de dossier. Nous revenons vers vous sous <strong>24h ouvrées</strong>.</p>
      `,
    }
  }

  // IA juridique / Automatisation / Workflows
  if (/ia|intelligence artificielle|automatisation|workflow|no.code|algorithme|tech|digital|contrat intelligent/i.test(texte)) {
    return {
      tag: 'Gouvernance IA & Automatisation juridique',
      objet: 'Votre demande — Architecture IA & Automatisation | Cabinet Mokadmi',
      corps: `
        <p>Votre demande concernant la <strong>gouvernance IA ou l'automatisation juridique</strong> a bien été reçue.</p>
        <p>Nous intervenons à l'intersection du droit et de la technologie sur :</p>
        <ul>
          <li>Déploiement de <strong>workflows juridiques automatisés</strong> (no-code et IA)</li>
          <li>Mise en conformité avec l'<strong>IA Act européen</strong> et les régulations algorithmiques</li>
          <li>Due diligence augmentée par IA pour <strong>data rooms et contrats</strong></li>
          <li>Gouvernance des données et des modèles IA (<strong>propriété intellectuelle</strong>)</li>
          <li>Contrats Tech, SaaS et clauses de responsabilité algorithmique</li>
        </ul>
        <p>C'est notre domaine de prédilection — nous serons particulièrement attentifs à votre dossier.</p>
      `,
    }
  }

  // Default — Contact général
  return {
    tag: 'Demande générale',
    objet: 'Votre demande a bien été reçue | Cabinet Mokadmi',
    corps: `
      <p>Nous avons bien reçu votre message et nous vous remercions de la confiance accordée au cabinet.</p>
      <p>Notre expertise couvre notamment :</p>
      <ul>
        <li><strong>Droit des affaires</strong> — levées de fonds, pactes, BSPCE, M&A</li>
        <li><strong>Stratégie fiscale</strong> — holdings, optimisation à l'exit, transfrontalier</li>
        <li><strong>Gouvernance IA</strong> — automatisation juridique, conformité algorithmique</li>
      </ul>
      <p>Un premier diagnostic de 90 minutes vous permettra de cartographier votre situation et de définir les priorités d'intervention.</p>
    `,
  }
}

// ── Template HTML email ───────────────────────────────────────────────────────
function htmlAutoReply(
  prenom: string,
  tag: string,
  corps: string,
  subject: string,
  message: string,
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Cabinet Mokadmi</title>
</head>
<body style="margin:0;padding:0;background:#070C18;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#070C18;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Bande dorée top -->
      <tr><td style="background:#C9A96E;height:3px;"></td></tr>

      <!-- En-tête -->
      <tr><td style="background:#0C1220;padding:32px 40px 24px;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:20px;color:#E8EDF5;font-weight:bold;">
          Maître Mokadmi Sami
        </p>
        <p style="margin:0;font-size:11px;color:#C9A96E;letter-spacing:0.15em;text-transform:uppercase;">
          L'Architecte Juridique · Barreau de Tunis
        </p>
      </td></tr>

      <!-- Séparateur -->
      <tr><td style="background:#0C1220;padding:0 40px;">
        <hr style="border:none;border-top:1px solid rgba(201,169,110,0.2);margin:0;" />
      </td></tr>

      <!-- Corps -->
      <tr><td style="background:#0C1220;padding:32px 40px;">

        <p style="margin:0 0 8px;font-size:11px;color:#C9A96E;letter-spacing:0.12em;text-transform:uppercase;">
          ${tag}
        </p>
        <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:22px;color:#E8EDF5;font-weight:normal;line-height:1.3;">
          Maître ${prenom.split(' ')[0]},<br/>votre demande a bien été reçue.
        </h1>

        <div style="font-size:14px;color:rgba(232,237,245,0.65);line-height:1.8;">
          ${corps}
        </div>

        <!-- Rappel du message -->
        <div style="margin:28px 0 0;padding:16px 20px;background:#111B2E;border-left:2px solid rgba(201,169,110,0.4);">
          <p style="margin:0 0 6px;font-size:10px;color:rgba(201,169,110,0.6);text-transform:uppercase;letter-spacing:0.1em;">
            Votre message
          </p>
          <p style="margin:0 0 4px;font-size:13px;color:rgba(232,237,245,0.8);font-style:italic;">
            Sujet : ${subject || '—'}
          </p>
          ${message ? `<p style="margin:8px 0 0;font-size:13px;color:rgba(232,237,245,0.5);">${message}</p>` : ''}
        </div>

        <!-- CTA -->
        <div style="margin:32px 0 0;text-align:center;">
          <a href="https://www.mokadmi.lawyer/#booking"
             style="display:inline-block;background:#C9A96E;color:#070C18;text-decoration:none;font-size:13px;font-weight:bold;padding:14px 32px;letter-spacing:0.05em;">
            Confirmer mon rendez-vous →
          </a>
        </div>

        <p style="margin:32px 0 0;font-size:13px;color:rgba(232,237,245,0.4);line-height:1.7;">
          Nous vous répondrons personnellement sous <strong style="color:rgba(232,237,245,0.7);">24h ouvrées</strong>.<br/>
          Pour toute urgence (closing imminent), appelez directement le
          <a href="tel:+21629784651" style="color:#C9A96E;text-decoration:none;">${CABINET.tel}</a>.
        </p>

      </td></tr>

      <!-- Pied de page -->
      <tr><td style="background:#070C18;padding:24px 40px;">
        <hr style="border:none;border-top:1px solid rgba(201,169,110,0.15);margin:0 0 20px;" />
        <p style="margin:0;font-size:11px;color:rgba(232,237,245,0.25);line-height:1.7;text-align:center;">
          <strong style="color:rgba(201,169,110,0.6);">${CABINET.nom}</strong> · Avocat au Barreau de Tunis<br/>
          ${CABINET.adresse}<br/>
          <a href="mailto:${CABINET.email}" style="color:rgba(201,169,110,0.5);text-decoration:none;">${CABINET.email}</a>
          &nbsp;·&nbsp;
          <a href="https://${CABINET.site}" style="color:rgba(201,169,110,0.5);text-decoration:none;">${CABINET.site}</a>
        </p>
        <p style="margin:12px 0 0;font-size:10px;color:rgba(232,237,245,0.12);text-align:center;">
          Cet email est une réponse automatique à votre demande de contact.
          Les informations échangées sont strictement confidentielles.
        </p>
      </td></tr>

      <!-- Bande dorée bottom -->
      <tr><td style="background:#C9A96E;height:2px;"></td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function htmlNotification(
  name: string,
  email: string,
  company: string,
  subject: string,
  message: string,
  tag: string,
): string {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;">
<div style="max-width:500px;margin:0 auto;background:#fff;border-top:4px solid #C9A96E;padding:24px;">
  <p style="margin:0 0 4px;font-size:12px;color:#C9A96E;text-transform:uppercase;letter-spacing:0.1em;">${tag}</p>
  <h2 style="margin:0 0 20px;font-size:18px;">Nouvelle demande de contact</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr><td style="padding:8px 0;color:#666;width:120px;">Nom</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
    <tr><td style="padding:8px 0;color:#666;">Société</td><td style="padding:8px 0;">${company || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;">Sujet</td><td style="padding:8px 0;">${subject || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#666;vertical-align:top;">Message</td><td style="padding:8px 0;">${message || '—'}</td></tr>
  </table>
  <hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/>
  <p style="margin:0;font-size:12px;color:#999;">Répondre directement à : <a href="mailto:${email}">${email}</a></p>
</div>
</body></html>`
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://www.mokadmi.lawyer')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' })

  const { name, email, company = '', subject = '', message = '' } = req.body ?? {}

  if (!name || !email) {
    return res.status(400).json({ error: 'Nom et email requis.' })
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Configuration serveur manquante.' })
  }

  const { tag, objet, corps } = detecterSujet(subject, message)

  try {
    // 1. Auto-réponse → client
    await resend.emails.send({
      from:    `${CABINET.nom} <onboarding@resend.dev>`,
      to:      [email],
      replyTo: CABINET.email,
      subject: objet,
      html:    htmlAutoReply(name, tag, corps, subject, message),
    })

    // 2. Notification interne → cabinet
    await resend.emails.send({
      from:    `Formulaire Site <onboarding@resend.dev>`,
      to:      [CABINET.email],
      replyTo: email,
      subject: `[Contact] ${tag} — ${name}`,
      html:    htmlNotification(name, email, company, subject, message, tag),
    })

    return res.status(200).json({ success: true })

  } catch (err) {
    console.error('[contact] Erreur Resend:', err)
    return res.status(500).json({ error: 'Échec de l\'envoi. Veuillez réessayer.' })
  }
}
