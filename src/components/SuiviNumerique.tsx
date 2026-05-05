import { Shield, Clock, Video, ArrowRight, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

const cards = [
  {
    icon: Shield,
    titre: 'Espace Client Sécurisé',
    description:
      "Accès à un espace dédié pour consulter l'avancement de votre dossier, échanger les documents et valider les étapes en temps réel.",
    detail: 'Chiffrement SSL 256 bits · Accès 24h/24',
  },
  {
    icon: Clock,
    titre: 'Réactivité Garantie',
    description:
      "Disponibilité par email sous 24h ouvrées sur toutes les missions actives. Un point hebdomadaire est organisé pour chaque dossier en cours.",
    detail: 'SLA · Réponse sous 24h ouvrées',
  },
  {
    icon: Video,
    titre: 'Visioconférence à la Demande',
    description:
      "Rendez-vous en visioconférence planifiables depuis votre espace client. En présentiel sur Paris selon votre préférence.",
    detail: 'Paris & remote · France, Europe',
  },
]

export default function SuiviNumerique() {
  return (
    <section id="suivi" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Suivi Numérique
      </p>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
        <h2 className="font-serif text-heading text-navy max-w-md">
          Votre Dossier en Temps Réel
        </h2>
        <p className="text-sm text-navy/50 max-w-xs leading-relaxed">
          Un accès complet et transparent à l'avancement de votre mission, à chaque étape.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-navy/10">
        {cards.map(({ icon: Icon, titre, description, detail }) => (
          <div
            key={titre}
            className="group bg-offwhite p-10 flex flex-col gap-6 transition-colors duration-200 hover:bg-navy hover:bg-opacity-[0.02]"
          >
            <div className="w-10 h-10 border border-navy/15 flex items-center justify-center group-hover:border-navy/30 transition-colors duration-200">
              <Icon size={18} strokeWidth={1.25} className="text-navy/40 group-hover:text-navy/60 transition-colors duration-200" />
            </div>
            <div className="flex flex-col gap-3 flex-1">
              <h3 className="font-serif text-base font-semibold text-navy">{titre}</h3>
              <p className="text-sm text-navy/60 leading-relaxed flex-1">{description}</p>
              <p className="text-xs text-navy/30 pt-4 border-t border-navy/10">{detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 border border-navy/10 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Lock size={14} strokeWidth={1.25} className="text-navy/30 flex-none" />
          <p className="text-xs text-navy/50 leading-relaxed">
            Connexion sécurisée · Chiffrement SSL 256 bits · Données hébergées en France
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-3 bg-navy text-offwhite text-sm font-medium px-6 py-3 hover:bg-navy/90 transition-colors duration-200 whitespace-nowrap"
        >
          Accéder à l'espace client
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  )
}
