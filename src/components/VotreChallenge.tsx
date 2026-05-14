import { AlertTriangle, Clock, Scale, Zap } from 'lucide-react'

const challenges = [
  {
    icon: Scale,
    titre: 'Obligations corporate croissantes',
    description:
      "Les fondateurs et directions juridiques font face a un cadre reglementaire toujours plus exigeant : levees de fonds, gouvernance, fiscalite, IA Act, avec des echeances precises et des exigences elevees en matiere de conformite.",
  },
  {
    icon: AlertTriangle,
    titre: "Risque d'erreur documentaire",
    description:
      "Une cap table mal structuree, un pacte d'associes incomplet, un BSPCE non conforme : ces erreurs juridiques passees inapercues peuvent bloquer une levee de fonds ou reduire drastiquement la valeur a l'exit.",
  },
  {
    icon: Clock,
    titre: 'Visibilite limitee sur les echeances',
    description:
      "Sans cadre structure, les obligations corporate s'accumulent sans visibilite globale. Les arbitrages manquent de tracabilite, la coordination entre fondateurs et conseils perd en efficacite.",
  },
  {
    icon: Zap,
    titre: 'Reactivite insuffisante face aux opportunites',
    description:
      "Dans les operations M&A, les closings ou les restructurations, chaque heure compte. L'absence d'architecture juridique preparee ralentit les decisions et augmente l'exposition aux risques.",
  },
]

export default function VotreChallenge() {
  return (
    <section id="challenge" className="bg-dark-surface">
      <div className="px-6 py-section max-w-content mx-auto">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-16">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
              Votre Challenge
            </p>
            <h2 className="font-serif text-heading text-light max-w-xl">
              Des enjeux juridiques complexes. Des risques sous-estimes.
            </h2>
          </div>
          <p className="text-sm text-light/45 max-w-xs leading-relaxed">
            Les entreprises en croissance naviguent dans un environnement ou la precision
            juridique n'est pas une option — c'est un avantage concurrentiel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gold/8">
          {challenges.map(({ icon: Icon, titre, description }) => (
            <div key={titre} className="bg-dark-bg p-6 md:p-10 flex flex-col gap-5 group hover:bg-dark-card transition-colors duration-200">
              <div className="w-10 h-10 border border-gold/15 flex items-center justify-center group-hover:border-gold/30 transition-colors duration-200">
                <Icon size={18} strokeWidth={1.25} className="text-gold/40 group-hover:text-gold/60 transition-colors duration-200" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-light mb-3">{titre}</h3>
                <p className="text-sm text-light/50 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 md:mt-14 border border-gold/15 bg-dark-card px-6 md:px-10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-gold/60 uppercase tracking-wider mb-2">La reponse du cabinet</p>
            <p className="text-sm text-light/65 leading-relaxed">
              Notre approche combine expertise juridique de 23 ans et architecture IA pour structurer,
              piloter et securiser vos obligations avec une visibilite totale sur chaque etape.
            </p>
          </div>
          <a
            href="#booking"
            className="flex-none inline-flex items-center gap-3 bg-gold text-dark-bg text-sm font-medium px-6 py-3 hover:bg-gold/90 transition-colors duration-200 whitespace-nowrap"
          >
            Diagnostic strategique
          </a>
        </div>

      </div>
    </section>
  )
}
