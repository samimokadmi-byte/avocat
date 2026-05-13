/**
 * Cabinet Mokadmi — Webhook formulaire de contact
 * Google Apps Script (Web App) — inspiré du pattern GmailApp
 *
 * Déploiement :
 *   1. Aller sur https://script.google.com → Nouveau projet
 *   2. Coller ce code entier
 *   3. Déployer → Nouvelle version → Web App
 *      - Exécuter en tant que : Moi (sami.mokadmi@gmail.com)
 *      - Qui peut accéder : Tout le monde
 *   4. Copier l'URL de déploiement → la coller dans Vercel :
 *      Variable : APPS_SCRIPT_URL = https://script.google.com/macros/s/XXXX/exec
 */

// ── Identité cabinet ──────────────────────────────────────────────────────────
var CABINET_EMAIL   = 'office@mokadmi.lawyer';
var CABINET_NOM     = 'Maître Mokadmi Sami';
var CABINET_TEL     = '+216 29 784 651';
var CABINET_SITE    = 'www.mokadmi.lawyer';
var CABINET_ADRESSE = 'Bloc B, Espace Tunis Monplaisir — 1073 Tunis';

// ── Réception du webhook (appelé par Vercel /api/contact) ─────────────────────
function doPost(e) {
  try {
    var data    = JSON.parse(e.postData.contents);
    var name    = data.name    || '';
    var email   = data.email   || '';
    var company = data.company || '';
    var subject = data.subject || '';
    var message = data.message || '';

    if (!name || !email) {
      return buildResponse(false, 'Nom et email requis.');
    }

    // 1. Notification interne → cabinet
    sendNotification(name, email, company, subject, message);

    // 2. Auto-réponse personnalisée → client
    sendAutoReply(name, email, subject, message);

    // Optionnel : marquer comme traité dans Gmail
    // var threads = GmailApp.search('from:' + email + ' is:unread');
    // if (threads.length) threads[0].markRead();

    return buildResponse(true, 'Emails envoyés avec succès.');

  } catch (err) {
    Logger.log('Erreur doPost : ' + err.toString());
    return buildResponse(false, err.toString());
  }
}

// ── Détection du sujet → contenu personnalisé ─────────────────────────────────
function detectSujet(subject, message) {
  var t = (subject + ' ' + message).toLowerCase();

  if (/lev[eé]|bspce|bsa|cap table|term sheet|seed|startup|fondateur/.test(t)) {
    return {
      tag:    'Levée de fonds & Ingénierie capitalistique',
      objet:  'Votre demande — Levée de fonds & BSPCE | Cabinet Mokadmi',
      intro:  'Votre demande concernant la structuration de votre levée de fonds est entre nos mains.',
      points: [
        'Cohérence et solidité de votre cap table',
        'Structure des BSPCE / BSA / stock-options',
        'Rédaction ou audit du pacte d\'associés',
        'Gouvernance pré-closing et term sheet',
        'Risques juridiques susceptibles de bloquer un closing'
      ],
      delai: 'Notre première intervention peut avoir lieu sous 48 à 72h.'
    };
  }

  if (/fisc|holding|exit|optimis|patrimoin|tva|imposition|cession|plus.value/.test(t)) {
    return {
      tag:    'Stratégie fiscale & Holding',
      objet:  'Votre demande — Stratégie fiscale & Holding | Cabinet Mokadmi',
      intro:  'Votre demande concernant la stratégie fiscale ou la structuration holding est entre nos mains.',
      points: [
        'Audit de votre situation fiscale et identification des risques',
        'Structuration d\'une holding patrimoniale ou opérationnelle',
        'Optimisation à l\'exit : plus-value, réinvestissement, conventions bilatérales'
      ],
      delai: 'Nous travaillons exclusivement sur des architectures fiscales pérennes et conformes.'
    };
  }

  if (/m&a|acquisition|rachat|fusion|due diligence|data room|earn.out|garantie/.test(t)) {
    return {
      tag:    'M&A & Transactions',
      objet:  'Votre demande — M&A & Transactions | Cabinet Mokadmi',
      intro:  'Votre demande relative à une opération de M&A est entre nos mains.',
      points: [
        'Due diligence juridique augmentée (détection de clauses à risque)',
        'Structuration de la garantie d\'actif et de passif (GAP)',
        'Négociation du prix et mécanismes d\'earn-out',
        'Closing et workflow post-acquisition'
      ],
      delai: 'La réactivité est essentielle dans ce type de dossier. Nous revenons vers vous sous 24h ouvrées.'
    };
  }

  if (/\bia\b|intelligence artificielle|automati|workflow|no.code|algorithme|tech/.test(t)) {
    return {
      tag:    'Gouvernance IA & Automatisation juridique',
      objet:  'Votre demande — Gouvernance IA & Automatisation | Cabinet Mokadmi',
      intro:  'Votre demande concernant la gouvernance IA ou l\'automatisation juridique est entre nos mains.',
      points: [
        'Déploiement de workflows juridiques automatisés (no-code et IA)',
        'Mise en conformité avec l\'IA Act européen et régulations algorithmiques',
        'Due diligence augmentée par IA pour contrats et data rooms',
        'Gouvernance des données et propriété intellectuelle des modèles'
      ],
      delai: 'C\'est notre domaine de prédilection — nous serons particulièrement attentifs à votre dossier.'
    };
  }

  return {
    tag:    'Demande générale',
    objet:  'Votre demande a bien été reçue | Cabinet Mokadmi',
    intro:  'Notre cabinet intervient sur trois expertises complémentaires.',
    points: [
      'Droit des affaires — levées de fonds, pactes, BSPCE, M&A',
      'Stratégie fiscale — holdings, optimisation à l\'exit, transfrontalier',
      'Gouvernance IA — automatisation juridique, conformité algorithmique'
    ],
    delai: 'Un premier diagnostic de 90 minutes vous permettra de cartographier votre situation.'
  };
}

