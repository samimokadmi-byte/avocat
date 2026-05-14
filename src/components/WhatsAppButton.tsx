import { useState } from 'react'
import { CalendarDays, X, Send, CheckCircle, Loader } from 'lucide-react'

const PHONE = '21629784651'

// ── Message WhatsApp (ouverture conversation standard) ───────────────────────
const MSG_CONTACT = "Bonjour Maitre Mokadmi, je viens de consulter votre site. Je souhaite echanger sur un projet strategique. Seriez-vous disponible ?"

// ── Créneaux disponibles ─────────────────────────────────────────────────────
const CRENEAUX = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

type RdvStatus = 'idle' | 'loading' | 'sent' | 'error'

export default function WhatsAppButton() {
  const [showPanel, setShowPanel] = useState(false)
  const [name,      setName]      = useState('')
  const [subject,   setSubject]   = useState('')
  const [date,      setDate]      = useState('')
  const [time,      setTime]      = useState('')
  const [status,    setStatus]    = useState<RdvStatus>('idle')

  const dateMin = () => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const canSubmit = name && date && time && status !== 'loading' && status !== 'sent'

  // Envoie vers Apps Script + ouvre WhatsApp avec le récapitulatif
  const handleRdv = async () => {
    if (!canSubmit) return
    setStatus('loading')

    // 1. Notification via Apps Script (email cabinet + confirmation client si email fourni)
    try {
      await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: '',           // pas d'email ici — canal WhatsApp
          subject: subject || 'Rendez-vous WhatsApp',
          date,
          time,
          type: 'telephone',
          notes: 'Demande via bouton WhatsApp du site',
        }),
      })
    } catch { /* non bloquant */ }

    // 2. Ouvrir WhatsApp avec message pré-rempli structuré
    const dateStr = new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
    const msg = `Bonjour Maitre Mokadmi,\n\nJe souhaite prendre rendez-vous.\n\nNom : ${name}\nSujet : ${subject || 'Diagnostic strategique'}\nDate souhaitee : ${dateStr}\nHeure : ${time}\n\nMerci de confirmer ce creneau.`

    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`, '_blank')
    setStatus('sent')
  }

  const inputCls = 'w-full bg-dark-bg border border-gold/15 px-3 py-2 text-sm text-light placeholder:text-light/30 focus:outline-none focus:border-gold/40 transition-colors'

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

      {/* ── Panel RDV WhatsApp ──────────────────────────────────────────── */}
      {showPanel && (
        <div className="bg-dark-surface border border-gold/20 shadow-2xl w-72 flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10 bg-dark-bg">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" width="14" height="14">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <p className="text-xs font-bold text-light">Prendre RDV via WhatsApp</p>
            </div>
            <button onClick={() => { setShowPanel(false); setStatus('idle') }} className="text-light/30 hover:text-light">
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-4 flex flex-col gap-3">
            {status === 'sent' ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle size={28} strokeWidth={1.25} className="text-[#25D366]" />
                <p className="text-sm font-medium text-light">WhatsApp ouvert</p>
                <p className="text-xs text-light/50 leading-relaxed">
                  Votre demande a ete envoyee au cabinet. Maître Mokadmi vous repondra directement sur WhatsApp.
                </p>
                <button onClick={() => { setStatus('idle'); setName(''); setDate(''); setTime(''); setSubject('') }}
                  className="text-xs text-gold/50 hover:text-gold transition-colors mt-1">
                  Nouvelle demande
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-light/45 leading-relaxed">
                  Remplissez ce formulaire — votre demande sera transmise au cabinet ET un message pre-rempli s'ouvrira sur WhatsApp.
                </p>

                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Votre nom *" className={inputCls} />

                <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Sujet (levee de fonds, fiscal...)" className={inputCls} />

                <input type="date" value={date} min={dateMin()}
                  onChange={e => setDate(e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`} />

                {/* Créneaux */}
                <div>
                  <p className="text-[10px] text-light/35 mb-1.5 uppercase tracking-wider">Creneau</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CRENEAUX.map(h => (
                      <button key={h} type="button" onClick={() => setTime(h)}
                        className={`px-2.5 py-1 text-xs border transition-colors ${
                          time === h ? 'bg-[#25D366] text-white border-[#25D366] font-medium' : 'border-gold/15 text-light/45 hover:border-gold/30'
                        }`}>{h}</button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleRdv}
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold py-3 hover:bg-[#1ebe5d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {status === 'loading'
                    ? <><Loader size={14} className="animate-spin" /> Envoi...</>
                    : <><Send size={13} strokeWidth={1.5} /> Envoyer & ouvrir WhatsApp</>
                  }
                </button>

                <p className="text-[10px] text-light/25 text-center leading-relaxed">
                  Le cabinet reçoit une notification email instantanee
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Boutons flottants ────────────────────────────────────────────── */}
      <div className="flex flex-col items-end gap-2">

        {/* Bouton RDV secondaire */}
        <button
          onClick={() => setShowPanel(v => !v)}
          aria-label="Prendre un rendez-vous via WhatsApp"
          className="group flex items-center gap-2"
        >
          <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-light/60 bg-dark-surface border border-gold/15 px-2.5 py-1.5 whitespace-nowrap">
            RDV WhatsApp
          </span>
          <div className={`w-9 h-9 border flex items-center justify-center transition-colors ${
            showPanel ? 'bg-gold/10 border-gold/40' : 'bg-dark-surface border-gold/20 hover:border-gold/40'
          }`}>
            <CalendarDays size={15} strokeWidth={1.5} className="text-gold/60" />
          </div>
        </button>

        {/* Bouton WhatsApp principal */}
        <a
          href={`https://wa.me/${PHONE}?text=${encodeURIComponent(MSG_CONTACT)}`}
          target="_blank" rel="noopener noreferrer"
          aria-label="Contacter sur WhatsApp"
          className="group flex items-center gap-3"
        >
          <span className="hidden sm:block opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-xs font-medium text-light/80 bg-dark-surface border border-gold/15 px-3 py-2 whitespace-nowrap pointer-events-none">
            Ecrire sur WhatsApp
          </span>
          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-[#25D366] hover:bg-[#1ebe5d] transition-colors duration-200 shadow-lg shadow-black/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24" className="sm:w-[26px] sm:h-[26px]" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
        </a>
      </div>
    </div>
  )
}
