import { Scale, BarChart3, Cpu } from 'lucide-react'

const pillars = [
  {
    icon: Scale,
    number: '01',
    title: 'Ingénierie Juridique & Levées de Fonds',
    subtitle: 'Architecture de Levée de Fonds',
    body: "Term sheets, pactes fondateurs, cap tables et closing — nous construisons des structures qui résistent aux investisseurs les plus exigeants. Pas des documents : des systèmes robustes et évolutifs.",
    tags: ["Term Sheet", "Pacte d'associés", 'Cap Table', 'BSPCE'],
  },
  {
    icon: BarChart3,
    number: '02',
    title: 'Stratégie Fiscale Avancée',
    subtitle: 'Gouvernance Fiscale Systémique',
    body: "Holdings patrimoniales, schémas BSA/BSPCE, optimisation à l'exit et structuration transfrontalière. Chaque décision est prise en vision globale — jamais en silos, toujours en cohérence.",
    tags: ['Holding', 'Exit fiscal', 'BSPCE', 'Transfrontalier'],
  },
  {
    icon: Cpu,
    number: '03',
    title: 'Architecture IA & Automatisation',
    subtitle: 'Gouvernance Algorithmique',
    body: "Workflows juridiques automatisés, due diligence augmentée par l'IA, contrats intelligents. Nous livrons des systèmes opérationnels, pas des PDFs — pour que votre vitesse d'exécution dépasse celle du marché.",
    tags: ['IA Juridique', 'No-code', 'Workflows', 'Automatisation'],
  },
]

export default function System() {
  return (
    <section id="systeme" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
        Les 3 Piliers de l'Architecte
      </p>
      <h2 className="font-serif text-heading text-light mb-4 max-w-xl">
        Une triple compétence. Une architecture globale.
      </h2>
      <p className="text-sm text-light/40 mb-10 md:mb-16 max-w-prose-luxury leading-relaxed">
        Droit des affaires, fiscalité stratégique et ingénierie IA — rarement réunies, jamais aussi bien intégrées.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gold/10">
        {pillars.map(({ icon: Icon, number, title, subtitle, body, tags }) => (
          <div key={title}
            className="bg-dark-surface p-5 sm:p-8 md:p-10 flex flex-col gap-6 group hover:bg-dark-card transition-colors duration-300">
            <div className="flex items-start justify-between">
              <Icon size={22} strokeWidth={1.25}
                className="text-gold/50 group-hover:text-gold transition-colors duration-300" />
              <span className="font-serif text-4xl font-bold text-gold/8 group-hover:text-gold/15 transition-colors duration-300 select-none">
                {number}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-gold/50 uppercase tracking-[0.15em] mb-2">{subtitle}</p>
              <h3 className="font-serif text-lg font-semibold text-light mb-4">{title}</h3>
              <p className="text-sm text-light/50 leading-relaxed mb-6">{body}</p>
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
