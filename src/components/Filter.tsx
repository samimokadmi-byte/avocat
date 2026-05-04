import { X } from 'lucide-react'

const exclusions = [
  "Les porteurs de projet sans structure juridique existante",
  "Les dossiers contentieux et litiges — ce n'est pas notre terrain",
  "Les TPE/PME sans ambition de croissance ou de cession",
  "Les entrepreneurs cherchant un prestataire, pas un partenaire stratégique",
]

export default function Filter() {
  return (
    <section id="filtre" className="px-6 py-section max-w-content mx-auto">
      <div className="border border-navy/10 p-10 md:p-16">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
          Filtre Sélectif
        </p>
        <h2 className="font-serif text-heading text-navy mb-4 max-w-xl">
          Ce cabinet n'est pas fait pour tout le monde.
        </h2>
        <p className="text-sm text-navy/60 mb-12 max-w-prose-luxury leading-relaxed">
          Travailler avec des fondateurs ambitieux exige une sélection rigoureuse. Voici les cas que nous ne traitons pas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {exclusions.map((item) => (
            <div key={item} className="flex items-start gap-4">
              <X size={14} strokeWidth={1.5} className="mt-0.5 flex-none text-navy/30" />
              <p className="text-sm text-navy/60">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
