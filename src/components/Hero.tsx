import { ArrowRight } from 'lucide-react'
import { scrollTo } from '../utils/scrollTo'

const stats = [
  { value: '24',     label: "ans d'expérience" },
  { value: '97%',    label: 'dossiers finalisés' },
  { value: '3-en-1', label: 'Droit · Fiscal · IA' },
]

export default function Hero() {
  return (
    <section
      id="hero"
      className="bg-paper min-h-screen flex flex-col justify-center px-8 pt-28 pb-16 md:pt-32 md:pb-section max-w-content mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 md:gap-16 items-center">
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-hairline-strong bg-paper-2 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green flex-none" />
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2">
              L'Architecte Juridique · 24 ans d'excellence
            </span>
          </div>

          <h1 className="font-display text-display text-ink font-normal max-w-3xl mb-6 text-pretty">
            Concevoir la sécurité juridique{' '}
            <span className="italic text-accent">de demain</span>
          </h1>

          <p className="text-subhead text-text2 max-w-[38ch] mb-4 font-light leading-relaxed">
            La sagesse de 24 ans d'expérience au service de l'innovation de rupture.
          </p>
          <p className="text-small text-text2 max-w-[38ch] mb-10 md:mb-12 leading-relaxed">
            Ingénierie juridique, fiscalité stratégique et intelligence artificielle — pour les fondateurs
            qui pensent en systèmes, pas en documents.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <button
              onClick={() => scrollTo('booking')}
              className="inline-flex items-center gap-3 bg-ink text-paper rounded-full px-[22px] py-[14px] text-sm font-medium hover:-translate-y-0.5 transition-all duration-200"
            >
              Prendre rendez-vous
              <ArrowRight size={15} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => scrollTo('systeme')}
              className="inline-flex items-center gap-2 border border-ink text-ink rounded-full px-[22px] py-[14px] text-sm font-medium hover:-translate-y-0.5 transition-all duration-200"
            >
              Découvrir l'architecture
              <ArrowRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex md:flex-col gap-4 flex-wrap">
          {stats.map(({ value, label }) => (
            <div key={label} className="bg-paper-2 border border-hairline-strong px-6 py-5 text-center min-w-[120px]">
              <p className="font-display text-3xl font-normal text-accent leading-none mb-1">{value}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-section-sm border-t border-hairline" />
    </section>
  )
}
