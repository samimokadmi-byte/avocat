import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [company, setCompany]   = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    setLoading(true)
    const result = await signup(name, email, password, company || undefined)
    setLoading(false)
    if (result.ok) navigate('/dashboard')
    else setError(result.error ?? 'Erreur lors de la création du compte.')
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex flex-col font-sans">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="border-b border-paper/10 px-6 h-16 flex items-center">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={32} />
          <div className="flex flex-col">
            <span className="font-display text-sm font-normal text-paper leading-tight">Maître Mokadmi Sami</span>
            <span className="font-mono text-[10px] text-accent tracking-[0.12em] uppercase">L'Architecte Juridique</span>
          </div>
        </Link>
      </header>

      {/* ── Form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          <div className="flex items-center gap-3 mb-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Espace Client</span>
            <span className="w-8 h-px bg-paper/15 flex-none" />
          </div>

          <h1 className="font-display text-3xl font-normal text-paper mb-2">Créer un accès</h1>
          <p className="text-sm text-paper/50 mb-10">Votre espace est activé après validation par le cabinet.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Nom complet</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="Ahmed Ben Ali"
                className="border-b border-paper/15 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ahmed@startup.tn"
                className="border-b border-paper/15 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">
                Société <span className="normal-case text-paper/20">(optionnel)</span>
              </label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                placeholder="Ma Startup"
                className="border-b border-paper/15 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="8 caractères minimum"
                  className="w-full border-b border-paper/15 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors pr-8" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-0 top-2.5 text-paper/25 hover:text-paper/60 transition-colors">
                  {showPwd ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 px-4 py-3">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-3 bg-accent text-paper text-sm font-medium px-6 py-4 rounded-full hover:bg-accent/90 transition-colors duration-200 disabled:opacity-50">
              {loading ? 'Création…' : 'Créer mon espace client'}
              {!loading && <ArrowRight size={14} strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 text-sm text-paper/35 text-center">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-accent hover:text-accent/80 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
