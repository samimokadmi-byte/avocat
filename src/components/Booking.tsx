import { MapPin, Clock, Mail, Phone } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import Logo from './Logo'

const expertise = [
  'Architecture de levée de fonds (Seed à Série B)',
  "Gouvernance fiscale & holdings",
  'BSPCE, BSA, stock-options',
  'M&A, acquisitions & exits',
  'Architecture IA & automatisation juridique',
]

export default function Booking() {
  return (
    <section id="booking" className="bg-dark-surface">
      <div className="px-6 py-12 md:py-section max-w-content mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24">

          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
              Diagnostic Stratégique
            </p>
            <h2 className="font-serif text-heading text-light mb-6">
              Prenez le contrôle de votre architecture juridique.
            </h2>
            <p className="text-sm text-light/50 leading-relaxed mb-10">
              Un premier échange de 90 minutes pour cartographier votre situation, identifier les risques
              et définir les priorités — avec une feuille de route concrète et les premiers workflows identifiés.
            </p>

            <ul className="flex flex-col gap-3 mb-10">
              {expertise.map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-light/55">
                  <span className="w-1 h-1 bg-gold/50 flex-none" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 text-xs text-light/35">
              <span className="flex items-center gap-2">
                <Clock size={12} strokeWidth={1.5} />
                90 minutes · En visio ou présentiel
              </span>
              <span className="flex items-center gap-2">
                <MapPin size={12} strokeWidth={1.5} />
                Bloc B Espace Tunis Monplaisir 1073 Tunis
              </span>
              <span className="flex items-center gap-2">
                <Mail size={12} strokeWidth={1.5} />
                office@mokadmi.lawyer
              </span>
              <span className="flex items-center gap-2">
                <Phone size={12} strokeWidth={1.5} />
                +216 29784651
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="border border-gold/15 p-6 md:p-10">
              <p className="text-sm text-light/40 mb-8 leading-relaxed">
                Remplissez ce formulaire ou écrivez-nous directement. Nous répondons sous 24h ouvrées.
              </p>

              <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/35 tracking-wide uppercase">
                    Nom complet
                  </label>
                  <input
                    type="text" required placeholder="Ahmed Ben Ali"
                    className="border-b border-light/10 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/35 tracking-wide uppercase">
                    Email
                  </label>
                  <input
                    type="email" required placeholder="ahmed@startup.tn"
                    className="border-b border-light/10 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/35 tracking-wide uppercase">
                    Société (optionnel)
                  </label>
                  <input
                    type="text" placeholder="Ma Startup"
                    className="border-b border-light/10 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/35 tracking-wide uppercase">
                    Sujet
                  </label>
                  <input
                    type="text" placeholder="Levée de fonds / BSPCE / IA juridique / Autre"
                    className="border-b border-light/10 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 inline-flex items-center justify-center gap-3 bg-gold text-dark-bg text-sm font-medium px-6 py-4 hover:bg-gold/90 transition-colors duration-200"
                >
                  Envoyer la demande
                  <ArrowRight size={14} strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </div>

        </div>

        <div className="mt-section-sm border-t border-gold/10 pt-12 flex flex-col items-center gap-6">
          <Logo size={88} />
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs text-light/20 text-center">
            <p>© 2025 Maître Mokadmi Sami — Avocat. Tous droits réservés.</p>
            <span className="hidden md:inline text-light/10">·</span>
            <p>Barreau de Tunis · office@mokadmi.lawyer</p>
          </div>
        </div>
      </div>
    </section>
  )
}
