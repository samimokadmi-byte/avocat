const steps = [
  {
    number: '01',
    title: 'Audit',
    duration: '1 semaine',
    description:
      "Analyse complète de votre situation juridique, fiscale et capitalistique. Identification des risques latents et des opportunités non exploitées dans votre structure actuelle.",
  },
  {
    number: '02',
    title: 'Structuration',
    duration: '2–3 semaines',
    description:
      "Élaboration de la feuille de route juridique sur mesure. Choix des véhicules, rédaction des documents fondateurs, arbitrages stratégiques entre les options disponibles.",
  },
  {
    number: '03',
    title: 'Exécution',
    duration: 'Continu',
    description:
      "Accompagnement lors des négociations, des signatures et des levées. Vous n'êtes jamais seul face aux investisseurs ou aux contreparties — nous sommes dans la salle.",
  },
]

export default function Method() {
  return (
    <section id="methode" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Méthode
      </p>
      <h2 className="font-serif text-heading text-navy mb-16 max-w-xl">
        Un processus en trois actes, sans improvisation.
      </h2>

      <div className="flex flex-col">
        {steps.map((step, i) => (
          <div key={step.number} className="relative flex gap-10 md:gap-16 pb-16 last:pb-0">
            {i < steps.length - 1 && (
              <div className="absolute left-[1.35rem] top-12 bottom-0 w-px bg-navy/10" />
            )}

            <div className="relative flex-none w-11 h-11 border border-navy flex items-center justify-center">
              <span className="text-xs font-medium tracking-wide text-navy">{step.number}</span>
            </div>

            <div className="flex-1 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-5 mb-4">
                <h3 className="font-serif text-xl font-semibold text-navy">{step.title}</h3>
                <span className="text-xs font-medium text-navy/40 tracking-wide uppercase mt-1 sm:mt-0">
                  {step.duration}
                </span>
              </div>
              <p className="text-sm text-navy/60 leading-relaxed max-w-prose-luxury">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
