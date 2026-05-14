import { ArrowRight, FileText, Layers, BarChart2, Shield } from 'lucide-react'

const services = [
  {
    icon: FileText,
    tag: 'Documents',
    titre: 'Generation de Documents Juridiques',
    description:
      "Automatisation de la redaction de vos actes, pactes d'associes, BSPCE, term sheets, sur la base de modeles conformes et actualises.",
    href: '#booking',
  },
  {
    icon: Layers,
    tag: 'Gouvernance',
    titre: 'Plateforme de Suivi Dossier',
    description:
      "Espace client securise pour suivre l'avancement de votre mission, echanger les documents et valider chaque etape en temps reel.",
    href: '/login',
  },
  {
    icon: BarChart2,
    tag: 'Audit',
    titre: 'Audit Comptable & Financier',
    description:
      "Expertise en audit et analyse financiere integree a la mission juridique, pour une vision complete de votre architecture d'entreprise.",
    href: '#booking',
  },
  {
    icon: Shield,
    tag: 'Compliance',
    titre: 'Conformite IA & Donnees',
    description:
      "Accompagnement sur la conformite IA Act, RGPD avance, et gouvernance des algorithmes pour les entreprises Tech en croissance.",
    href: '#booking',
  },
]

export default function ServicesAssocies() {
  return (
    <section id="services" className="bg-dark-surface">
      <div className="px-6 py-section max-w-content mx-auto">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-16">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
              Services Associes
            </p>
            <h2 className="font-serif text-heading text-light max-w-xl">
              Un ecosysteme complet d'expertise.
            </h2>
          </div>
          <p className="text-sm text-light/45 max-w-xs leading-relaxed">
            Chaque mission peut etre enrichie par des services complementaires,
            integres a votre architecture juridique principale.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gold/8">
          {services.map(({ icon: Icon, tag, titre, description, href }) => (
            <a
              key={titre}
              href={href}
              className="group bg-dark-bg p-6 md:p-10 flex flex-col gap-5 hover:bg-dark-card transition-colors duration-200 no-underline"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-gold/15 flex items-center justify-center group-hover:border-gold/30 transition-colors duration-200">
                  <Icon size={16} strokeWidth={1.25} className="text-gold/40 group-hover:text-gold/60 transition-colors duration-200" />
                </div>
                <span className="text-[10px] font-medium text-gold/45 uppercase tracking-widest border border-gold/12 px-2 py-0.5">
                  {tag}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-base font-semibold text-light mb-3 group-hover:text-gold transition-colors duration-200">
                  {titre}
                </h3>
                <p className="text-sm text-light/45 leading-relaxed">{description}</p>
              </div>
              <span className="flex items-center gap-2 text-xs font-medium text-gold/40 group-hover:text-gold transition-colors duration-200 mt-auto">
                En savoir plus <ArrowRight size={12} strokeWidth={1.5} />
              </span>
            </a>
          ))}
        </div>

      </div>
    </section>
  )
}
