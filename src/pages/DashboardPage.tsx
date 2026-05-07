import { useState, useRef, useEffect, useMemo, DragEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FolderOpen, FileUp, MessageSquare, LogOut,
  CheckCircle2, Clock, Circle, ChevronRight, Upload, File,
  FileText, Trash2, Menu, X, Shield, CalendarDays, Plus, Pencil, Bell, Receipt, Send,
} from 'lucide-react'
import CalendarView, { Appointment } from '../components/CalendarView'
import TodoList, { Todo } from '../components/TodoList'
import { useReminders } from '../hooks/useReminders'
import BillingModule, { Invoice, computeAmounts, fmtAmount } from '../components/BillingModule'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Etape {
  label: string
  statut: 'done' | 'current' | 'pending'
  date: string | null
}

interface Dossier {
  id: string
  titre: string
  statut: 'en_cours' | 'complete' | 'attente'
  dateOuverture: string
  prochainEcheance: string | null
  description: string
  etapes: Etape[]
}

interface Message {
  id: string
  from: 'admin' | 'client'
  text: string
  sentAt: string
  read: boolean
}

function getMessagesForClient(clientId: string): Message[] {
  return JSON.parse(localStorage.getItem(`avocat_messages_${clientId}`) || '[]')
}
function saveMessagesForClient(clientId: string, msgs: Message[]) {
  localStorage.setItem(`avocat_messages_${clientId}`, JSON.stringify(msgs))
}

