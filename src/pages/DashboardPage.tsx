import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FolderOpen, FileUp, MessageSquare, LogOut,
  CheckCircle2, Clock, Circle, ChevronRight, Upload, File,
  FileText, Trash2, Menu, X, Shield, CalendarDays, Plus, Pencil, Bell, Receipt
} from 'lucide-react'
import CalendarView, { Appointment } from '../components/CalendarView'
import TodoList, { Todo } from '../components/TodoList'
import { useReminders } from '../hooks/useReminders'
import BillingModule, { Invoice, computeAmounts, fmtAmount } from '../components/BillingModule'
import ErrorBoundary from '../components/ErrorBoundary'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { Dossier } from '../types'

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

function useLocalState<T>(key: string, fallback: T): [T, (val: T | ((prev: T) => T)) => void, string | null] {
  const [state, setStateRaw] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
    catch { return fallback }
  })
  const [storageError, setStorageError] = useState<string | null>(null)

  const setState = (val: T | ((prev: T) => T)) => {
    setStateRaw(prev => {
      const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val
      try {
        localStorage.setItem(key, JSON.stringify(next))
        setStorageError(null)
        return next
      } catch (e) {
        if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          setStorageError('Espace de stockage insuffisant. Supprimez des fichiers pour libérer de la place.')
        }
        return prev
      }
    })
  }
  return [state, setState, storageError]
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
    attente: { label: 'En attente', className: 'bg-gold/50/10 text-amber-400 border-amber-500/20' },
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
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Tableau de bord</p>
        <h2 className="font-serif text-2xl text-light">Bonjour, {userName.split(' ')[0]}.</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gold/10">
        <div className="bg-dark-surface p-6">
          <p className="text-xs text-light/40 uppercase tracking-wide mb-2">Dossiers actifs</p>
          <p className="font-serif text-3xl font-bold text-light">{actifs}</p>
        </div>
        <div className="bg-dark-surface p-6">
          <p className="text-xs text-light/40 uppercase tracking-wide mb-2">Documents</p>
          <p className="font-serif text-3xl font-bold text-light">{documents.length}</p>
        </div>
        <div className="bg-dark-surface p-6">
          <p className="text-xs text-light/40 uppercase tracking-wide mb-2">Prochaine échéance</p>
          <p className="font-serif text-base font-semibold text-light leading-tight">
            {prochaine ? new Date(prochaine.prochainEcheance!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
          </p>
          {prochaine && <p className="text-xs text-light/40 mt-0.5">{prochaine.titre}</p>}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-4">Dossiers récents</p>
        <div className="flex flex-col gap-px bg-gold/10">
          {dossiers.slice(0, 3).map(d => (
            <div key={d.id} className="bg-dark-surface px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FolderOpen size={15} strokeWidth={1.25} className="text-light/30 flex-none" />
                <span className="text-sm font-medium text-light truncate">{d.titre}</span>
              </div>
              <StatusBadge statut={d.statut} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-gold/10 px-6 py-4 flex items-center gap-3">
        <Shield size={14} strokeWidth={1.25} className="text-light/30 flex-none" />
        <p className="text-xs text-light/40">Connexion sécurisée · Chiffrement SSL 256 bits · Données hébergées en France</p>
      </div>
    </div>
  )
}

// ─── Dossiers ─────────────────────────────────────────────────────────────────

function Dossiers({ dossiers, setDossiers, rdvs, todos, invoices }: {
  dossiers: Dossier[]
  setDossiers: (d: Dossier[] | ((prev: Dossier[]) => Dossier[])) => void
  rdvs: Appointment[]
  todos: Todo[]
  invoices: Invoice[]
}) {
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', prochainEcheance: '' })
  const [formError, setFormError] = useState('')

  const createDossier = () => {
    if (!form.titre.trim()) { setFormError('Le titre est requis.'); return }
    const today = new Date()
    const newDossier: Dossier = {
      id: crypto.randomUUID(),
      titre: form.titre.trim(),
      description: form.description.trim(),
      statut: 'attente',
      dateOuverture: today.toISOString().split('T')[0],
      prochainEcheance: form.prochainEcheance || null,
      etapes: [
        {
          label: 'Ouverture du dossier',
          statut: 'done',
          date: today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        },
      ],
    }
    setDossiers((prev: Dossier[]) => [...prev, newDossier])
    setForm({ titre: '', description: '', prochainEcheance: '' })
    setFormError('')
    setShowForm(false)
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
          className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors"
        >
          ← Retour aux dossiers
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-1">
              Dossier · {new Date(selected.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="font-serif text-2xl text-light">{selected.titre}</h2>
          </div>
          <StatusBadge statut={selected.statut} />
        </div>

        <p className="text-sm text-light/60 leading-relaxed max-w-prose">{selected.description}</p>

        <div>
          <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-6">Avancement</p>
          <div className="flex flex-col gap-0">
            {selected.etapes.map((etape, i) => (
              <div key={i} className="flex gap-5 pb-8 last:pb-0 relative">
                {i < selected.etapes.length - 1 && (
                  <div className="absolute left-[10px] top-6 bottom-0 w-px bg-gold/10" />
                )}
                <div className="flex-none mt-0.5 z-10">
                  {etape.statut === 'done' && <CheckCircle2 size={20} strokeWidth={1.5} className="text-light" />}
                  {etape.statut === 'current' && <Clock size={20} strokeWidth={1.5} className="text-blue-600" />}
                  {etape.statut === 'pending' && <Circle size={20} strokeWidth={1.5} className="text-light/20" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${etape.statut === 'pending' ? 'text-light/30' : 'text-light'}`}>
                    {etape.label}
                  </p>
                  {etape.date && (
                    <p className="text-xs text-light/40 mt-0.5">{etape.date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected.prochainEcheance && (
          <div className="border border-gold/10 px-6 py-4">
            <p className="text-xs text-light/40 uppercase tracking-wide mb-1">Prochaine échéance</p>
            <p className="text-sm font-medium text-light">
              {new Date(selected.prochainEcheance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}

        {linkedRdvs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">Rendez-vous liés</p>
            <div className="flex flex-col gap-px bg-gold/10">
              {linkedRdvs.map(r => (
                <div key={r.id} className="bg-dark-surface px-5 py-3 flex items-center gap-3">
                  <CalendarDays size={13} strokeWidth={1.25} className="text-light/30 flex-none" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-light truncate">{r.title}</p>
                    <p className="text-xs text-light/40 mt-0.5">
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
            <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">Tâches liées</p>
            <div className="flex flex-col gap-px bg-gold/10">
              {linkedTodos.map(t => (
                <div key={t.id} className={`bg-dark-surface px-5 py-3 flex items-center gap-3 ${t.done ? 'opacity-50' : ''}`}>
                  {t.done
                    ? <CheckCircle2 size={13} strokeWidth={1.5} className="text-light flex-none" />
                    : <Circle size={13} strokeWidth={1.5} className="text-light/30 flex-none" />}
                  <p className={`text-sm flex-1 min-w-0 truncate ${t.done ? 'line-through text-light/40' : 'text-light font-medium'}`}>{t.title}</p>
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
            <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">Factures liées</p>
            <div className="flex flex-col gap-px bg-gold/10">
              {linkedInvoices.map(inv => {
                const { net } = computeAmounts(inv)
                const statusCls = { brouillon: 'text-gray-500', envoyee: 'text-blue-600', payee: 'text-green-600', en_retard: 'text-red-600' }[inv.status]
                const statusLabel = { brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée', en_retard: 'En retard' }[inv.status]
                return (
                  <div key={inv.id} className="bg-dark-surface px-5 py-3 flex items-center gap-3">
                    <Receipt size={13} strokeWidth={1.25} className="text-light/30 flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light font-mono truncate">{inv.number}</p>
                      <p className="text-xs text-light/40 mt-0.5">
                        {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}<span className={statusCls}>{statusLabel}</span>
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-light flex-none">{fmtAmount(net, inv.currency)}</p>
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Mes Dossiers</p>
          <h2 className="font-serif text-2xl text-light">Suivi de vos missions</h2>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError('') }}
          className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-4 py-2.5 hover:bg-gold/90 transition-colors flex-none"
        >
          <Plus size={13} strokeWidth={1.5} />
          Nouveau dossier
        </button>
      </div>

      {showForm && (
        <div className="border border-gold/15 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-light">Nouveau dossier</p>
            <button onClick={() => { setShowForm(false); setFormError('') }} className="text-light/30 hover:text-light transition-colors">
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Titre <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.titre}
                onChange={e => { setForm(f => ({ ...f, titre: e.target.value })); setFormError('') }}
                placeholder="Ex : Levée de fonds Série A"
                className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Description <span className="normal-case text-light/30">(optionnel)</span></label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Résumé de la mission"
                className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Prochaine échéance <span className="normal-case text-light/30">(optionnel)</span></label>
              <input
                type="date"
                value={form.prochainEcheance}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, prochainEcheance: e.target.value }))}
                className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>
          {formError && <p className="text-xs text-red-400">{formError}</p>}
          <div className="flex gap-3 mt-1">
            <button onClick={createDossier} className="bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">
              Créer
            </button>
            <button onClick={() => { setShowForm(false); setFormError('') }} className="text-xs text-light/40 hover:text-light transition-colors px-3">
              Annuler
            </button>
          </div>
        </div>
      )}

      {dossiers.length === 0 && !showForm && (
        <p className="text-sm text-light/30 text-center py-8">Aucun dossier pour le moment. Créez-en un ci-dessus.</p>
      )}

      {dossiers.length > 0 && <div className="flex flex-col gap-px bg-gold/10">
        {dossiers.map(dossier => {
          const rdvCount = rdvs.filter(r => r.dossierId === dossier.id).length
          const todoCount = todos.filter(t => t.dossierId === dossier.id && !t.done).length
          const invCount = invoices.filter(i => i.dossierId === dossier.id).length
          return (
            <button
              key={dossier.id}
              onClick={() => setSelected(dossier)}
              className="bg-dark-surface px-8 py-6 flex items-center justify-between gap-4 text-left hover:bg-dark-card transition-colors group"
            >
              <div className="flex items-start gap-4 min-w-0">
                <FolderOpen size={16} strokeWidth={1.25} className="text-light/30 flex-none mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-light mb-1">{dossier.titre}</p>
                  <p className="text-xs text-light/40 truncate">{dossier.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-light/30">
                      Ouvert le {new Date(dossier.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-light/20">·</span>
                    <span className="text-xs text-light/30">
                      {dossier.etapes.filter(e => e.statut === 'done').length}/{dossier.etapes.length} étapes
                    </span>
                    {rdvCount > 0 && (
                      <span className="text-xs text-blue-500">{rdvCount} RDV</span>
                    )}
                    {todoCount > 0 && (
                      <span className="text-xs text-gold/70">{todoCount} tâche{todoCount > 1 ? 's' : ''}</span>
                    )}
                    {invCount > 0 && (
                      <span className="text-xs text-emerald-600">{invCount} facture{invCount > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-none">
                <StatusBadge statut={dossier.statut} />
                <ChevronRight size={14} strokeWidth={1.5} className="text-light/20 group-hover:text-light/50 transition-colors" />
              </div>
            </button>
          )
        })}
      </div>}
    </div>
  )
}

// ─── Documents ────────────────────────────────────────────────────────────────

function Documents({ documents, setDocuments, storageError }: {
  documents: Document[]
  setDocuments: (d: Document[] | ((prev: Document[]) => Document[])) => void
  storageError?: string | null
}) {
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
    return <File size={15} strokeWidth={1.25} className="text-light/30" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Documents</p>
        <h2 className="font-serif text-2xl text-light">Gestion documentaire</h2>
      </div>

      {storageError && (
        <div className="border border-red-500/20 bg-red-500/5 px-5 py-3 flex items-center gap-2">
          <p className="text-xs text-red-400">{storageError}</p>
        </div>
      )}

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed px-8 py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          dragging ? 'border-gold bg-dark-card' : 'border-gold/15 hover:border-gold/30 hover:bg-dark-card'
        }`}
      >
        <Upload size={24} strokeWidth={1.25} className="text-light/30" />
        <div className="text-center">
          <p className="text-sm font-medium text-light">Déposer vos fichiers ici</p>
          <p className="text-xs text-light/40 mt-1">ou cliquez pour parcourir · PDF, Word, Excel acceptés</p>
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
        <div className="flex flex-col gap-px bg-gold/10">
          {documents.map(doc => (
            <div key={doc.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
              <div className="flex-none">{fileIcon(doc.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-light truncate">{doc.name}</p>
                <p className="text-xs text-light/40 mt-0.5">
                  {formatSize(doc.size)} · Déposé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => remove(doc.id)}
                className="flex-none text-light/20 hover:text-red-500 transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <p className="text-sm text-light/30 text-center py-4">Aucun document déposé pour le moment.</p>
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
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Agenda</p>
        <h2 className="font-serif text-2xl text-light">Planning & Tâches</h2>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-gold/10">
        {(['rdv', 'todo'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${section === s ? 'border-gold text-light' : 'border-transparent text-light/40 hover:text-light'}`}>
            {s === 'rdv' ? `Rendez-vous (${rdvs.length})` : `Tâches (${todos.filter(t => !t.done).length} en cours)`}
          </button>
        ))}
      </div>

      {/* ── RDV ── */}
      {section === 'rdv' && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-end">
            <button onClick={openNewRdv}
              className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-4 py-2.5 hover:bg-gold/90 transition-colors">
              <Plus size={13} strokeWidth={1.5} /> Ajouter un RDV
            </button>
          </div>

          {showRdvForm && (
            <div className="border border-gold/15 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-light">{editRdv ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</p>
                <button onClick={() => setShowRdvForm(false)} className="text-light/30 hover:text-light transition-colors"><X size={14} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Titre</label>
                  <input type="text" value={rdvForm.title} onChange={e => setRdvForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Point sur la levée de fonds" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Date</label>
                  <input type="date" value={rdvForm.date} onChange={e => setRdvForm(f => ({ ...f, date: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Heure</label>
                  <input type="time" value={rdvForm.time} onChange={e => setRdvForm(f => ({ ...f, time: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Type</label>
                  <select value={rdvForm.type} onChange={e => setRdvForm(f => ({ ...f, type: e.target.value as Appointment['type'] }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors">
                    <option value="visio">Visioconférence</option>
                    <option value="presentiel">Présentiel</option>
                    <option value="telephone">Téléphone</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Dossier <span className="normal-case text-light/30">(optionnel)</span></label>
                  <select value={rdvForm.dossierId ?? ''} onChange={e => setRdvForm(f => ({ ...f, dossierId: e.target.value || undefined }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors">
                    <option value="">— Aucun dossier —</option>
                    {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Notes <span className="normal-case text-light/30">(optionnel)</span></label>
                  <input type="text" value={rdvForm.notes} onChange={e => setRdvForm(f => ({ ...f, notes: e.target.value }))} placeholder="Détails, lieu, lien visio…" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <button onClick={saveRdv} className="bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">
                  {editRdv ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button onClick={() => setShowRdvForm(false)} className="text-xs text-light/40 hover:text-light transition-colors px-3">Annuler</button>
              </div>
            </div>
          )}

          <CalendarView appointments={rdvs} selectedDate={selectedDate} onSelectDate={d => { setSelectedDate(d); setRdvForm(f => ({ ...f, date: d })) }} />

          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">Prochains rendez-vous</p>
              <div className="flex flex-col gap-px bg-gold/10">
                {upcoming.map(r => (
                  <div key={r.id} className="bg-dark-surface px-5 py-4 flex items-center gap-4 group">
                    <div className="flex-none text-center w-10">
                      <p className="text-xs font-bold text-light leading-none">{new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric' })}</p>
                      <p className="text-[10px] text-light/40 uppercase">{new Date(r.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' })}</p>
                    </div>
                    <div className="w-px h-8 bg-gold/10 flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-light/40">{r.time} · {rdvTypeLabel(r.type)}{r.notes ? ` · ${r.notes}` : ''}</span>
                        {r.dossierId && dossierMap[r.dossierId] && (
                          <span className="flex items-center gap-1 text-[10px] text-light/40 border border-gold/10 px-1.5 py-0.5">
                            <FolderOpen size={9} strokeWidth={1.5} /> {dossierMap[r.dossierId]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditRdv(r)} className="text-light/30 hover:text-light transition-colors p-1">
                        <Pencil size={13} strokeWidth={1.5} />
                      </button>
                      <button onClick={() => deleteRdv(r.id)} className="text-light/20 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {rdvs.length === 0 && <p className="text-sm text-light/30 text-center py-6">Aucun rendez-vous. Ajoutez-en un ci-dessus.</p>}
        </div>
      )}

      {/* ── Todos ── */}
      {section === 'todo' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button onClick={openNewTodo}
              className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-4 py-2.5 hover:bg-gold/90 transition-colors">
              <Plus size={13} strokeWidth={1.5} /> Nouvelle tâche
            </button>
          </div>

          {showTodoForm && (
            <div className="border border-gold/15 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-light">{editTodo ? 'Modifier la tâche' : 'Nouvelle tâche'}</p>
                <button onClick={() => setShowTodoForm(false)} className="text-light/30 hover:text-light transition-colors"><X size={14} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Tâche</label>
                  <input type="text" value={todoForm.title} onChange={e => setTodoForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Préparer les statuts" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Priorité</label>
                  <select value={todoForm.priority} onChange={e => setTodoForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors">
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Échéance <span className="normal-case text-light/30">(optionnel)</span></label>
                  <input type="date" value={todoForm.dueDate} onChange={e => setTodoForm(f => ({ ...f, dueDate: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Dossier <span className="normal-case text-light/30">(optionnel)</span></label>
                  <select value={todoForm.dossierId ?? ''} onChange={e => setTodoForm(f => ({ ...f, dossierId: e.target.value || undefined }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors">
                    <option value="">— Aucun dossier —</option>
                    {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-1">
                <button onClick={saveTodo} className="bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">
                  {editTodo ? 'Enregistrer' : 'Ajouter'}
                </button>
                <button onClick={() => setShowTodoForm(false)} className="text-xs text-light/40 hover:text-light transition-colors px-3">Annuler</button>
              </div>
            </div>
          )}

          <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={openEditTodo} dossierMap={dossierMap} />
          {todos.length === 0 && <p className="text-sm text-light/30 text-center py-6">Aucune tâche. Ajoutez-en une ci-dessus.</p>}
        </div>
      )}
    </div>
  )
}

// ─── Messagerie ───────────────────────────────────────────────────────────────

function Messagerie() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Messagerie</p>
        <h2 className="font-serif text-2xl text-light">Échanges sécurisés</h2>
      </div>
      <div className="border border-gold/10 px-8 py-12 flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 bg-gold/10 flex items-center justify-center rounded-full">
          <MessageSquare size={28} strokeWidth={1.25} className="text-gold" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-light">Besoin d'une réponse immédiate ?</p>
          <p className="text-xs text-light/40 max-w-xs mx-auto leading-relaxed">
            Utilisez notre Assistant IA (en bas à droite) pour vos questions d'ordre général,
            ou contactez directement Maître Mokadmi pour vos dossiers en cours.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a
            href="mailto:office@mokadmi.lawyer"
            className="flex items-center justify-center gap-2 bg-dark-card border border-gold/20 py-3 text-xs font-medium text-light hover:border-gold transition-colors"
          >
            office@mokadmi.lawyer
          </a>
          <p className="text-[10px] text-light/20 uppercase tracking-widest">Réponse sous 24h ouvrées</p>
        </div>
      </div>
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

  const [dossiers, setDossiers] = useLocalState<Dossier[]>(STORAGE_KEYS.dossiers(user?.id ?? ''), [])
  const [documents, setDocuments, docStorageError] = useLocalState<Document[]>(STORAGE_KEYS.documents(user?.id ?? ''), [])
  const [rdvs, setRdvs] = useLocalState<Appointment[]>(STORAGE_KEYS.rdvs(user?.id ?? ''), [])
  const [todos, setTodos] = useLocalState<Todo[]>(STORAGE_KEYS.todos(user?.id ?? ''), [])
  const [invoices, setInvoices] = useLocalState<Invoice[]>(STORAGE_KEYS.invoices(user?.id ?? ''), [])

  const { alerts, dismiss } = useReminders(rdvs, todos)

  const handleLogout = () => { logout(); navigate('/') }

  const changeTab = (id: string) => { setTab(id); setMobileOpen(false) }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Top bar */}
      <header className="border-b border-gold/10 bg-dark-surface flex items-center justify-between px-6 h-14 sticky top-0 z-40">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-base font-semibold text-light leading-tight">Maître Mokadmi Sami</span>
          <span className="text-[10px] text-light/40 tracking-wide">Espace Client</span>
        </Link>
        <div className="flex items-center gap-4">
          {alerts.length > 0 && (
            <button onClick={() => changeTab('rendezvous')} className="relative text-light/40 hover:text-light transition-colors" title="Rappels">
              <Bell size={16} strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{alerts.length}</span>
            </button>
          )}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-light">{user?.name}</span>
            {user?.company && <span className="text-[10px] text-light/40">{user.company}</span>}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-light/40 hover:text-light transition-colors"
          >
            <LogOut size={13} strokeWidth={1.5} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-light/50 hover:text-light transition-colors"
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Reminder banner */}
      {alerts.length > 0 && (
        <div className="border-b border-gold/15 bg-gold/5 px-6 py-2.5 flex flex-col gap-1.5">
          {alerts.map(alert => (
            <div key={alert.id} className="flex items-center gap-3 max-w-3xl">
              <Bell size={12} strokeWidth={1.5} className={`flex-none ${alert.urgency === 'high' ? 'text-red-500' : 'text-gold/70'}`} />
              <p className={`text-xs flex-1 ${alert.urgency === 'high' ? 'text-red-700 font-medium' : 'text-gold/80'}`}>{alert.message}</p>
              <button onClick={() => dismiss(alert.id)} className="text-light/30 hover:text-light transition-colors flex-none" aria-label="Fermer">
                <X size={11} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-56 border-r border-gold/10 pt-8 pb-6 px-4 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                  tab === id
                    ? 'bg-gold text-dark-bg'
                    : 'text-light/50 hover:text-light hover:bg-dark-card'
                }`}
              >
                <Icon size={15} strokeWidth={1.25} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-30 bg-dark-surface border-t border-gold/10 p-6 flex flex-col gap-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  tab === id ? 'bg-gold text-dark-bg' : 'text-light/60 hover:text-light hover:bg-dark-card'
                }`}
              >
                <Icon size={15} strokeWidth={1.25} />
                {label}
              </button>
            ))}
            <div className="mt-auto pt-6 border-t border-gold/10">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-light/40 hover:text-light transition-colors">
                <LogOut size={14} strokeWidth={1.5} /> Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-3xl">
          {tab === 'apercu' && <Apercu dossiers={dossiers} documents={documents} userName={user?.name ?? ''} />}
          {tab === 'dossiers' && <Dossiers dossiers={dossiers} setDossiers={setDossiers} rdvs={rdvs} todos={todos} invoices={invoices} />}
          {tab === 'documents' && (
            <ErrorBoundary>
              <Documents documents={documents} setDocuments={setDocuments} storageError={docStorageError} />
            </ErrorBoundary>
          )}
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
          {tab === 'messagerie' && <Messagerie />}
        </main>
      </div>
    </div>
  )
}
