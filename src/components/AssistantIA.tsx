import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Sparkles, CalendarDays, Loader } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Appointment } from './CalendarView'

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
  isRdvForm?: boolean
}

// ── Créneaux horaires ─────────────────────────────────────────────────────────
const CRENEAUX = ['09:00', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:00', '17:00']
const FORMATS  = [
  { value: 'visio',      label: 'Visio' },
  { value: 'presentiel', label: 'Présentiel' },
  { value: 'telephone',  label: 'Téléphone' },
] as const

// ── Base de connaissances ─────────────────────────────────────────────────────
const KNOWLEDGE_BASE = [
  {
    keywords: ['expertise', 'services', 'faites', 'domaine', 'compétence'],
    response: "Nous intervenons sur trois piliers majeurs : l'Ingénierie Juridique (levées de fonds, pactes), la Stratégie Fiscale Avancée (optimisation, holdings) et l'Architecture IA (automatisation de workflows, conformité IA Act)."
  },
  {
    keywords: ['levée', 'fonds', 'seed', 'série', 'investisseur', 'equity'],
    response: "Nous structurons des levées de fonds du Seed à la Série B. Notre approche consiste à construire des systèmes robustes (Term sheets, Cap tables) qui résistent aux exigences des fonds de VC les plus rigoureux."
  },
  {
    keywords: ['ia', 'intelligence artificielle', 'algorithme', 'ia act', 'automatisation'],
    response: "L'IA est au cœur de notre cabinet. Nous conseillons sur la conformité IA Act et intégrons l'IA pour automatiser vos processus juridiques (due diligence augmentée, smart contracts)."
  },
  {
    keywords: ['fiscal', 'impôt', 'holding', 'optimisation', 'exit', 'bsa', 'bspce'],
    response: "Nous concevons des architectures fiscales globales : holdings patrimoniales, schémas d'incitation (BSPCE) et optimisation lors de l'exit pour minimiser les frictions fiscales."
  },
  {
    keywords: ['contact', 'rendez-vous', 'rdv', 'parler', 'appel', 'téléphone', 'email', 'réserver', 'consultation', 'rencontrer', 'prendre'],
    response: "Je peux vous aider à planifier un rendez-vous directement ici. Complétez le formulaire ci-dessous :"
  },
  {
    keywords: ['prix', 'tarif', 'honoraires', 'coût', 'combien'],
    response: "Nos interventions se font généralement au forfait pour garantir une totale transparence. Le diagnostic initial de 90 minutes est facturé 350 € HT (imputable sur mission)."
  },
  {
    keywords: ['expérience', 'ancienneté', 'qui est', 'mokadmi', 'sami'],
    response: "Maître Mokadmi Sami est l'Architecte Juridique du cabinet, fort de 23 ans d'expérience en droit des affaires et ingénierie stratégique entre Tunis et Paris."
  }
]

const RDV_KEYWORDS = ['rdv', 'rendez-vous', 'rendez vous', 'appointment', 'réserver', 'consultation', 'rencontrer', 'prendre rendez', 'prendre un rdv', 'fixer']

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Bonjour, je suis l'Assistant Numérique du cabinet. Comment puis-je vous éclairer sur notre approche d'Architecture Juridique aujourd'hui ?",
    sender: 'bot',
    timestamp: new Date()
  }
]

