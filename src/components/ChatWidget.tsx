import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { scrollTo } from '../utils/scrollTo'

const PHONE = '21629784651'

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

interface Msg {
  from: 'bot' | 'user'
  text: string
}

type Step =
  | 'menu'
  | 'societe_ask'
  | 'litige_ask'
  | 'contrat_ask'
  | 'prix_ask'
  | 'autre_ask'
  | 'cta'

const INIT_MSGS: Msg[] = [{
  from: 'bot',
  text: 'Bonjour ! Je suis l\'assistant juridique du cabinet Mokadmi Sami.\n\nComment puis-je vous aider aujourd\'hui ?',
}]

const MENU_REPLIES = [
  'Créer une société',
  'Problème juridique',
  'Contrat',
  'Honoraires',
  'Autre demande',
]

function buildWaUrl(msgs: Msg[]): string {
  const exchange = msgs
    .slice(1)
    .map(m => `${m.from === 'user' ? 'Moi' : 'Assistant'}: ${m.text}`)
    .slice(-8)
    .join('\n\n')
  const text = `Bonjour Maître Mokadmi,\n\nSuite à mon échange avec votre assistant :\n\n${exchange}\n\nJe souhaite obtenir votre accompagnement.`
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`
}

export default function ChatWidget() {
  const [open, setOpen]       = useState(false)
  const [msgs, setMsgs]       = useState<Msg[]>(INIT_MSGS)
  const [step, setStep]       = useState<Step>('menu')
  const [replies, setReplies] = useState<string[]>(MENU_REPLIES)
  const [typing, setTyping]   = useState(false)
  const [input, setInput]     = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, typing])

  function botReply(text: string, nextStep: Step, nextReplies: string[] = []) {
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs(prev => [...prev, { from: 'bot', text }])
      setStep(nextStep)
      setReplies(nextReplies)
    }, 800)
  }

  function handleReply(text: string) {
    if (typing) return
    setMsgs(prev => [...prev, { from: 'user', text }])
    setReplies([])
    dispatch(text, step)
  }

  function handleSend() {
    const t = input.trim()
    if (!t) return
    setInput('')
    handleReply(t)
  }

  function dispatch(text: string, currentStep: Step) {
    const t = text.toLowerCase()

    if (currentStep === 'menu') {
      if (t.includes('société') || t.includes('societe') || t.includes('créer') || t.includes('creer')) {
        botReply(
          'Vous souhaitez créer une société, c\'est bien noté.\n\nPour vous orienter vers la forme juridique la plus adaptée :\n\n• Quelle est votre activité principale ?\n• Serez-vous seul ou avec des associés ?',
          'societe_ask',
          ['Seul (SUARL)', 'Avec des associés (SARL)', 'Plusieurs associés (SA)']
        )
      } else if (t.includes('problème') || t.includes('probleme') || t.includes('litige') || t.includes('juridique')) {
        botReply(
          'Je comprends que vous faites face à une situation délicate.\n\nQuelques précisions pour mieux vous orienter :\n\n• Quel est le type de litige (commercial, contractuel, social…) ?\n• Y a-t-il une urgence particulière ?',
          'litige_ask',
          ['Litige commercial', 'Litige contractuel', 'Litige social', 'Urgence']
        )
      } else if (t.includes('contrat')) {
        botReply(
          'Vous avez besoin d\'aide sur un contrat, c\'est noté.\n\nDe quel type de prestation avez-vous besoin ?\n\n• Audit d\'un contrat existant ?\n• Rédaction d\'un nouveau contrat ?',
          'contrat_ask',
          ['Audit de contrat', 'Rédaction de contrat', 'Les deux']
        )
      } else if (
        t.includes('honoraire') || t.includes('prix') ||
        t.includes('tarif') || t.includes('coût') || t.includes('cout')
      ) {
        botReply(
          'Les honoraires dépendent de votre situation et de la complexité du dossier.\n\nJe peux vous proposer une estimation après quelques informations.\n\nQuel est l\'objet de votre demande ?',
          'prix_ask',
          ['Création de société', 'Consultation juridique', 'Rédaction de contrat', 'Accompagnement global']
        )
      } else {
        botReply(
          'Je prends note de votre demande.\n\nPour mieux vous orienter, pourriez-vous préciser :\n\n• De quelle nature est votre question juridique ?\n• Y a-t-il une urgence ?',
          'autre_ask',
          ['Oui, c\'est urgent', 'Pas d\'urgence particulière']
        )
      }
    } else {
      botReply(
        'Merci pour ces informations.\n\nVotre situation nécessite une analyse approfondie pour vous apporter une réponse fiable et adaptée à votre contexte.\n\nJe vous invite à :\n\n• Prendre un rendez-vous de diagnostic (90 min)\n• Ou poursuivre directement avec Maître Mokadmi sur WhatsApp',
        'cta',
        []
      )
    }
  }

  return (
    <>
      {/* ── Chat Panel ─────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 max-h-[70vh] flex flex-col shadow-2xl shadow-black/60 border border-white/5">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#075E54] flex-none">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-none text-white">
              {WA_ICON}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white leading-tight">Assistant Juridique</p>
              <p className="text-[10px] text-white/60 leading-tight">Cabinet Mokadmi Sami · En ligne</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
              className="text-white/60 hover:text-white transition-colors p-1"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0C1220] min-h-0">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                  m.from === 'bot'
                    ? 'bg-[#111B2E] text-light/80'
                    : 'bg-[#075E54] text-white'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-[#111B2E] px-3 py-2 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick replies */}
            {replies.length > 0 && !typing && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {replies.map(r => (
                  <button
                    key={r}
                    onClick={() => handleReply(r)}
                    className="text-[11px] border border-gold/25 text-gold/70 hover:bg-gold/10 hover:text-gold px-2.5 py-1 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* CTA */}
            {step === 'cta' && !typing && (
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { setOpen(false); scrollTo('booking') }}
                  className="text-[11px] font-medium bg-gold text-dark-bg px-3 py-2 hover:bg-gold/90 transition-colors text-center"
                >
                  Prendre rendez-vous →
                </button>
                <a
                  href={buildWaUrl(msgs)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium bg-[#25D366] text-white px-3 py-2 hover:bg-[#1ebe5d] transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <span className="text-white">{WA_ICON}</span>
                  Continuer sur WhatsApp
                </a>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 bg-[#0C1220] flex-none">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Écrivez votre message…"
              className="flex-1 bg-transparent text-xs text-light/80 placeholder:text-light/25 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              aria-label="Envoyer"
              className="text-gold/40 hover:text-gold transition-colors disabled:opacity-25"
            >
              <Send size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Button ────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat WhatsApp'}
        className="fixed bottom-6 right-4 sm:right-6 z-50 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] flex items-center justify-center shadow-lg shadow-black/30 transition-all duration-200 text-white"
      >
        {open ? <X size={20} strokeWidth={1.5} /> : WA_ICON}
      </button>
    </>
  )
}
