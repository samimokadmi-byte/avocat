import { ArrowRight } from 'lucide-react'

const stats = [
  { value: '24', label: "ans d'expérience" },
  { value: '97%', label: 'dossiers closés' },
]

export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-section max-w-content mx-auto"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 md:gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 border border-navy/15 px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-navy/40 rounded-full flex-none" />
            <span className="text-xs font-medium text-navy/60 tracking-wide">Barreau de Paris · 24 ans d'expérience</span>
          </div>

          <h1 className="font-serif text-display text-navy max-w-3xl mb-8">
            24 ans d'ingénierie juridique au service de la Tech
          </h1>

          <p className="text-subhead text-navy/60 max-w-prose-luxury mb-12 font-light">
            Sécuriser vos levées de fonds, structurer vos pactes d'associés et optimiser votre fiscalité — avec la précision d'un ingénieur et l'autorité de 24 ans de pratique.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <a
              href="#booking"
              className="inline-flex items-center gap-3 bg-navy text-offwhite text-sm font-medium px-7 py-4 hover:bg-navy/90 transition-colors duration-200"
            >
              Réserver un diagnostic stratégique
              <ArrowRight size={16} strokeWidth={1.5} />
            </a>
            <a
              href="#expertises"
              className="inline-flex items-center text-sm font-medium text-navy/50 hover:text-navy py-4 transition-colors duration-200"
            >
              Voir les expertises
            </a>
          </div>
        </div>

        <div className="flex md:flex-col gap-4 flex-wrap">
          {stats.map(({ value, label }) => (
            <div key={label} className="border border-navy/10 px-6 py-5 text-center min-w-[120px]">
              <p className="font-serif text-3xl font-bold text-navy leading-none mb-1">{value}</p>
              <p className="text-xs text-navy/50 font-medium leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-section-sm border-t border-navy/10" />
    </section>
  )
}
