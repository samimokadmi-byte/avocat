import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
          <h1 className="font-serif text-3xl text-navy mb-2">Créer un accès</h1>
          <p className="text-sm text-navy/50 mb-10">Votre espace est activé après validation par le cabinet.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">Nom complet</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jean Dupont"
                className="border-b border-navy/15 bg-transparent py-2.5 text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
              />
            </div>

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
              <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">Société <span className="normal-case text-navy/30">(optionnel)</span></label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Ma Startup SAS"
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
                  placeholder="8 caractères minimum"
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
              {loading ? 'Création…' : 'Créer mon espace client'}
              {!loading && <ArrowRight size={14} strokeWidth={1.5} />}
            </button>
          </form>

          <p className="mt-8 text-sm text-navy/50 text-center">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-navy font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
