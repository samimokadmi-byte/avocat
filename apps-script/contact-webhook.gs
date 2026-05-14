/**
 * Cabinet Mokadmi - Webhook formulaire de contact
 * Google Apps Script (Web App)
 *
 * DEPLOIEMENT :
 * 1. script.google.com -> Nouveau projet -> coller ce code
 * 2. Executer -> testLocal() pour valider
 * 3. Deployer -> Nouvelle version -> Web App
 *    - Executer en tant que : Moi (sami.mokadmi@gmail.com)
 *    - Qui peut acceder : Tout le monde
 * 4. Copier l'URL -> Vercel -> APPS_SCRIPT_URL
 */

// ============================================================
// IDENTITE CABINET
// ============================================================
var CABINET_EMAIL   = 'office@mokadmi.lawyer';
var CABINET_NOM     = 'Maitre Mokadmi Sami';
var CABINET_TEL     = '+216 29 784 651';
var CABINET_SITE    = 'www.mokadmi.lawyer';
var CABINET_ADRESSE = 'Bloc B, Espace Tunis Monplaisir - 1073 Tunis';

// ============================================================
// POINT D'ENTREE WEBHOOK
// ============================================================
function doPost(e) {
  try {
    var raw     = e.postData.contents;
    var data    = JSON.parse(raw);
    var name    = data.name    || '';
    var email   = data.email   || '';
    var company = data.company || '';
    var subject = data.subject || '';
    var message = data.message || '';

    if (!name || !email) {
      return buildResponse(false, 'Nom et email requis.');
    }

    sendNotification(name, email, company, subject, message);
    sendAutoReply(name, email, subject, message);

    return buildResponse(true, 'Emails envoyes avec succes.');

  } catch (err) {
    Logger.log('Erreur doPost : ' + err.toString());
    return buildResponse(false, err.toString());
  }
}

// ============================================================
// DETECTION DU SUJET
// NOTE : on evite les accents dans les regex - on passe tout
// en minuscules et on utilise indexOf() pour les mots accentues
// ============================================================
function detectSujet(subject, message) {
  var t = (subject + ' ' + message).toLowerCase();

  // Levee de fonds / BSPCE
  if (
    t.indexOf('lev') !== -1 ||
    t.indexOf('bspce') !== -1 ||
    t.indexOf('bsa') !== -1 ||
    t.indexOf('cap table') !== -1 ||
    t.indexOf('term sheet') !== -1 ||
    t.indexOf('seed') !== -1 ||
    t.indexOf('startup') !== -1 ||
    t.indexOf('fondateur') !== -1
  ) {
    return {
      tag:    'Levee de fonds & Ingenierie capitalistique',
      objet:  'Votre demande - Levee de fonds & BSPCE | Cabinet Mokadmi',
      intro:  'Votre demande concernant la structuration de votre levee de fonds est entre nos mains.',
      points: [
        'Coherence et solidite de votre cap table',
        'Structure des BSPCE / BSA / stock-options',
        'Redaction ou audit du pacte d\'associes',
        'Gouvernance pre-closing et term sheet',
        'Risques juridiques susceptibles de bloquer un closing'
      ],
      delai: 'Notre premiere intervention peut avoir lieu sous 48 a 72h.'
    };
  }

  // Fiscalite / Holding
  if (
    t.indexOf('fisc') !== -1 ||
    t.indexOf('holding') !== -1 ||
    t.indexOf('exit') !== -1 ||
    t.indexOf('optimis') !== -1 ||
    t.indexOf('patrimoin') !== -1 ||
    t.indexOf('tva') !== -1 ||
    t.indexOf('imposition') !== -1 ||
    t.indexOf('cession') !== -1
  ) {
    return {
      tag:    'Strategie fiscale & Holding',
      objet:  'Votre demande - Strategie fiscale & Holding | Cabinet Mokadmi',
      intro:  'Votre demande concernant la strategie fiscale ou la structuration holding est entre nos mains.',
      points: [
        'Audit de votre situation fiscale et identification des risques',
        'Structuration d\'une holding patrimoniale ou operationnelle',
        'Optimisation a l\'exit : plus-value, reinvestissement, conventions bilaterales'
      ],
      delai: 'Nous travaillons exclusivement sur des architectures fiscales perennes et conformes.'
    };
  }

  // M&A / Acquisition
  if (
    t.indexOf('m&a') !== -1 ||
    t.indexOf('acquisition') !== -1 ||
    t.indexOf('rachat') !== -1 ||
    t.indexOf('fusion') !== -1 ||
    t.indexOf('diligence') !== -1 ||
    t.indexOf('data room') !== -1 ||
    t.indexOf('garantie') !== -1
  ) {
    return {
      tag:    'M&A & Transactions',
      objet:  'Votre demande - M&A & Transactions | Cabinet Mokadmi',
      intro:  'Votre demande relative a une operation de M&A est entre nos mains.',
      points: [
        'Due diligence juridique augmentee (detection de clauses a risque)',
        'Structuration de la garantie d\'actif et de passif (GAP)',
        'Negociation du prix et mecanismes d\'earn-out',
        'Closing et workflow post-acquisition'
      ],
      delai: 'La reactivite est essentielle. Nous revenons vers vous sous 24h ouvrees.'
    };
  }

  // IA / Automatisation
  if (
    t.indexOf(' ia ') !== -1 ||
    t.indexOf('intelligence artificielle') !== -1 ||
    t.indexOf('automati') !== -1 ||
    t.indexOf('workflow') !== -1 ||
    t.indexOf('no-code') !== -1 ||
    t.indexOf('algorithme') !== -1
  ) {
    return {
      tag:    'Gouvernance IA & Automatisation juridique',
      objet:  'Votre demande - Gouvernance IA & Automatisation | Cabinet Mokadmi',
      intro:  'Votre demande concernant la gouvernance IA ou l\'automatisation juridique est entre nos mains.',
      points: [
        'Deploiement de workflows juridiques automatises (no-code et IA)',
        'Mise en conformite avec l\'IA Act europeen et regulations algorithmiques',
        'Due diligence augmentee par IA pour contrats et data rooms',
        'Gouvernance des donnees et propriete intellectuelle des modeles'
      ],
      delai: 'C\'est notre domaine de predilection - nous serons particulierement attentifs a votre dossier.'
    };
  }

  // Defaut
  return {
    tag:    'Demande generale',
    objet:  'Votre demande a bien ete recue | Cabinet Mokadmi',
    intro:  'Notre cabinet intervient sur trois expertises complementaires.',
    points: [
      'Droit des affaires - levees de fonds, pactes, BSPCE, M&A',
      'Strategie fiscale - holdings, optimisation a l\'exit, transfrontalier',
      'Gouvernance IA - automatisation juridique, conformite algorithmique'
    ],
    delai: 'Un premier diagnostic de 90 minutes vous permettra de cartographier votre situation.'
  };
}

