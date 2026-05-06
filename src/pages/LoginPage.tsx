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
    <div className="min-h-screen bg-offwhite flex flex-col">
      <header className="border-b border-navy/10 px-6 h-16 flex items-center">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-lg font-semibold text-navy leading-tight">Maître Mokadmi Sami</span>
          <span className="text-xs text-navy/40 tracking-wide">Avocat — Droit des Affaires &amp; Tech</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-4">Espace Client</p>
          <h1 className="font-serif text-3xl text-navy mb-2">Connexion</h1>
          <p className="text-sm text-navy/50 mb-10">Accédez à vos dossiers et documents sécurisés.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jean@startup.fr"
                className="border-b border-navy/15 bg-transparent py-2.5 text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border-b border-navy/15 bg-transparent py-2.5 text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-0 top-2.5 text-navy/30 hover:text-navy/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 border border-red-200 bg-red-50 px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex items-center justify-center gap-3 bg-navy text-offwhite text-sm font-medium px-6 py-4 hover:bg-navy/90 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
              {!loading && <ArrowRight size={14} strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 text-sm text-navy/50 text-center">
            Pas encore de compte ?{' '}
            <Link to="/signup" className="text-navy font-medium hover:underline">
              Créer un accès client
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
