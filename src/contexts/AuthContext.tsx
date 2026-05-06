import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { hashPassword, verifyPassword } from '../utils/crypto'

export interface User {
  id: string
  name: string
  email: string
  company?: string
  role: 'client' | 'admin'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signup: (name: string, email: string, password: string, company?: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

interface StoredAccount {
  passwordHash: string
  user: User
}

const AuthContext = createContext<AuthContextType | null>(null)

const ADMIN_EMAIL = 'admin@cabinet.fr'
const ADMIN_PASSWORD = 'Admin2024!'

/**
 * Ensures the admin account exists in localStorage with a hashed password.
 * Migrates legacy plaintext passwords on first run.
 */
async function ensureAdmin() {
  const raw = localStorage.getItem('avocat_accounts') || '{}'
  const accounts: Record<string, StoredAccount | { password: string; user: User }> = JSON.parse(raw)

  // Migrate any legacy plaintext accounts to hashed
  let migrated = false
  for (const key of Object.keys(accounts)) {
    const entry = accounts[key] as any
    if ('password' in entry && !('passwordHash' in entry)) {
      entry.passwordHash = await hashPassword(entry.password)
      delete entry.password
      migrated = true
    }
  }

  if (!accounts[ADMIN_EMAIL]) {
    const admin: User = { id: 'admin-001', name: 'Maître Mokadmi Sami', email: ADMIN_EMAIL, role: 'admin' }
    accounts[ADMIN_EMAIL] = { passwordHash: await hashPassword(ADMIN_PASSWORD), user: admin }
    migrated = true
  }

  if (migrated) localStorage.setItem('avocat_accounts', JSON.stringify(accounts))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  /**
   * Session is stored in memory only — NOT in localStorage or sessionStorage.
   * This prevents XSS-based session theft: a malicious script injected into
   * the page cannot read React state from another closure.
   */
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => { ensureAdmin() }, [])

  const login = async (email: string, password: string) => {
    if (!email || !password) return { ok: false, error: 'Champs requis.' }
    const accounts: Record<string, StoredAccount> = JSON.parse(
      localStorage.getItem('avocat_accounts') || '{}'
    )
    const account = accounts[email.toLowerCase()]
    if (!account) return { ok: false, error: 'Aucun compte trouvé pour cet email.' }

    const valid = await verifyPassword(password, account.passwordHash)
    if (!valid) return { ok: false, error: 'Mot de passe incorrect.' }

    setUser(account.user)
    return { ok: true }
  }

  const signup = async (name: string, email: string, password: string, company?: string) => {
    if (!name || !email || !password) return { ok: false, error: 'Champs requis.' }
    const accounts: Record<string, StoredAccount> = JSON.parse(
      localStorage.getItem('avocat_accounts') || '{}'
    )
    if (accounts[email.toLowerCase()]) return { ok: false, error: 'Un compte existe déjà pour cet email.' }

    const newUser: User = { id: crypto.randomUUID(), name, email: email.toLowerCase(), company, role: 'client' }
    accounts[email.toLowerCase()] = { passwordHash: await hashPassword(password), user: newUser }
    localStorage.setItem('avocat_accounts', JSON.stringify(accounts))
    seedDemoData(newUser.id)
    setUser(newUser)
    return { ok: true }
  }

  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function seedDemoData(userId: string) {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const addDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d }

  const dossiers = [
    {
      id: crypto.randomUUID(),
      titre: 'Levée de fonds Série A',
      statut: 'en_cours',
      dateOuverture: '2024-01-15',
      prochainEcheance: '2024-04-01',
      description: 'Structuration juridique et accompagnement closing Série A.',
      etapes: [
        { label: 'Audit capitalistique', statut: 'done', date: '15 jan. 2024' },
        { label: 'Structuration', statut: 'done', date: '01 fév. 2024' },
        { label: 'Négociation term sheet', statut: 'current', date: 'En cours' },
        { label: 'Closing', statut: 'pending', date: null },
      ],
    },
    {
      id: crypto.randomUUID(),
      titre: "Pacte d'associés",
      statut: 'complete',
      dateOuverture: '2023-09-10',
      prochainEcheance: null,
      description: "Rédaction et négociation du pacte entre fondateurs et investisseurs.",
      etapes: [
        { label: 'Analyse de la situation', statut: 'done', date: '10 sep. 2023' },
        { label: 'Rédaction', statut: 'done', date: '01 oct. 2023' },
        { label: 'Validation parties', statut: 'done', date: '20 oct. 2023' },
        { label: 'Signature', statut: 'done', date: '05 nov. 2023' },
      ],
    },
    {
      id: crypto.randomUUID(),
      titre: 'Protection des données',
      statut: 'attente',
      dateOuverture: '2024-02-20',
      prochainEcheance: '2024-05-01',
      description: 'Mise en conformité du traitement des données personnelles.',
      etapes: [
        { label: 'Diagnostic', statut: 'current', date: '20 fév. 2024' },
        { label: "Plan d'action", statut: 'pending', date: null },
        { label: 'Mise en conformité', statut: 'pending', date: null },
        { label: 'Validation finale', statut: 'pending', date: null },
      ],
    },
  ]

  const rdvs = [
    { id: crypto.randomUUID(), title: "Point d'avancement — Série A", date: fmt(addDays(3)), time: '10:00', type: 'visio', notes: "Revue du term sheet avec l'investisseur lead.", clientId: userId },
    { id: crypto.randomUUID(), title: "Signature pacte d'associés", date: fmt(addDays(7)), time: '14:30', type: 'presentiel', notes: 'Réunion au cabinet. Prévoir les documents constitutifs.', clientId: userId },
    { id: crypto.randomUUID(), title: 'Consultation — Protection des données', date: fmt(addDays(14)), time: '11:00', type: 'telephone', notes: 'Premier point sur le plan de conformité.', clientId: userId },
  ]

  const todos = [
    { id: crypto.randomUUID(), title: 'Envoyer les statuts mis à jour', done: false, priority: 'urgente', dueDate: fmt(addDays(2)), clientId: userId, createdAt: today.toISOString() },
    { id: crypto.randomUUID(), title: 'Préparer le cap table pour la data room', done: false, priority: 'urgente', dueDate: fmt(addDays(5)), clientId: userId, createdAt: today.toISOString() },
    { id: crypto.randomUUID(), title: 'Valider les clauses de liquidité préférentielle', done: false, priority: 'normale', dueDate: fmt(addDays(10)), clientId: userId, createdAt: today.toISOString() },
    { id: crypto.randomUUID(), title: 'Transmettre les 3 dernières liasses fiscales', done: true, priority: 'normale', clientId: userId, createdAt: today.toISOString() },
  ]

  localStorage.setItem(`avocat_dossiers_${userId}`, JSON.stringify(dossiers))
  localStorage.setItem(`avocat_documents_${userId}`, JSON.stringify([]))
  localStorage.setItem(`avocat_rdv_${userId}`, JSON.stringify(rdvs))
  localStorage.setItem(`avocat_todos_${userId}`, JSON.stringify(todos))
}
