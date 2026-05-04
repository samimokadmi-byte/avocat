import { ArrowRight, MapPin, Clock, Mail } from 'lucide-react'

const expertise = [
  'Levées de fonds (Seed à Série B)',
  "Pactes d'associés & gouvernance",
  'BSPCE, BSA, stock-options',
  'Acquisitions & cessions',
]

export default function Booking() {
  return (
    <section id="booking" className="px-6 py-section max-w-content mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">

        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
            Diagnostic Stratégique
          </p>
          <h2 className="font-serif text-heading text-navy mb-6">
            Prenez le contrôle de votre structure juridique.
          </h2>
          <p className="text-sm text-navy/60 leading-relaxed mb-10">
            Un premier échange de 90 minutes pour cartographier votre situation, identifier les risques et définir les priorités. Sans engagement, avec une feuille de route concrète.
          </p>

          <ul className="flex flex-col gap-3 mb-10">
            {expertise.map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-navy/70">
                <span className="w-1 h-1 bg-navy/40 flex-none" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 text-xs text-navy/50">
            <span className="flex items-center gap-2">
              <Clock size={12} strokeWidth={1.5} />
              90 minutes · En visio ou présentiel
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={12} strokeWidth={1.5} />
              Paris &amp; remote (France, Europe)
            </span>
            <span className="flex items-center gap-2">
              <Mail size={12} strokeWidth={1.5} />
              contact@cabinet-juridique.fr
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="border border-navy/10 p-10">
            <p className="text-sm text-navy/60 mb-8 leading-relaxed">
              Remplissez ce formulaire ou écrivez-nous directement. Nous répondons sous 24h ouvrées.
            </p>

            <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  className="border-b border-navy/10 bg-transparent py-2 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="jean@startup.fr"
                  className="border-b border-navy/10 bg-transparent py-2 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-navy/50 tracking-wide uppercase">
                  Sujet
                </label>
                <input
                  type="text"
                  placeholder="Levée de fonds / BSPCE / Autre"
                  className="border-b border-navy/10 bg-transparent py-2 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              <button
                type="submit"
                className="mt-4 inline-flex items-center justify-center gap-3 bg-navy text-offwhite text-sm font-medium px-6 py-4 hover:bg-navy/90 transition-colors duration-200"
              >
                Envoyer la demande
                <ArrowRight size={14} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>

      </div>

      <div className="mt-section-sm border-t border-navy/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-navy/30">
        <p>© 2024 Cabinet Juridique. Tous droits réservés.</p>
        <p>Barreau de Paris · RPVA · SIRET 000 000 000 00000</p>
      </div>
    </section>
  )
}
