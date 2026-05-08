import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Sparkles } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Bonjour, je suis l'Assistant Numérique du cabinet. Comment puis-je vous éclairer sur notre approche d'Architecture Juridique aujourd'hui ?",
    sender: 'bot',
    timestamp: new Date()
  }
]

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
    keywords: ['contact', 'rendez-vous', 'rdv', 'parler', 'appel', 'téléphone', 'email'],
    response: "Vous pouvez prendre rendez-vous pour un Diagnostic Stratégique de 90 minutes via le bouton 'Consultation' en haut de page, ou nous contacter directement à office@mokadmi.lawyer."
  },
  {
    keywords: ['prix', 'tarif', 'honoraires', 'coût', 'combien'],
    response: "Nos interventions se font généralement au forfait pour garantir une totale transparence. Le diagnostic initial de 90 minutes est facturé 350 € HT (imputable sur mission)."
  },
  {
    keywords: ['expérience', 'ancienneté', 'qui est', 'mokadmi', 'sami'],
    response: "Maître Mokadmi Sami est l'Architecte Juridique du cabinet, fort de 24 ans d'expérience en droit des affaires et ingénierie stratégique entre Tunis et Paris."
  }
]

export default function AssistantIA() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate natural delay
    setTimeout(() => {
      const botResponse = findResponse(inputValue)
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1000)
  }

  const findResponse = (input: string): string => {
    const lowInput = input.toLowerCase()

    for (const entry of KNOWLEDGE_BASE) {
      if (entry.keywords.some(k => lowInput.includes(k))) {
        return entry.response
      }
    }

    return "C'est une excellente question. Pour vous apporter une réponse précise et adaptée à votre architecture spécifique, je vous suggère d'en discuter directement avec Maître Mokadmi lors d'un diagnostic stratégique."
  }

  return (
    <div className="fixed bottom-6 right-6 sm:right-24 z-50 flex flex-col items-end">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? 'bg-gold rotate-90' : 'bg-dark-surface border border-gold/30 hover:border-gold'
        }`}
      >
        {isOpen ? (
          <X className="text-dark-bg" size={24} />
        ) : (
          <div className="relative">
            <Bot className="text-gold" size={26} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-surface animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 sm:bottom-20 right-0 sm:-right-4 w-[calc(100vw-3rem)] sm:w-[400px] max-w-[400px] h-[60vh] sm:h-[500px] bg-dark-bg border border-gold/20 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-dark-surface border-b border-gold/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gold/10 flex items-center justify-center border border-gold/20">
              <Sparkles className="text-gold" size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-gold uppercase tracking-widest">Assistant IA</p>
              <p className="text-[10px] text-light/40">L'Architecte Numérique</p>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-gold/20"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gold text-dark-bg font-medium'
                    : 'bg-dark-surface border border-gold/10 text-light/80'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-dark-surface border border-gold/10 p-3 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gold/40 animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gold/40 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-gold/40 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gold/10 bg-dark-surface">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Posez votre question..."
                className="flex-1 bg-dark-bg border border-gold/15 px-4 py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-gold text-dark-bg flex items-center justify-center hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
