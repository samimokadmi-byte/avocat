import { TrendingUp, Shield, Scale } from 'lucide-react'

const pillars = [
  {
    icon: TrendingUp,
    title: 'Ingénierie Financière',
    body: "Structuration de levées de fonds en equity ou dette convertible. Négociation des term sheets, pactes d'actionnaires et clauses de liquidité préférentielle.",
  },
  {
    icon: Shield,
    title: 'Conformité Tech',
    body: 'Propriété intellectuelle des logiciels, contrats SaaS et licences. Sécurisation juridique de votre stack produit et de vos données stratégiques.',
  },
  {
    icon: Scale,
    title: 'Optimisation Fiscale',
    body: "Schémas BSA/BSPCE, holding patrimoniale, transmission d'entreprise. Chaque structure est conçue pour minimiser la friction fiscale à chaque étape.",
  },
]

export default function System() {
  return (
    <section id="systeme" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Le Système
      </p>
      <h2 className="font-serif text-heading text-navy mb-16 max-w-xl">
        Trois leviers. Un seul objectif : la croissance de votre entreprise.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-navy/10">
        {pillars.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-offwhite p-10 flex flex-col gap-6">
            <Icon size={22} strokeWidth={1.25} className="text-navy/40" />
            <div>
              <h3 className="font-serif text-lg font-semibold text-navy mb-3">{title}</h3>
              <p className="text-sm text-navy/60 leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
