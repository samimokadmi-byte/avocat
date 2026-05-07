import { Scale, BarChart3, Cpu } from 'lucide-react'

const pillars = [
  {
    icon: Scale,
    glyph: '§',
    number: '01',
    title: 'Ingénierie Juridique & Levées de Fonds',
    subtitle: 'Architecture de Levée de Fonds',
    body: "Term sheets, pactes fondateurs, cap tables et closing — nous construisons des structures qui résistent aux investisseurs les plus exigeants. Pas des documents : des systèmes robustes et évolutifs.",
    tags: ["Term Sheet", "Pacte d'associés", 'Cap Table', 'BSPCE'],
  },
  {
    icon: BarChart3,
    glyph: '%',
    number: '02',
    title: 'Stratégie Fiscale Avancée',
    subtitle: 'Gouvernance Fiscale Systémique',
    body: "Holdings patrimoniales, schémas BSA/BSPCE, optimisation à l'exit et structuration transfrontalière. Chaque décision est prise en vision globale — jamais en silos, toujours en cohérence.",
    tags: ['Holding', 'Exit fiscal', 'BSPCE', 'Transfrontalier'],
  },
  {
    icon: Cpu,
    glyph: '◇',
    number: '03',
    title: 'Architecture IA & Automatisation',
    subtitle: 'Gouvernance Algorithmique',
    body: "Workflows juridiques automatisés, due diligence augmentée par l'IA, contrats intelligents. Nous livrons des systèmes opérationnels, pas des PDFs — pour que votre vitesse d'exécution dépasse celle du marché.",
    tags: ['IA Juridique', 'No-code', 'Workflows', 'Automatisation'],
  },
]

export default function System() {
  return (
    <section id="systeme" className="bg-paper-2">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2">[02]</span>
          <span className="w-8 h-px bg-hairline-strong flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2">Les 3 Piliers</span>
        </div>

        <h2 className="font-display text-heading text-ink font-normal mb-4 max-w-xl text-pretty">
          Une triple compétence.{' '}
          <span className="italic text-accent">Une architecture globale.</span>
        </h2>
        <p className="text-body text-text2 mb-10 md:mb-16 max-w-prose-luxury leading-relaxed">
          Droit des affaires, fiscalité stratégique et ingénierie IA — rarement réunies, jamais aussi bien intégrées.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map(({ icon: Icon, glyph, title, subtitle, body, tags }) => (
            <div key={title}
              className="bg-paper border border-hairline-strong p-6 md:p-8 flex flex-col gap-6 group hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start justify-between">
                <Icon size={20} strokeWidth={1.25}
                  className="text-text2 group-hover:text-accent transition-colors duration-200" />
                <span
                  className="font-display font-normal italic text-accent/10 group-hover:text-accent/18 select-none transition-colors duration-200 leading-none"
                  style={{ fontSize: '72px' }}
                >
                  {glyph}
                </span>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2 mb-2">{subtitle}</p>
                <h3 className="font-display text-xl font-normal text-ink mb-4">{title}</h3>
                <p className="text-small text-text2 leading-relaxed mb-6">{body}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag}
                      className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2 border border-hairline-strong rounded-full px-2.5 py-0.5">
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
