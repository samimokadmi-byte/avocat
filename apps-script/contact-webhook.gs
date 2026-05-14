// Cabinet Mokadmi - Webhook formulaire de contact
// AVANT DE COLLER CE CODE :
//   1. Ctrl+A dans l'editeur pour tout selectionner
//   2. Supprimer tout
//   3. Coller ce code
//   4. Enregistrer (Ctrl+S)

var CABINET_EMAIL = 'office@mokadmi.lawyer';
var CABINET_NOM   = 'Maitre Mokadmi Sami';
var CABINET_TEL   = '+216 29 784 651';
var CABINET_SITE  = 'www.mokadmi.lawyer';

function doPost(e) {
  try {
    var data    = JSON.parse(e.postData.contents);

    // Router selon l'action
    if (data.action === 'rdv') {
      handleRdv(data);
      return reponse(true, 'RDV envoye.');
    }

    var name    = data.name    || 'Client';
    var email   = data.email   || '';
    var company = data.company || '';
    var subject = data.subject || '';
    var message = data.message || '';

    if (!email) {
      return reponse(false, 'Email manquant.');
    }

    notifierCabinet(name, email, company, subject, message);
    repondreClient(name, email, subject, message);

    return reponse(true, 'OK');
  } catch (err) {
    Logger.log(err.toString());
    return reponse(false, err.toString());
  }
}

function detecterSujet(subject, message) {
  var texte = (subject + ' ' + message).toLowerCase();

  if (texte.indexOf('lev') > -1 || texte.indexOf('bspce') > -1 || texte.indexOf('seed') > -1 || texte.indexOf('cap table') > -1 || texte.indexOf('startup') > -1) {
    return {
      objet: 'Votre demande - Levee de fonds & BSPCE | Cabinet Mokadmi',
      tag: 'Levee de fonds & Ingenierie capitalistique',
      intro: 'Votre demande concernant la structuration de votre levee de fonds est entre nos mains.',
      points: 'Cap table | BSPCE & BSA | Pacte d\'associes | Term sheet | Risques juridiques pre-closing',
      delai: 'Premiere intervention possible sous 48 a 72h.'
    };
  }

  if (texte.indexOf('fisc') > -1 || texte.indexOf('holding') > -1 || texte.indexOf('exit') > -1 || texte.indexOf('optimis') > -1 || texte.indexOf('tva') > -1) {
    return {
      objet: 'Votre demande - Strategie fiscale & Holding | Cabinet Mokadmi',
      tag: 'Strategie fiscale & Holding',
      intro: 'Votre demande concernant la strategie fiscale ou la structuration holding est entre nos mains.',
      points: 'Audit fiscal | Holding patrimoniale ou operationnelle | Optimisation a l\'exit | Conventions bilaterales',
      delai: 'Architectures fiscales perennes et conformes - sans optimisation agressive.'
    };
  }

  if (texte.indexOf('m&a') > -1 || texte.indexOf('acquisition') > -1 || texte.indexOf('fusion') > -1 || texte.indexOf('diligence') > -1) {
    return {
      objet: 'Votre demande - M&A & Transactions | Cabinet Mokadmi',
      tag: 'M&A & Transactions',
      intro: 'Votre demande relative a une operation de M&A est entre nos mains.',
      points: 'Due diligence juridique | Garantie actif/passif | Earn-out | Closing',
      delai: 'Reponse sous 24h ouvrees - la reactivite est essentielle.'
    };
  }

  if (texte.indexOf('automati') > -1 || texte.indexOf('workflow') > -1 || texte.indexOf('ia') > -1 || texte.indexOf('algorithme') > -1) {
    return {
      objet: 'Votre demande - Gouvernance IA & Automatisation | Cabinet Mokadmi',
      tag: 'Gouvernance IA & Automatisation juridique',
      intro: 'Votre demande concernant la gouvernance IA ou l\'automatisation juridique est entre nos mains.',
      points: 'Workflows juridiques automatises | IA Act europeen | Due diligence IA | Propriete intellectuelle des modeles',
      delai: 'Notre domaine de predilection - nous serons particulierement attentifs.'
    };
  }

  return {
    objet: 'Votre demande a bien ete recue | Cabinet Mokadmi',
    tag: 'Demande generale',
    intro: 'Notre cabinet intervient sur trois expertises complementaires.',
    points: 'Droit des affaires & levees de fonds | Strategie fiscale & holdings | Gouvernance IA & automatisation',
    delai: 'Un premier diagnostic de 90 minutes vous permettra de cartographier votre situation.'
  };
}

