/**
 * dossierSync.ts — Synchronisation automatique des dossiers client
 *
 * Règle métier : dès qu'une action est créée pour un client (facture, tâche,
 * RDV, document uploadé), un dossier "parent" est automatiquement créé si le
 * client n'en possède pas encore un par défaut.
 *
 * Ce module est appelé partout où une entité est créée côté admin.
 */

export interface SyncDossier {
  id: string
  titre: string
  statut: 'en_cours' | 'complete' | 'attente'
  dateOuverture: string
  prochainEcheance: string | null
  description: string
  etapes: Array<{ label: string; statut: 'done' | 'current' | 'pending'; date: string | null }>
  autoCreated?: boolean   // marqueur d'un dossier auto-généré
  origin?: string         // 'facture' | 'todo' | 'rdv' | 'document'
}

const storageKey = (userId: string) => `avocat_dossiers_${userId}`

// ── Lecture / écriture ────────────────────────────────────────────────────────

export function getDossiers(userId: string): SyncDossier[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]')
  } catch {
    return []
  }
}

export function saveDossiersSync(userId: string, dossiers: SyncDossier[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(dossiers))
}

// ── Création d'un dossier générique ──────────────────────────────────────────

function buildDefaultDossier(
  titre: string,
  origin: SyncDossier['origin'],
  description: string,
): SyncDossier {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  const dateFr  = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return {
    id:              crypto.randomUUID(),
    titre,
    statut:          'en_cours',
    dateOuverture:   dateStr,
    prochainEcheance: null,
    description,
    autoCreated:     true,
    origin,
    etapes: [
      {
        label:  'Ouverture automatique du dossier',
        statut: 'done',
        date:   dateFr,
      },
      {
        label:  'Prise en charge par le cabinet',
        statut: 'current',
        date:   dateFr,
      },
      {
        label:  'Clôture du dossier',
        statut: 'pending',
        date:   null,
      },
    ],
  }
}

// ── API publique ──────────────────────────────────────────────────────────────

/**
 * Garantit qu'un dossier avec le titre donné existe pour ce client.
 * Si absent → le crée automatiquement.
 * Retourne l'id du dossier (existant ou nouvellement créé).
 */
export function ensureDossier(
  userId:      string,
  titre:       string,
  origin:      SyncDossier['origin'],
  description: string,
): string {
  const dossiers = getDossiers(userId)

  // Chercher un dossier existant avec le même titre (insensible à la casse)
  const existing = dossiers.find(d =>
    d.titre.trim().toLowerCase() === titre.trim().toLowerCase()
  )
  if (existing) return existing.id

  // Créer le dossier manquant
  const newDossier = buildDefaultDossier(titre, origin, description)
  saveDossiersSync(userId, [...dossiers, newDossier])
  return newDossier.id
}

/**
 * Sync déclenchée lors de la création d'une FACTURE.
 * Si la facture a un dossierId vide mais un clientName → crée le dossier.
 */
export function syncOnInvoice(
  userId:     string,
  clientName: string,
  invoiceNum: string,
): void {
  const titre = `Dossier client — ${clientName}`
  ensureDossier(
    userId,
    titre,
    'facture',
    `Dossier créé automatiquement lors de l'émission de la facture ${invoiceNum}.`,
  )
}

/**
 * Sync déclenchée lors de la création d'une TÂCHE (todo).
 */
export function syncOnTodo(
  userId:     string,
  clientName: string,
  todoTitle:  string,
): void {
  const titre = `Dossier client — ${clientName}`
  ensureDossier(
    userId,
    titre,
    'todo',
    `Dossier créé automatiquement lors de l'assignation de la tâche « ${todoTitle} ».`,
  )
}

/**
 * Sync déclenchée lors de la création d'un RDV.
 */
export function syncOnRdv(
  userId:     string,
  clientName: string,
  rdvTitle:   string,
): void {
  const titre = `Dossier client — ${clientName}`
  ensureDossier(
    userId,
    titre,
    'rdv',
    `Dossier créé automatiquement lors de la planification du RDV « ${rdvTitle} ».`,
  )
}

/**
 * Sync déclenchée lors de l'UPLOAD d'un document.
 */
export function syncOnDocument(
  userId:     string,
  clientName: string,
  docName:    string,
): void {
  const titre = `Dossier client — ${clientName}`
  ensureDossier(
    userId,
    titre,
    'document',
    `Dossier créé automatiquement lors du dépôt du document « ${docName} ».`,
  )
}
