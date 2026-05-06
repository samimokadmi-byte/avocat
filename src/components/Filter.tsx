import { X } from 'lucide-react'

const exclusions = [
  "Les porteurs de projet sans structure juridique existante",
  "Les dossiers contentieux et litiges — ce n'est pas notre terrain",
  "Les TPE/PME sans ambition de croissance ou de cession",
  "Les entrepreneurs cherchant un prestataire, pas un architecte systémique",
]

export default function Filter() {
  return (
    <section id="filtre" className="px-6 py-section max-w-content mx-auto">
      <div className="border border-gold/15 p-10 md:p-16">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
          Filtre Sélectif
        </p>
        <h2 className="font-serif text-heading text-light mb-4 max-w-xl">
          Cette expertise n'est pas faite pour tout le monde.
        </h2>
        <p className="text-sm text-light/40 mb-12 max-w-prose-luxury leading-relaxed">
          Travailler avec des fondateurs d'exception exige une sélection rigoureuse. Voici les profils que nous n'accompagnons pas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {exclusions.map((item) => (
            <div key={item} className="flex items-start gap-4">
              <X size={14} strokeWidth={1.5} className="mt-0.5 flex-none text-gold/30" />
              <p className="text-sm text-light/50">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
