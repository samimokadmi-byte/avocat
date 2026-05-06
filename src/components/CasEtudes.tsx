const cas = [
  {
    secteur: 'SaaS B2B · Série A',
    problematique:
      "Une startup de 12 personnes arrivait en closing de série A avec un cap table désorganisé : trois pactes contradictoires, des BSPCE mal structurés et un investisseur lead qui menaçait de se retirer.",
    solution:
      "Audit complet en 5 jours ouvrés, restructuration du cap table, fusion des pactes en un document unique, re-négociation des clauses de liquidité avec le lead. Closing finalisé 3 semaines après notre intervention.",
    impact: 'Closing en 3 semaines · Cap table restructuré',
  },
  {
    secteur: 'Acquisition · PME Tech',
    problematique:
      "Un groupe industriel souhaitait acquérir une PME éditrice de logiciels. La data room révélait des risques cachés : contrats clients sans clause de cession, propriété intellectuelle incertaine sur le core code.",
    solution:
      "Due diligence approfondie avec reclassification des risques, renégociation du prix d'acquisition à la baisse de 18%, mise en place d'un earn-out conditionné à la rétention des développeurs clés.",
    impact: '18% de réduction du prix · Sécurisation IP',
  },
  {
    secteur: 'Fondateur · Exit',
    problematique:
      "Un fondateur cédait sa société à un acquéreur américain. Le traitement fiscal de la plus-value sur les actions et le régime applicable aux BSPCE exercés n'avaient pas été anticipés.",
    solution:
      "Structuration préalable de la cession via holding patrimoniale, optimisation du calendrier fiscal, mise en place d'un apport-cession conforme à l'article 150-0 B ter du CGI.",
    impact: 'Économie fiscale de 22% sur la plus-value',
  },
]

export default function CasEtudes() {
  return (
    <section id="cas" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Études de Cas
      </p>
      <h2 className="font-serif text-heading text-navy mb-4 max-w-xl">
        Des problématiques réelles. Des solutions mesurables.
      </h2>
      <p className="text-sm text-navy/50 mb-16 max-w-prose-luxury">
        Les cas présentés respectent le secret professionnel. Les détails identifiants ont été modifiés.
      </p>

      <div className="flex flex-col gap-px bg-navy/10">
        {cas.map(({ secteur, problematique, solution, impact }) => (
          <div key={secteur} className="bg-offwhite p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Left: sector + impact */}
            <div className="flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-navy/40 mb-3">{secteur}</p>
                <div className="border-t border-navy/10 pt-4">
                  <p className="font-serif text-sm font-semibold text-navy leading-snug">{impact}</p>
                </div>
              </div>
            </div>

            {/* Middle: problem */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-navy/40 mb-3">Problématique</p>
              <p className="text-sm text-navy/60 leading-relaxed">{problematique}</p>
            </div>

            {/* Right: solution */}
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-navy/40 mb-3">Solution apportée</p>
              <p className="text-sm text-navy/60 leading-relaxed">{solution}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
