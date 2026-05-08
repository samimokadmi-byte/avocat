export interface Etape {
  label: string
  statut: 'done' | 'current' | 'pending'
  date: string | null
}

export interface Dossier {
  id: string
  titre: string
  statut: 'en_cours' | 'complete' | 'attente'
  dateOuverture: string
  prochainEcheance: string | null
  description: string
  etapes: Etape[]
}
