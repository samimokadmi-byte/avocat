import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      {/* ── Utility bar ──────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-8 bg-ink flex items-center">
        <div className="max-w-content mx-auto w-full px-8 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/50">
            Cabinet Mokadmi Sami — Barreau de Tunis — Fondé en 2006
          </span>
          <span className="hidden sm:block font-mono text-[11px] uppercase tracking-[0.06em] text-paper/35">
            office@mokadmi.lawyer
          </span>
        </div>
      </div>

      {/* ── Main nav ─────────────────────────────────────────────────── */}
      <header className={`fixed top-8 left-0 right-0 z-50 border-b border-hairline transition-all duration-300 ${
        scrolled ? 'bg-paper/95 backdrop-blur-sm' : 'bg-paper'
      }`}>
        <div className="max-w-content mx-auto px-8 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3">
            <Logo size={34} />
            <div className="flex flex-col">
              <span className="font-display text-sm font-normal tracking-tight text-ink leading-tight">
                Maître Mokadmi Sami
              </span>
              <span className="font-mono text-[10px] text-text2 tracking-[0.12em] uppercase">
                L'Architecte Juridique
              </span>
            </div>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2 hover:text-ink transition-colors duration-200"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/login"
              className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2 hover:text-ink transition-colors duration-200"
            >
              Espace client
            </Link>
            <button
              onClick={() => scrollTo('booking')}
              className="font-mono text-[11px] uppercase tracking-[0.06em] bg-ink text-paper rounded-full px-5 py-2.5 hover:-translate-y-0.5 transition-all duration-200"
            >
              Consultation →
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            className="md:hidden text-ink/50 hover:text-ink transition-colors p-1"
          >
            {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden bg-paper border-t border-hairline px-8 py-6 flex flex-col gap-4">
            {links.map(l => (
              <button
                key={l.id}
                onClick={() => { scrollTo(l.id); setOpen(false) }}
                className="font-mono text-[12px] uppercase tracking-[0.06em] text-left text-text2 hover:text-ink transition-colors py-1"
              >
                {l.label}
              </button>
            ))}
            <div className="h-px bg-hairline my-1" />
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="font-mono text-[12px] uppercase tracking-[0.06em] text-text2 hover:text-ink transition-colors"
            >
              Espace client
            </Link>
            <button
              onClick={() => { scrollTo('booking'); setOpen(false) }}
              className="font-mono text-[12px] uppercase tracking-[0.06em] bg-ink text-paper rounded-full px-5 py-3 text-center hover:-translate-y-0.5 transition-all duration-200"
            >
              Prendre rendez-vous →
            </button>
          </div>
        )}
      </header>
    </>
  )
}
