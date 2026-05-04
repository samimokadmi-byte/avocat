import { Zap, Building2, ShieldCheck, TrendingUp, Globe, Cpu } from 'lucide-react'

const secteurs = [
  {
    icon: Zap,
    titre: 'Startups Tech & SaaS',
    description:
      "De la création à la série B : structuration juridique, pactes fondateurs, levées de fonds, BSPCE et gouvernance. Un accompagnement pensé pour la vitesse d'exécution des équipes Tech.",
    tags: ['Levées de fonds', 'BSPCE', 'Term Sheet', 'Gouvernance'],
  },
  {
    icon: ShieldCheck,
    titre: 'Protection des Données & IA',
    description:
      "RGPD, IA Act européen, contrats de traitement de données, privacy by design. Nous sécurisons votre conformité sans freiner votre roadmap produit.",
    tags: ['RGPD', 'IA Act', 'DPA', 'Privacy'],
  },
  {
    icon: TrendingUp,
    titre: 'Capital-Risque & M&A',
    description:
      "Due diligence juridique, structuration d'acquisitions, négociation des garanties d'actif-passif. Expertise reconnue sur les transactions cross-border France–Europe.",
    tags: ['Due diligence', 'M&A', 'GAP', 'LBO'],
  },
  {
    icon: Globe,
    titre: 'Expansion Internationale',
    description:
      "Implantation en Europe, structuration de holdings étrangères, contrats de distribution internationaux. Nous parlons la langue des investisseurs et des conseils étrangers.",
    tags: ['Holding', 'Droit européen', 'Distribution', 'Contrats internationaux'],
  },
  {
    icon: Building2,
    titre: 'Immobilier & PropTech',
    description:
      "Acquisition de locaux commerciaux, baux professionnels, structuration de SCI et montages PropTech. La rigueur du droit immobilier combinée à la réactivité du conseil Tech.",
    tags: ['SCI', 'Baux commerciaux', 'PropTech', 'Acquisition'],
  },
  {
    icon: Cpu,
    titre: 'Propriété Intellectuelle',
    description:
      "Dépôts de marques, protection du code source, contrats de licence logicielle et cession de droits. Sécurisez votre IP avant qu'elle ne soit votre actif le plus précieux.",
    tags: ['Marques', 'Logiciels', 'Licences', 'Open Source'],
  },
]

export default function Expertises() {
  return (
    <section id="expertises" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Expertises Sectorielles
      </p>
      <h2 className="font-serif text-heading text-navy mb-16 max-w-xl">
        Une expertise verticale, pas un service généraliste.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-navy/10">
        {secteurs.map(({ icon: Icon, titre, description, tags }) => (
          <div key={titre} className="bg-offwhite p-10 flex flex-col gap-5">
            <Icon size={20} strokeWidth={1.25} className="text-navy/40" />
            <div>
              <h3 className="font-serif text-base font-semibold text-navy mb-3">{titre}</h3>
              <p className="text-sm text-navy/60 leading-relaxed mb-5">{description}</p>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-navy/50 border border-navy/10 px-2 py-0.5"
                  >
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
