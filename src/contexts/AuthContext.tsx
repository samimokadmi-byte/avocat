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
  passwordHash:   string
  user:           User
  confirmToken?:  string
  confirmed?:     boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// ── Admin credentials — définis via variables d'environnement Vercel ─────────
// Ne jamais hardcoder ces valeurs dans le code source.
// Configurer dans Vercel → Project Settings → Environment Variables :
//   VITE_ADMIN_EMAIL    = votre email admin
//   VITE_ADMIN_PASSWORD = mot de passe fort (≥16 chars)
const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL    ?? 'admin@cabinet.fr'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? ''

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
      entry.passwordHash = await hashPassword(entry.password, key)
      delete entry.password
      migrated = true
    }
  }

  if (!accounts[ADMIN_EMAIL]) {
    const admin: User = { id: 'admin-001', name: 'Maître Mokadmi Sami', email: ADMIN_EMAIL, role: 'admin' }
    accounts[ADMIN_EMAIL] = { passwordHash: await hashPassword(ADMIN_PASSWORD, ADMIN_EMAIL), user: admin }
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

    const valid = await verifyPassword(password, account.passwordHash, email.toLowerCase())
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
    const confirmToken = crypto.randomUUID()

    accounts[email.toLowerCase()] = {
      passwordHash: await hashPassword(password, email.toLowerCase()),
      user: newUser,
      confirmToken,
      confirmed: false,
    }
    localStorage.setItem('avocat_accounts', JSON.stringify(accounts))

    // Initialiser l'espace client VIDE — aucune donnée fictive
    localStorage.setItem(`avocat_dossiers_${newUser.id}`,  JSON.stringify([]))
    localStorage.setItem(`avocat_documents_${newUser.id}`, JSON.stringify([]))
    localStorage.setItem(`avocat_rdv_${newUser.id}`,       JSON.stringify([]))
    localStorage.setItem(`avocat_todos_${newUser.id}`,     JSON.stringify([]))

    // Envoyer l'email de bienvenue (non bloquant mais on log les erreurs)
    fetch('/api/send-welcome', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email: email.toLowerCase(), confirmToken }),
    }).then(async r => {
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        console.error('[send-welcome] Erreur:', r.status, err)
      }
    }).catch(err => console.error('[send-welcome] Fetch error:', err))

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
