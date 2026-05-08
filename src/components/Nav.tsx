import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import { scrollTo } from '../utils/scrollTo'
import Logo from './Logo'

const links = [
  { id: 'apropos',   label: 'À propos' },
  { id: 'systeme',   label: 'Expertise' },
  { id: 'methode',   label: 'Méthode' },
  { id: 'resultats', label: 'Résultats' },
  { id: 'blog',      label: 'Blog' },
  { id: 'faq',       label: 'FAQ' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-bg/95 backdrop-blur-sm border-b border-gold/10' : 'bg-transparent'
    }`}>
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">

        {/* Brand lockup: circular logo + wordmark */}
        <Link to="/" className="flex items-center gap-3">
          <Logo size={40} />
          <div className="flex flex-col">
            <span className="font-serif text-base tracking-tight font-semibold text-light leading-tight">
              Maître Mokadmi Sami
            </span>
            <span className="text-[10px] text-gold/60 tracking-[0.15em] uppercase">
              L'Architecte Juridique
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-xs font-medium tracking-wide uppercase text-light/40 hover:text-gold transition-colors duration-200"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/login"
            className="text-xs font-medium text-light/30 hover:text-light/60 transition-colors"
          >
            Espace client
          </Link>
          <button
            onClick={() => scrollTo('booking')}
            className="flex items-center gap-1.5 text-xs font-medium bg-gold text-dark-bg px-4 py-2 hover:bg-gold/90 transition-colors"
          >
            <Zap size={10} strokeWidth={2} /> Consultation
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          className="md:hidden text-light/50 hover:text-light transition-colors p-1"
        >
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-dark-bg/98 backdrop-blur-sm border-b border-gold/10 overflow-hidden transition-all duration-300 ease-in-out ${
        open ? 'max-h-[500px] opacity-100 py-6 px-6' : 'max-h-0 opacity-0 py-0 px-6'
      }`}>
        <div className="flex flex-col gap-4">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => { scrollTo(l.id); setOpen(false) }}
              className="text-base font-medium text-left text-light/50 hover:text-gold transition-colors py-2"
            >
              {l.label}
            </button>
          ))}
          <div className="h-px bg-gold/10 my-1" />
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-base text-light/30 hover:text-light/60 transition-colors py-2"
          >
            Espace client
          </Link>
          <button
            onClick={() => { scrollTo('booking'); setOpen(false) }}
            className="text-base font-medium bg-gold text-dark-bg px-4 py-4 text-center hover:bg-gold/90 transition-colors mt-2"
          >
            Prendre rendez-vous
          </button>
        </div>
      </div>
    </header>
  )
}
