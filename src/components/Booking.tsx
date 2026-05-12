import { useState, FormEvent } from 'react'
import { MapPin, Clock, Mail, Phone, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import Logo from './Logo'

// ── Make.com Webhook — auto-réponse Gmail selon le sujet ──────────────────
const MAKE_WEBHOOK = 'https://hook.us2.make.com/uaxmqy4uwpwkptg2d6wipovr1allhvha'

const expertise = [
  'Architecture de levée de fonds (Seed à Série B)',
  "Gouvernance fiscale & holdings",
  'BSPCE, BSA, stock-options',
  'M&A, acquisitions & exits',
  'Architecture IA & automatisation juridique',
]

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormData {
  name: string
  email: string
  company: string
  subject: string
  message: string
}

const EMPTY_FORM: FormData = { name: '', email: '', company: '', subject: '', message: '' }

export default function Booking() {
  const [form, setForm]     = useState<FormData>(EMPTY_FORM)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'loading') return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch(MAKE_WEBHOOK, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:    form.name,
          email:   form.email,
          company: form.company  || '',
          subject: form.subject  || '',
          message: form.message  || '',
        }),
      })

      if (res.ok) {
        setStatus('success')
        setForm(EMPTY_FORM)
      } else {
        throw new Error('Erreur lors de l\'envoi.')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      setErrorMsg(message)
      setStatus('error')
    }
  }

  const inputClass =
    'border-b border-light/10 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors disabled:opacity-40'
  const labelClass = 'text-xs font-medium text-light/35 tracking-wide uppercase'
  const isDisabled = status === 'loading' || status === 'success'

  return (
    <section id="booking" className="bg-dark-surface">
      <div className="px-6 py-section max-w-content mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 lg:gap-24">

          {/* ── Colonne gauche — infos ───────────────────────────────────── */}
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

          {/* ── Colonne droite — formulaire ─────────────────────────────── */}
          <div className="flex flex-col justify-center">
            <div className="border border-gold/15 p-5 sm:p-8 md:p-10">

              {/* Succès */}
              {status === 'success' ? (
                <div className="flex flex-col items-start gap-4 py-4">
                  <CheckCircle size={28} strokeWidth={1.25} className="text-gold" />
                  <div>
                    <p className="text-sm font-medium text-light mb-1">Demande envoyée.</p>
                    <p className="text-xs text-light/40 leading-relaxed">
                      Nous vous répondrons sous 24h ouvrées à <span className="text-gold/60">{form.email || 'votre adresse'}</span>.
                    </p>
                  </div>
                  <button
                    onClick={() => setStatus('idle')}
                    className="text-xs text-gold/50 hover:text-gold transition-colors mt-2"
                  >
                    Envoyer une autre demande →
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-light/40 mb-8 leading-relaxed">
                    Remplissez ce formulaire ou écrivez-nous directement. Nous répondons sous 24h ouvrées.
                  </p>

                  <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>

                    {/* Champ anti-bot honeypot (invisible) */}
                    <input type="checkbox" name="botcheck" className="hidden" aria-hidden="true" />

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="booking-name" className={labelClass}>Nom complet</label>
                      <input
                        id="booking-name" name="name" type="text" required
                        placeholder="Ahmed Ben Ali"
                        value={form.name} onChange={handleChange} disabled={isDisabled}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="booking-email" className={labelClass}>Email</label>
                      <input
                        id="booking-email" name="email" type="email" required
                        placeholder="ahmed@startup.tn"
                        value={form.email} onChange={handleChange} disabled={isDisabled}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="booking-company" className={labelClass}>Société (optionnel)</label>
                      <input
                        id="booking-company" name="company" type="text"
                        placeholder="Ma Startup"
                        value={form.company} onChange={handleChange} disabled={isDisabled}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="booking-subject" className={labelClass}>Sujet</label>
                      <input
                        id="booking-subject" name="subject" type="text"
                        placeholder="Levée de fonds / BSPCE / IA juridique / Autre"
                        value={form.subject} onChange={handleChange} disabled={isDisabled}
                        className={inputClass}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="booking-message" className={labelClass}>Message (optionnel)</label>
                      <textarea
                        id="booking-message" name="message" rows={3}
                        placeholder="Décrivez brièvement votre situation..."
                        value={form.message} onChange={handleChange} disabled={isDisabled}
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {/* Erreur */}
                    {status === 'error' && (
                      <div className="flex items-start gap-2 text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-4 py-3">
                        <AlertCircle size={12} strokeWidth={1.5} className="mt-0.5 flex-none" />
                        <span>{errorMsg || "Une erreur s'est produite. Veuillez réessayer ou nous écrire directement."}</span>
                      </div>
                    )}

                    <button
                      type="submit" disabled={isDisabled}
                      className="mt-4 inline-flex items-center justify-center gap-3 bg-gold text-dark-bg text-sm font-medium px-6 py-4 hover:bg-gold/90 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? (
                        <>
                          <Loader size={14} strokeWidth={1.5} className="animate-spin" />
                          Envoi en cours…
                        </>
                      ) : (
                        <>
                          Envoyer la demande
                          <ArrowRight size={14} strokeWidth={1.5} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="mt-section-sm border-t border-gold/10 pt-12 flex flex-col items-center gap-6">
          <Logo size={88} />
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xs text-light/20 text-center">
            <p>© {new Date().getFullYear()} Maître Mokadmi Sami — Avocat. Tous droits réservés.</p>
            <span className="hidden md:inline text-light/10">·</span>
            <p>Barreau de Tunis · office@mokadmi.lawyer</p>
          </div>
        </div>
      </div>
    </section>
  )
}
