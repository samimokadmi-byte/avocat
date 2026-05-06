const steps = [
  {
    number: '01',
    title: 'Diagnostic Systémique',
    duration: '1 semaine',
    description:
      "Cartographie complète de votre situation juridique, fiscale et capitalistique. Identification des risques latents, des leviers non activés et des processus à automatiser dans votre structure.",
  },
  {
    number: '02',
    title: 'Architecture & Structuration',
    duration: '2–3 semaines',
    description:
      "Conception de l'architecture juridique sur mesure. Véhicules optimaux, documents fondateurs, arbitrages stratégiques — et modélisation des workflows à déployer pour vos équipes.",
  },
  {
    number: '03',
    title: 'Déploiement & Automatisation',
    duration: 'Continu',
    description:
      "Mise en œuvre, closing, négociations — et livraison des workflows automatisés. Vous recevez un système opérationnel, pas une pile de documents. Nous restons présents à chaque étape décisive.",
  },
]

export default function Method() {
  return (
    <section id="methode" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
        Méthode
      </p>
      <h2 className="font-serif text-heading text-light mb-16 max-w-xl">
        Trois actes. Zéro improvisation.
      </h2>

      <div className="flex flex-col">
        {steps.map((step, i) => (
          <div key={step.number} className="relative flex gap-10 md:gap-16 pb-16 last:pb-0">
            {i < steps.length - 1 && (
              <div className="absolute left-[1.35rem] top-12 bottom-0 w-px bg-gold/15" />
            )}

            <div className="relative flex-none w-11 h-11 border border-gold/30 bg-dark-surface flex items-center justify-center">
              <span className="text-xs font-medium tracking-wide text-gold">{step.number}</span>
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-5 mb-4">
                <h3 className="font-serif text-xl font-semibold text-light">{step.title}</h3>
                <span className="text-xs font-medium text-gold/40 tracking-wide uppercase mt-1 sm:mt-0">
                  {step.duration}
                </span>
              </div>
              <p className="text-sm text-light/50 leading-relaxed max-w-prose-luxury">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
