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
    <section id="methode" className="bg-white">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">[03]</span>
          <span className="w-8 h-px bg-gray-300 flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray-400">Méthode</span>
        </div>

        <h2 className="font-display text-heading text-gray-900 font-normal mb-12 md:mb-16 max-w-xl text-pretty">
          Trois actes.{' '}
          <span className="italic text-accent">Zéro improvisation.</span>
        </h2>

        <div className="flex flex-col">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex gap-8 md:gap-16 pb-12 md:pb-16 last:pb-0">
              {i < steps.length - 1 && (
                <div className="absolute left-[1.35rem] top-12 bottom-0 w-px bg-gray-200" />
              )}

              <div className="relative flex-none w-11 h-11 border border-gray-200 bg-slate-50 flex items-center justify-center">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-accent">{step.number}</span>
              </div>

              <div className="flex-1 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 mb-4">
                  <h3 className="font-display text-xl font-normal text-gray-900">{step.title}</h3>
                  <span className="inline-flex items-center border border-gray-200 rounded-full px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em] text-gray-400 mt-1.5 sm:mt-0 self-start">
                    {step.duration}
                  </span>
                </div>
                <p className="text-body text-gray-600 leading-relaxed max-w-prose-luxury">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