// ── Composant formulaire RDV inline ─────────────────────────────────────────
function RdvFormInline({ user, onConfirm }: {
  user: { id: string; name: string; email: string } | null
  onConfirm: (data: { name: string; email: string; date: string; time: string; format: string; subject: string }) => void
}) {
  const [name,    setName]    = useState(user?.name  ?? '')
  const [email,   setEmail]   = useState(user?.email ?? '')
  const [date,    setDate]    = useState('')
  const [time,    setTime]    = useState('')
  const [format,  setFormat]  = useState<'visio' | 'presentiel' | 'telephone'>('visio')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)

  const dateMin = () => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    if (!name || !email || !date || !time || loading) return
    setLoading(true)
    try {
      await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject: subject || 'Diagnostic Stratégique', date, time, type: format, notes: 'Demande via Assistant IA' }),
      })
    } catch { /* non bloquant */ }

    onConfirm({ name, email, date, time, format, subject })
    setDone(true)
    setLoading(false)
  }

  if (done) return null

  const inputCls = 'w-full bg-dark-bg border border-gold/15 px-3 py-1.5 text-xs text-light placeholder:text-light/20 focus:outline-none focus:border-gold/40 transition-colors'

  return (
    <div className="mt-2 w-full bg-dark-surface border border-gold/20 p-3 flex flex-col gap-3 text-xs">
      <p className="text-[10px] font-medium text-gold/70 uppercase tracking-wider flex items-center gap-1.5">
        <CalendarDays size={11} strokeWidth={1.5} /> Planifier un rendez-vous
      </p>

      {/* Nom + Email (masqués si connecté) */}
      {!user && (
        <div className="flex flex-col gap-2">
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Votre nom *" className={inputCls} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Votre email *" className={inputCls} />
        </div>
      )}

      {/* Sujet */}
      <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
        placeholder="Sujet (levée de fonds, fiscal…)" className={inputCls} />

      {/* Date */}
      <input type="date" value={date} min={dateMin()}
        onChange={e => setDate(e.target.value)}
        className="w-full bg-dark-bg border border-gold/15 px-3 py-1.5 text-xs text-light focus:outline-none focus:border-gold/40 [color-scheme:dark]" />

      {/* Créneaux */}
      <div>
        <p className="text-[10px] text-light/30 mb-1.5">Créneau *</p>
        <div className="flex flex-wrap gap-1.5">
          {CRENEAUX.map(h => (
            <button key={h} type="button" onClick={() => setTime(h)}
              className={`px-2.5 py-1 text-[10px] border transition-colors ${
                time === h ? 'bg-gold text-dark-bg border-gold font-medium' : 'border-gold/15 text-light/40 hover:border-gold/30'
              }`}>{h}</button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div className="flex gap-1.5">
        {FORMATS.map(f => (
          <button key={f.value} type="button" onClick={() => setFormat(f.value)}
            className={`flex-1 py-1.5 text-[10px] border transition-colors ${
              format === f.value ? 'bg-gold/10 border-gold/40 text-gold' : 'border-gold/10 text-light/30 hover:border-gold/25'
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Bouton */}
      <button
        onClick={handleSubmit}
        disabled={!name || !email || !date || !time || loading}
        className="w-full bg-gold text-dark-bg text-[11px] font-bold py-2 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <><Loader size={11} className="animate-spin" /> Envoi…</> : 'Confirmer la demande de RDV'}
      </button>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AssistantIA() {
  const [isOpen,     setIsOpen]     = useState(false)
  const [messages,   setMessages]   = useState<Message[]>(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping,   setIsTyping]   = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  const addBotMessage = (text: string, isRdvForm = false) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text, sender: 'bot', timestamp: new Date(), isRdvForm,
    }])
  }

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: 'user', timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    const input = inputValue
    setInputValue('')
    setIsTyping(true)

    setTimeout(() => {
      const low = input.toLowerCase()
      const isRdv = RDV_KEYWORDS.some(k => low.includes(k))

      if (isRdv) {
        addBotMessage("Je peux vous aider à planifier un rendez-vous directement ici. Complétez le formulaire ci-dessous :", true)
      } else {
        const found = KNOWLEDGE_BASE.find(e => e.keywords.some(k => low.includes(k)))
        addBotMessage(found?.response ?? "C'est une excellente question. Pour vous apporter une réponse précise et adaptée à votre architecture spécifique, je vous suggère d'en discuter directement avec Maître Mokadmi lors d'un diagnostic stratégique.")
      }
      setIsTyping(false)
    }, 800)
  }

  const handleRdvConfirm = (data: { name: string; email: string; date: string; time: string; format: string; subject: string }) => {
    // Si client connecté → aussi dans localStorage
    if (user?.role === 'client') {
      const rdvs: Appointment[] = JSON.parse(localStorage.getItem(`avocat_rdv_${user.id}`) || '[]')
      rdvs.push({
        id: crypto.randomUUID(),
        title: data.subject || 'Rendez-vous (via Assistant IA)',
        date: data.date, time: data.time,
        type: data.format as Appointment['type'],
        notes: 'Demande depuis l\'assistant IA',
        clientId: user.id,
      })
      localStorage.setItem(`avocat_rdv_${user.id}`, JSON.stringify(rdvs))
    }

    // Fermer le formulaire + confirmer
    setMessages(prev => prev.map(m => m.isRdvForm ? { ...m, isRdvForm: false } : m))
    setTimeout(() => {
      addBotMessage(
        `✓ Demande envoyée pour le ${new Date(data.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${data.time}. Maître Mokadmi vous confirmera le créneau sous 24h ouvrées à ${data.email}.`
      )
    }, 100)
  }

  return (
    <div className="fixed bottom-6 right-[5.5rem] sm:right-24 z-50 flex flex-col items-end">
      {/* Bouton toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Fermer l\'assistant' : 'Ouvrir l\'assistant'}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-gold rotate-90' : 'bg-dark-surface border border-gold/30 hover:border-gold'
        }`}
      >
        {isOpen ? <X className="text-dark-bg" size={24} /> : (
          <div className="relative">
            <Bot className="text-gold" size={26} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-surface animate-pulse" />
          </div>
        )}
      </button>

      {/* Fenêtre chat */}
      {isOpen && (
        <div className="absolute bottom-16 sm:bottom-20 right-0 sm:-right-4 w-[calc(100vw-3rem)] sm:w-[400px] max-w-[400px] h-[65vh] sm:h-[540px] bg-dark-bg border border-gold/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Header */}
          <div className="bg-dark-surface border-b border-gold/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 flex items-center justify-center border border-gold/20">
              <Sparkles className="text-gold" size={18} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-gold uppercase tracking-widest">Assistant IA</p>
              <p className="text-[10px] text-light/40">L'Architecte Numérique</p>
            </div>
            {/* Bouton RDV rapide */}
            <button
              onClick={() => {
                addBotMessage("Je peux vous aider à planifier un rendez-vous directement ici. Complétez le formulaire ci-dessous :", true)
              }}
              className="flex items-center gap-1.5 text-[10px] font-medium text-gold/60 border border-gold/20 px-2.5 py-1.5 hover:border-gold/40 hover:text-gold transition-colors"
            >
              <CalendarDays size={10} strokeWidth={1.5} /> RDV
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {messages.map(msg => (
              <div key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gold text-dark-bg font-medium'
                    : 'bg-dark-surface border border-gold/10 text-light/80'
                }`}>
                  {msg.text}
                </div>

                {/* Formulaire RDV inline */}
                {msg.isRdvForm && (
                  <div className="w-full max-w-[85%]">
                    <RdvFormInline user={user} onConfirm={handleRdvConfirm} />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-dark-surface border border-gold/10 p-3 flex gap-1">
                  {[0, 0.2, 0.4].map(d => (
                    <div key={d} className="w-1.5 h-1.5 bg-gold/40 animate-bounce" style={{ animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gold/10 bg-dark-surface">
            <div className="flex gap-2">
              <input
                type="text" value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Posez votre question ou tapez 'RDV'…"
                className="flex-1 bg-dark-bg border border-gold/15 px-4 py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors"
              />
              <button onClick={handleSend} disabled={!inputValue.trim()}
                className="w-10 h-10 bg-gold text-dark-bg flex items-center justify-center hover:bg-gold/90 transition-colors disabled:opacity-50">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
