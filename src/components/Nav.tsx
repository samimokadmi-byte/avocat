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
  { id: 'shield',    label: 'Shield' },
  { id: 'afrb',      label: 'AFRB' },
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
      <div className={`md:hidden absolute top-full left-0 right-0 bg-dark-bg border-b border-t border-gold/10 transition-all duration-300 ease-in-out ${
        open ? 'max-h-[90dvh] opacity-100 py-6 px-6 overflow-y-auto' : 'max-h-0 opacity-0 py-0 px-6 overflow-hidden'
      }`}>
        <div className="flex flex-col gap-1">
          {links.map(l => (
            <button
              key={l.id}
              onClick={() => { scrollTo(l.id); setOpen(false) }}
              className="text-base font-medium text-left text-light/70 hover:text-gold transition-colors py-3 border-b border-gold/5 last:border-0"
            >
              {l.label}
            </button>
          ))}

          <div className="h-px bg-gold/10 my-3" />

          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-light/45 hover:text-light/70 transition-colors py-2"
          >
            Espace client
          </Link>

          {/* Bouton Consultation — toujours visible en bas du menu */}
          <button
            onClick={() => { scrollTo('booking'); setOpen(false) }}
            className="flex items-center justify-center gap-2 bg-gold text-dark-bg text-sm font-bold px-4 py-4 hover:bg-gold/90 transition-colors mt-3 w-full"
          >
            <Zap size={12} strokeWidth={2} />
            Consultation — Diagnostic 90 min
          </button>
        </div>
      </div>
    </header>
  )
}
