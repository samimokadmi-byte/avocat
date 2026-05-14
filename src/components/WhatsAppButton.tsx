import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'

const PHONE = '21629784651'

function waLink(msg: string) {
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`
}

const MSG_CONTACT = "Bonjour Maître Mokadmi, je viens de consulter votre site et j'aimerais échanger avec vous sur un projet stratégique. Seriez-vous disponible pour un court échange ?"

const MSG_RDV = (subject: string, date: string, time: string) =>
  `Bonjour Maître Mokadmi,\n\nJe souhaite prendre rendez-vous via votre site.\n\n📋 Sujet : ${subject || 'Diagnostic stratégique'}\n📅 Date souhaitée : ${date || 'À définir ensemble'}\n🕐 Heure : ${time || 'À définir'}\n\nMerci de confirmer ce créneau.`

export default function WhatsAppButton() {
  const [showRdv, setShowRdv] = useState(false)
  const [subject, setSubject] = useState('')
  const [date,    setDate]    = useState('')
  const [time,    setTime]    = useState('')

  const dateMin = () => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const inputCls = 'w-full bg-dark-bg border border-gold/15 px-3 py-2 text-xs text-light placeholder:text-light/20 focus:outline-none focus:border-gold/40 transition-colors'

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">

      {/* ── Mini-panel RDV WhatsApp ──────────────────────────────────── */}
      {showRdv && (
        <div className="bg-dark-surface border border-gold/20 p-4 w-64 sm:w-72 shadow-2xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-gold/70 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays size={11} /> RDV via WhatsApp
            </p>
            <button onClick={() => setShowRdv(false)} className="text-light/30 hover:text-light transition-colors">
              <X size={13} strokeWidth={1.5} />
            </button>
          </div>

          <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
            placeholder="Sujet (levée de fonds, fiscal…)" className={inputCls} />

          <input type="date" value={date} min={dateMin()}
            onChange={e => setDate(e.target.value)}
            className={`${inputCls} [color-scheme:dark]`} />

          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className={`${inputCls} [color-scheme:dark]`} />

          <a
            href={waLink(MSG_RDV(subject, date, time))}
            target="_blank" rel="noopener noreferrer"
            onClick={() => setShowRdv(false)}
            className="w-full bg-[#25D366] text-white text-[11px] font-bold py-2.5 flex items-center justify-center gap-2 hover:bg-[#1ebe5d] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="13" height="13">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Envoyer sur WhatsApp
          </a>

          <p className="text-[9px] text-light/20 text-center leading-relaxed">
            Ouvre WhatsApp avec votre demande pré-remplie
          </p>
        </div>
      )}

      {/* ── Boutons WhatsApp ─────────────────────────────────────────── */}
      <div className="flex flex-col items-end gap-2">

        {/* Bouton RDV secondaire */}
        <button
          onClick={() => setShowRdv(v => !v)}
          className="group flex items-center gap-2"
          aria-label="Prendre un rendez-vous via WhatsApp"
        >
          <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-medium text-light/60 bg-dark-surface border border-gold/15 px-2.5 py-1.5 whitespace-nowrap">
            Prendre RDV WhatsApp
          </span>
          <div className="w-9 h-9 bg-dark-surface border border-gold/20 flex items-center justify-center hover:border-gold/40 transition-colors">
            <CalendarDays size={15} strokeWidth={1.5} className="text-gold/60" />
          </div>
        </button>

        {/* Bouton principal WhatsApp */}
        <a
          href={waLink(MSG_CONTACT)}
          target="_blank" rel="noopener noreferrer"
          aria-label="Nous contacter sur WhatsApp"
          className="group flex items-center gap-3"
        >
          <span className="hidden sm:block opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 text-xs font-medium text-light/80 bg-dark-surface border border-gold/15 px-3 py-2 whitespace-nowrap pointer-events-none">
            Écrire sur WhatsApp
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
