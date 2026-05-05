import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { label: 'Expertises', href: '#expertises' },
  { label: 'Méthode', href: '#honoraires' },
  { label: 'Résultats', href: '#resultats' },
  { label: 'Veille', href: '#veille' },
  { label: 'FAQ', href: '#faq' },
]

export default function Nav() {
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-offwhite border-b border-navy/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex flex-col">
          <span className="font-serif text-lg tracking-tight font-semibold text-navy leading-tight">Sami Mokadmi</span>
          <span className="text-xs text-navy/40 tracking-wide">Avocat — Droit des Affaires &amp; Tech</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-navy/60 hover:text-navy transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#booking"
            className="text-sm font-medium text-navy/60 hover:text-navy transition-colors duration-200"
          >
            Contact
          </a>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="text-sm font-medium border border-navy px-4 py-1.5 text-navy hover:bg-navy hover:text-offwhite transition-colors duration-200"
          >
            {user ? 'Mon espace' : 'Espace client'}
          </Link>
        </nav>

        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden w-8 h-8 flex flex-col justify-center gap-[5px]"
          aria-label="Menu"
        >
          <span className={`block h-px bg-navy transition-all duration-200 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
          <span className={`block h-px bg-navy transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-px bg-navy transition-all duration-200 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-offwhite border-t border-navy/10 px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-navy/60 hover:text-navy transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a href="#booking" onClick={() => setOpen(false)} className="text-sm font-medium text-navy/60 hover:text-navy transition-colors">
            Contact
          </a>
          <Link
            to={user ? '/dashboard' : '/login'}
            onClick={() => setOpen(false)}
            className="text-sm font-medium border border-navy px-4 py-2 text-center text-navy hover:bg-navy hover:text-offwhite transition-colors"
          >
            {user ? 'Mon espace' : 'Espace client'}
          </Link>
        </div>
      )}
    </header>
  )
}
