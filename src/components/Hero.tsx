import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section
      id="hero"
      className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-section max-w-content mx-auto"
    >
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-8">
        Droit des Affaires · Tech &amp; Fundraising
      </p>

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
          href="#systeme"
          className="inline-flex items-center text-sm font-medium text-navy/50 hover:text-navy py-4 transition-colors duration-200"
        >
          Voir le système
        </a>
      </div>

      <div className="mt-section-sm border-t border-navy/10" />
    </section>
  )
}