function notifierCabinet(name, email, company, subject, message) {
  var corps = 'Nouvelle demande de contact\n\n'
    + 'Nom : ' + name + '\n'
    + 'Email : ' + email + '\n'
    + 'Societe : ' + (company || '-') + '\n'
    + 'Sujet : ' + (subject || '-') + '\n'
    + 'Message : ' + (message || '-') + '\n\n'
    + 'Repondre a : ' + email;

  var html = '<div style="font-family:Arial,sans-serif;max-width:520px;border-top:4px solid #C9A96E;padding:24px;">'
    + '<h2 style="color:#C9A96E;margin:0 0 16px;">Nouvelle demande de contact</h2>'
    + '<p><b>Nom :</b> ' + name + '</p>'
    + '<p><b>Email :</b> <a href="mailto:' + email + '" style="color:#C9A96E;">' + email + '</a></p>'
    + '<p><b>Societe :</b> ' + (company || '-') + '</p>'
    + '<p><b>Sujet :</b> ' + (subject || '-') + '</p>'
    + '<p><b>Message :</b> ' + (message || '-') + '</p>'
    + '<hr style="margin:16px 0;border:none;border-top:1px solid #eee;"/>'
    + '<p style="font-size:12px;color:#999;">Repondre a : <a href="mailto:' + email + '">' + email + '</a></p>'
    + '</div>';

  GmailApp.sendEmail(
    CABINET_EMAIL,
    '[Contact] ' + name + ' - ' + (subject || 'Demande generale'),
    corps,
    { replyTo: email, htmlBody: html, name: 'Formulaire Site Cabinet Mokadmi' }
  );
}

function repondreClient(name, email, subject, message) {
  var s = detecterSujet(subject, message);

  var corps = 'Bonjour ' + name + ',\n\n'
    + s.intro + '\n\n'
    + 'Points traites : ' + s.points + '\n\n'
    + s.delai + '\n\n'
    + 'Reponse personnelle sous 24h ouvrees.\n'
    + 'Urgence : ' + CABINET_TEL + '\n\n'
    + 'Confirmer votre rendez-vous : https://' + CABINET_SITE + '/#booking\n\n'
    + '---\n'
    + CABINET_NOM + ' - Avocat au Barreau de Tunis\n'
    + CABINET_EMAIL + ' | ' + CABINET_SITE;

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>'
    + '<body style="margin:0;padding:0;background:#070C18;">'
    + '<div style="max-width:600px;margin:0 auto;">'

    + '<div style="background:#C9A96E;height:3px;"></div>'

    + '<div style="background:#0C1220;padding:32px 40px;">'
    + '<p style="margin:0 0 4px;font-family:Georgia,serif;font-size:18px;color:#E8EDF5;font-weight:bold;">' + CABINET_NOM + '</p>'
    + '<p style="margin:0 0 20px;font-size:10px;color:#C9A96E;letter-spacing:2px;text-transform:uppercase;">' + s.tag + '</p>'

    + '<p style="font-size:15px;color:#E8EDF5;font-family:Georgia,serif;margin:0 0 6px;">Bonjour ' + name + ',</p>'
    + '<p style="font-size:15px;color:#E8EDF5;margin:0 0 20px;">' + s.intro + '</p>'

    + '<div style="background:#111B2E;border-left:3px solid #C9A96E;padding:14px 18px;margin:0 0 20px;">'
    + '<p style="margin:0 0 6px;font-size:11px;color:#C9A96E;text-transform:uppercase;letter-spacing:1px;">Points traites</p>'
    + '<p style="margin:0;font-size:14px;color:rgba(232,237,245,0.75);line-height:1.8;">' + s.points.split('|').join('<br/>') + '</p>'
    + '</div>'

    + '<p style="font-size:14px;color:rgba(232,237,245,0.6);margin:0 0 8px;">' + s.delai + '</p>'
    + '<p style="font-size:14px;color:rgba(232,237,245,0.5);margin:0 0 28px;">Reponse personnelle sous <b style="color:#C9A96E;">24h ouvrees</b>. Urgence : <a href="tel:+21629784651" style="color:#C9A96E;text-decoration:none;">' + CABINET_TEL + '</a></p>'

    + '<div style="text-align:center;margin:0 0 20px;">'
    + '<a href="https://' + CABINET_SITE + '/rdv?name=' + encodeURIComponent(name) + '&email=' + encodeURIComponent(email) + '&subject=' + encodeURIComponent(subject) + '" style="display:inline-block;background:#C9A96E;color:#070C18;text-decoration:none;font-size:13px;font-weight:bold;padding:14px 32px;">CONFIRMER MON RENDEZ-VOUS</a>'
    + '</div>'
    + '</div>'

    + '<div style="background:#050A14;padding:16px 40px;">'
    + '<p style="font-size:11px;color:rgba(232,237,245,0.2);text-align:center;margin:0;">' + CABINET_NOM + ' - Avocat au Barreau de Tunis<br/><a href="mailto:' + CABINET_EMAIL + '" style="color:rgba(201,169,110,0.4);text-decoration:none;">' + CABINET_EMAIL + '</a> - <a href="https://' + CABINET_SITE + '" style="color:rgba(201,169,110,0.4);text-decoration:none;">' + CABINET_SITE + '</a></p>'
    + '</div>'

    + '<div style="background:#C9A96E;height:2px;"></div>'
    + '</div>'
    + '</body></html>';

  GmailApp.sendEmail(
    email,
    s.objet,
    corps,
    { replyTo: CABINET_EMAIL, htmlBody: html, name: CABINET_NOM }
  );
}

