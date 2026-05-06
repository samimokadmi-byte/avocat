import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen bg-dark-bg text-light flex flex-col font-sans">
      <header className="border-b border-gold/10 px-6 h-16 flex items-center">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-lg font-semibold text-light leading-tight">Maître Mokadmi Sami</span>
          <span className="text-[10px] text-gold/60 tracking-[0.15em] uppercase">L'Architecte Juridique</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">Espace Client</p>
          <h1 className="font-serif text-3xl text-light mb-2">Connexion</h1>
          <p className="text-sm text-light/40 mb-10">Accédez à vos dossiers et documents sécurisés.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-light/35 tracking-wide uppercase">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ahmed@startup.tn"
                className="border-b border-light/10 bg-transparent py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-light/35 tracking-wide uppercase">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full border-b border-light/10 bg-transparent py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors pr-8"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-0 top-2.5 text-light/25 hover:text-light/50 transition-colors">
                  {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 border border-red-500/20 bg-red-500/10 px-4 py-3">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-3 bg-gold text-dark-bg text-sm font-medium px-6 py-4 hover:bg-gold/90 transition-colors duration-200 disabled:opacity-50">
              {loading ? 'Connexion…' : 'Se connecter'}
              {!loading && <ArrowRight size={14} strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 text-sm text-light/35 text-center">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-gold hover:text-gold/80 transition-colors">
              Créer un accès client
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
