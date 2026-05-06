import { Scale, TrendingUp, Cpu, Globe, ShieldCheck, Zap } from 'lucide-react'

const secteurs = [
  {
    icon: Scale,
    titre: 'Architecture de Levée de Fonds',
    description:
      "De la seed à la Série B : structuration haut de gamme, pactes fondateurs anti-dilution, BSPCE optimisés et gouvernance solide. Conçu pour les équipes Tech qui bougent vite.",
    tags: ['Levée de fonds', 'BSPCE', 'Term Sheet', 'Gouvernance'],
  },
  {
    icon: TrendingUp,
    titre: 'Gouvernance Fiscale Systémique',
    description:
      "Holdings transfrontalières, optimisation à l'exit, structuration patrimoniale et conformité numérique. Pas d'optimisation à court terme — des architectures qui durent dans le temps.",
    tags: ['Holding', 'Exit fiscal', 'Optimisation', 'Transfrontalier'],
  },
  {
    icon: Cpu,
    titre: 'Gouvernance Algorithmique & IA',
    description:
      "Intégration de l'intelligence artificielle dans vos processus légaux. Due diligence augmentée, contrats intelligents, workflows automatisés. Vous livrez plus vite, sans sacrifier la rigueur.",
    tags: ['IA Juridique', 'No-code', 'Automatisation', 'Workflows'],
  },
  {
    icon: Globe,
    titre: 'M&A & Exit Structuring',
    description:
      "Due diligence juridique, structuration d'acquisitions, négociation GAP et exit optimization. Expertise reconnue sur les transactions cross-border Afrique–Europe–Golfe.",
    tags: ['Due diligence', 'M&A', 'GAP', 'Exit'],
  },
  {
    icon: ShieldCheck,
    titre: 'Protection des Données & IA Act',
    description:
      "IA Act européen, contrats de traitement de données, privacy by design. Conformité sans friction pour les startups data-driven et les plateformes IA qui ciblent le marché européen.",
    tags: ['IA Act', 'DPA', 'Privacy', 'Protection des données'],
  },
  {
    icon: Zap,
    titre: 'Expansion & Holding Internationale',
    description:
      "Structuration de holdings étrangères, implantation multi-pays, contrats de distribution internationaux. Nous parlons la langue des investisseurs du Golfe, d'Europe et de la diaspora.",
    tags: ['Holding', 'International', 'Distribution', 'Investisseurs'],
  },
]

export default function Expertises() {
  return (
    <section id="expertises" className="px-6 py-12 md:py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
        Expertises
      </p>
      <h2 className="font-serif text-heading text-light mb-4 max-w-xl">
        Une expertise verticale, jamais généraliste.
      </h2>
      <p className="text-sm text-light/40 mb-8 md:mb-16 max-w-prose-luxury">
        Chaque domaine est traité avec la précision d'un ingénieur et l'autorité de 24 ans de pratique.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gold/10">
        {secteurs.map(({ icon: Icon, titre, description, tags }) => (
          <div key={titre}
            className="bg-dark-surface p-6 md:p-10 flex flex-col gap-5 group hover:bg-dark-card transition-colors duration-300">
            <Icon size={20} strokeWidth={1.25}
              className="text-gold/50 group-hover:text-gold transition-colors duration-300" />
            <div>
              <h3 className="font-serif text-base font-semibold text-light mb-3">{titre}</h3>
              <p className="text-sm text-light/50 leading-relaxed mb-5">{description}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span key={tag}
                    className="text-xs font-medium text-gold/40 border border-gold/15 px-2 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