function reponse(ok, msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: ok, message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function testLocal() {
  repondreClient('Ahmed Ben Ali', 'sami.mokadmi@gmail.com', 'Levee de fonds Seed', 'On cherche un avocat pour notre levee de fonds de 500k.');
  notifierCabinet('Ahmed Ben Ali', 'sami.mokadmi@gmail.com', 'Tech Startup', 'Levee de fonds Seed', 'On cherche un avocat pour notre levee de fonds de 500k.');
  Logger.log('Test termine - verifier Gmail.');
}

// ============================================================
// GESTION DES RESERVATIONS RDV
// ============================================================

var SITE_URL = 'https://avocat-navy.vercel.app';
var TYPE_LABELS = { visio: 'Visioconference', presentiel: 'Presentiel - Tunis', telephone: 'Telephone' };

function handleRdv(data) {
  var name    = data.name    || '';
  var email   = data.email   || '';
  var subject = data.subject || '';
  var message = data.message || '';
  var date    = data.date    || '';
  var time    = data.time    || '';
  var type    = data.type    || 'visio';
  var notes   = data.notes   || '';

  var typeLabel = TYPE_LABELS[type] || type;
  var dateStr   = formatDate(date);

  // Encodage du RDV pour le lien magic admin
  var rdvData = {
    name:    name,
    email:   email,
    subject: subject,
    notes:   notes || message,
    date:    date,
    time:    time,
    type:    type
  };
  var encoded = Utilities.base64Encode(JSON.stringify(rdvData));
  var magicLink = SITE_URL + '/admin?rdv=' + encodeURIComponent(encoded);

  // 1. Email confirmation au client
  var clientHtml = ''
    + '<div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;">'
    + '<div style="background:#C9A96E;height:3px;"></div>'
    + '<div style="background:#0C1220;padding:32px 40px;">'
    + '<p style="margin:0 0 2px;font-family:Georgia,serif;font-size:18px;color:#E8EDF5;font-weight:bold;">' + CABINET_NOM + '</p>'
    + '<p style="margin:0 0 20px;font-size:10px;color:#C9A96E;letter-spacing:2px;text-transform:uppercase;">Demande de rendez-vous</p>'
    + '<p style="font-size:15px;color:#E8EDF5;font-family:Georgia,serif;margin:0 0 20px;">Bonjour ' + name + ',</p>'
    + '<p style="font-size:15px;color:#E8EDF5;margin:0 0 24px;">Votre demande de rendez-vous a bien ete recue. Voici le recapitulatif :</p>'
    + '<div style="background:#111B2E;border-left:3px solid #C9A96E;padding:18px 20px;margin:0 0 24px;">'
    + '<p style="margin:0 0 10px;font-size:13px;color:rgba(232,237,245,0.9);"><b style="color:#C9A96E;">Date :</b> ' + dateStr + '</p>'
    + '<p style="margin:0 0 10px;font-size:13px;color:rgba(232,237,245,0.9);"><b style="color:#C9A96E;">Heure :</b> ' + time + '</p>'
    + '<p style="margin:0 0 10px;font-size:13px;color:rgba(232,237,245,0.9);"><b style="color:#C9A96E;">Format :</b> ' + typeLabel + '</p>'
    + (subject ? '<p style="margin:0;font-size:13px;color:rgba(232,237,245,0.9);"><b style="color:#C9A96E;">Sujet :</b> ' + subject + '</p>' : '')
    + '</div>'
    + '<p style="font-size:14px;color:rgba(232,237,245,0.5);margin:0 0 28px;">Nous vous confirmerons ce creneau sous <b style="color:#C9A96E;">24h ouvrees</b>. Pour toute urgence : <a href="tel:+21629784651" style="color:#C9A96E;text-decoration:none;">' + CABINET_TEL + '</a></p>'
    + '</div>'
    + '<div style="background:#050A14;padding:14px 40px;">'
    + '<p style="font-size:11px;color:rgba(232,237,245,0.2);text-align:center;margin:0;">' + CABINET_NOM + ' - Avocat au Barreau de Tunis - ' + CABINET_EMAIL + '</p>'
    + '</div>'
    + '<div style="background:#C9A96E;height:2px;"></div>'
    + '</div>';

  GmailApp.sendEmail(
    email,
    'Demande de RDV recue - ' + dateStr + ' a ' + time + ' | Cabinet Mokadmi',
    'Bonjour ' + name + ', votre demande de RDV du ' + dateStr + ' a ' + time + ' a bien ete recue. Confirmation sous 24h. ' + CABINET_TEL,
    { replyTo: CABINET_EMAIL, htmlBody: clientHtml, name: CABINET_NOM }
  );

  // 2. Email notification admin avec lien magic
  var adminHtml = ''
    + '<div style="font-family:Arial,sans-serif;max-width:560px;border-top:4px solid #C9A96E;padding:24px;background:#fff;">'
    + '<h2 style="color:#C9A96E;margin:0 0 20px;">Nouvelle demande de RDV</h2>'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;width:90px;border-bottom:1px solid #eee;">Client</td><td style="padding:8px 12px;font-weight:bold;border-bottom:1px solid #eee;">' + name + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Email</td><td style="padding:8px 12px;border-bottom:1px solid #eee;"><a href="mailto:' + email + '" style="color:#C9A96E;">' + email + '</a></td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Date</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">' + dateStr + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Heure</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">' + time + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Format</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">' + typeLabel + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;border-bottom:1px solid #eee;">Sujet</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">' + (subject || '-') + '</td></tr>'
    + '<tr><td style="padding:8px 12px;background:#f5f5f5;color:#666;vertical-align:top;">Notes</td><td style="padding:8px 12px;">' + (notes || message || '-') + '</td></tr>'
    + '</table>'
    + '<div style="text-align:center;margin:28px 0;">'
    + '<a href="' + magicLink + '" style="display:inline-block;background:#C9A96E;color:#070C18;text-decoration:none;font-size:14px;font-weight:bold;padding:14px 32px;">CREER LE RDV DANS LE DASHBOARD</a>'
    + '</div>'
    + '<p style="font-size:12px;color:#999;text-align:center;">Cliquez sur le bouton ci-dessus pour ajouter automatiquement ce RDV dans l\'espace admin.</p>'
    + '</div>';

  GmailApp.sendEmail(
    CABINET_EMAIL,
    '[RDV] ' + name + ' - ' + dateStr + ' a ' + time,
    'Nouvelle demande de RDV de ' + name + ' (' + email + ') pour le ' + dateStr + ' a ' + time + '. Sujet : ' + (subject || '-'),
    { replyTo: email, htmlBody: adminHtml, name: 'Systeme RDV Cabinet Mokadmi' }
  );
}

function formatDate(iso) {
  if (!iso) return '-';
  var parts = iso.split('-');
  var mois = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
  return parts[2] + ' ' + mois[parseInt(parts[1]) - 1] + ' ' + parts[0];
}