// ── Email 1 : Notification interne ────────────────────────────────────────────
function sendNotification(name, email, company, subject, message) {
  var htmlBody =
    '<div style="font-family:Arial,sans-serif;max-width:520px;border-top:4px solid #C9A96E;padding:24px;background:#fff;">' +
    '<h2 style="color:#C9A96E;margin:0 0 20px;">Nouvelle demande de contact</h2>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
    '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;width:90px;border-bottom:1px solid #eee;">Nom</td>' +
    '<td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">' + name + '</td></tr>' +
    '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Email</td>' +
    '<td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:' + email + '" style="color:#C9A96E;">' + email + '</a></td></tr>' +
    '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Société</td>' +
    '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + (company || '—') + '</td></tr>' +
    '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Sujet</td>' +
    '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + (subject || '—') + '</td></tr>' +
    '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;vertical-align:top;">Message</td>' +
    '<td style="padding:8px 12px;">' + (message || '—') + '</td></tr>' +
    '</table>' +
    '<hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/>' +
    '<p style="margin:0;font-size:12px;color:#999;">Répondre directement à : ' +
    '<a href="mailto:' + email + '" style="color:#C9A96E;">' + email + '</a></p>' +
    '</div>';

  GmailApp.sendEmail(
    CABINET_EMAIL,
    '[Contact] ' + name + ' — ' + (subject || 'Demande générale'),
    'Nouvelle demande de ' + name + ' (' + email + '). Sujet : ' + (subject || '—') + '. Message : ' + (message || '—'),
    {
      replyTo: email,
      htmlBody: htmlBody,
      name: 'Formulaire Site — Cabinet Mokadmi'
    }
  );
}

