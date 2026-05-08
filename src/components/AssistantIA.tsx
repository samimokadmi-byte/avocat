import { useState, useEffect, useRef } from 'react'
import { X, Send, Bot, Sparkles, CalendarDays } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Appointment } from './CalendarView'
import { KNOWLEDGE_BASE, FALLBACK_RESPONSE } from '../data/knowledgeBase'
import { STORAGE_KEYS } from '../constants/storageKeys'

interface Message {
  id: string
  text: string
  sender: 'bot' | 'user'
  timestamp: Date
  isAppointmentForm?: boolean
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    text: "Bonjour, je suis l'Assistant Numérique du cabinet. Comment puis-je vous éclairer sur notre approche d'Architecture Juridique aujourd'hui ?",
    sender: 'bot',
    timestamp: new Date()
  }
]

export default function AssistantIA() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Appointment form state
  const [rdvDate, setRdvDate] = useState('')
  const [rdvTime, setRdvTime] = useState('10:00')

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
      const isRdvIntent = ['rdv', 'rendez-vous', 'rendez vous', 'prendre rdv', 'appointment', 'réserver'].some(k => inputValue.toLowerCase().includes(k))

      if (isRdvIntent && user?.role === 'client') {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "Je peux vous aider à planifier un rendez-vous. Veuillez choisir une date et une heure ci-dessous :",
          sender: 'bot',
          timestamp: new Date(),
          isAppointmentForm: true
        }
        setMessages(prev => [...prev, botMessage])
        setIsTyping(false)
        return
      }

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

  const handleBookAppointment = () => {
    if (!rdvDate || !user) return

    const rdvs: Appointment[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.rdvs(user.id)) || '[]')
    const newRdv: Appointment = {
      id: crypto.randomUUID(),
      title: 'Rendez-vous (via Assistant IA)',
      date: rdvDate,
      time: rdvTime,
      type: 'visio',
      notes: "Demande depuis l'assistant IA",
      clientId: user.id
    }

    rdvs.push(newRdv)
    localStorage.setItem(STORAGE_KEYS.rdvs(user.id), JSON.stringify(rdvs))

    const confirmationMsg: Message = {
      id: Date.now().toString(),
      text: `Parfait, votre rendez-vous est confirmé pour le ${new Date(rdvDate).toLocaleDateString('fr-FR')} à ${rdvTime}. Vous le retrouverez dans votre agenda.`,
      sender: 'bot',
      timestamp: new Date()
    }

    setMessages(prev => prev.filter(m => !m.isAppointmentForm).concat(confirmationMsg))
  }

  const findResponse = (input: string): string => {
    const lowInput = input.toLowerCase()
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.keywords.some(k => lowInput.includes(k))) {
        return entry.response
      }
    }
    return FALLBACK_RESPONSE
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
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className={`max-w-[80%] p-3 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gold text-dark-bg font-medium'
                    : 'bg-dark-surface border border-gold/10 text-light/80'
                }`}>
                  {msg.text}
                </div>
                {msg.isAppointmentForm && (
                  <div className="mt-2 w-full max-w-[80%] bg-dark-surface border border-gold/20 p-3 flex flex-col gap-3">
                    <p className="text-xs text-light/60 flex items-center gap-1.5 font-medium"><CalendarDays size={14}/> Planifier un RDV</p>
                    <div className="flex flex-col gap-1.5">
                      <input type="date" value={rdvDate} onChange={e => setRdvDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="bg-dark-bg border border-gold/10 px-3 py-1.5 text-sm text-light focus:outline-none focus:border-gold" />
                      <input type="time" value={rdvTime} onChange={e => setRdvTime(e.target.value)} className="bg-dark-bg border border-gold/10 px-3 py-1.5 text-sm text-light focus:outline-none focus:border-gold" />
                    </div>
                    <button onClick={handleBookAppointment} disabled={!rdvDate} className="bg-gold text-dark-bg text-xs font-bold py-2 hover:bg-gold/90 transition-colors disabled:opacity-50">Confirmer le RDV</button>
                  </div>
                )}
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
