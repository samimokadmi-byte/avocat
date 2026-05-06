import { useEffect, useState } from 'react'
import { Appointment } from '../components/CalendarView'
import { Todo } from '../components/TodoList'

export interface ReminderAlert {
  id: string
  message: string
  urgency: 'high' | 'normal'
}

function getDayStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().split('T')[0]
}

function buildAlerts(rdvs: Appointment[], todos: Todo[]): ReminderAlert[] {
  const today = getDayStr(0)
  const tomorrow = getDayStr(1)
  const in2 = getDayStr(2)
  const alerts: ReminderAlert[] = []

  rdvs.forEach(r => {
    if (r.date === today) {
      alerts.push({ id: `rdv-${r.id}`, urgency: 'high', message: `RDV aujourd'hui à ${r.time} — ${r.title}` })
    } else if (r.date === tomorrow) {
      alerts.push({ id: `rdv-${r.id}`, urgency: 'normal', message: `RDV demain à ${r.time} — ${r.title}` })
    } else if (r.date === in2) {
      alerts.push({ id: `rdv-${r.id}`, urgency: 'normal', message: `RDV dans 2 jours (${r.time}) — ${r.title}` })
    }
  })

  todos.filter(t => !t.done && t.dueDate).forEach(t => {
    if (t.dueDate! < today) {
      alerts.push({ id: `todo-${t.id}`, urgency: 'high', message: `Tâche en retard — ${t.title}` })
    } else if (t.dueDate === today) {
      alerts.push({ id: `todo-${t.id}`, urgency: 'high', message: `Tâche à rendre aujourd'hui — ${t.title}` })
    } else if (t.dueDate === tomorrow) {
      alerts.push({ id: `todo-${t.id}`, urgency: 'normal', message: `Tâche due demain — ${t.title}` })
    }
  })

  return alerts
}

export function useReminders(rdvs: Appointment[], todos: Todo[]) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const rawAlerts = buildAlerts(rdvs, todos)
  const alerts = rawAlerts.filter(a => !dismissed.has(a.id))

  useEffect(() => {
    if (rawAlerts.length === 0) return

    const alreadyFired = new Set<string>(
      JSON.parse(sessionStorage.getItem('avocat_notified') ?? '[]')
    )
    const toFire = rawAlerts.filter(a => !alreadyFired.has(a.id))
    if (toFire.length === 0) return

    const notify = async () => {
      if (!('Notification' in window)) return
      let perm = Notification.permission
      if (perm === 'default') perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      toFire.forEach(a => new Notification('Maître Mokadmi Sami', { body: a.message, tag: a.id }))
      const next = [...alreadyFired, ...toFire.map(a => a.id)]
      sessionStorage.setItem('avocat_notified', JSON.stringify(next))
    }
    notify()
  }, [rdvs, todos]) // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]))

  return { alerts, dismiss }
}