// ── Email 2 : Auto-réponse client ─────────────────────────────────────────────
function sendAutoReply(name, email, subject, message) {
  var s      = detectSujet(subject, message);
  var points = s.points.map(function(p) {
    return '<li style="margin-bottom:8px;">' + p + '</li>';
  }).join('');

  var msgBlock = message
    ? '<div style="background:#111B2E;border-left:3px solid #C9A96E;padding:14px 18px;margin:20px 0;">' +
      '<p style="margin:0 0 4px;font-size:11px;color:#C9A96E;text-transform:uppercase;letter-spacing:1px;">Votre message</p>' +
      '<p style="margin:0;font-size:13px;color:rgba(232,237,245,0.6);">' + message + '</p></div>'
    : '';

  var htmlBody =
    '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/></head>' +
    '<body style="margin:0;padding:0;background:#070C18;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#070C18;padding:32px 16px;">' +
    '<tr><td align="center"><table width="600" style="max-width:600px;width:100%;">' +

    // Bande dorée top
    '<tr><td style="background:#C9A96E;height:3px;"></td></tr>' +

    // Corps
    '<tr><td style="background:#0C1220;padding:32px 40px;">' +
    '<p style="margin:0 0 2px;font-family:Georgia,serif;font-size:18px;color:#E8EDF5;font-weight:bold;">' + CABINET_NOM + '</p>' +
    '<p style="margin:0 0 4px;font-size:10px;color:#C9A96E;letter-spacing:2px;text-transform:uppercase;">' + s.tag + '</p>' +
    '<hr style="border:none;border-top:1px solid rgba(201,169,110,0.2);margin:16px 0;"/>' +
    '<p style="font-size:15px;color:#E8EDF5;font-family:Georgia,serif;line-height:1.6;margin:0 0 6px;">Bonjour ' + name + ',</p>' +
    '<p style="font-size:15px;color:#E8EDF5;margin:0 0 20px;">' + s.intro + '</p>' +
    '<ul style="padding-left:20px;color:rgba(232,237,245,0.7);font-size:14px;line-height:1.8;margin:0 0 16px;">' + points + '</ul>' +
    '<p style="font-size:14px;color:rgba(232,237,245,0.6);margin:0 0 8px;">' + s.delai + '</p>' +
    msgBlock +
    '<p style="font-size:14px;color:rgba(232,237,245,0.6);margin:20px 0 28px;">' +
    'Pour toute urgence : <a href="tel:' + CABINET_TEL.replace(/\s/g,'') + '" style="color:#C9A96E;text-decoration:none;">' + CABINET_TEL + '</a></p>' +
    '<div style="text-align:center;">' +
    '<a href="https://' + CABINET_SITE + '/#booking" style="display:inline-block;background:#C9A96E;color:#070C18;text-decoration:none;font-size:13px;font-weight:bold;padding:14px 32px;letter-spacing:1px;">CONFIRMER MON RENDEZ-VOUS &rarr;</a>' +
    '</div></td></tr>' +

    // Pied de page
    '<tr><td style="background:#050A14;padding:16px 40px;border-top:1px solid rgba(201,169,110,0.15);">' +
    '<p style="font-size:11px;color:rgba(232,237,245,0.2);text-align:center;margin:0;">' +
    CABINET_NOM + ' &middot; Avocat au Barreau de Tunis<br/>' +
    CABINET_ADRESSE + '<br/>' +
    '<a href="mailto:' + CABINET_EMAIL + '" style="color:rgba(201,169,110,0.4);text-decoration:none;">' + CABINET_EMAIL + '</a>' +
    ' &middot; <a href="https://' + CABINET_SITE + '" style="color:rgba(201,169,110,0.4);text-decoration:none;">' + CABINET_SITE + '</a>' +
    '</p></td></tr>' +

    // Bande dorée bottom
    '<tr><td style="background:#C9A96E;height:2px;"></td></tr>' +

    '</table></td></tr></table></body></html>';

  GmailApp.sendEmail(
    email,
    s.objet,
    'Bonjour ' + name + ', votre demande a bien été reçue. Nous vous répondrons sous 24h ouvrées. ' + CABINET_TEL,
    {
      replyTo: CABINET_EMAIL,
      htmlBody: htmlBody,
      name: CABINET_NOM
    }
  );
}

// ── Utilitaire réponse HTTP ───────────────────────────────────────────────────
function buildResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: success, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Test manuel depuis l'éditeur Apps Script ──────────────────────────────────
function testLocal() {
  sendNotification('Test Nom', 'sami.mokadmi@gmail.com', 'Test SARL', 'Levée de fonds Seed', 'Test message local');
  sendAutoReply('Test Nom', 'sami.mokadmi@gmail.com', 'Levée de fonds Seed', 'Test message local');
  Logger.log('Emails envoyés — vérifier la boîte Gmail.');
}
