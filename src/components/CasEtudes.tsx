const cas = [
  {
    secteur: 'SaaS B2B · Série A',
    problematique:
      "Une startup de 12 personnes arrivait en closing de série A avec un cap table désorganisé : trois pactes contradictoires, des BSPCE mal structurés et un investisseur lead qui menaçait de se retirer.",
    solution:
      "Audit complet en 5 jours ouvrés via due diligence augmentée par IA, restructuration du cap table, fusion des pactes en un document unique, re-négociation des clauses de liquidité. Closing finalisé 3 semaines après notre intervention.",
    impact: 'Closing en 3 semaines · Cap table restructuré',
  },
  {
    secteur: 'Acquisition · PME Tech',
    problematique:
      "Un groupe industriel souhaitait acquérir une PME éditrice de logiciels. La data room révélait des risques cachés : contrats sans clause de cession, propriété intellectuelle incertaine sur le core code.",
    solution:
      "Due diligence approfondie avec outils IA de détection de clauses à risque, renégociation du prix d'acquisition à la baisse de 18%, earn-out conditionné à la rétention des ingénieurs clés.",
    impact: '18% de réduction du prix · IP sécurisée',
  },
  {
    secteur: 'Fondateur · Exit',
    problematique:
      "Un fondateur cédait sa société à un acquéreur. Le traitement fiscal de la plus-value sur les actions et le régime applicable aux BSPCE exercés n'avaient pas été anticipés.",
    solution:
      "Structuration préalable via holding patrimoniale, optimisation du calendrier fiscal, livraison d'un workflow automatisé de suivi post-closing pour les équipes de l'acquéreur.",
    impact: 'Économie fiscale de 22% · Closing sans friction',
  },
]

export default function CasEtudes() {
  return (
    <section id="cas" className="px-6 py-12 md:py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
        Études de Cas
      </p>
      <h2 className="font-serif text-heading text-light mb-4 max-w-xl">
        Des problématiques réelles. Des solutions mesurables.
      </h2>
      <p className="text-sm text-light/40 mb-8 md:mb-16 max-w-prose-luxury">
        Les cas présentés respectent le secret professionnel. Les détails identifiants ont été modifiés.
      </p>

      <div className="flex flex-col gap-px bg-gold/10">
        {cas.map(({ secteur, problematique, solution, impact }) => (
          <div key={secteur} className="bg-dark-surface p-5 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold/50 mb-3">{secteur}</p>
                <div className="border-t border-gold/15 pt-4">
                  <p className="font-serif text-sm font-semibold text-gold leading-snug">{impact}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-light/25 mb-3">Problématique</p>
              <p className="text-sm text-light/50 leading-relaxed">{problematique}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-light/25 mb-3">Solution apportée</p>
              <p className="text-sm text-light/50 leading-relaxed">{solution}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
