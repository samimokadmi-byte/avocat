import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FolderOpen, FileUp, MessageSquare, LogOut,
  CheckCircle2, Clock, Circle, ChevronRight, Upload, File,
  FileText, Trash2, Menu, X, Shield, CalendarDays, Bell, Receipt,
  Download, CheckSquare
} from 'lucide-react'
import { useReminders } from '../hooks/useReminders'
import { Invoice, computeAmounts, fmtAmount, CURRENCIES } from '../components/BillingModule'
import { syncOnDocument } from '../utils/dossierSync'
import type { Appointment } from '../components/CalendarView'
import type { Todo } from '../components/TodoList'

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

function Dossiers({ dossiers, rdvs, todos, invoices }: { dossiers: Dossier[]; rdvs: Appointment[]; todos: Todo[]; invoices: Invoice[] }) {
  const [selected, setSelected] = useState<Dossier | null>(null)

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
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Mes Dossiers</p>
        <h2 className="font-serif text-2xl text-light">Suivi de vos missions</h2>
      </div>

      <div className="flex flex-col gap-px bg-gold/10">
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
      </div>
    </div>
  )
}

// ─── Documents ────────────────────────────────────────────────────────────────

function Documents({ documents, setDocuments, userId, userName }: {
  documents: Document[]
  setDocuments: (d: Document[] | ((prev: Document[]) => Document[])) => void
  userId: string
  userName: string
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
        // ── Sync automatique dossier ────────────────────────────────────────
        if (userId && userName) syncOnDocument(userId, userName, f.name)
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

// ─── InvoiceViewer — lecture seule pour le client ────────────────────────────
function InvoiceViewer({ invoices, userName, userCompany }: {
  invoices: Invoice[]
  userName: string
  userCompany?: string
}) {
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const statusMap: Record<Invoice['status'], { label: string; cls: string }> = {
    brouillon: { label: 'Brouillon',  cls: 'text-light/40 border-light/15' },
    envoyee:   { label: 'Envoyée',    cls: 'text-blue-400 border-blue-400/30' },
    payee:     { label: 'Payée',      cls: 'text-emerald-400 border-emerald-400/30' },
    en_retard: { label: 'En retard',  cls: 'text-red-400 border-red-400/30' },
  }

  const handlePdf = async (inv: Invoice) => {
    setPdfLoading(true)
    try {
      const { downloadInvoicePdf } = await import('../utils/invoicePdf')
      await downloadInvoicePdf(inv, userName, userCompany)
    } finally {
      setPdfLoading(false)
    }
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Facturation</p>
          <h2 className="font-serif text-2xl text-light">Mes factures</h2>
        </div>
        <div className="border border-gold/10 py-16 flex flex-col items-center gap-3">
          <Receipt size={28} strokeWidth={1} className="text-light/20" />
          <p className="text-sm text-light/40 text-center">Aucune facture disponible pour le moment.</p>
          <p className="text-xs text-light/25 text-center">Les factures émises par le cabinet apparaîtront ici.</p>
        </div>
      </div>
    )
  }

  const fmtDate = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Facturation</p>
        <h2 className="font-serif text-2xl text-light">Mes factures</h2>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-px bg-gold/10">
        {invoices.map(inv => {
          const { net } = computeAmounts(inv)
          const sym = CURRENCIES[inv.currency]?.symbol ?? inv.currency
          const st  = statusMap[inv.status]
          return (
            <div key={inv.id}
              className="bg-dark-surface px-4 sm:px-6 py-4 flex items-center gap-3 cursor-pointer hover:bg-dark-card transition-colors"
              onClick={() => setSelected(selected?.id === inv.id ? null : inv)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-sm font-semibold text-light">{inv.number}</span>
                  <span className={`text-[10px] font-medium border px-1.5 py-0.5 ${st.cls}`}>{st.label}</span>
                </div>
                <p className="text-xs text-light/45">Émise le {fmtDate(inv.dateEmission)} · Échéance {fmtDate(inv.dateEcheance)}</p>
              </div>
              <div className="text-right flex-none">
                <p className="text-sm font-bold text-light">{fmtAmount(net, inv.currency)} {sym}</p>
                <p className="text-xs text-light/35">Net à payer</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Détail dépliable */}
      {selected && (() => {
        const { ht, tva, ttc, retenue, timbre, net } = computeAmounts(selected)
        const sym = CURRENCIES[selected.currency]?.symbol ?? selected.currency
        const fmtD = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        return (
          <div className="border border-gold/15 bg-dark-surface">
            {/* Header détail */}
            <div className="px-4 sm:px-6 py-4 border-b border-gold/10 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs text-light/40 mb-0.5">Facture {selected.number}</p>
                <p className="text-xs text-light/30">{fmtD(selected.dateEmission)} → {fmtD(selected.dateEcheance)}</p>
              </div>
              <button
                onClick={() => handlePdf(selected)}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 text-xs font-medium bg-gold text-dark-bg px-3 py-2 hover:bg-gold/90 transition-colors disabled:opacity-50"
              >
                <Download size={11} strokeWidth={1.5} />
                {pdfLoading ? 'Génération…' : 'Télécharger PDF'}
              </button>
            </div>

            {/* Lignes */}
            <div className="overflow-x-auto">
              <div className="min-w-[400px]">
                <div className="px-4 sm:px-6 py-2 bg-dark-bg grid grid-cols-[1fr_48px_80px_80px] gap-3">
                  {['Description', 'Qté', `PU (${sym})`, `Total`].map((h, i) => (
                    <p key={h} className={`text-[10px] font-semibold text-light/50 uppercase ${i > 0 ? 'text-right' : ''}`}>{h}</p>
                  ))}
                </div>
                {selected.lines.map(l => (
                  <div key={l.id} className="px-4 sm:px-6 py-3 bg-dark-surface border-t border-gold/8 grid grid-cols-[1fr_48px_80px_80px] gap-3">
                    <p className="text-sm text-light">{l.description || '—'}</p>
                    <p className="text-sm text-light/70 text-right">{l.quantity}</p>
                    <p className="text-sm text-light/70 text-right">{fmtAmount(l.unitPrice, selected.currency)}</p>
                    <p className="text-sm font-medium text-light text-right">{fmtAmount(l.quantity * l.unitPrice, selected.currency)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totaux */}
            <div className="px-4 sm:px-6 py-4 border-t border-gold/10 flex flex-col items-end gap-1.5">
              <div className="flex gap-6 text-sm"><span className="text-light/45">Montant HT</span><span className="text-light font-medium">{fmtAmount(ht, selected.currency)} {sym}</span></div>
              {selected.tvaRate > 0 && <div className="flex gap-6 text-sm"><span className="text-light/45">TVA ({selected.tvaRate} %)</span><span className="text-light">{fmtAmount(tva, selected.currency)} {sym}</span></div>}
              <div className="flex gap-6 text-sm font-semibold"><span className="text-light/60">Montant TTC</span><span className="text-light">{fmtAmount(ttc, selected.currency)} {sym}</span></div>
              {selected.retenueRate > 0 && <div className="flex gap-6 text-sm"><span className="text-light/45">Retenue ({selected.retenueRate} %)</span><span className="text-red-400">– {fmtAmount(retenue, selected.currency)} {sym}</span></div>}
              {selected.timbreFiscal > 0 && <div className="flex gap-6 text-sm"><span className="text-light/45">Timbre fiscal</span><span className="text-emerald-400">+ {fmtAmount(timbre, selected.currency)} {sym}</span></div>}
              <div className="flex gap-6 text-base font-bold border-t border-gold/15 pt-2 mt-1">
                <span className="text-gold">Net à payer</span>
                <span className="text-light">{fmtAmount(net, selected.currency)} {sym}</span>
              </div>
            </div>

            {selected.notes && (
              <div className="px-4 sm:px-6 pb-4 text-xs text-light/40 border-t border-gold/8 pt-3">{selected.notes}</div>
            )}
          </div>
        )
      })()}
    </div>
  )
}

// ─── RdvViewer — lecture seule agenda pour le client ─────────────────────────
function RdvViewer({ rdvs, todos, dossiers }: {
  rdvs: Appointment[]
  todos: Todo[]
  dossiers: Dossier[]
}) {
  const [section, setSection] = useState<'rdv' | 'todo'>('rdv')
  const dossierMap: Record<string, string> = Object.fromEntries(dossiers.map(d => [d.id, d.titre]))

  const upcoming = [...rdvs]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const typeLabel = (t: Appointment['type']) => t === 'visio' ? 'Visioconférence' : t === 'presentiel' ? 'Présentiel' : 'Téléphone'
  const priorityColor = (p: Todo['priority']) => p === 'urgente' ? 'text-red-400' : p === 'normale' ? 'text-gold/60' : 'text-light/40'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Agenda</p>
        <h2 className="font-serif text-2xl text-light">Planning & Tâches</h2>
      </div>

      <div className="flex gap-1 border-b border-gold/10">
        {(['rdv', 'todo'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${section === s ? 'border-gold text-light' : 'border-transparent text-light/40 hover:text-light'}`}>
            {s === 'rdv' ? `Rendez-vous (${rdvs.length})` : `Tâches (${todos.filter(t => !t.done).length} actives)`}
          </button>
        ))}
      </div>

      {section === 'rdv' && (
        upcoming.length === 0 ? (
          <div className="border border-gold/10 py-12 flex flex-col items-center gap-3">
            <CalendarDays size={24} strokeWidth={1} className="text-light/20" />
            <p className="text-sm text-light/40 text-center">Aucun rendez-vous planifié.</p>
            <p className="text-xs text-light/25 text-center">Les RDV fixés avec le cabinet apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-gold/10">
            {upcoming.map(rdv => (
              <div key={rdv.id} className="bg-dark-surface px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="flex-none text-center hidden sm:block">
                  <p className="text-xs font-bold text-gold">{new Date(rdv.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase()}</p>
                  <p className="text-base font-bold text-light">{rdv.time}</p>
                </div>
                <div className="sm:hidden text-xs text-gold font-medium">
                  {new Date(rdv.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — {rdv.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light">{rdv.title}</p>
                  <p className="text-xs text-light/40">{typeLabel(rdv.type)}{rdv.dossierId && dossierMap[rdv.dossierId] ? ` · ${dossierMap[rdv.dossierId]}` : ''}</p>
                  {rdv.notes && <p className="text-xs text-light/30 mt-0.5 truncate">{rdv.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {section === 'todo' && (
        todos.length === 0 ? (
          <div className="border border-gold/10 py-12 flex flex-col items-center gap-3">
            <CheckSquare size={24} strokeWidth={1} className="text-light/20" />
            <p className="text-sm text-light/40 text-center">Aucune tâche assignée.</p>
            <p className="text-xs text-light/25 text-center">Les tâches assignées par le cabinet apparaîtront ici.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-gold/10">
            {todos.map(todo => (
              <div key={todo.id} className="bg-dark-surface px-4 sm:px-6 py-3 flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full flex-none ${todo.done ? 'bg-emerald-400' : priorityColor(todo.priority).replace('text-', 'bg-')}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${todo.done ? 'line-through text-light/30' : 'text-light'}`}>{todo.title}</p>
                  {todo.dueDate && <p className="text-xs text-light/35">Échéance : {new Date(todo.dueDate + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>}
                </div>
                <span className={`text-[10px] font-medium ${todo.done ? 'text-emerald-400' : priorityColor(todo.priority)}`}>
                  {todo.done ? '✓ Fait' : todo.priority}
                </span>
              </div>
            ))}
          </div>
        )
      )}

      {/* CTA vers prise de RDV */}
      <div className="border border-gold/10 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-light/45 flex-1">Besoin de fixer un nouveau rendez-vous ?</p>
        <a href="/rdv" className="text-xs font-medium text-gold border border-gold/20 px-4 py-2 hover:border-gold/40 hover:bg-gold/5 transition-colors whitespace-nowrap">
          Prendre RDV →
        </a>
      </div>
    </div>
  )
}

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

  const [dossiers] = useLocalState<Dossier[]>(`avocat_dossiers_${user?.id}`, [])
  const [documents, setDocuments] = useLocalState<Document[]>(`avocat_documents_${user?.id}`, [])
  const [rdvs] = useLocalState<Appointment[]>(`avocat_rdv_${user?.id}`, [])
  const [todos] = useLocalState<Todo[]>(`avocat_todos_${user?.id}`, [])
  const [invoices] = useLocalState<Invoice[]>(`avocat_invoices_${user?.id}`, [])

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
        <main className="flex-1 px-4 sm:px-6 md:px-12 py-6 md:py-10 max-w-3xl pb-20 md:pb-10">
          {tab === 'apercu' && <Apercu dossiers={dossiers} documents={documents} userName={user?.name ?? ''} />}
          {tab === 'dossiers' && <Dossiers dossiers={dossiers} rdvs={rdvs} todos={todos} invoices={invoices} />}
          {tab === 'documents' && (
            <Documents
              documents={documents}
              setDocuments={setDocuments}
              userId={user?.id ?? ''}
              userName={user?.name ?? ''}
            />
          )}
          {tab === 'rendezvous' && (
            <RdvViewer rdvs={rdvs} todos={todos} dossiers={dossiers} />
          )}
          {tab === 'facturation' && (
            <InvoiceViewer
              invoices={invoices}
              userName={user?.name ?? ''}
              userCompany={user?.company}
            />
          )}
          {tab === 'messagerie' && <Messagerie />}
        </main>
      </div>

      {/* ── Bottom nav mobile ──────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark-surface border-t border-gold/10 flex safe-area-bottom">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => changeTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px] ${
              tab === id ? 'text-gold' : 'text-light/40 hover:text-light/60'
            }`}
          >
            <Icon size={20} strokeWidth={tab === id ? 2 : 1.25} />
            <span className="text-[9px] font-medium tracking-wide leading-none mt-0.5">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
