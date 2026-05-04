import { MessageSquare, FileText, Monitor, CheckCircle } from 'lucide-react'

const etapes = [
  {
    icon: MessageSquare,
    numero: '01',
    titre: 'Consultation initiale',
    description:
      "Un premier entretien de 90 minutes pour cartographier votre situation, identifier les priorités et déterminer si une collaboration est pertinente. Facturé 350 € HT, imputable sur toute mission.",
  },
  {
    icon: FileText,
    numero: '02',
    titre: "Convention d'honoraires",
    description:
      "Chaque mission est encadrée par une convention claire : périmètre, livrables, calendrier et budget. Pas de surprise en fin de mission — le cadre est fixé avant le début des travaux.",
  },
  {
    icon: Monitor,
    numero: '03',
    titre: 'Suivi numérique',
    description:
      "Accès à un espace client sécurisé pour consulter l'avancement des dossiers, échanger les documents et valider les étapes. Disponibilité par email sous 24h ouvrées, visio à la demande.",
  },
  {
    icon: CheckCircle,
    numero: '04',
    titre: 'Clôture & bilan',
    description:
      "À la fin de chaque mission, un compte-rendu structuré récapitule les décisions prises, les documents produits et les points de vigilance pour la suite. Votre dossier reste accessible à tout moment.",
  },
]

const grilles = [
  {
    type: 'Diagnostic stratégique',
    tarif: '350 € HT',
    detail: '90 min · imputable sur mission',
  },
  {
    type: 'Structuration simple',
    tarif: 'À partir de 3 500 € HT',
    detail: 'Forfait · périmètre défini',
  },
  {
    type: 'Accompagnement levée de fonds',
    tarif: 'Sur devis',
    detail: 'Seed à Série B · forfait ou taux horaire',
  },
  {
    type: 'Retainer mensuel',
    tarif: 'À partir de 1 800 € HT/mois',
    detail: 'Conseil continu · volume garanti',
  },
]

export default function Honoraires() {
  return (
    <section id="honoraires" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Méthodologie & Honoraires
      </p>
      <h2 className="font-serif text-heading text-navy mb-16 max-w-xl">
        Un cadre clair, dès le premier jour.
      </h2>

      {/* Process steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-navy/10 mb-px">
        {etapes.map(({ icon: Icon, numero, titre, description }) => (
          <div key={numero} className="bg-offwhite p-10 flex gap-6">
            <div className="flex-none">
              <div className="w-10 h-10 border border-navy/20 flex items-center justify-center">
                <Icon size={16} strokeWidth={1.25} className="text-navy/40" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-navy/30 tracking-wide uppercase mb-2">{numero}</p>
              <h3 className="font-serif text-base font-semibold text-navy mb-2">{titre}</h3>
              <p className="text-sm text-navy/60 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tariff grid */}
      <div className="bg-offwhite border border-navy/10 mt-12">
        <div className="border-b border-navy/10 px-10 py-5">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40">Grille tarifaire indicative</p>
        </div>
        <div className="flex flex-col">
          {grilles.map(({ type, tarif, detail }, i) => (
            <div
              key={type}
              className={`px-10 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                i < grilles.length - 1 ? 'border-b border-navy/10' : ''
              }`}
            >
              <span className="text-sm font-medium text-navy">{type}</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-navy block">{tarif}</span>
                <span className="text-xs text-navy/40">{detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
