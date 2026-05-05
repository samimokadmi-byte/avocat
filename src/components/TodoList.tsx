import { useState } from 'react'
import { CheckSquare, Square, Trash2, AlertCircle, Clock, Pencil, FolderOpen } from 'lucide-react'

export interface Todo {
  id: string
  title: string
  done: boolean
  priority: 'normale' | 'urgente'
  dueDate?: string // YYYY-MM-DD
  clientId: string
  createdAt: string
  dossierId?: string
}

interface Props {
  todos: Todo[]
  onToggle?: (id: string) => void
  onDelete?: (id: string) => void
  onEdit?: (todo: Todo) => void
  readOnly?: boolean
  dossierMap?: Record<string, string>
}

export default function TodoList({ todos, onToggle, onDelete, onEdit, readOnly, dossierMap }: Props) {
  const [filter, setFilter] = useState<'toutes' | 'en_cours' | 'faites'>('en_cours')

  const filtered = todos.filter(t =>
    filter === 'toutes' ? true : filter === 'en_cours' ? !t.done : t.done
  )

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex gap-1">
        {(['en_cours', 'toutes', 'faites'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3 py-1.5 transition-colors border ${
              filter === f ? 'bg-navy text-offwhite border-navy' : 'text-navy/50 border-navy/15 hover:border-navy/30'
            }`}
          >
            {f === 'en_cours' ? 'En cours' : f === 'toutes' ? 'Toutes' : 'Faites'}
            <span className="ml-1.5 opacity-60">
              {f === 'en_cours' ? todos.filter(t => !t.done).length
               : f === 'toutes' ? todos.length
               : todos.filter(t => t.done).length}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-sm text-navy/30 py-4 text-center">Aucune tâche.</p>
      ) : (
        <div className="flex flex-col gap-px bg-navy/10">
          {filtered
            .sort((a, b) => {
              if (a.done !== b.done) return a.done ? 1 : -1
              if (a.priority !== b.priority) return a.priority === 'urgente' ? -1 : 1
              return (a.dueDate ?? '').localeCompare(b.dueDate ?? '')
            })
            .map(todo => {
              const overdue = !todo.done && todo.dueDate && todo.dueDate < todayStr
              const dossierName = todo.dossierId && dossierMap ? dossierMap[todo.dossierId] : undefined
              return (
                <div key={todo.id} className={`bg-offwhite px-5 py-4 flex items-start gap-3 ${todo.done ? 'opacity-50' : ''}`}>
                  <button
                    onClick={() => onToggle?.(todo.id)}
                    disabled={readOnly}
                    className="mt-0.5 flex-none text-navy/40 hover:text-navy transition-colors disabled:cursor-default"
                  >
                    {todo.done
                      ? <CheckSquare size={16} strokeWidth={1.5} className="text-navy" />
                      : <Square size={16} strokeWidth={1.5} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-navy leading-snug ${todo.done ? 'line-through text-navy/40' : ''}`}>
                      {todo.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {todo.priority === 'urgente' && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-600">
                          <AlertCircle size={10} strokeWidth={2} /> Urgent
                        </span>
                      )}
                      {todo.dueDate && (
                        <span className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? 'text-red-500' : 'text-navy/40'}`}>
                          <Clock size={10} strokeWidth={1.5} />
                          {overdue ? 'En retard · ' : ''}
                          {new Date(todo.dueDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {dossierName && (
                        <span className="flex items-center gap-1 text-[10px] text-navy/40 border border-navy/10 px-1.5 py-0.5">
                          <FolderOpen size={9} strokeWidth={1.5} /> {dossierName}
                        </span>
                      )}
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="flex gap-1 mt-0.5">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(todo)}
                          className="flex-none text-navy/20 hover:text-navy transition-colors"
                        >
                          <Pencil size={13} strokeWidth={1.5} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(todo.id)}
                          className="flex-none text-navy/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