export interface Document {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  dossierId?: string
  content?: string // base64
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useLocalState<T>(key: string, fallback: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
    catch { return fallback }
  })
  const setState = (val: T | ((prev: T) => T)) => {
    setStateRaw(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }
  return [state, setState]
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function StatusBadge({ statut }: { statut: Dossier['statut'] }) {
  const map = {
    en_cours: { label: 'En cours', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    complete: { label: 'Clôturé', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    attente: { label: 'En attente', className: 'bg-accent/50/10 text-amber-400 border-amber-500/20' },
  }
  const { label, className } = map[statut]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 border ${className}`}>{label}</span>
  )
}

// ─── Aperçu ──────────────────────────────────────────────────────────────────

function Apercu({ dossiers, documents, userName }: { dossiers: Dossier[]; documents: Document[]; userName: string }) {
  const actifs = dossiers.filter(d => d.statut === 'en_cours').length
  const prochaine = dossiers
    .filter(d => d.prochainEcheance)
    .sort((a, b) => a.prochainEcheance!.localeCompare(b.prochainEcheance!))[0]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-paper/40 mb-2">Tableau de bord</p>
        <h2 className="font-display text-2xl text-paper">Bonjour, {userName.split(' ')[0]}.</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-accent/10">
        <div className="bg-ink-soft p-6">
          <p className="text-xs text-paper/40 uppercase tracking-wide mb-2">Dossiers actifs</p>
          <p className="font-display text-3xl font-bold text-paper">{actifs}</p>
        </div>
        <div className="bg-ink-soft p-6">
          <p className="text-xs text-paper/40 uppercase tracking-wide mb-2">Documents</p>
          <p className="font-display text-3xl font-bold text-paper">{documents.length}</p>
        </div>
        <div className="bg-ink-soft p-6">
          <p className="text-xs text-paper/40 uppercase tracking-wide mb-2">Prochaine échéance</p>
          <p className="font-display text-base font-semibold text-paper leading-tight">
            {prochaine ? new Date(prochaine.prochainEcheance!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
          </p>
          {prochaine && <p className="text-xs text-paper/40 mt-0.5">{prochaine.titre}</p>}
        </div>
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-4">Dossiers récents</p>
        <div className="flex flex-col gap-px bg-accent/10">
          {dossiers.slice(0, 3).map(d => (
            <div key={d.id} className="bg-ink-soft px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FolderOpen size={15} strokeWidth={1.25} className="text-paper/30 flex-none" />
                <span className="text-sm font-medium text-paper truncate">{d.titre}</span>
              </div>
              <StatusBadge statut={d.statut} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-accent/10 px-6 py-4 flex items-center gap-3">
        <Shield size={14} strokeWidth={1.25} className="text-paper/30 flex-none" />
        <p className="text-xs text-paper/40">Connexion sécurisée · Chiffrement SSL 256 bits · Données hébergées en France</p>
      </div>
    </div>
  )
}

// ─── Dossiers ─────────────────────────────────────────────────────────────────

const DEFAULT_ETAPES_CLIENT = ['Audit initial', 'Structuration', 'Rédaction', 'Validation', 'Clôture']

function Dossiers({ dossiers, setDossiers, rdvs, todos, invoices }: {
  dossiers: Dossier[]
  setDossiers: (val: Dossier[] | ((prev: Dossier[]) => Dossier[])) => void
  rdvs: Appointment[]
  todos: Todo[]
  invoices: Invoice[]
}) {
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titre: '',
    description: '',
    etapes: [...DEFAULT_ETAPES_CLIENT],
  })

  const handleCreate = () => {
    if (!form.titre.trim()) return
    const newDossier: Dossier = {
      id: crypto.randomUUID(),
      titre: form.titre.trim(),
      statut: 'attente',
      dateOuverture: new Date().toISOString().split('T')[0],
      prochainEcheance: null,
      description: form.description.trim(),
      etapes: form.etapes.filter(e => e.trim()).map(label => ({
        label: label.trim(), statut: 'pending' as const, date: null,
      })),
    }
    setDossiers(prev => [...prev, newDossier])
    setShowForm(false)
    setForm({ titre: '', description: '', etapes: [...DEFAULT_ETAPES_CLIENT] })
  }

  if (selected) {
    const linkedRdvs = rdvs
      .filter(r => r.dossierId === selected.id)
      .sort((a, b) => a.date.localeCompare(b.date))
    const linkedTodos = todos.filter(t => t.dossierId === selected.id)
    const linkedInvoices = invoices.filter(i => i.dossierId === selected.id)

    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-xs text-paper/40 hover:text-paper transition-colors"
        >
          ← Retour aux dossiers
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-paper/40 mb-1">
              Dossier · {new Date(selected.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="font-display text-2xl text-paper">{selected.titre}</h2>
          </div>
          <StatusBadge statut={selected.statut} />
        </div>

        <p className="text-sm text-paper/60 leading-relaxed max-w-prose">{selected.description}</p>

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-6">Avancement</p>
          <div className="flex flex-col gap-0">
            {selected.etapes.map((etape, i) => (
              <div key={i} className="flex gap-5 pb-8 last:pb-0 relative">
                {i < selected.etapes.length - 1 && (
                  <div className="absolute left-[10px] top-6 bottom-0 w-px bg-accent/10" />
                )}
                <div className="flex-none mt-0.5 z-10">
                  {etape.statut === 'done' && <CheckCircle2 size={20} strokeWidth={1.5} className="text-paper" />}
                  {etape.statut === 'current' && <Clock size={20} strokeWidth={1.5} className="text-blue-600" />}
                  {etape.statut === 'pending' && <Circle size={20} strokeWidth={1.5} className="text-paper/20" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${etape.statut === 'pending' ? 'text-paper/30' : 'text-paper'}`}>
                    {etape.label}
                  </p>
                  {etape.date && (
                    <p className="text-xs text-paper/40 mt-0.5">{etape.date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected.prochainEcheance && (
          <div className="border border-accent/10 px-6 py-4">
            <p className="text-xs text-paper/40 uppercase tracking-wide mb-1">Prochaine échéance</p>
            <p className="text-sm font-medium text-paper">
              {new Date(selected.prochainEcheance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        {linkedRdvs.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-3">Rendez-vous liés</p>
            <div className="flex flex-col gap-px bg-accent/10">
              {linkedRdvs.map(r => (
                <div key={r.id} className="bg-ink-soft px-5 py-3 flex items-center gap-3">
                  <CalendarDays size={13} strokeWidth={1.25} className="text-paper/30 flex-none" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-paper truncate">{r.title}</p>
                    <p className="text-xs text-paper/40 mt-0.5">
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {r.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {linkedTodos.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-3">Tâches liées</p>
            <div className="flex flex-col gap-px bg-accent/10">
              {linkedTodos.map(t => (
                <div key={t.id} className={`bg-ink-soft px-5 py-3 flex items-center gap-3 ${t.done ? 'opacity-50' : ''}`}>
                  {t.done
                    ? <CheckCircle2 size={13} strokeWidth={1.5} className="text-paper flex-none" />
                    : <Circle size={13} strokeWidth={1.5} className="text-paper/30 flex-none" />}
                  <p className={`text-sm flex-1 min-w-0 truncate ${t.done ? 'line-through text-paper/40' : 'text-paper font-medium'}`}>{t.title}</p>
                  {t.priority === 'urgente' && !t.done && (
                    <span className="text-[10px] font-semibold text-red-600 flex-none">Urgent</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {linkedInvoices.length > 0 && (
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-3">Factures liées</p>
            <div className="flex flex-col gap-px bg-accent/10">
              {linkedInvoices.map(inv => {
                const { net } = computeAmounts(inv)
                const statusCls = { brouillon: 'text-gray-500', envoyee: 'text-blue-600', payee: 'text-green-600', en_retard: 'text-red-600' }[inv.status]
                const statusLabel = { brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée', en_retard: 'En retard' }[inv.status]
                return (
                  <div key={inv.id} className="bg-ink-soft px-5 py-3 flex items-center gap-3">
                    <Receipt size={13} strokeWidth={1.25} className="text-paper/30 flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-paper font-mono truncate">{inv.number}</p>
                      <p className="text-xs text-paper/40 mt-0.5">
                        {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}<span className={statusCls}>{statusLabel}</span>
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-paper flex-none">{fmtAmount(net, inv.currency)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-paper/40 mb-2">Mes Dossiers</p>
          <h2 className="font-display text-2xl text-paper">Suivi de vos missions</h2>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 bg-accent text-paper text-xs font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors"
        >
          <Plus size={13} strokeWidth={2} />
          Nouveau dossier
        </button>
      </div>

      {showForm && (
        <div className="border border-accent/20 bg-ink-soft p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-paper">Créer un dossier</p>
            <button onClick={() => setShowForm(false)} className="text-paper/30 hover:text-paper transition-colors">
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Titre du dossier *</label>
            <input
              type="text" placeholder="Ex : Levée de fonds Série A"
              value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              className="border border-paper/15 bg-ink text-paper text-sm px-3 py-2.5 placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Description</label>
            <textarea
              rows={2} placeholder="Contexte ou objectif de la mission…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="border border-paper/15 bg-ink text-paper text-sm px-3 py-2.5 placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Étapes</label>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, etapes: [...f.etapes, ''] }))}
                className="inline-flex items-center gap-1 text-accent text-[11px] font-mono hover:text-accent/70 transition-colors"
              >
                <Plus size={11} strokeWidth={2} /> Ajouter
              </button>
            </div>
            {form.etapes.map((etape, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-paper/25 w-4 flex-none">{idx + 1}.</span>
                <input
                  type="text" value={etape}
                  onChange={ev => setForm(f => {
                    const etapes = [...f.etapes]
                    etapes[idx] = ev.target.value
                    return { ...f, etapes }
                  })}
                  className="flex-1 border border-paper/10 bg-ink text-paper text-xs px-2.5 py-1.5 placeholder:text-paper/20 focus:outline-none focus:border-accent/50 transition-colors"
                />
                {form.etapes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, etapes: f.etapes.filter((_, i) => i !== idx) }))}
                    className="text-paper/20 hover:text-red-400 transition-colors flex-none"
                  >
                    <X size={12} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.titre.trim()}
            className="self-start bg-accent text-paper text-xs font-medium px-5 py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-40"
          >
            Créer le dossier
          </button>
        </div>
      )}

      <div className="flex flex-col gap-px bg-accent/10">
        {dossiers.length === 0 && !showForm && (
          <div className="px-8 py-12 text-center text-sm text-paper/30 border border-paper/10">
            Aucun dossier. Cliquez sur "Nouveau dossier" pour commencer.
          </div>
        )}
        {dossiers.map(dossier => {
          const rdvCount = rdvs.filter(r => r.dossierId === dossier.id).length
          const todoCount = todos.filter(t => t.dossierId === dossier.id && !t.done).length
          const invCount = invoices.filter(i => i.dossierId === dossier.id).length
          return (
            <button
              key={dossier.id}
              onClick={() => setSelected(dossier)}
              className="bg-ink-soft px-8 py-6 flex items-center justify-between gap-4 text-left hover:bg-ink transition-colors group"
            >
              <div className="flex items-start gap-4 min-w-0">
                <FolderOpen size={16} strokeWidth={1.25} className="text-paper/30 flex-none mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-paper mb-1">{dossier.titre}</p>
                  <p className="text-xs text-paper/40 truncate">{dossier.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-paper/30">
                      Ouvert le {new Date(dossier.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-paper/20">·</span>
                    <span className="text-xs text-paper/30">
                      {dossier.etapes.filter(e => e.statut === 'done').length}/{dossier.etapes.length} étapes
                    </span>
                    {rdvCount > 0 && (
                      <span className="text-xs text-blue-500">{rdvCount} RDV</span>
                    )}
                    {todoCount > 0 && (
                      <span className="text-xs text-accent/70">{todoCount} tâche{todoCount > 1 ? 's' : ''}</span>
                    )}
                    {invCount > 0 && (
                      <span className="text-xs text-emerald-600">{invCount} facture{invCount > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-none">
                <StatusBadge statut={dossier.statut} />
                <ChevronRight size={14} strokeWidth={1.5} className="text-paper/20 group-hover:text-paper/50 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Documents ────────────────────────────────────────────────────────────────

function Documents({ documents, setDocuments }: { documents: Document[]; setDocuments: (d: Document[] | ((prev: Document[]) => Document[])) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => {
      const reader = new FileReader()
      reader.onload = () => {
        const doc: Document = {
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          type: f.type,
          uploadedAt: new Date().toISOString(),
          content: reader.result as string,
        }
        setDocuments((prev: Document[]) => [...prev, doc])
      }
      reader.readAsDataURL(f)
    })
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => addFiles(e.target.files)

  const remove = (id: string) => setDocuments(documents.filter(d => d.id !== id))

  const fileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText size={15} strokeWidth={1.25} className="text-red-400" />
    return <File size={15} strokeWidth={1.25} className="text-paper/30" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-paper/40 mb-2">Documents</p>
        <h2 className="font-display text-2xl text-paper">Gestion documentaire</h2>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed px-8 py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          dragging ? 'border-accent bg-ink' : 'border-accent/15 hover:border-accent/30 hover:bg-ink'
        }`}
      >
        <Upload size={24} strokeWidth={1.25} className="text-paper/30" />
        <div className="text-center">
          <p className="text-sm font-medium text-paper">Déposer vos fichiers ici</p>
          <p className="text-xs text-paper/40 mt-1">ou cliquez pour parcourir · PDF, Word, Excel acceptés</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={onInputChange}
          className="hidden"
        />
      </div>

      {documents.length > 0 && (
        <div className="flex flex-col gap-px bg-accent/10">
          {documents.map(doc => (
            <div key={doc.id} className="bg-ink-soft px-6 py-4 flex items-center gap-4">
              <div className="flex-none">{fileIcon(doc.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-paper truncate">{doc.name}</p>
                <p className="text-xs text-paper/40 mt-0.5">
                  {formatSize(doc.size)} · Déposé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => remove(doc.id)}
                className="flex-none text-paper/20 hover:text-red-500 transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <p className="text-sm text-paper/30 text-center py-4">Aucun document déposé pour le moment.</p>
      )}
    </div>
  )
}

// ─── Rendez-vous + Todos ──────────────────────────────────────────────────────

function Rendezvous({ rdvs, setRdvs, todos, setTodos, userId, dossiers }: {
  rdvs: Appointment[]
  setRdvs: (r: Appointment[] | ((prev: Appointment[]) => Appointment[])) => void
  todos: Todo[]
  setTodos: (t: Todo[] | ((prev: Todo[]) => Todo[])) => void
  userId: string
  dossiers: Dossier[]
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [section, setSection] = useState<'rdv' | 'todo'>('rdv')

  const dossierMap: Record<string, string> = Object.fromEntries(dossiers.map(d => [d.id, d.titre]))

  // RDV state
  const [showRdvForm, setShowRdvForm] = useState(false)
  const [editRdv, setEditRdv] = useState<Appointment | null>(null)
  const [rdvForm, setRdvForm] = useState({
    title: '', date: new Date().toISOString().split('T')[0],
    time: '10:00', type: 'visio' as Appointment['type'], notes: '',
    dossierId: undefined as string | undefined,
  })

  // Todo state
  const [showTodoForm, setShowTodoForm] = useState(false)
  const [editTodo, setEditTodo] = useState<Todo | null>(null)
  const [todoForm, setTodoForm] = useState({
    title: '', priority: 'normale' as Todo['priority'], dueDate: '',
    dossierId: undefined as string | undefined,
  })

  const upcoming = [...rdvs]
    .filter(r => r.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── RDV actions ──
  const openNewRdv = () => {
    setEditRdv(null)
    setRdvForm({ title: '', date: selectedDate ?? new Date().toISOString().split('T')[0], time: '10:00', type: 'visio', notes: '', dossierId: undefined })
    setShowRdvForm(true)
  }
  const openEditRdv = (r: Appointment) => {
    setEditRdv(r)
    setRdvForm({ title: r.title, date: r.date, time: r.time, type: r.type, notes: r.notes ?? '', dossierId: r.dossierId })
    setShowRdvForm(true)
  }
  const saveRdv = () => {
    if (!rdvForm.title || !rdvForm.date) return
    if (editRdv) {
      setRdvs((prev: Appointment[]) => prev.map(r => r.id === editRdv.id ? { ...r, ...rdvForm } : r))
    } else {
      const newRdv: Appointment = { id: crypto.randomUUID(), clientId: userId, ...rdvForm }
      setRdvs((prev: Appointment[]) => [...prev, newRdv])
    }
    setShowRdvForm(false)
    setEditRdv(null)
  }
  const deleteRdv = (id: string) => setRdvs((prev: Appointment[]) => prev.filter(r => r.id !== id))

  // ── Todo actions ──
  const openNewTodo = () => {
    setEditTodo(null)
    setTodoForm({ title: '', priority: 'normale', dueDate: '', dossierId: undefined })
    setShowTodoForm(true)
  }
  const openEditTodo = (t: Todo) => {
    setEditTodo(t)
    setTodoForm({ title: t.title, priority: t.priority, dueDate: t.dueDate ?? '', dossierId: t.dossierId })
    setShowTodoForm(true)
  }
  const saveTodo = () => {
    if (!todoForm.title) return
    if (editTodo) {
      setTodos((prev: Todo[]) => prev.map(t => t.id === editTodo.id ? { ...t, ...todoForm, dueDate: todoForm.dueDate || undefined } : t))
    } else {
      const newTodo: Todo = { id: crypto.randomUUID(), clientId: userId, done: false, createdAt: new Date().toISOString(), ...todoForm, dueDate: todoForm.dueDate || undefined }
      setTodos((prev: Todo[]) => [...prev, newTodo])
    }
    setShowTodoForm(false)
    setEditTodo(null)
  }
  const toggleTodo = (id: string) => setTodos((prev: Todo[]) => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  const deleteTodo = (id: string) => setTodos((prev: Todo[]) => prev.filter(t => t.id !== id))

  const rdvTypeLabel = (t: Appointment['type']) => t === 'visio' ? 'Visioconférence' : t === 'presentiel' ? 'Présentiel' : 'Téléphone'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-paper/40 mb-2">Agenda</p>
        <h2 className="font-display text-2xl text-paper">Planning & Tâches</h2>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-accent/10">
        {(['rdv', 'todo'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${section === s ? 'border-accent text-paper' : 'border-transparent text-paper/40 hover:text-paper'}`}>
            {s === 'rdv' ? `Rendez-vous (${rdvs.length})` : `Tâches (${todos.filter(t => !t.done).length} en cours)`}
          </button>
        ))}
      </div>

      {/* ── RDV ── */}
      {section === 'rdv' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <button onClick={openNewRdv}
              className="flex items-center gap-2 bg-accent text-paper text-xs font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors">
              <Plus size={13} strokeWidth={1.5} /> Ajouter un RDV
            </button>
          </div>

          {showRdvForm && (
            <div className="border border-accent/15 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-paper">{editRdv ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</p>
                <button onClick={() => setShowRdvForm(false)} className="text-paper/30 hover:text-paper transition-colors"><X size={14} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Titre</label>
                  <input type="text" value={rdvForm.title} onChange={e => setRdvForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Point sur la levée de fonds" className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Date</label>
                  <input type="date" value={rdvForm.date} onChange={e => setRdvForm(f => ({ ...f, date: e.target.value }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Heure</label>
                  <input type="time" value={rdvForm.time} onChange={e => setRdvForm(f => ({ ...f, time: e.target.value }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Type</label>
                  <select value={rdvForm.type} onChange={e => setRdvForm(f => ({ ...f, type: e.target.value as Appointment['type'] }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors">
                    <option value="visio">Visioconférence</option>
                    <option value="presentiel">Présentiel</option>
                    <option value="telephone">Téléphone</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Dossier <span className="normal-case text-paper/30">(optionnel)</span></label>
                  <select value={rdvForm.dossierId ?? ''} onChange={e => setRdvForm(f => ({ ...f, dossierId: e.target.value || undefined }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors">
                    <option value="">— Aucun dossier —</option>
                    {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Notes <span className="normal-case text-paper/30">(optionnel)</span></label>
                  <input type="text" value={rdvForm.notes} onChange={e => setRdvForm(f => ({ ...f, notes: e.target.value }))} placeholder="Détails, lieu, lien visio…" className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <button onClick={saveRdv} className="bg-accent text-paper text-xs font-medium px-5 py-2.5 hover:bg-accent/90 transition-colors">
                  {editRdv ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button onClick={() => setShowRdvForm(false)} className="text-xs text-paper/40 hover:text-paper transition-colors px-3">Annuler</button>
              </div>
            </div>
          )}

          <CalendarView appointments={rdvs} selectedDate={selectedDate} onSelectDate={d => { setSelectedDate(d); setRdvForm(f => ({ ...f, date: d })) }} />

          {upcoming.length > 0 && (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35 mb-3">Prochains rendez-vous</p>
              <div className="flex flex-col gap-px bg-accent/10">
                {upcoming.map(r => (
                  <div key={r.id} className="bg-ink-soft px-5 py-4 flex items-center gap-4 group">
                    <div className="flex-none text-center w-10">
                      <p className="text-xs font-bold text-paper leading-none">{new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric' })}</p>
                      <p className="text-[10px] text-paper/40 uppercase">{new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' })}</p>
                    </div>
                    <div className="w-px h-8 bg-accent/10 flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-paper truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-paper/40">{r.time} · {rdvTypeLabel(r.type)}{r.notes ? ` · ${r.notes}` : ''}</span>
                        {r.dossierId && dossierMap[r.dossierId] && (
                          <span className="flex items-center gap-1 text-[10px] text-paper/40 border border-accent/10 px-1.5 py-0.5">
                            <FolderOpen size={9} strokeWidth={1.5} /> {dossierMap[r.dossierId]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditRdv(r)} className="text-paper/30 hover:text-paper transition-colors p-1">
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => deleteRdv(r.id)} className="text-paper/20 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rdvs.length === 0 && <p className="text-sm text-paper/30 text-center py-6">Aucun rendez-vous. Ajoutez-en un ci-dessus.</p>}
        </div>
      )}

      {/* ── Todos ── */}
      {section === 'todo' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={openNewTodo}
              className="flex items-center gap-2 bg-accent text-paper text-xs font-medium px-4 py-2.5 hover:bg-accent/90 transition-colors">
              <Plus size={13} strokeWidth={1.5} /> Nouvelle tâche
            </button>
          </div>

          {showTodoForm && (
            <div className="border border-accent/15 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-paper">{editTodo ? 'Modifier la tâche' : 'Nouvelle tâche'}</p>
                <button onClick={() => setShowTodoForm(false)} className="text-paper/30 hover:text-paper transition-colors"><X size={14} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Tâche</label>
                  <input type="text" value={todoForm.title} onChange={e => setTodoForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Préparer les statuts" className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper placeholder:text-paper/20 focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Priorité</label>
                  <select value={todoForm.priority} onChange={e => setTodoForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors">
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Échéance <span className="normal-case text-paper/30">(optionnel)</span></label>
                  <input type="date" value={todoForm.dueDate} onChange={e => setTodoForm(f => ({ ...f, dueDate: e.target.value }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Dossier <span className="normal-case text-paper/30">(optionnel)</span></label>
                  <select value={todoForm.dossierId ?? ''} onChange={e => setTodoForm(f => ({ ...f, dossierId: e.target.value || undefined }))} className="border-b border-accent/15 bg-transparent py-2 text-sm text-paper focus:outline-none focus:border-accent transition-colors">
                    <option value="">— Aucun dossier —</option>
                    {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <button onClick={saveTodo} className="bg-accent text-paper text-xs font-medium px-5 py-2.5 hover:bg-accent/90 transition-colors">
                  {editTodo ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button onClick={() => setShowTodoForm(false)} className="text-xs text-paper/40 hover:text-paper transition-colors px-3">Annuler</button>
              </div>
            </div>
          )}

          <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={openEditTodo} dossierMap={dossierMap} />
          {todos.length === 0 && <p className="text-sm text-paper/30 text-center py-6">Aucune tâche. Ajoutez-en une ci-dessus.</p>}
        </div>
      )}
    </div>
  )
}

// ─── Messagerie ───────────────────────────────────────────────────────────────

function Messagerie({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const msgs = getMessagesForClient(userId)
    const updated = msgs.map(m => m.from === 'admin' && !m.read ? { ...m, read: true } : m)
    saveMessagesForClient(userId, updated)
    return updated
  })
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    const msg: Message = {
      id: crypto.randomUUID(), from: 'client',
      text: input.trim(), sentAt: new Date().toISOString(), read: false,
    }
    const updated = [...messages, msg]
    saveMessagesForClient(userId, updated)
    setMessages(updated)
    setInput('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-paper/40 mb-2">Messagerie</p>
        <h2 className="font-display text-2xl text-paper">Échanges sécurisés</h2>
      </div>

      <div className="border border-accent/10 flex flex-col" style={{ height: '500px' }}>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <MessageSquare size={28} strokeWidth={1.25} className="text-paper/20" />
              <p className="text-sm font-medium text-paper">Échangez directement avec le cabinet</p>
              <p className="text-xs text-paper/40 max-w-xs leading-relaxed">
                Vos messages sont sécurisés et accessibles uniquement par vous et l'équipe de Maître Mokadmi.
              </p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2.5 ${msg.from === 'client' ? 'bg-accent text-paper' : 'bg-ink-soft border border-accent/10 text-paper'}`}>
                {msg.from === 'admin' && (
                  <p className="text-[10px] font-medium text-paper/40 uppercase mb-0.5">Cabinet</p>
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.from === 'client' ? 'text-paper/50' : 'text-paper/30'}`}>
                  {new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  {new Date(msg.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="border-t border-accent/10 p-4 flex gap-3">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Votre message au cabinet…"
            className="flex-1 bg-transparent text-sm text-paper placeholder:text-paper/20 focus:outline-none"
          />
          <button
            onClick={sendMessage} disabled={!input.trim()}
            className="flex items-center gap-1.5 bg-accent text-paper text-xs font-medium px-4 py-2 hover:bg-accent/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={12} strokeWidth={1.5} /> Envoyer
          </button>
        </div>
      </div>

      <p className="text-xs text-paper/30 text-center">
        Pour toute urgence, contactez directement le cabinet au{' '}
        <span className="text-paper/50">+216 29784651</span>
      </p>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const navItems = [
  { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
  { id: 'dossiers', label: 'Dossiers', icon: FolderOpen },
  { id: 'documents', label: 'Documents', icon: FileUp },
  { id: 'rendezvous', label: 'Agenda', icon: CalendarDays },
  { id: 'facturation', label: 'Facturation', icon: Receipt },
  { id: 'messagerie', label: 'Messagerie', icon: MessageSquare },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('apercu')
  const [mobileOpen, setMobileOpen] = useState(false)

  const [dossiers, setDossiers] = useLocalState<Dossier[]>(`avocat_dossiers_${user?.id}`, [])
  const [documents, setDocuments] = useLocalState<Document[]>(`avocat_documents_${user?.id}`, [])
  const [rdvs, setRdvs] = useLocalState<Appointment[]>(`avocat_rdv_${user?.id}`, [])
  const [todos, setTodos] = useLocalState<Todo[]>(`avocat_todos_${user?.id}`, [])
  const [invoices, setInvoices] = useLocalState<Invoice[]>(`avocat_invoices_${user?.id}`, [])

  const { alerts, dismiss } = useReminders(rdvs, todos)

  const unreadMessages = useMemo(() => {
    if (!user?.id) return 0
    return getMessagesForClient(user.id).filter(m => m.from === 'admin' && !m.read).length
  }, [user?.id, tab])

  const handleLogout = () => { logout(); navigate('/') }

  const changeTab = (id: string) => { setTab(id); setMobileOpen(false) }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      {/* Top bar */}
      <header className="border-b border-accent/10 bg-ink-soft flex items-center justify-between px-6 h-14 sticky top-0 z-40">
        <Link to="/" className="flex flex-col">
          <span className="font-display text-base font-semibold text-paper leading-tight">Maître Mokadmi Sami</span>
          <span className="text-[10px] text-paper/40 tracking-wide">Espace Client</span>
        </Link>
        <div className="flex items-center gap-4">
          {alerts.length > 0 && (
            <button onClick={() => changeTab('rendezvous')} className="relative text-paper/40 hover:text-paper transition-colors" title="Rappels">
              <Bell size={16} strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{alerts.length}</span>
            </button>
          )}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-paper">{user?.name}</span>
            {user?.company && <span className="text-[10px] text-paper/40">{user.company}</span>}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-paper/40 hover:text-paper transition-colors"
          >
            <LogOut size={13} strokeWidth={1.5} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-paper/50 hover:text-paper transition-colors"
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Reminder banner */}
      {alerts.length > 0 && (
        <div className="border-b border-accent/15 bg-accent/5 px-6 py-2.5 flex flex-col gap-1.5">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 max-w-3xl">
              <Bell size={12} strokeWidth={1.5} className={`flex-none ${alert.urgency === 'high' ? 'text-red-500' : 'text-accent/70'}`} />
              <p className={`text-xs flex-1 ${alert.urgency === 'high' ? 'text-red-700 font-medium' : 'text-accent/80'}`}>{alert.message}</p>
              <button onClick={() => dismiss(alert.id)} className="text-paper/30 hover:text-paper transition-colors flex-none" aria-label="Fermer">
                <X size={11} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-56 border-r border-accent/10 pt-8 pb-6 px-4 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isMsg = id === 'messagerie'
              return (
                <button
                  key={id}
                  onClick={() => changeTab(id)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                    tab === id ? 'bg-accent text-paper' : 'text-paper/50 hover:text-paper hover:bg-ink'
                  }`}
                >
                  <Icon size={15} strokeWidth={1.25} />
                  {label}
                  {isMsg && unreadMessages > 0 && (
                    <span className={`ml-auto flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-sm ${tab === id ? 'bg-ink text-accent' : 'bg-accent text-paper'}`}>{unreadMessages}</span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-30 bg-ink-soft border-t border-accent/10 p-6 flex flex-col gap-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  tab === id ? 'bg-accent text-paper' : 'text-paper/60 hover:text-paper hover:bg-ink'
                }`}
              >
                <Icon size={15} strokeWidth={1.25} />
                {label}
                {id === 'messagerie' && unreadMessages > 0 && (
                  <span className="ml-auto flex items-center justify-center w-4 h-4 bg-accent text-paper text-[10px] font-bold rounded-sm">{unreadMessages}</span>
                )}
              </button>
            ))}
            <div className="mt-auto pt-6 border-t border-accent/10">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-paper/40 hover:text-paper transition-colors">
                <LogOut size={14} strokeWidth={1.5} /> Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-3xl">
          {tab === 'apercu' && <Apercu dossiers={dossiers} documents={documents} userName={user?.name ?? ''} />}
          {tab === 'dossiers' && <Dossiers dossiers={dossiers} setDossiers={setDossiers} rdvs={rdvs} todos={todos} invoices={invoices} />}
          {tab === 'documents' && <Documents documents={documents} setDocuments={setDocuments} />}
          {tab === 'rendezvous' && <Rendezvous rdvs={rdvs} setRdvs={setRdvs} todos={todos} setTodos={setTodos} userId={user?.id ?? ''} dossiers={dossiers} />}
          {tab === 'facturation' && (
            <BillingModule
              invoices={invoices}
              setInvoices={setInvoices}
              rdvs={rdvs}
              todos={todos}
              dossiers={dossiers}
              userId={user?.id ?? ''}
              userName={user?.name ?? ''}
              userCompany={user?.company}
              userEmail={user?.email}
            />
          )}
          {tab === 'messagerie' && <Messagerie userId={user?.id ?? ''} />}
        </main>
      </div>
    </div>
  )
}
