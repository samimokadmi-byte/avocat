import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

const AuthContext = createContext<AuthContextType | null>(null)

const ADMIN_EMAIL = 'admin@cabinet.fr'
const ADMIN_PASSWORD = 'Admin2024!'

function ensureAdmin() {
  const accounts: Record<string, { password: string; user: User }> = JSON.parse(
    localStorage.getItem('avocat_accounts') || '{}'
  )
  if (!accounts[ADMIN_EMAIL]) {
    const admin: User = {
      id: 'admin-001',
      name: 'Sami Mokadmi',
      email: ADMIN_EMAIL,
      role: 'admin',
    }
    accounts[ADMIN_EMAIL] = { password: ADMIN_PASSWORD, user: admin }
    localStorage.setItem('avocat_accounts', JSON.stringify(accounts))
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('avocat_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  useEffect(() => { ensureAdmin() }, [])

  useEffect(() => {
    if (user) localStorage.setItem('avocat_user', JSON.stringify(user))
    else localStorage.removeItem('avocat_user')
  }, [user])

  const login = async (email: string, password: string) => {
    if (!email || !password) return { ok: false, error: 'Champs requis.' }
    const accounts: Record<string, { password: string; user: User }> = JSON.parse(
      localStorage.getItem('avocat_accounts') || '{}'
    )
    const account = accounts[email.toLowerCase()]
    if (!account) return { ok: false, error: 'Aucun compte trouvé pour cet email.' }
    if (account.password !== password) return { ok: false, error: 'Mot de passe incorrect.' }
    setUser(account.user)
    return { ok: true }
  }

  const signup = async (name: string, email: string, password: string, company?: string) => {
    if (!name || !email || !password) return { ok: false, error: 'Champs requis.' }
    const accounts: Record<string, { password: string; user: User }> = JSON.parse(
      localStorage.getItem('avocat_accounts') || '{}'
    )
    if (accounts[email.toLowerCase()]) return { ok: false, error: 'Un compte existe déjà pour cet email.' }
    const newUser: User = { id: crypto.randomUUID(), name, email: email.toLowerCase(), company, role: 'client' }
    accounts[email.toLowerCase()] = { password, user: newUser }
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
  const dossiers = [
    {
      id: crypto.randomUUID(),
      titre: 'Levée de fonds Série A',
      statut: 'en_cours',
      dateOuverture: '2024-01-15',
      prochainEcheance: '2024-04-01',
      description: 'Structuration juridique et accompagnement closing Série A — 4,2 M€.',
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
      titre: 'Conformité RGPD',
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
  localStorage.setItem(`avocat_dossiers_${userId}`, JSON.stringify(dossiers))
  localStorage.setItem(`avocat_documents_${userId}`, JSON.stringify([]))
}
