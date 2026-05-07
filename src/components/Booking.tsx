import { MapPin, Clock, Mail, Phone, ArrowRight } from 'lucide-react'
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
    <section id="booking" className="bg-ink">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">[09]</span>
          <span className="w-8 h-px bg-paper/15 flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Diagnostic Stratégique</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24">

          <div>
            <h2 className="font-display text-heading text-paper font-normal mb-6 text-pretty">
              Prenez le contrôle de{' '}
              <span className="italic text-accent">votre architecture juridique.</span>
            </h2>
            <p className="text-body text-paper/70 leading-relaxed mb-10">
              Un premier échange de 90 minutes pour cartographier votre situation, identifier les risques
              et définir les priorités — avec une feuille de route concrète et les premiers workflows identifiés.
            </p>

            <ul className="flex flex-col gap-3 mb-10">
              {expertise.map(item => (
                <li key={item} className="flex items-center gap-3 text-body text-paper/75">
                  <span className="w-1 h-1 bg-accent rounded-full flex-none" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/35">
                <Clock size={12} strokeWidth={1.5} />
                90 minutes · En visio ou présentiel
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/35">
                <MapPin size={12} strokeWidth={1.5} />
                Bloc B Espace Tunis Monplaisir 1073 Tunis
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/35">
                <Mail size={12} strokeWidth={1.5} />
                office@mokadmi.lawyer
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/35">
                <Phone size={12} strokeWidth={1.5} />
                +216 29784651
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="bg-ink-soft border border-paper/10 p-6 md:p-10">
              <p className="text-body text-paper/70 mb-8 leading-relaxed">
                Remplissez ce formulaire ou écrivez-nous directement. Nous répondons sous 24h ouvrées.
              </p>

              <form className="flex flex-col gap-5" onSubmit={e => e.preventDefault()}>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">
                    Nom complet
                  </label>
                  <input
                    type="text" required placeholder="Ahmed Ben Ali"
                    className="border-b border-paper/15 bg-transparent py-2.5 text-body text-paper placeholder:text-paper/25 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">
                    Email
                  </label>
                  <input
                    type="email" required placeholder="ahmed@startup.tn"
                    className="border-b border-paper/15 bg-transparent py-2.5 text-body text-paper placeholder:text-paper/25 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">
                    Société (optionnel)
                  </label>
                  <input
                    type="text" placeholder="Ma Startup"
                    className="border-b border-paper/15 bg-transparent py-2.5 text-body text-paper placeholder:text-paper/25 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">
                    Sujet
                  </label>
                  <input
                    type="text" placeholder="Levée de fonds / BSPCE / IA juridique / Autre"
                    className="border-b border-paper/15 bg-transparent py-2.5 text-body text-paper placeholder:text-paper/25 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 inline-flex items-center justify-center gap-3 bg-accent text-paper rounded-full px-[22px] py-[14px] text-sm font-medium hover:-translate-y-0.5 transition-all duration-200"
                >
                  Envoyer la demande
                  <ArrowRight size={14} strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* ── Footer strip ───────────────────────────────────────────── */}
        <div className="mt-section-sm -mx-8 px-8 border-t border-paper/10 pt-12 flex flex-col items-center gap-6">
          <Logo size={80} />
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.06em] text-paper/25 text-center">
            <p>© 2025 Maître Mokadmi Sami — Avocat. Tous droits réservés.</p>
            <span className="hidden md:inline text-paper/15">·</span>
            <p>Barreau de Tunis · office@mokadmi.lawyer</p>
          </div>
        </div>
      </div>
    </section>
  )
}
