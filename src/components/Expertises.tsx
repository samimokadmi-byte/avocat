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
    <section id="expertises" className="bg-ink">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">[05]</span>
          <span className="w-8 h-px bg-paper/15 flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Expertises</span>
        </div>

        <h2 className="font-display text-heading text-paper font-normal mb-4 max-w-xl text-pretty">
          Une expertise verticale,{' '}
          <span className="italic text-accent">jamais généraliste.</span>
        </h2>
        <p className="text-body text-paper/70 mb-10 md:mb-16 max-w-prose-luxury">
          Chaque domaine est traité avec la précision d'un ingénieur et l'autorité de 24 ans de pratique.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {secteurs.map(({ icon: Icon, titre, description, tags }) => (
            <div key={titre}
              className="bg-ink-soft border border-paper/10 p-6 md:p-8 flex flex-col gap-5 group hover:border-paper/20 hover:-translate-y-0.5 transition-all duration-200">
              <Icon size={20} strokeWidth={1.25}
                className="text-paper/30 group-hover:text-accent transition-colors duration-200" />
              <div>
                <h3 className="font-display text-base font-normal text-paper mb-3">{titre}</h3>
                <p className="text-small text-paper/70 leading-relaxed mb-5">{description}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag}
                      className="font-mono text-[11px] uppercase tracking-[0.06em] text-paper/35 border border-paper/12 rounded-full px-2.5 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
