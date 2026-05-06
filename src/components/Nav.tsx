import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import { scrollTo } from '../utils/scrollTo'

const links = [
  { id: 'systeme',    label: 'Expertise' },
  { id: 'methode',    label: 'Méthode' },
  { id: 'resultats',  label: 'Résultats' },
  { id: 'blog',       label: 'Blog' },
  { id: 'faq',        label: 'FAQ' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

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
        <a href="/" className="flex flex-col">
          <span className="font-serif text-lg tracking-tight font-semibold text-light leading-tight">
            Maître Mokadmi Sami
          </span>
          <span className="text-[10px] text-gold/60 tracking-[0.15em] uppercase">L'Architecte Juridique</span>
        </a>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button key={l.id} onClick={() => scrollTo(l.id)}
              className="text-xs font-medium tracking-wide uppercase text-light/40 hover:text-gold transition-colors duration-200">
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-xs font-medium text-light/30 hover:text-light/60 transition-colors">
            Espace client
          </Link>
          <button onClick={() => scrollTo('booking')}
            className="flex items-center gap-1.5 text-xs font-medium bg-gold text-dark-bg px-4 py-2 hover:bg-gold/90 transition-colors">
            <Zap size={10} strokeWidth={2} /> Consultation
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(o => !o)} className="md:hidden text-light/50 hover:text-light transition-colors p-1">
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-dark-bg/98 backdrop-blur-sm border-b border-gold/10 px-6 py-6 flex flex-col gap-4">
          {links.map(l => (
            <button key={l.id} onClick={() => { scrollTo(l.id); setOpen(false) }}
              className="text-sm font-medium text-left text-light/50 hover:text-gold transition-colors py-1">
              {l.label}
            </button>
          ))}
          <div className="h-px bg-gold/10 my-1" />
          <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-light/30 hover:text-light/60 transition-colors">
            Espace client
          </Link>
          <button onClick={() => { scrollTo('booking'); setOpen(false) }}
            className="text-sm font-medium bg-gold text-dark-bg px-4 py-2.5 text-center hover:bg-gold/90 transition-colors">
            Prendre rendez-vous
          </button>
        </div>
      )}
    </header>
  )
}
