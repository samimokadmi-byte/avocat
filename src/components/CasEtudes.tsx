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
    <section id="cas" className="bg-ink-soft">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">[06]</span>
          <span className="w-8 h-px bg-paper/15 flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Études de Cas</span>
        </div>

        <h2 className="font-display text-heading text-paper font-normal mb-4 max-w-xl text-pretty">
          Des problématiques réelles.{' '}
          <span className="italic text-accent">Des solutions mesurables.</span>
        </h2>
        <p className="text-body text-paper/70 mb-10 md:mb-16 max-w-prose-luxury">
          Les cas présentés respectent le secret professionnel. Les détails identifiants ont été modifiés.
        </p>

        <div className="flex flex-col gap-6">
          {cas.map(({ secteur, problematique, solution, impact }) => (
            <div key={secteur} className="bg-ink border border-paper/10 p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <div className="flex flex-col justify-between gap-6">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-3">{secteur}</p>
                  <div className="border-t border-paper/10 pt-4">
                    <p className="font-display text-base font-normal italic text-accent leading-snug">{impact}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/45 mb-3">Problématique</p>
                <p className="text-body text-paper/70 leading-relaxed">{problematique}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/45 mb-3">Solution apportée</p>
                <p className="text-body text-paper/70 leading-relaxed">{solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
