import { ArrowRight } from 'lucide-react'

const analyses = [
  {
    domaine: 'Droit Numérique',
    date: 'Avril 2024',
    titre: "IA générative & responsabilité contractuelle : ce que change la position de la CNIL",
    extrait:
      "La CNIL a précisé les contours de la responsabilité des entreprises intégrant des outils d'IA dans leurs processus métiers. Cette décision redéfinit les obligations des co-responsables de traitement et ouvre la voie à une nouvelle architecture contractuelle.",
  },
  {
    domaine: 'Droit Commercial',
    date: 'Mars 2024',
    titre: "Pactes d'actionnaires : la Cour de cassation renforce l'exécution forcée des clauses de préemption",
    extrait:
      "Par un arrêt du 14 mars 2024, la chambre commerciale confirme qu'un associé peut obtenir en référé l'exécution forcée d'une clause de préemption violée. Impact direct sur la rédaction des pactes et la protection des minoritaires.",
  },
  {
    domaine: 'Fiscalité Tech',
    date: 'Février 2024',
    titre: 'BSPCE et salariés non-résidents : clarification du régime après la loi de finances 2024',
    extrait:
      "La loi de finances rectificative précise le traitement fiscal des BSPCE exercés par des bénéficiaires ayant quitté la France. Un point de vigilance majeur pour les startups à dimension internationale avant toute levée.",
  },
]

export default function Veille() {
  return (
    <section id="veille" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
        Jurisprudence & Veille
      </p>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
        <h2 className="font-serif text-heading text-light max-w-xl">
          L'autorité intellectuelle au service de votre stratégie.
        </h2>
        <p className="text-sm text-light/45 max-w-xs leading-relaxed">
          Analyses des décisions récentes qui impactent directement les entreprises Tech et les opérations de capital.
        </p>
      </div>

      <div className="flex flex-col gap-px bg-gold/8">
        {analyses.map(({ domaine, date, titre, extrait }) => (
          <div key={titre} className="bg-dark-surface p-5 sm:p-8 md:p-10 flex flex-col md:flex-row gap-10">
            <div className="flex-none md:w-40">
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-gold/50 mb-1">{domaine}</p>
              <p className="text-xs text-light/25">{date}</p>
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-base font-semibold text-light mb-3 leading-snug">{titre}</h3>
              <p className="text-sm text-light/50 leading-relaxed mb-5">{extrait}</p>
              <a
                href="#booking"
                className="inline-flex items-center gap-2 text-xs font-medium text-gold/45 hover:text-gold transition-colors duration-200"
              >
                Discuter de l'impact pour votre structure
                <ArrowRight size={12} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