// ============================================================
// EMAIL 1 : NOTIFICATION INTERNE CABINET
// ============================================================
function sendNotification(name, email, company, subject, message) {
  var html = ''
    + '<div style="font-family:Arial,sans-serif;max-width:520px;border-top:4px solid #C9A96E;padding:24px;background:#fff;">'
    + '<h2 style="color:#C9A96E;margin:0 0 20px;">Nouvelle demande de contact</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;width:90px;border-bottom:1px solid #eee;">Nom</td>'
    + '<td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">' + name + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Email</td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:' + email + '" style="color:#C9A96E;">' + email + '</a></td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Societe</td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + (company ? company : '-') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Sujet</td>'
    + '<td style="padding:8px 12px;border-bottom:1px solid #eee;">' + (subject ? subject : '-') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;vertical-align:top;">Message</td>'
    + '<td style="padding:8px 12px;">' + (message ? message : '-') + '</td></tr>'
    + '</table>'
    + '<p style="margin:16px 0 0;font-size:12px;color:#999;">Repondre a : <a href="mailto:' + email + '" style="color:#C9A96E;">' + email + '</a></p>'
    + '</div>';

  GmailApp.sendEmail(
    CABINET_EMAIL,
    '[Contact] ' + name + ' - ' + (subject ? subject : 'Demande generale'),
    'Nouvelle demande de ' + name + ' (' + email + '). Sujet : ' + (subject ? subject : '-'),
    { replyTo: email, htmlBody: html, name: 'Formulaire Site Cabinet Mokadmi' }
  );
}

