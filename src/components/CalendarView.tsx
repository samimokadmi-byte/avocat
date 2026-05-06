import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export interface Appointment {
  id: string
  title: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM
  type: 'visio' | 'presentiel' | 'telephone'
  notes?: string
  clientId: string
  dossierId?: string
}

const TYPE_LABEL: Record<Appointment['type'], string> = {
  visio: 'Visioconférence',
  presentiel: 'Présentiel',
  telephone: 'Téléphone',
}

const TYPE_DOT: Record<Appointment['type'], string> = {
  visio: 'bg-blue-500',
  presentiel: 'bg-dark-surface',
  telephone: 'bg-gold/50',
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface Props {
  appointments: Appointment[]
  onSelectDate?: (date: string) => void
  selectedDate?: string | null
  readOnly?: boolean
}

export default function CalendarView({ appointments, onSelectDate, selectedDate, readOnly }: Props) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const firstDay = new Date(year, month, 1)
  // Mon=0 … Sun=6
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // Map date → appointments
  const byDate = new Map<string, Appointment[]>()
  appointments.forEach(a => {
    if (!byDate.has(a.date)) byDate.set(a.date, [])
    byDate.get(a.date)!.push(a)
  })

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const dayAppts = selectedDate ? (byDate.get(selectedDate) ?? []) : []

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Grid */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prev} className="p-1 text-light/40 hover:text-light transition-colors">
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <p className="font-serif text-base font-semibold text-light">
            {MONTHS[month]} {year}
          </p>
          <button onClick={next} className="p-1 text-light/40 hover:text-light transition-colors">
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-medium text-light/30 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-gold/10">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="bg-dark-surface h-12 sm:h-14" />
            const dateStr = isoDate(year, month, day)
            const appts = byDate.get(dateStr) ?? []
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            return (
              <button
                key={i}
                onClick={() => !readOnly && onSelectDate?.(dateStr)}
                disabled={readOnly}
                className={`bg-dark-surface h-12 sm:h-14 flex flex-col items-center justify-start pt-1.5 gap-1 transition-colors relative ${
                  !readOnly ? 'hover:bg-dark-card cursor-pointer' : 'cursor-default'
                } ${isSelected ? 'ring-1 ring-inset ring-navy' : ''}`}
              >
                <span className={`text-xs font-medium w-5 h-5 flex items-center justify-center ${
                  isToday ? 'bg-gold text-dark-bg' : 'text-light/70'
                }`}>
                  {day}
                </span>
                {appts.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center px-1">
                    {appts.slice(0, 3).map(a => (
                      <span key={a.id} className={`w-1 h-1 rounded-full ${TYPE_DOT[a.type]}`} />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 flex-wrap">
          {(Object.entries(TYPE_LABEL) as [Appointment['type'], string][]).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-light/40">
              <span className={`w-2 h-2 rounded-full ${TYPE_DOT[type]}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Day detail */}
      <div className="lg:w-64 flex-none">
        {selectedDate ? (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-light/40 uppercase tracking-wide">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {dayAppts.length === 0 ? (
              <p className="text-sm text-light/30 py-4">Aucun rendez-vous ce jour.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {dayAppts.sort((a, b) => a.time.localeCompare(b.time)).map(appt => (
                  <div key={appt.id} className="border border-gold/10 px-4 py-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-none ${TYPE_DOT[appt.type]}`} />
                      <span className="text-xs font-medium text-light/40">{appt.time} · {TYPE_LABEL[appt.type]}</span>
                    </div>
                    <p className="text-sm font-medium text-light">{appt.title}</p>
                    {appt.notes && <p className="text-xs text-light/50 leading-snug">{appt.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-gold/15 px-4 py-8 text-center">
            <p className="text-xs text-light/30">Sélectionnez un jour<br />pour voir les rendez-vous</p>
          </div>
        )}
      </div>
    </div>
  )
}

export { TYPE_LABEL, TYPE_DOT }
