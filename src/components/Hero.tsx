import { ArrowRight, Zap } from 'lucide-react'
import { scrollTo } from '../utils/scrollTo'

const stats = [
  { value: '23',   label: "ans d'expérience" },
  { value: '97%',  label: 'dossiers finalisés' },
  { value: '3-en-1', label: 'Droit · Fiscal · IA' },
]

export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-section max-w-content mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 md:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border border-gold/20 bg-gold/5 px-3 py-1.5 mb-8">
            <Zap size={10} className="text-gold" strokeWidth={2} />
            <span className="text-xs font-medium text-gold/80 tracking-wide">
              L'Architecte Juridique · 23 ans d'excellence
            </span>
          </div>

          <h1 className="font-serif text-display text-light max-w-3xl mb-6">
            Concevoir la sécurité juridique de demain
          </h1>

          <p className="text-subhead text-light/50 max-w-prose-luxury mb-4 font-light leading-relaxed">
            La sagesse de 23 ans d'expérience au service de l'innovation de rupture.
          </p>
          <p className="text-sm text-light/35 max-w-prose-luxury mb-12 leading-relaxed">
            Ingénierie juridique, fiscalité stratégique et intelligence artificielle — pour les fondateurs
            qui pensent en systèmes, pas en documents.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <button
              onClick={() => scrollTo('booking')}
              className="inline-flex items-center gap-3 bg-gold text-dark-bg text-sm font-medium px-7 py-4 hover:bg-gold/90 transition-colors duration-200"
            >
              Prendre rendez-vous
              <ArrowRight size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => scrollTo('systeme')}
              className="inline-flex items-center gap-2 text-sm font-medium text-light/40 hover:text-gold py-4 transition-colors duration-200"
            >
              Découvrir l'architecture
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 md:flex md:flex-col gap-3 w-full md:w-auto">
          {stats.map(({ value, label }) => (
            <div key={label} className="border border-gold/15 bg-dark-surface px-2 py-4 sm:px-4 sm:py-5 text-center">
              <p className="font-serif text-xl sm:text-3xl font-bold text-gold leading-none mb-1">{value}</p>
              <p className="text-[9px] sm:text-[10px] text-light/35 font-medium uppercase tracking-wider leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-section-sm border-t border-gold/10" />
    </section>
  )
}
