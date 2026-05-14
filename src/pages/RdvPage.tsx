import { useState, useEffect, FormEvent } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Loader, Calendar, Clock, User, Mail, Video, Phone, MapPin, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'

// ── Créneaux horaires disponibles ─────────────────────────────────────────────
const CRENEAUX = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '17:00']

const TYPE_OPTIONS = [
  { value: 'visio',       label: 'Visioconférence', icon: Video },
  { value: 'presentiel',  label: 'Présentiel — Tunis', icon: MapPin },
  { value: 'telephone',   label: 'Téléphone', icon: Phone },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function dateMin() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function dateMax() {
  const d = new Date()
  d.setDate(d.getDate() + 60)
  return d.toISOString().split('T')[0]
}

function formatDateFr(iso: string) {
  if (!iso) return ''
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

type Status = 'idle' | 'loading' | 'success' | 'error'

// ─────────────────────────────────────────────────────────────────────────────
export default function RdvPage() {
  const [params] = useSearchParams()

  // Pré-remplir depuis les paramètres URL de l'email
  const [name,    setName]    = useState(params.get('name')    ?? '')
  const [email,   setEmail]   = useState(params.get('email')   ?? '')
  const [subject, setSubject] = useState(params.get('subject') ?? '')
  const [message] = useState(params.get('message') ?? '')

  const [date,   setDate]   = useState('')
  const [time,   setTime]   = useState('')
  const [type,   setType]   = useState<'visio' | 'presentiel' | 'telephone'>('visio')
  const [notes,  setNotes]  = useState('')

  const [status,  setStatus]  = useState<Status>('idle')
  const [errMsg,  setErrMsg]  = useState('')

  // Scroll en haut à l'arrivée
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const canSubmit = name && email && date && time

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || status === 'loading') return

    setStatus('loading')
    setErrMsg('')

    try {
      const payload = { name, email, subject, message, date, time, type, notes }

      const res = await fetch('/api/rdv', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setStatus('success')
      } else {
        throw new Error(data.error ?? 'Erreur lors de la réservation.')
      }
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Erreur inconnue.')
      setStatus('error')
    }
  }

  const inputCls = 'w-full border-b border-gold/15 bg-transparent py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'block text-[10px] font-medium text-light/35 tracking-widest uppercase mb-1.5'

  // ── Succès ───────────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <CheckCircle size={40} strokeWidth={1.25} className="text-gold mx-auto mb-6" />
          <h1 className="font-serif text-2xl text-light mb-3">Demande de rendez-vous envoyée</h1>
          <p className="text-sm text-light/50 leading-relaxed mb-2">
            Votre demande pour le <strong className="text-light/70">{formatDateFr(date)} à {time}</strong> a bien été reçue.
          </p>
          <p className="text-sm text-light/40 leading-relaxed mb-10">
            Maître Mokadmi vous confirmera le rendez-vous sous <strong className="text-light/60">24h ouvrées</strong> à <span className="text-gold/60">{email}</span>.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-gold/50 hover:text-gold transition-colors">
            ← Retour au site
          </Link>
        </div>
      </div>
    )
  }

  // ── Formulaire ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Nav minimale */}
      <header className="border-b border-gold/10 px-6 py-4 flex items-center justify-between">
        <Link to="/"><Logo size={80} /></Link>
        <span className="text-xs text-light/30 tracking-wider uppercase">Réservation</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">

        {/* Titre */}
        <div className="mb-10">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-3">
            Diagnostic Stratégique
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-light mb-4">
            Confirmer votre rendez-vous
          </h1>
          <p className="text-sm text-light/40 leading-relaxed max-w-prose">
            Choisissez la date, l'heure et le format qui vous conviennent.
            Maître Mokadmi vous confirmera le créneau sous 24h ouvrées.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── Vos coordonnées ─────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-gold/50 mb-5 flex items-center gap-2">
              <User size={11} strokeWidth={1.5} /> Vos coordonnées
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Nom complet *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  required placeholder="Ahmed Ben Ali" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="ahmed@startup.tn" className={inputCls} />
              </div>
            </div>
          </section>

          {/* ── Sujet ────────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-gold/50 mb-5 flex items-center gap-2">
              <Mail size={11} strokeWidth={1.5} /> Objet du rendez-vous
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>Sujet</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="Levée de fonds / BSPCE / Holding / IA juridique…" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description (optionnel)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  rows={3} placeholder="Précisez votre situation, vos objectifs ou les points à aborder…"
                  className={`${inputCls} resize-none`} />
              </div>
            </div>
          </section>

          {/* ── Date ─────────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-gold/50 mb-5 flex items-center gap-2">
              <Calendar size={11} strokeWidth={1.5} /> Date souhaitée *
            </h2>
            <input
              type="date" value={date} min={dateMin()} max={dateMax()}
              onChange={e => setDate(e.target.value)} required
              className="border border-gold/15 bg-dark-surface text-light text-sm px-4 py-2.5 focus:outline-none focus:border-gold/40 transition-colors [color-scheme:dark]"
            />
            {date && (
              <p className="text-xs text-gold/50 mt-2 capitalize">{formatDateFr(date)}</p>
            )}
          </section>

          {/* ── Créneau ──────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-gold/50 mb-5 flex items-center gap-2">
              <Clock size={11} strokeWidth={1.5} /> Créneau horaire *
            </h2>
            <div className="flex flex-wrap gap-2">
              {CRENEAUX.map(h => (
                <button key={h} type="button" onClick={() => setTime(h)}
                  className={`px-4 py-2 text-sm border transition-colors ${
                    time === h
                      ? 'bg-gold text-dark-bg border-gold font-medium'
                      : 'border-gold/15 text-light/50 hover:border-gold/35 hover:text-light/70'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </section>

          {/* ── Format ───────────────────────────────────────────────────── */}
          <section>
            <h2 className="text-xs font-medium tracking-[0.15em] uppercase text-gold/50 mb-5">
              Format du rendez-vous
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button"
                  onClick={() => setType(value as typeof type)}
                  className={`flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                    type === value
                      ? 'border-gold/50 bg-gold/5 text-light'
                      : 'border-gold/10 text-light/40 hover:border-gold/25 hover:text-light/60'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} className={type === value ? 'text-gold' : ''} />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Erreur ───────────────────────────────────────────────────── */}
          {status === 'error' && (
            <div className="flex items-start gap-2 text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-4 py-3">
              <AlertCircle size={12} strokeWidth={1.5} className="mt-0.5 flex-none" />
              <span>{errMsg || 'Une erreur s\'est produite. Réessayez ou écrivez-nous directement.'}</span>
            </div>
          )}

          {/* ── Récapitulatif + CTA ───────────────────────────────────────── */}
          {date && time && (
            <div className="border border-gold/15 bg-dark-surface px-6 py-5">
              <p className="text-xs text-light/35 uppercase tracking-wider mb-3">Récapitulatif</p>
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex gap-3">
                  <span className="text-light/40 w-16 flex-none">Date</span>
                  <span className="text-light capitalize">{formatDateFr(date)}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-light/40 w-16 flex-none">Heure</span>
                  <span className="text-light">{time}</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-light/40 w-16 flex-none">Format</span>
                  <span className="text-light">{TYPE_OPTIONS.find(t => t.value === type)?.label}</span>
                </div>
                {subject && (
                  <div className="flex gap-3">
                    <span className="text-light/40 w-16 flex-none">Sujet</span>
                    <span className="text-light/70">{subject}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <button type="submit" disabled={!canSubmit || status === 'loading'}
            className="flex items-center justify-center gap-3 bg-gold text-dark-bg text-sm font-medium px-8 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <><Loader size={14} strokeWidth={1.5} className="animate-spin" /> Envoi en cours…</>
            ) : (
              'Envoyer la demande de rendez-vous'
            )}
          </button>

        </form>
      </main>
    </div>
  )
}
