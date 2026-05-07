import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) navigate('/dashboard')
    else setError(result.error ?? 'Erreur de connexion.')
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

          <h1 className="font-display text-3xl font-normal text-paper mb-2">Connexion</h1>
          <p className="text-sm text-paper/50 mb-10">Accédez à vos dossiers et documents sécurisés.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ahmed@startup.tn"
                className="border-b border-paper/15 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full border-b border-paper/15 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors pr-8"
                />
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
              {loading ? 'Connexion…' : 'Se connecter'}
              {!loading && <ArrowRight size={14} strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 text-sm text-paper/35 text-center">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-accent hover:text-accent/80 transition-colors">
              Créer un accès client
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