// ============================================================
// EMAIL 2 : AUTO-REPONSE CLIENT
// ============================================================
function sendAutoReply(name, email, subject, message) {
  var s = detectSujet(subject, message);

  var pointsHtml = '';
  for (var i = 0; i < s.points.length; i++) {
    pointsHtml += '<li style="margin-bottom:8px;">' + s.points[i] + '</li>';
  }

  var msgBlock = '';
  if (message) {
    msgBlock = '<div style="background:#111B2E;border-left:3px solid #C9A96E;padding:14px 18px;margin:20px 0;">'
      + '<p style="margin:0 0 4px;font-size:11px;color:#C9A96E;text-transform:uppercase;letter-spacing:1px;">Votre message</p>'
      + '<p style="margin:0;font-size:13px;color:rgba(232,237,245,0.6);">' + message + '</p>'
      + '</div>';
  }

  var telClean = CABINET_TEL.replace(/ /g, '');

  var html = ''
    + '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>'
    + '<body style="margin:0;padding:0;background:#070C18;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#070C18;padding:32px 16px;">'
    + '<tr><td align="center">'
    + '<table width="600" style="max-width:600px;width:100%;">'

    // Bande doree top
    + '<tr><td style="background:#C9A96E;height:3px;"></td></tr>'

    // En-tete
    + '<tr><td style="background:#0C1220;padding:32px 40px;">'
    + '<p style="margin:0 0 2px;font-family:Georgia,serif;font-size:18px;color:#E8EDF5;font-weight:bold;">' + CABINET_NOM + '</p>'
    + '<p style="margin:0 0 4px;font-size:10px;color:#C9A96E;letter-spacing:2px;text-transform:uppercase;">' + s.tag + '</p>'
    + '<hr style="border:none;border-top:1px solid rgba(201,169,110,0.2);margin:16px 0;"/>'

    // Corps
    + '<p style="font-size:15px;color:#E8EDF5;font-family:Georgia,serif;line-height:1.6;margin:0 0 6px;">Bonjour ' + name + ',</p>'
    + '<p style="font-size:15px;color:#E8EDF5;margin:0 0 20px;">' + s.intro + '</p>'
    + '<ul style="padding-left:20px;color:rgba(232,237,245,0.7);font-size:14px;line-height:1.8;margin:0 0 16px;">'
    + pointsHtml
    + '</ul>'
    + '<p style="font-size:14px;color:rgba(232,237,245,0.6);margin:0 0 12px;">' + s.delai + '</p>'
    + msgBlock
    + '<p style="font-size:14px;color:rgba(232,237,245,0.5);margin:20px 0 28px;">'
    + 'Nous vous repondrons sous <strong style="color:#C9A96E;">24h ouvrees</strong>. '
    + 'Urgence : <a href="tel:' + telClean + '" style="color:#C9A96E;text-decoration:none;">' + CABINET_TEL + '</a>'
    + '</p>'
    + '<div style="text-align:center;">'
    + '<a href="https://' + CABINET_SITE + '/#booking" style="display:inline-block;background:#C9A96E;color:#070C18;text-decoration:none;font-size:13px;font-weight:bold;padding:14px 32px;letter-spacing:1px;">CONFIRMER MON RENDEZ-VOUS</a>'
    + '</div>'
    + '</td></tr>'

    // Pied de page
    + '<tr><td style="background:#050A14;padding:16px 40px;border-top:1px solid rgba(201,169,110,0.15);">'
    + '<p style="font-size:11px;color:rgba(232,237,245,0.2);text-align:center;margin:0;">'
    + CABINET_NOM + ' - Avocat au Barreau de Tunis<br/>'
    + CABINET_ADRESSE + '<br/>'
    + '<a href="mailto:' + CABINET_EMAIL + '" style="color:rgba(201,169,110,0.4);text-decoration:none;">' + CABINET_EMAIL + '</a>'
    + ' - '
    + '<a href="https://' + CABINET_SITE + '" style="color:rgba(201,169,110,0.4);text-decoration:none;">' + CABINET_SITE + '</a>'
    + '</p></td></tr>'

    // Bande doree bottom
    + '<tr><td style="background:#C9A96E;height:2px;"></td></tr>'

    + '</table></td></tr></table></body></html>';

  GmailApp.sendEmail(
    email,
    s.objet,
    'Bonjour ' + name + ', votre demande a bien ete recue. Reponse sous 24h ouvrees. ' + CABINET_TEL,
    { replyTo: CABINET_EMAIL, htmlBody: html, name: CABINET_NOM }
  );
}

// ============================================================
// UTILITAIRE REPONSE HTTP
// ============================================================
function buildResponse(success, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: success, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// TEST MANUEL (executer depuis l'editeur Apps Script)
// Selectionner testLocal -> cliquer Executer
// ============================================================
function testLocal() {
  sendNotification('Ahmed Ben Ali', 'sami.mokadmi@gmail.com', 'Tech Startup', 'Levee de fonds Seed 500k', 'Nous cherchons un avocat pour structurer notre levee de fonds.');
  sendAutoReply('Ahmed Ben Ali', 'sami.mokadmi@gmail.com', 'Levee de fonds Seed 500k', 'Nous cherchons un avocat pour structurer notre levee de fonds.');
  Logger.log('Test OK - verifier la boite Gmail.');
}
