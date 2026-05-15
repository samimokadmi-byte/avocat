/**
 * dossierSync.ts
 *
 * REGLE METIER :
 * Les dossiers sont crees UNIQUEMENT par l'admin (via l'interface admin)
 * ou par le client manuellement dans son espace.
 * Plus de creation automatique (pas de dossiers fantomes).
 */

export interface SyncDossier {
  id: string
  titre: string
  client?: string
  statut: 'en_cours' | 'complete' | 'attente'
  dateOuverture: string
  prochainEcheance: string | null
  description: string
  etapes: Array<{ label: string; statut: 'done' | 'current' | 'pending'; date: string | null }>
  autoCreated?: boolean
  origin?: string
}

const storageKey = (userId: string) => `avocat_dossiers_${userId}`

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

// Stubs conserves pour compatibilite des imports existants
export function ensureDossier(): string { return '' }
export function syncOnInvoice(): void {}
export function syncOnTodo(): void {}
export function syncOnRdv(): void {}
export function syncOnDocument(): void {}
