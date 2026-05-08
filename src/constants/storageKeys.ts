export const STORAGE_KEYS = {
  accounts: 'avocat_accounts',
  dossiers: (userId: string) => `avocat_dossiers_${userId}`,
  documents: (userId: string) => `avocat_documents_${userId}`,
  rdvs: (userId: string) => `avocat_rdv_${userId}`,
  todos: (userId: string) => `avocat_todos_${userId}`,
  invoices: (userId: string) => `avocat_invoices_${userId}`,
} as const
