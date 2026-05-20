import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, User } from '../contexts/AuthContext'
import { Document } from './DashboardPage'
import CalendarView, { Appointment } from '../components/CalendarView'
import TodoList, { Todo } from '../components/TodoList'
import {
  LayoutDashboard, Users, FileUp, LogOut, ChevronRight,
  Download, Trash2, CheckCircle2, Clock, Circle, Search,
  FolderOpen, ArrowLeft, FileText, File as FileIcon, AlertCircle,
  CalendarDays, Plus, X, Menu, Receipt, Pencil, Mail, CheckCircle,
  Phone, MapPin, BookUser, AtSign, Building2, Save, UserPlus,
  Scale, ScrollText, ChevronDown, ChevronUp, Eye, EyeOff,
  FilePlus, GripVertical, BookOpen, Shield, BarChart3,
  Copy, Check, Loader2
} from 'lucide-react'
import { RAPPORT_TYPES, type RapportData, type RapportSection, type RapportTypeId, downloadRapportPdf } from '../utils/rapportPdf'
import { getAFRBAnalyses, type AFRBAnalysis, AFRB_KEY } from '../components/AFRBTool'
import { downloadAFRBReport, generateAFRBBase64 } from '../utils/afrbReportPdf'

// ── Helper API IA — proxy /api/ai ─────────────────────────────────────────────
async function callAI(prompt: string, maxTokens = 2000): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
  return data.text ?? ''
}

// ── Clé de stockage des demandes clients ──────────────────────────────────────
const RAPPORT_REQUESTS_KEY = 'avocat_rapport_requests'
interface RapportRequest {
  id: string
  clientId: string
  clientName: string
  type: RapportTypeId
  titre: string
  objet: string
  source: 'client' | 'email' | 'messagerie'
  createdAt: string
  processed: boolean
}
import { Invoice, computeAmounts, fmtAmount } from '../components/BillingModule'

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface ClientData {
  user: User
  dossiers: Dossier[]
  documents: Document[]
}

// ─── Contact types (référencés par ContactsAdmin et upsertContactFromInvoice) ─

const CONTACTS_KEY = 'avocat_contacts'

interface ContactEntry {
  id: string
  nom: string
  email?: string
  telephone?: string
  adresse?: string
  societe?: string
  dossierId?: string
  dossierRef?: string   // référence texte libre du dossier
  clientId?: string     // lié à un compte client enregistré
  notes?: string
  createdAt: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function StatusBadge({ statut }: { statut: Dossier['statut'] }) {
  const map = {
    en_cours: { label: 'En cours', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    complete: { label: 'Clôturé', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    attente: { label: 'En attente', cls: 'bg-gold/50/10 text-amber-400 border-amber-500/20' },
  }
  const { label, cls } = map[statut]
  return <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
}

function downloadDocument(doc: Document) {
  if (!doc.content) return
  const a = document.createElement('a')
  a.href = doc.content
  a.download = doc.name
  a.click()
}

function fileIcon(type: string) {
  if (type.includes('pdf')) return <FileText size={14} strokeWidth={1.25} className="text-red-400 flex-none" />
  return <FileIcon size={14} strokeWidth={1.25} className="text-light/30 flex-none" />
}

// ─── Nettoyage des dossiers fictifs (seedDemoData hérités) ────────────────────
const DEMO_TITRES = ['Levée de fonds Série A', "Pacte d'associés", 'Protection des données']

function purgeDemoDossiers() {
  const accounts: Record<string, { user: User }> = JSON.parse(
    localStorage.getItem('avocat_accounts') || '{}'
  )
  Object.values(accounts)
    .filter(a => a.user.role === 'client')
    .forEach(a => {
      const key = `avocat_dossiers_${a.user.id}`
      const dossiers: Dossier[] = JSON.parse(localStorage.getItem(key) || '[]')
      const filtered = dossiers.filter(d => !DEMO_TITRES.includes(d.titre))
      if (filtered.length !== dossiers.length) {
        localStorage.setItem(key, JSON.stringify(filtered))
      }
      // Purger aussi les RDV et todos fictifs
      const rdvKey = `avocat_rdv_${a.user.id}`
      const rdvs: Appointment[] = JSON.parse(localStorage.getItem(rdvKey) || '[]')
      const cleanRdvs = rdvs.filter(r =>
        !r.title.includes("Point d'avancement — Série A") &&
        !r.title.includes("Signature pacte d'associés") &&
        !r.title.includes('Consultation — Protection des données')
      )
      if (cleanRdvs.length !== rdvs.length) {
        localStorage.setItem(rdvKey, JSON.stringify(cleanRdvs))
      }
      // Purger todos fictifs
      const todoKey = `avocat_todos_${a.user.id}`
      const todos: Todo[] = JSON.parse(localStorage.getItem(todoKey) || '[]')
      const cleanTodos = todos.filter(t =>
        !t.title.includes('Envoyer les statuts mis à jour') &&
        !t.title.includes('Préparer le cap table') &&
        !t.title.includes('Valider les clauses de liquidité') &&
        !t.title.includes('Transmettre les 3 dernières liasses')
      )
      if (cleanTodos.length !== todos.length) {
        localStorage.setItem(todoKey, JSON.stringify(cleanTodos))
      }
    })
}

// ─── getAllClients ─────────────────────────────────────────────────────────────

function getAllClients(): ClientData[] {
  const accounts: Record<string, { password: string; user: User }> = JSON.parse(
    localStorage.getItem('avocat_accounts') || '{}'
  )
  return Object.values(accounts)
    .filter(a => a.user.role === 'client')
    .map(a => ({
      user: a.user,
      dossiers: JSON.parse(localStorage.getItem(`avocat_dossiers_${a.user.id}`) || '[]'),
      documents: JSON.parse(localStorage.getItem(`avocat_documents_${a.user.id}`) || '[]'),
    }))
}

function saveDossiers(userId: string, dossiers: Dossier[]) {
  localStorage.setItem(`avocat_dossiers_${userId}`, JSON.stringify(dossiers))
}

function deleteDocument(userId: string, docId: string) {
  const docs: Document[] = JSON.parse(localStorage.getItem(`avocat_documents_${userId}`) || '[]')
  localStorage.setItem(`avocat_documents_${userId}`, JSON.stringify(docs.filter(d => d.id !== docId)))
}

function getAllRdvs(): (Appointment & { clientName: string })[] {
  const accounts: Record<string, { password: string; user: User }> = JSON.parse(localStorage.getItem('avocat_accounts') || '{}')
  return Object.values(accounts)
    .filter(a => a.user.role === 'client')
    .flatMap(a => {
      const rdvs: Appointment[] = JSON.parse(localStorage.getItem(`avocat_rdv_${a.user.id}`) || '[]')
      return rdvs.map(r => ({ ...r, clientName: a.user.name }))
    })
}

function saveRdvForClient(clientId: string, rdvs: Appointment[]) {
  localStorage.setItem(`avocat_rdv_${clientId}`, JSON.stringify(rdvs))
}

function getRdvsForClient(clientId: string): Appointment[] {
  return JSON.parse(localStorage.getItem(`avocat_rdv_${clientId}`) || '[]')
}

function getTodosForClient(clientId: string): Todo[] {
  return JSON.parse(localStorage.getItem(`avocat_todos_${clientId}`) || '[]')
}

function saveTodosForClient(clientId: string, todos: Todo[]) {
  localStorage.setItem(`avocat_todos_${clientId}`, JSON.stringify(todos))
}

// ── Registre admin centralisé — toutes les factures ──────────────────────────
const ADMIN_INVOICES_KEY = 'avocat_admin_invoices'

function getAdminInvoices(): Invoice[] {
  try { return JSON.parse(localStorage.getItem(ADMIN_INVOICES_KEY) ?? '[]') }
  catch { return [] }
}

function saveAdminInvoices(invoices: Invoice[]): void {
  localStorage.setItem(ADMIN_INVOICES_KEY, JSON.stringify(invoices))
}

function getInvoicesForClient(clientId: string): Invoice[] {
  try { return JSON.parse(localStorage.getItem(`avocat_invoices_${clientId}`) ?? '[]') }
  catch { return [] }
}

function saveInvoicesForClient(clientId: string, invoices: Invoice[]): void {
  localStorage.setItem(`avocat_invoices_${clientId}`, JSON.stringify(invoices))
}

// ─── Vue d'ensemble ───────────────────────────────────────────────────────────

function Overview({ clients }: { clients: ClientData[] }) {
  const totalDossiers = clients.reduce((s, c) => s + c.dossiers.length, 0)
  const dossiersActifs = clients.reduce((s, c) => s + c.dossiers.filter(d => d.statut === 'en_cours').length, 0)
  const totalDocs = clients.reduce((s, c) => s + c.documents.length, 0)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Administration</p>
        <h2 className="font-serif text-2xl text-light">Tableau de bord</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gold/10">
        {[
          { label: 'Clients actifs', value: clients.length },
          { label: 'Dossiers en cours', value: dossiersActifs },
          { label: 'Dossiers totaux', value: totalDossiers },
          { label: 'Documents reçus', value: totalDocs },
        ].map(({ label, value }) => (
          <div key={label} className="bg-dark-surface p-6">
            <p className="text-xs text-light/40 uppercase tracking-wide mb-2">{label}</p>
            <p className="font-serif text-2xl font-bold text-light">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-4">Dossiers actifs</p>
        <div className="flex flex-col gap-px bg-gold/10">
          {clients.flatMap(c =>
            c.dossiers.filter(d => d.statut === 'en_cours').map(d => (
              <div key={d.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
                <FolderOpen size={14} strokeWidth={1.25} className="text-light/30 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light truncate">{d.titre}</p>
                  <p className="text-xs text-light/40">{c.user.name}{c.user.company ? ` · ${c.user.company}` : ''}</p>
                </div>
                <StatusBadge statut={d.statut} />
              </div>
            ))
          )}
          {clients.every(c => c.dossiers.every(d => d.statut !== 'en_cours')) && (
            <div className="bg-dark-surface px-6 py-8 text-center text-sm text-light/30">Aucun dossier en cours.</div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Detail client ────────────────────────────────────────────────────────────

function ClientDetail({
  data,
  onBack,
  onRefresh,
}: {
  data: ClientData
  onBack: () => void
  onRefresh: () => void
}) {
  const [dossiers, setDossiersState] = useState<Dossier[]>(data.dossiers)
  const [documents, setDocumentsState] = useState<Document[]>(data.documents)
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null)
  const [clientInvoices, setClientInvoicesState] = useState<Invoice[]>(() => getInvoicesForClient(data.user.id))

  const [showNewDossierForm, setShowNewDossierForm] = useState(false)
  const [newDossierForm, setNewDossierForm] = useState({ titre: '', description: '' })

  const updateEtape = (dossierId: string, etapeIdx: number, newStatut: Etape['statut']) => {
    const updated = dossiers.map(d => {
      if (d.id !== dossierId) return d
      const etapes = d.etapes.map((e, i) => i === etapeIdx ? { ...e, statut: newStatut, date: newStatut !== 'pending' ? new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : null } : e)
      const allDone = etapes.every(e => e.statut === 'done')
      const anyDone = etapes.some(e => e.statut !== 'pending')
      return { ...d, etapes, statut: allDone ? 'complete' as const : anyDone ? 'en_cours' as const : 'attente' as const }
    })
    setDossiersState(updated)
    saveDossiers(data.user.id, updated)
    if (selectedDossier) setSelectedDossier(updated.find(d => d.id === selectedDossier.id) ?? null)
    onRefresh()
  }

  const createDossier = () => {
    if (!newDossierForm.titre) return
    const newDossier: Dossier = {
      id: crypto.randomUUID(),
      titre: newDossierForm.titre,
      description: newDossierForm.description,
      statut: 'attente',
      dateOuverture: new Date().toISOString().split('T')[0],
      prochainEcheance: null,
      etapes: [{ label: 'Ouverture du dossier', statut: 'done', date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }]
    }
    const updated = [...dossiers, newDossier]
    setDossiersState(updated)
    saveDossiers(data.user.id, updated)
    setNewDossierForm({ titre: '', description: '' })
    setShowNewDossierForm(false)
    onRefresh()
  }

  const removeDoc = (docId: string) => {
    deleteDocument(data.user.id, docId)
    setDocumentsState(prev => prev.filter(d => d.id !== docId))
    onRefresh()
  }

  // ── Sync changement statut facture → auto-crée dossier si nouveau client ──
  const handleInvoiceStatusChange = (inv: Invoice, status: Invoice['status']) => {
    const updated = clientInvoices.map(i => i.id === inv.id ? { ...i, status } : i)
    saveInvoicesForClient(data.user.id, updated)
    setClientInvoicesState(updated)
    // Sync : si la facture devient "envoyée" ou "payée", s'assurer que le dossier existe
    if (status === 'envoyee' || status === 'payee') {
    }
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors">
        <ArrowLeft size={12} strokeWidth={1.5} /> Retour aux clients
      </button>

      <div className="border border-gold/10 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-light">{data.user.name}</p>
          <p className="text-xs text-light/40 mt-0.5">{data.user.email}{data.user.company ? ` · ${data.user.company}` : ''}</p>
        </div>
        <div className="flex gap-3 text-xs text-light/40">
          <span>{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{documents.length} document{documents.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Dossiers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-light/40 uppercase tracking-wide">Dossiers</p>
          {!selectedDossier && (
            <button
              onClick={() => setShowNewDossierForm(!showNewDossierForm)}
              className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors"
            >
              <Plus size={12} strokeWidth={1.5} /> Nouveau dossier
            </button>
          )}
        </div>

        {showNewDossierForm && !selectedDossier && (
          <div className="border border-gold/15 p-6 flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-light">Créer un dossier</p>
              <button onClick={() => setShowNewDossierForm(false)} className="text-light/30 hover:text-light transition-colors"><X size={14} strokeWidth={1.5} /></button>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Titre</label>
              <input type="text" value={newDossierForm.titre} onChange={e => setNewDossierForm(f => ({ ...f, titre: e.target.value }))} placeholder="Nom du dossier" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Description</label>
              <input type="text" value={newDossierForm.description} onChange={e => setNewDossierForm(f => ({ ...f, description: e.target.value }))} placeholder="Description (optionnelle)" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors" />
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={createDossier} className="bg-gold text-dark-bg text-xs font-medium px-4 py-2 hover:bg-gold/90 transition-colors">Créer</button>
              <button onClick={() => setShowNewDossierForm(false)} className="text-xs text-light/40 hover:text-light transition-colors">Annuler</button>
            </div>
          </div>
        )}

        {selectedDossier ? (
          <div className="border border-gold/10 p-6 flex flex-col gap-5">
            <button onClick={() => setSelectedDossier(null)} className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors">
              <ArrowLeft size={12} strokeWidth={1.5} /> Retour à la liste
            </button>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="font-serif text-lg text-light">{selectedDossier.titre}</h3>
              <StatusBadge statut={selectedDossier.statut} />
            </div>
            <div className="flex flex-col gap-4">
              {selectedDossier.etapes.map((etape, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-gold/5 last:border-0 last:pb-0">
                  <div className="flex-none mt-0.5">
                    {etape.statut === 'done' && <CheckCircle2 size={18} strokeWidth={1.5} className="text-light" />}
                    {etape.statut === 'current' && <Clock size={18} strokeWidth={1.5} className="text-blue-600" />}
                    {etape.statut === 'pending' && <Circle size={18} strokeWidth={1.5} className="text-light/20" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${etape.statut === 'pending' ? 'text-light/40' : 'text-light'}`}>{etape.label}</p>
                    {etape.date && <p className="text-xs text-light/40 mt-0.5">{etape.date}</p>}
                  </div>
                  <div className="flex gap-1 flex-none">
                    {(['done', 'current', 'pending'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateEtape(selectedDossier.id, i, s)}
                        className={`text-[10px] font-medium px-2 py-1 border transition-colors ${
                          etape.statut === s
                            ? 'bg-gold text-dark-bg border-gold'
                            : 'text-light/40 border-gold/15 hover:border-gold/30'
                        }`}
                      >
                        {s === 'done' ? '✓' : s === 'current' ? '⏳' : '○'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-px bg-gold/10">
            {dossiers.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDossier(d)}
                className="bg-dark-surface px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-dark-card group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen size={14} strokeWidth={1.25} className="text-light/30 flex-none" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-light truncate">{d.titre}</p>
                    <p className="text-xs text-light/40 mt-0.5">
                      {d.etapes.filter(e => e.statut === 'done').length}/{d.etapes.length} étapes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <StatusBadge statut={d.statut} />
                  <ChevronRight size={13} strokeWidth={1.5} className="text-light/20 group-hover:text-light/50 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">
          Documents ({documents.length})
        </p>
        {documents.length === 0 ? (
          <div className="border border-gold/10 px-6 py-8 text-center text-sm text-light/30">Aucun document déposé.</div>
        ) : (
          <div className="flex flex-col gap-px bg-gold/10">
            {documents.map(doc => (
              <div key={doc.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
                {fileIcon(doc.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-light truncate">{doc.name}</p>
                  <p className="text-xs text-light/40 mt-0.5">
                    {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  {doc.content ? (
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="flex items-center gap-1.5 text-xs text-light/50 hover:text-light border border-gold/15 hover:border-gold/30 px-3 py-1.5 transition-colors"
                    >
                      <Download size={11} strokeWidth={1.5} />
                      Télécharger
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-light/30">
                      <AlertCircle size={11} strokeWidth={1.5} /> Indisponible
                    </span>
                  )}
                  <button
                    onClick={() => removeDoc(doc.id)}
                    className="text-light/20 hover:text-red-500 transition-colors p-1"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Factures */}
      <div>
        <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">
          Factures ({clientInvoices.length})
        </p>
        {clientInvoices.length === 0 ? (
          <div className="border border-gold/10 px-6 py-8 text-center text-sm text-light/30">Aucune facture pour ce client.</div>
        ) : (
          <div className="flex flex-col gap-px bg-gold/10">
            {[...clientInvoices].sort((a, b) => b.dateEmission.localeCompare(a.dateEmission)).map(inv => {
              const { net } = computeAmounts(inv)
              const { label, cls } = INV_STATUS_MAP[inv.status]
              return (
                <div key={inv.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
                  <Receipt size={14} strokeWidth={1.25} className="text-light/30 flex-none" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-light font-mono">{inv.number}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
                    </div>
                    <p className="text-xs text-light/40">
                      {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' — '}
                      {new Date(inv.dateEcheance + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right mr-2 flex-none">
                    <p className="text-sm font-semibold text-light">{fmtAmount(net, inv.currency)}</p>
                    <p className="text-[10px] text-light/40">net à payer</p>
                  </div>
                  {/* Quick status buttons */}
                  <div className="flex gap-1 flex-none">
                    {(['brouillon', 'envoyee', 'payee', 'en_retard'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => handleInvoiceStatusChange(inv, s)}
                        title={INV_STATUS_MAP[s].label}
                        className={`text-[10px] font-medium px-2 py-1 border transition-colors ${
                          inv.status === s ? 'bg-gold text-dark-bg border-gold' : 'text-light/30 border-gold/10 hover:border-gold/30'
                        }`}
                      >
                        {s === 'brouillon' ? '✎' : s === 'envoyee' ? '✉' : s === 'payee' ? '✓' : '!'}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const updated = clientInvoices.filter(i => i.id !== inv.id)
                      saveInvoicesForClient(data.user.id, updated)
                      setClientInvoicesState(updated)
                      onRefresh()
                    }}
                    className="text-light/20 hover:text-red-500 transition-colors p-1 flex-none"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Liste clients ─────────────────────────────────────────────────────────────

function ClientsList({ clients, onSelect }: {
  clients: ClientData[]
  onSelect: (c: ClientData) => void
  onRefresh: () => void
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() =>
    clients.filter(c =>
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.user.company ?? '').toLowerCase().includes(search.toLowerCase())
    ), [clients, search])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Clients</p>
        <h2 className="font-serif text-2xl text-light">{clients.length} client{clients.length > 1 ? 's' : ''}</h2>
      </div>

      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou société…"
          className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-light/30 text-center py-8">Aucun client trouvé.</p>
      ) : (
        <div className="flex flex-col gap-px bg-gold/10">
          {filtered.map(c => (
            <button
              key={c.user.id}
              onClick={() => onSelect(c)}
              className="bg-dark-surface px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-dark-card group transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-8 h-8 bg-dark-card flex items-center justify-center flex-none">
                  <span className="text-xs font-semibold text-light/50">
                    {c.user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-light">{c.user.name}</p>
                  <p className="text-xs text-light/40 mt-0.5">{c.user.email}{c.user.company ? ` · ${c.user.company}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-none">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-light/40">{c.dossiers.length} dossier{c.dossiers.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-light/30">{c.documents.length} document{c.documents.length > 1 ? 's' : ''}</p>
                </div>
                <ChevronRight size={13} strokeWidth={1.5} className="text-light/20 group-hover:text-light/50 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tous les documents ───────────────────────────────────────────────────────

function saveDocumentForUser(userId: string, doc: Document) {
  const docs: Document[] = JSON.parse(localStorage.getItem(`avocat_documents_${userId}`) || '[]')
  localStorage.setItem(`avocat_documents_${userId}`, JSON.stringify([doc, ...docs]))
}

function AllDocuments({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const [search,      setSearch]      = useState('')
  const [showUpload,  setShowUpload]  = useState(false)
  const [targetUser,  setTargetUser]  = useState(clients[0]?.user.id ?? '')
  const [dragOver,    setDragOver]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [uploadMsg,   setUploadMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allDocs = useMemo(() =>
    clients.flatMap(c => c.documents.map(d => ({ ...d, client: c.user }))),
    [clients]
  )
  const filtered = useMemo(() =>
    allDocs.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.client.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    [allDocs, search]
  )

  const handleDelete = (userId: string, docId: string) => {
    if (!confirm('Supprimer ce document définitivement ?')) return
    deleteDocument(userId, docId)
    onRefresh()
  }

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !targetUser) return
    setUploading(true)
    setUploadMsg(null)
    let done = 0
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const doc: Document = {
          id:         crypto.randomUUID(),
          name:       file.name,
          size:       file.size,
          type:       file.type || 'application/octet-stream',
          uploadedAt: new Date().toISOString(),
          content:    reader.result as string,
        }
        saveDocumentForUser(targetUser, doc)
        done++
        if (done === files.length) {
          setUploading(false)
          setUploadMsg({ ok: true, text: `${done} fichier${done > 1 ? 's' : ''} ajouté${done > 1 ? 's' : ''} avec succès` })
          setShowUpload(false)
          onRefresh()
          setTimeout(() => setUploadMsg(null), 4000)
        }
      }
      reader.onerror = () => {
        done++
        setUploading(false)
        setUploadMsg({ ok: false, text: `Erreur lors de la lecture de ${file.name}` })
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Documents</p>
          <h2 className="font-serif text-2xl text-light">{allDocs.length} document{allDocs.length > 1 ? 's' : ''}</h2>
          <p className="text-xs text-light/35 mt-1">Tous les fichiers partagés avec les clients</p>
        </div>
        <button
          onClick={() => { setShowUpload(s => !s); setUploadMsg(null) }}
          className="flex items-center gap-2 text-xs font-medium bg-gold text-dark-bg px-4 py-2.5 hover:bg-gold/90 transition-colors"
        >
          <Plus size={13} strokeWidth={1.5} />
          {showUpload ? 'Annuler' : 'Ajouter un document'}
        </button>
      </div>

      {/* Feedback upload */}
      {uploadMsg && (
        <div className={`flex items-center gap-2 px-4 py-3 text-xs border ${
          uploadMsg.ok
            ? 'border-green-500/20 bg-green-500/8 text-green-400'
            : 'border-red-500/20 bg-red-500/8 text-red-400'
        }`}>
          {uploadMsg.ok ? <CheckCircle size={13} strokeWidth={1.5} /> : <AlertCircle size={13} strokeWidth={1.5} />}
          {uploadMsg.text}
        </div>
      )}

      {/* Zone d'upload */}
      {showUpload && (
        <div className="border border-gold/20 bg-dark-surface p-6 flex flex-col gap-5">
          <p className="text-[10px] font-bold text-light/30 tracking-[0.25em] uppercase">Ajouter un document</p>

          {/* Sélection du client destinataire */}
          <div>
            <label className="text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-2">
              Client destinataire *
            </label>
            <select
              value={targetUser}
              onChange={e => setTargetUser(e.target.value)}
              className="w-full sm:w-auto border-b border-gold/15 bg-dark-surface py-2 text-sm text-light focus:outline-none focus:border-gold/50 transition-colors pr-8"
            >
              {clients.length === 0 && (
                <option value="">— Aucun client enregistré —</option>
              )}
              {clients.map(c => (
                <option key={c.user.id} value={c.user.id}>
                  {c.user.name}{c.user.company ? ` — ${c.user.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Zone drag & drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              processFiles(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-none cursor-pointer flex flex-col items-center gap-4 py-12 px-6 transition-colors ${
              dragOver
                ? 'border-gold bg-gold/5 text-light'
                : 'border-gold/20 hover:border-gold/40 text-light/35 hover:text-light/60'
            }`}
          >
            <FileUp size={28} strokeWidth={1} className={dragOver ? 'text-gold' : 'text-light/25'} />
            <div className="text-center">
              <p className="text-sm font-medium mb-1">
                {uploading ? 'Chargement en cours…' : 'Glissez vos fichiers ici'}
              </p>
              <p className="text-xs text-light/30">
                ou cliquez pour sélectionner · PDF, Word, Excel, images, etc.
              </p>
            </div>
            {!uploading && (
              <span className="text-xs border border-gold/25 px-4 py-1.5 text-light/50 hover:text-light transition-colors">
                Parcourir
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => processFiles(e.target.files)}
          />

          <p className="text-[10px] text-light/25">
            Les fichiers seront visibles immédiatement dans l'espace client du destinataire.
          </p>
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom de fichier ou client…"
          className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Liste documents */}
      {filtered.length === 0 ? (
        <div className="border border-gold/10 py-16 flex flex-col items-center gap-4">
          <FileUp size={32} strokeWidth={1} className="text-light/15" />
          <div className="text-center">
            <p className="text-sm font-medium text-light/40 mb-1">Aucun document</p>
            <p className="text-xs text-light/25">
              {search ? 'Aucun résultat pour cette recherche.' : 'Ajoutez des documents pour les partager avec vos clients.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/10">
          {filtered.map(doc => (
            <div key={`${doc.client.id}-${doc.id}`}
              className="bg-dark-surface px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-dark-card transition-colors group">
              <div className="flex-none">{fileIcon(doc.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-light truncate">{doc.name}</p>
                <p className="text-xs text-light/40 mt-0.5">
                  <span className="font-medium text-light/60">{doc.client.name}</span>
                  {doc.client.company ? ` · ${doc.client.company}` : ''} ·{' '}
                  {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-none opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.content ? (
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="flex items-center gap-1.5 text-xs text-light/50 hover:text-gold border border-gold/15 hover:border-gold/30 px-3 py-1.5 transition-colors"
                  >
                    <Download size={11} strokeWidth={1.5} /> Télécharger
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-light/30">
                    <AlertCircle size={11} strokeWidth={1.5} /> Indisponible
                  </span>
                )}
                <button
                  onClick={() => handleDelete(doc.client.id, doc.id)}
                  className="text-light/20 hover:text-red-500 transition-colors p-1.5 border border-gold/10 hover:border-red-500/30"
                >
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Facturation Admin ────────────────────────────────────────────────────────

const INV_STATUS_MAP = {
  brouillon: { label: 'Brouillon',  cls: 'bg-light/5 text-light/40 border-light/15' },
  envoyee:   { label: 'Envoyée',    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  payee:     { label: 'Payée',      cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  en_retard: { label: 'En retard',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
} as const

// ── Numérotation auto ─────────────────────────────────────────────────────────
function nextInvoiceNumber(allInvoices: Invoice[]): string {
  const year = new Date().getFullYear()
  const existing = allInvoices
    .map(i => {
      const m = i.number.match(/(\d+)$/)
      return m ? parseInt(m[1]) : 0
    })
    .filter(n => !isNaN(n))
  const seq = existing.length > 0 ? Math.max(...existing) + 1 : 1
  return `NH-${year}-${String(seq).padStart(3, '0')}`
}

// ── Formulaire création note d'honoraires ─────────────────────────────────────
function InvoiceFormAdmin({ clients, allInvoices, initialValues, onSave, onCancel }: {
  clients: ClientData[]
  allInvoices: Invoice[]
  initialValues?: Invoice
  onSave: (inv: Invoice) => void
  onCancel: () => void
}) {
  const isEdit = !!initialValues
  const today       = new Date().toISOString().split('T')[0]
  const echeance30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  // ── Mode client : existant (dropdown) ou manuel (saisie libre) ───────────
  const [clientMode,   setClientMode]   = useState<'existing' | 'manual'>(
    initialValues
      ? (initialValues.clientId.startsWith('manual_') ? 'manual' : 'existing')
      : (clients.length > 0 ? 'existing' : 'manual')
  )
  const [clientId,     setClientId]     = useState(
    initialValues && !initialValues.clientId.startsWith('manual_') ? initialValues.clientId : (clients[0]?.user.id ?? '')
  )
  const [clientNom,    setClientNom]    = useState(initialValues?.clientName ?? '')
  const [clientEmail,  setClientEmail]  = useState(initialValues?.clientEmail ?? '')
  const [clientPhone,  setClientPhone]  = useState(initialValues?.clientPhone ?? '')
  const [clientMF,     setClientMF]     = useState(initialValues?.clientMF ?? '')
  const [clientAddr,   setClientAddr]   = useState(initialValues?.clientAddress ?? '')

  // ── Mode saisie : montant HT direct ou lignes de prestations ─────────────
  const hasMultiLines = initialValues && initialValues.lines.length > 1
  const [saisieMode,   setSaisieMode]   = useState<'ht_direct' | 'lignes'>(
    hasMultiLines ? 'lignes' : 'ht_direct'
  )
  const initHt = initialValues
    ? String(initialValues.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0))
    : ''
  const [htDirect,     setHtDirect]     = useState(initialValues && !hasMultiLines ? initHt : '')
  const [htLibelle,    setHtLibelle]    = useState(
    initialValues?.lines[0]?.description ?? 'Honoraires professionnels'
  )
  const [lines,        setLines]        = useState(
    initialValues?.lines ?? [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
  )

  const [number,       setNumber]       = useState(initialValues?.number ?? nextInvoiceNumber(allInvoices))
  const [dateE,        setDateE]        = useState(initialValues?.dateEmission ?? today)
  const [dateEch,      setDateEch]      = useState(initialValues?.dateEcheance ?? echeance30)
  const [notes,        setNotes]        = useState(initialValues?.notes ?? '')
  const [mention,      setMention]      = useState(initialValues?.mentionRetenue ?? true)

  // ── Taux fixes Tunisie ────────────────────────────────────────────────────
  const TVA_RATE     = 19
  const RETENUE_RATE = 10
  const TIMBRE       = 0

  // ── Calculs dynamiques ────────────────────────────────────────────────────
  const ht = saisieMode === 'ht_direct'
    ? parseFloat(htDirect) || 0
    : lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)

  const tva     = ht * TVA_RATE / 100
  const ttc     = ht + tva
  const retenue = ttc * RETENUE_RATE / 100
  const net     = ttc - retenue + TIMBRE

  const selectedClient = clients.find(c => c.user.id === clientId)

  // Nom effectif du client
  const effectiveClientName = clientMode === 'existing'
    ? (selectedClient?.user.name ?? '')
    : clientNom

  // Lignes effectives
  const effectiveLines = saisieMode === 'ht_direct'
    ? [{ id: crypto.randomUUID(), description: htLibelle, quantity: 1, unitPrice: ht }]
    : lines

  const updLine = (id: string, field: string, val: string) =>
    setLines(prev => prev.map(l => l.id === id ? {
      ...l,
      [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(val) || 0 : val,
    } : l))

  const addLine = () => setLines(prev => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }])
  const delLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id))

  const canSave = effectiveClientName.trim() && ht > 0

  const handleSave = () => {
    if (!canSave) return
    const finalClientId = clientMode === 'existing' ? clientId : (initialValues?.clientId ?? `manual_${crypto.randomUUID().slice(0, 8)}`)
    const inv: Invoice = {
      ...(initialValues ?? {}),
      id:             initialValues?.id ?? crypto.randomUUID(),
      number,
      clientId:       finalClientId,
      clientName:     effectiveClientName,
      clientEmail:    clientMode === 'existing'
                        ? (selectedClient?.user?.email ?? undefined)
                        : (clientEmail || undefined),
      clientPhone:    clientPhone || undefined,
      clientMF:       clientMF  || undefined,
      clientAddress:  clientAddr || undefined,
      status:         initialValues?.status ?? 'brouillon',
      dateEmission:   dateE,
      dateEcheance:   dateEch,
      lines:          effectiveLines,
      linkedRdvIds:   initialValues?.linkedRdvIds ?? [],
      linkedTodoIds:  initialValues?.linkedTodoIds ?? [],
      notes:          notes || undefined,
      mentionRetenue: mention,
      currency:       'TND',
      tvaRate:        TVA_RATE,
      retenueRate:    RETENUE_RATE,
      timbreFiscal:   TIMBRE,
      createdAt:      initialValues?.createdAt ?? new Date().toISOString(),
    }
    onSave(inv)
  }

  const inputCls  = 'w-full border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/25 focus:outline-none focus:border-gold/50 transition-colors'
  const labelCls  = 'text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-1.5'
  const fmt       = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

  return (
    <div className="flex flex-col gap-6">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-1">{isEdit ? 'Modifier la facture' : 'Nouvelle facture'}</p>
          <h2 className="font-serif text-2xl text-light">Note d'honoraires</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="text-xs font-medium text-light/40 border border-gold/15 px-4 py-2 hover:border-gold/30 transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={!canSave}
            className="flex items-center gap-2 text-xs font-medium bg-gold text-dark-bg px-5 py-2 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Receipt size={13} strokeWidth={1.5} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Identité de la facture ─────────────────────────────────────── */}
        <div className="border border-gold/15 bg-dark-surface p-5 flex flex-col gap-4">
          <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">Identité de la facture</p>
          <div>
            <label className={labelCls}>Numéro *</label>
            <input type="text" value={number} onChange={e => setNumber(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date d'émission</label>
              <input type="date" value={dateE} onChange={e => setDateE(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            </div>
            <div>
              <label className={labelCls}>Date d'échéance</label>
              <input type="date" value={dateEch} onChange={e => setDateEch(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
            </div>
          </div>
        </div>

        {/* ── Récapitulatif fiscal ───────────────────────────────────────── */}
        <div className="border border-gold/20 bg-dark-surface p-5">
          <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-4">Calcul fiscal (TND)</p>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Montant HT',                   value: fmt(ht),      sub: '',                                    bold: false, red: false },
              { label: `+ TVA (${TVA_RATE} %)`,         value: fmt(tva),     sub: `${fmt(ht)} × ${TVA_RATE} %`,          bold: false, red: false },
              { label: '= Montant TTC',                 value: fmt(ttc),     sub: '',                                    bold: true,  red: false },
              { label: `− Retenue (${RETENUE_RATE} %)`, value: fmt(retenue), sub: `${fmt(ttc)} × ${RETENUE_RATE} %`,     bold: false, red: true  },
            ].map(row => (
              <div key={row.label} className={`flex items-end justify-between gap-2 py-2 border-b border-gold/8 ${row.bold ? 'bg-gold/8 px-2 -mx-2' : ''}`}>
                <div>
                  <p className={`text-sm ${row.bold ? 'font-semibold text-light' : row.red ? 'text-red-400/80' : 'text-light/55'}`}>{row.label}</p>
                  {row.sub && <p className="text-[10px] text-light/25 mt-0.5">{row.sub}</p>}
                </div>
                <p className={`text-sm font-mono font-semibold flex-none ${row.bold ? 'text-light' : row.red ? 'text-red-400/70' : 'text-light/65'}`}>{row.value} DT</p>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 bg-gold px-3 py-2.5 -mx-1 mt-1">
              <p className="text-sm font-bold text-dark-bg">Net à payer</p>
              <p className="text-base font-bold text-dark-bg font-mono">{fmt(net)} DT</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Client ─────────────────────────────────────────────────────────── */}
      <div className="border border-gold/15 bg-dark-surface p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">Client</p>
          {/* Bascule existant / manuel */}
          <div className="flex gap-1">
            {(['existing', 'manual'] as const).map(m => (
              <button key={m} onClick={() => setClientMode(m)}
                className={`text-xs px-3 py-1.5 border transition-colors ${
                  clientMode === m ? 'bg-gold text-dark-bg border-gold font-medium' : 'text-light/40 border-gold/15 hover:border-gold/30'
                }`}>
                {m === 'existing' ? 'Client enregistré' : 'Saisie manuelle'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Nom client */}
          <div>
            <label className={labelCls}>
              {clientMode === 'existing' ? 'Client *' : 'Nom du client *'}
            </label>
            {clientMode === 'existing' ? (
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full border-b border-gold/15 bg-dark-bg py-2 text-sm text-light focus:outline-none focus:border-gold/50 transition-colors">
                {clients.length === 0
                  ? <option value="">Aucun client enregistré</option>
                  : clients.map(c => (
                    <option key={c.user.id} value={c.user.id}>
                      {c.user.name}{c.user.company ? ` — ${c.user.company}` : ''}
                    </option>
                  ))
                }
              </select>
            ) : (
              <input type="text" value={clientNom} onChange={e => setClientNom(e.target.value)}
                placeholder="Nom complet ou raison sociale" className={inputCls} />
            )}
          </div>

          {/* Matricule fiscal */}
          <div>
            <label className={labelCls}>Matricule fiscal</label>
            <input type="text" value={clientMF} onChange={e => setClientMF(e.target.value)}
              placeholder="Ex : 1234567A/M/000" className={inputCls} />
          </div>

          {/* Email (mode manuel uniquement) */}
          {clientMode === 'manual' && (
            <div>
              <label className={labelCls}>Email <span className="normal-case text-light/30">(pour envoi de facture)</span></label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                placeholder="client@entreprise.com" className={inputCls} />
            </div>
          )}

          {/* Téléphone */}
          <div>
            <label className={labelCls}>Téléphone <span className="normal-case text-light/30">(optionnel)</span></label>
            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)}
              placeholder="+216 XX XXX XXX" className={inputCls} />
          </div>

          {/* Adresse */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Adresse</label>
            <input type="text" value={clientAddr} onChange={e => setClientAddr(e.target.value)}
              placeholder="Adresse complète, ville" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Montant / Prestations ─────────────────────────────────────────── */}
      <div className="border border-gold/15 bg-dark-surface p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest">Honoraires</p>
          {/* Bascule montant direct / lignes détaillées */}
          <div className="flex gap-1">
            {(['ht_direct', 'lignes'] as const).map(m => (
              <button key={m} onClick={() => setSaisieMode(m)}
                className={`text-xs px-3 py-1.5 border transition-colors ${
                  saisieMode === m ? 'bg-gold text-dark-bg border-gold font-medium' : 'text-light/40 border-gold/15 hover:border-gold/30'
                }`}>
                {m === 'ht_direct' ? 'Montant HT direct' : 'Lignes détaillées'}
              </button>
            ))}
          </div>
        </div>

        {/* Montant HT direct */}
        {saisieMode === 'ht_direct' && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Libellé de la prestation</label>
              <input type="text" value={htLibelle} onChange={e => setHtLibelle(e.target.value)}
                placeholder="Honoraires professionnels" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Montant HT (DT) *</label>
              <div className="relative">
                <input
                  type="number" min="0" step="0.001"
                  value={htDirect}
                  onChange={e => setHtDirect(e.target.value)}
                  placeholder="0,000"
                  className={`${inputCls} pr-10 text-lg font-semibold`}
                />
                <span className="absolute right-0 bottom-2 text-sm text-light/40 font-medium">DT</span>
              </div>
              {ht > 0 && (
                <p className="text-[10px] text-light/30 mt-1.5">
                  → TVA : {fmt(tva)} DT · TTC : {fmt(ttc)} DT · Retenue : {fmt(retenue)} DT · Net : <strong className="text-gold/60">{fmt(net)} DT</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lignes détaillées */}
        {saisieMode === 'lignes' && (
          <div>
            <div className="overflow-x-auto -mx-2">
              <div className="min-w-[480px] px-2">
                <div className="grid grid-cols-[1fr_56px_96px_28px] gap-2 px-3 py-2 bg-dark-bg mb-1">
                  {['Description', 'Qté', 'PU HT (DT)', ''].map((h, i) => (
                    <p key={h} className={`text-[10px] font-medium text-light/40 uppercase ${i > 0 ? 'text-right' : ''}`}>{h}</p>
                  ))}
                </div>
                {lines.map((line, idx) => (
                  <div key={line.id} className="grid grid-cols-[1fr_56px_96px_28px] gap-2 px-3 py-2 bg-dark-surface border-t border-gold/8 items-center">
                    <input type="text" value={line.description}
                      onChange={e => updLine(line.id, 'description', e.target.value)}
                      placeholder={`Prestation ${idx + 1}`}
                      className="text-sm text-light bg-transparent border-b border-transparent focus:border-gold/30 py-1 focus:outline-none transition-colors min-w-0"
                    />
                    <input type="number" min="0" step="0.5" value={line.quantity}
                      onChange={e => updLine(line.id, 'quantity', e.target.value)}
                      className="text-sm text-light text-right bg-transparent border-b border-transparent focus:border-gold/30 py-1 focus:outline-none transition-colors"
                    />
                    <input type="number" min="0" step="1" value={line.unitPrice}
                      onChange={e => updLine(line.id, 'unitPrice', e.target.value)}
                      className="text-sm text-light text-right bg-transparent border-b border-transparent focus:border-gold/30 py-1 focus:outline-none transition-colors"
                    />
                    <button onClick={() => delLine(line.id)} disabled={lines.length === 1}
                      className="text-light/20 hover:text-red-500 transition-colors flex justify-center disabled:opacity-20">
                      <X size={13} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_56px_96px_28px] gap-2 px-3 py-2 bg-dark-bg mt-1">
                  <p className="text-xs text-light/40 col-span-2">Total HT</p>
                  <p className="text-sm font-semibold text-light text-right font-mono">{fmt(ht)} DT</p>
                  <span />
                </div>
              </div>
            </div>
            <button onClick={addLine}
              className="mt-3 text-xs font-medium text-gold/55 border border-gold/15 px-3 py-1.5 hover:border-gold/35 hover:text-gold transition-colors flex items-center gap-1.5">
              <Plus size={11} strokeWidth={1.5} /> Ajouter une ligne
            </button>
          </div>
        )}
      </div>

      {/* ── Notes + Mention retenue ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="border border-gold/15 bg-dark-surface p-5">
          <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-3">Notes (optionnel)</p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            rows={3} placeholder="Conditions particulières, références dossier..."
            className="w-full bg-transparent border-b border-gold/15 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/40 resize-none py-2"
          />
        </div>

        <div className="border border-gold/20 bg-dark-surface p-5">
          <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest mb-3">Mention légale</p>
          <label className="flex items-start gap-3 cursor-pointer">
            <div onClick={() => setMention(v => !v)}
              className={`mt-0.5 w-4 h-4 border flex-none flex items-center justify-center transition-colors cursor-pointer ${
                mention ? 'bg-gold border-gold' : 'border-gold/30 hover:border-gold/60'
              }`}>
              {mention && <span className="text-dark-bg text-[10px] font-bold">✓</span>}
            </div>
            <div>
              <p className="text-xs font-semibold text-light/80 mb-1">Attestation de retenue à la source</p>
              <p className="text-[11px] text-light/40 leading-relaxed italic">
                "Prière nous délivrer une attestation de retenue à la source comportant le montant de la retenue opérée."
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

// ── Crée ou enrichit une fiche contact après envoi d'une facture ──────────────
function upsertContactFromInvoice(inv: Invoice, email: string, clientUser?: User) {
  const contacts: ContactEntry[] = (() => {
    try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) ?? '[]') }
    catch { return [] }
  })()

  // Chercher une fiche existante par clientId ou par email
  const existingIdx = contacts.findIndex(c =>
    (inv.clientId && !inv.clientId.startsWith('manual_') && c.clientId === inv.clientId) ||
    (c.email?.toLowerCase() === email.toLowerCase())
  )

  // Référence dossier : numéro de facture comme trace
  const dossierRef = inv.dossierId
    ? (inv.dossierRef ?? inv.number)
    : inv.number

  if (existingIdx >= 0) {
    // ── Enrichir la fiche existante ───────────────────────────────────────
    const existing = contacts[existingIdx]
    contacts[existingIdx] = {
      ...existing,
      email:       email || existing.email,
      telephone:   inv.clientPhone  || existing.telephone,
      adresse:     inv.clientAddress || existing.adresse,
      societe:     clientUser?.company || inv.clientAddress || existing.societe,
      // Ajouter la réf facture si pas déjà présente
      dossierRef:  existing.dossierRef
        ? (existing.dossierRef.includes(inv.number) ? existing.dossierRef : `${existing.dossierRef} · ${inv.number}`)
        : dossierRef,
    }
  } else {
    // ── Créer une nouvelle fiche ──────────────────────────────────────────
    const newContact: ContactEntry = {
      id:         crypto.randomUUID(),
      nom:        inv.clientName ?? clientUser?.name ?? 'Client',
      email,
      telephone:  inv.clientPhone  || undefined,
      adresse:    inv.clientAddress || undefined,
      societe:    clientUser?.company || undefined,
      clientId:   !inv.clientId.startsWith('manual_') ? inv.clientId : undefined,
      dossierRef,
      notes:      `Fiche créée automatiquement via facture ${inv.number}`,
      createdAt:  new Date().toISOString(),
    }
    contacts.unshift(newContact)
  }

  // Sauvegarder uniquement les contacts manuels (pas les auto_)
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(
    contacts.filter(c => !c.id.startsWith('auto_'))
  ))
}

function AllInvoicesAdmin({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const [search,       setSearch]       = useState('')
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all')
  const [showForm,     setShowForm]     = useState(false)
  const [editInv,      setEditInv]      = useState<Invoice | null>(null)
  const [pdfLoading,    setPdfLoading]    = useState(false)
  const [emailLoading,  setEmailLoading]  = useState<string | null>(null) // invoice id en cours
  const [emailFeedback, setEmailFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null)

  // ── Source de vérité : registre admin centralisé ──────────────────────────
  const [invoices, setInvoicesState] = useState<Invoice[]>(() => getAdminInvoices())

  const reloadInvoices = () => setInvoicesState(getAdminInvoices())

  // Map clientId → infos client (pour l'affichage)
  const clientMap = useMemo(() =>
    Object.fromEntries(clients.map(c => [c.user.id, c.user])),
    [clients]
  )

  const enriched = useMemo(() =>
    invoices.map(inv => ({
      ...inv,
      clientDisplayName: inv.clientName || clientMap[inv.clientId]?.name || 'Client inconnu',
      clientCompanyDisplay: clientMap[inv.clientId]?.company,
    })),
    [invoices, clientMap]
  )

  const filtered = useMemo(() =>
    enriched.filter(inv => {
      const matchSearch = search === '' ||
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientDisplayName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus
      return matchSearch && matchStatus
    }).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission)),
    [enriched, search, filterStatus]
  )

  const totalNet = filtered.reduce((s, inv) => s + computeAmounts(inv).net, 0)
  const paidNet  = filtered.filter(i => i.status === 'payee').reduce((s, inv) => s + computeAmounts(inv).net, 0)

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const handleSaveNew = (inv: Invoice) => {
    // 1. Registre admin
    const updated = [...getAdminInvoices(), inv]
    saveAdminInvoices(updated)
    // 2. Si client enregistré → aussi dans son espace client
    if (!inv.clientId.startsWith('manual_')) {
      saveInvoicesForClient(inv.clientId, [...getInvoicesForClient(inv.clientId), inv])
    }
    reloadInvoices()
    setShowForm(false)
    onRefresh()
  }

  const handleSaveEdit = (inv: Invoice) => {
    // Mettre à jour dans le registre admin
    const updated = getAdminInvoices().map(i => i.id === inv.id ? inv : i)
    saveAdminInvoices(updated)
    // Mettre à jour dans l'espace client si enregistré
    if (!inv.clientId.startsWith('manual_')) {
      const clientInvs = getInvoicesForClient(inv.clientId).map(i => i.id === inv.id ? inv : i)
      saveInvoicesForClient(inv.clientId, clientInvs)
    }
    reloadInvoices()
    setEditInv(null)
    onRefresh()
  }

  const updateStatus = (inv: Invoice, status: Invoice['status']) => {
    const updated = { ...inv, status }
    const adminUpdated = getAdminInvoices().map(i => i.id === inv.id ? updated : i)
    saveAdminInvoices(adminUpdated)
    if (!inv.clientId.startsWith('manual_')) {
      saveInvoicesForClient(inv.clientId, getInvoicesForClient(inv.clientId).map(i => i.id === inv.id ? updated : i))
    }
    reloadInvoices()
  }

  const deleteInvoice = (inv: Invoice) => {
    if (!confirm(`Supprimer la facture ${inv.number} ?`)) return
    saveAdminInvoices(getAdminInvoices().filter(i => i.id !== inv.id))
    if (!inv.clientId.startsWith('manual_')) {
      saveInvoicesForClient(inv.clientId, getInvoicesForClient(inv.clientId).filter(i => i.id !== inv.id))
    }
    reloadInvoices()
    onRefresh()
  }

  const handleDownloadPdf = async (inv: Invoice) => {
    setPdfLoading(true)
    try {
      const { downloadInvoicePdf } = await import('../utils/invoicePdf')
      await downloadInvoicePdf(inv, inv.clientName ?? 'Client', clientMap[inv.clientId]?.company)
    } finally { setPdfLoading(false) }
  }

  const handleSendEmail = async (inv: Invoice) => {
    // Récupérer l'email du client
    const clientUser = clientMap[inv.clientId]
    const clientEmail = clientUser?.email ?? inv.clientEmail ?? ''

    if (!clientEmail) {
      setEmailFeedback({ id: inv.id, ok: false, msg: 'Email client introuvable. Ajoutez l\'email dans la fiche contact ou modifiez la facture.' })
      return
    }

    setEmailLoading(inv.id)
    setEmailFeedback(null)
    try {
      // Générer le PDF en base64
      const { generateInvoicePdfBase64 } = await import('../utils/invoicePdf')
      const { base64, filename } = await generateInvoicePdfBase64(
        inv, inv.clientName ?? 'Client', clientUser?.company
      )

      const { net } = computeAmounts(inv)

      // Envoyer via l'API
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:        'send_invoice',
          pdfBase64:     base64,
          filename,
          clientEmail,
          clientName:    inv.clientName ?? clientUser?.name ?? 'Client',
          invoiceNumber: inv.number,
          netAmount:     `${(net).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0').replace('.', ',')} DT`,
          dateEcheance:  inv.dateEcheance,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        // Marquer comme envoyée
        updateStatus(inv, 'envoyee')

        // ── Créer / enrichir la fiche contact automatiquement ──────────────
        upsertContactFromInvoice(inv, clientEmail, clientUser)

        setEmailFeedback({ id: inv.id, ok: true, msg: `Email envoyé à ${clientEmail} · Fiche contact mise à jour` })
      } else {
        throw new Error(data.error ?? 'Erreur serveur')
      }
    } catch (err) {
      setEmailFeedback({
        id: inv.id,
        ok: false,
        msg: err instanceof Error ? err.message : 'Échec de l\'envoi',
      })
    } finally {
      setEmailLoading(null)
    }
  }

  // ── Formulaire création / édition ─────────────────────────────────────────
  if (showForm || editInv) {
    return (
      <InvoiceFormAdmin
        clients={clients}
        allInvoices={invoices}
        initialValues={editInv ?? undefined}
        onSave={editInv ? handleSaveEdit : handleSaveNew}
        onCancel={() => { setShowForm(false); setEditInv(null) }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Facturation</p>
          <h2 className="font-serif text-2xl text-light">Notes d'honoraires</h2>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-xs font-medium bg-gold text-dark-bg px-4 py-2.5 hover:bg-gold/90 transition-colors">
          <Plus size={12} strokeWidth={2} /> Nouvelle note d'honoraires
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gold/10">
        {[
          { label: 'Total factures',   value: String(invoices.length) },
          { label: 'En attente',       value: String(invoices.filter(i => i.status === 'envoyee' || i.status === 'en_retard').length) },
          { label: 'Payées',           value: String(invoices.filter(i => i.status === 'payee').length) },
          { label: 'Chiffre encaissé', value: paidNet > 0 ? fmtAmount(paidNet, 'TND') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-dark-surface p-5 sm:p-6">
            <p className="text-xs text-light/40 uppercase tracking-wide mb-2">{label}</p>
            <p className="font-serif text-xl font-bold text-light">{value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par n°, client…"
            className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'brouillon', 'envoyee', 'payee', 'en_retard'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs font-medium px-3 py-1.5 border transition-colors ${
                filterStatus === s ? 'bg-gold text-dark-bg border-gold' : 'text-light/40 border-gold/15 hover:border-gold/30'
              }`}>
              {s === 'all' ? 'Toutes' : INV_STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-light/40">
          {filtered.length} facture{filtered.length > 1 ? 's' : ''} · Net total : <span className="font-medium text-light">{fmtAmount(totalNet, 'TND')} DT</span>
        </p>
      )}

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="border border-gold/10 px-6 py-12 text-center">
          <Receipt size={28} strokeWidth={1} className="text-light/15 mx-auto mb-3" />
          <p className="text-sm text-light/30">Aucune facture. Créez votre première note d'honoraires.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/10">
          {filtered.map(inv => {
            const { net, retenue } = computeAmounts(inv)
            const { label, cls }  = INV_STATUS_MAP[inv.status]
            return (
              <div key={inv.id} className="bg-dark-surface px-4 sm:px-6 py-4">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-light font-mono">{inv.number}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
                    </div>
                    <p className="text-xs font-medium text-light/65">{inv.clientDisplayName}</p>
                    {inv.clientMF && <p className="text-[10px] text-light/30">MF : {inv.clientMF}</p>}
                    <p className="text-xs text-light/35 mt-0.5">
                      {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="text-right flex-none">
                    <p className="text-sm font-bold text-light">{fmtAmount(net, inv.currency)} DT</p>
                    <p className="text-[10px] text-light/35">Retenue : {fmtAmount(retenue, inv.currency)} DT</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  {/* Statuts */}
                  {(['brouillon', 'envoyee', 'payee', 'en_retard'] as const).map(s => (
                    <button key={s} onClick={() => updateStatus(inv, s)} title={INV_STATUS_MAP[s].label}
                      className={`text-[10px] font-medium px-2 py-1 border transition-colors ${
                        inv.status === s ? 'bg-gold text-dark-bg border-gold' : 'text-light/30 border-gold/10 hover:border-gold/30'
                      }`}>
                      {s === 'brouillon' ? '✎' : s === 'envoyee' ? '✉' : s === 'payee' ? '✓' : '!'}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    {/* Modifier */}
                    <button onClick={() => setEditInv(inv)} title="Modifier"
                      className="text-light/30 hover:text-light p-1.5 transition-colors border border-gold/10 hover:border-gold/25">
                      <Pencil size={12} strokeWidth={1.5} />
                    </button>
                    {/* Envoyer par email */}
                    <button
                      onClick={() => handleSendEmail(inv)}
                      disabled={!!emailLoading}
                      title="Envoyer par email"
                      className={`p-1.5 transition-colors border ${
                        emailLoading === inv.id
                          ? 'border-gold/20 text-gold/40 animate-pulse'
                          : emailFeedback?.id === inv.id && emailFeedback.ok
                          ? 'border-emerald-400/30 text-emerald-400'
                          : 'border-gold/10 text-light/30 hover:text-gold hover:border-gold/25'
                      } disabled:opacity-40`}
                    >
                      {emailFeedback?.id === inv.id && emailFeedback.ok
                        ? <CheckCircle size={12} strokeWidth={1.5} />
                        : <Mail size={12} strokeWidth={1.5} />
                      }
                    </button>
                    {/* PDF */}
                    <button onClick={() => handleDownloadPdf(inv)} disabled={pdfLoading} title="Télécharger PDF"
                      className="text-light/30 hover:text-gold p-1.5 transition-colors border border-gold/10 hover:border-gold/25 disabled:opacity-40">
                      <Download size={12} strokeWidth={1.5} />
                    </button>
                    {/* Supprimer */}
                    <button onClick={() => deleteInvoice(inv)} title="Supprimer"
                      className="text-light/20 hover:text-red-500 p-1.5 transition-colors border border-gold/10 hover:border-red-500/30">
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Feedback email */}
                {emailFeedback?.id === inv.id && (
                  <p className={`text-xs mt-2 px-1 ${emailFeedback.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {emailFeedback.ok ? '✓ ' : '⚠ '}{emailFeedback.msg}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Agenda Admin ─────────────────────────────────────────────────────────────

function AgendaAdmin({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const allRdvs = useMemo(() => getAllRdvs(), [clients])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'rdv' | 'todo'>('rdv')

  // RDV form
  const [showRdvForm, setShowRdvForm] = useState(false)
  const [rdvForm, setRdvForm] = useState({
    clientId: clients[0]?.user.id ?? '',
    title: '', date: new Date().toISOString().split('T')[0],
    time: '10:00', type: 'visio' as Appointment['type'], notes: '',
  })

  // Todo form
  const [showTodoForm, setShowTodoForm] = useState(false)
  const [todoForm, setTodoForm] = useState({
    clientId: clients[0]?.user.id ?? '',
    title: '', priority: 'normale' as Todo['priority'], dueDate: '',
  })

  // All todos
  const allTodos = useMemo(() =>
    clients.flatMap(c => getTodosForClient(c.user.id).map(t => ({ ...t, clientName: c.user.name }))),
    [clients]
  )

  const handleCreateRdv = () => {
    if (!rdvForm.title || !rdvForm.date || !rdvForm.clientId) return
    const newRdv: Appointment = { ...rdvForm, id: crypto.randomUUID() }
    saveRdvForClient(rdvForm.clientId, [...getRdvsForClient(rdvForm.clientId), newRdv])
    // ── Sync automatique dossier ──────────────────────────────────────────────
    setShowRdvForm(false)
    setRdvForm(f => ({ ...f, title: '', notes: '' }))
    onRefresh()
  }

  const handleDeleteRdv = (rdv: Appointment & { clientName: string }) => {
    saveRdvForClient(rdv.clientId, getRdvsForClient(rdv.clientId).filter(r => r.id !== rdv.id))
    onRefresh()
  }

  const handleCreateTodo = () => {
    if (!todoForm.title || !todoForm.clientId) return
    const newTodo: Todo = {
      id: crypto.randomUUID(), title: todoForm.title,
      done: false, priority: todoForm.priority,
      dueDate: todoForm.dueDate || undefined,
      clientId: todoForm.clientId, createdAt: new Date().toISOString(),
    }
    saveTodosForClient(todoForm.clientId, [...getTodosForClient(todoForm.clientId), newTodo])
    // ── Sync automatique dossier ──────────────────────────────────────────────
    setShowTodoForm(false)
    setTodoForm(f => ({ ...f, title: '', dueDate: '' }))
    onRefresh()
  }

  const handleDeleteTodo = (todo: Todo & { clientName: string }) => {
    saveTodosForClient(todo.clientId, getTodosForClient(todo.clientId).filter(t => t.id !== todo.id))
    onRefresh()
  }

  const handleToggleTodo = (todo: Todo & { clientName: string }) => {
    const existing = getTodosForClient(todo.clientId)
    saveTodosForClient(todo.clientId, existing.map(t => t.id === todo.id ? { ...t, done: !t.done } : t))
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Agenda</p>
        <h2 className="font-serif text-2xl text-light">Planning & Tâches</h2>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-gold/10 pb-0">
        {(['rdv', 'todo'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`text-sm font-medium px-4 py-2 border-b-2 transition-colors ${activeSection === s ? 'border-gold text-light' : 'border-transparent text-light/40 hover:text-light'}`}>
            {s === 'rdv' ? `Rendez-vous (${allRdvs.length})` : `To-Do (${allTodos.filter(t => !t.done).length} en cours)`}
          </button>
        ))}
      </div>

      {/* ── RDV section ── */}
      {activeSection === 'rdv' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowRdvForm(v => !v)}
              className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-4 py-2.5 hover:bg-gold/90 transition-colors">
              <Plus size={13} strokeWidth={1.5} /> Nouveau RDV
            </button>
          </div>

          {showRdvForm && (
            <div className="border border-gold/15 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-light">Créer un rendez-vous</p>
                <button onClick={() => setShowRdvForm(false)} className="text-light/30 hover:text-light transition-colors"><X size={14} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Client</label>
                  <select value={rdvForm.clientId} onChange={e => setRdvForm(f => ({ ...f, clientId: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors">
                    {clients.map(c => <option key={c.user.id} value={c.user.id}>{c.user.name}{c.user.company ? ` — ${c.user.company}` : ''}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Titre</label>
                  <input type="text" value={rdvForm.title} onChange={e => setRdvForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Point d'avancement Série A" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Date</label>
                  <input type="date" value={rdvForm.date} onChange={e => setRdvForm(f => ({ ...f, date: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Heure</label>
                  <input type="time" value={rdvForm.time} onChange={e => setRdvForm(f => ({ ...f, time: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Type</label>
                  <select value={rdvForm.type} onChange={e => setRdvForm(f => ({ ...f, type: e.target.value as Appointment['type'] }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold">
                    <option value="visio">Visioconférence</option>
                    <option value="presentiel">Présentiel</option>
                    <option value="telephone">Téléphone</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Notes</label>
                  <input type="text" value={rdvForm.notes} onChange={e => setRdvForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optionnel" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold" />
                </div>
              </div>
              <button onClick={handleCreateRdv} className="self-start bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">Créer le rendez-vous</button>
            </div>
          )}

          <CalendarView appointments={allRdvs} selectedDate={selectedDate} onSelectDate={date => { setSelectedDate(date); setRdvForm(f => ({ ...f, date })) }} />

          <div>
            <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-3">Tous les rendez-vous</p>
            {allRdvs.length === 0 ? (
              <div className="border border-gold/10 px-6 py-8 text-center text-sm text-light/30">Aucun rendez-vous planifié.</div>
            ) : (
              <div className="flex flex-col gap-px bg-gold/10">
                {[...allRdvs].sort((a, b) => a.date.localeCompare(b.date)).map(rdv => (
                  <div key={rdv.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
                    <div className="flex-none text-center w-10">
                      <p className="text-xs font-bold text-light">{new Date(rdv.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric' })}</p>
                      <p className="text-[10px] text-light/40 uppercase">{new Date(rdv.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' })}</p>
                    </div>
                    <div className="w-px h-8 bg-gold/10 flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-light truncate">{rdv.title}</p>
                      <p className="text-xs text-light/40 mt-0.5">{rdv.clientName} · {rdv.time} · {rdv.type === 'visio' ? 'Visio' : rdv.type === 'presentiel' ? 'Présentiel' : 'Tél.'}</p>
                    </div>
                    <button onClick={() => handleDeleteRdv(rdv)} className="flex-none text-light/20 hover:text-red-500 transition-colors p-1"><Trash2 size={13} strokeWidth={1.5} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Todo section ── */}
      {activeSection === 'todo' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowTodoForm(v => !v)}
              className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-4 py-2.5 hover:bg-gold/90 transition-colors">
              <Plus size={13} strokeWidth={1.5} /> Nouvelle tâche
            </button>
          </div>

          {showTodoForm && (
            <div className="border border-gold/15 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-light">Assigner une tâche</p>
                <button onClick={() => setShowTodoForm(false)} className="text-light/30 hover:text-light transition-colors"><X size={14} strokeWidth={1.5} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Client</label>
                  <select value={todoForm.clientId} onChange={e => setTodoForm(f => ({ ...f, clientId: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold">
                    {clients.map(c => <option key={c.user.id} value={c.user.id}>{c.user.name}{c.user.company ? ` — ${c.user.company}` : ''}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Tâche</label>
                  <input type="text" value={todoForm.title} onChange={e => setTodoForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Envoyer les statuts mis à jour" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Priorité</label>
                  <select value={todoForm.priority} onChange={e => setTodoForm(f => ({ ...f, priority: e.target.value as Todo['priority'] }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold">
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Échéance <span className="normal-case text-light/30">(optionnel)</span></label>
                  <input type="date" value={todoForm.dueDate} onChange={e => setTodoForm(f => ({ ...f, dueDate: e.target.value }))} className="border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold" />
                </div>
              </div>
              <button onClick={handleCreateTodo} className="self-start bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">Assigner la tâche</button>
            </div>
          )}

          <TodoList
            todos={allTodos}
            onToggle={id => { const t = allTodos.find(x => x.id === id); if (t) handleToggleTodo(t) }}
            onDelete={id => { const t = allTodos.find(x => x.id === id); if (t) handleDeleteTodo(t) }}
          />
        </>
      )}
    </div>
  )
}

// ─── Rapports Juridiques Admin ────────────────────────────────────────────────

const RAPPORTS_KEY = 'avocat_rapports'

function getRapports(): RapportData[] {
  try { return JSON.parse(localStorage.getItem(RAPPORTS_KEY) ?? '[]') }
  catch { return [] }
}
function saveRapports(list: RapportData[]) {
  localStorage.setItem(RAPPORTS_KEY, JSON.stringify(list))
}

function nextRef(type: RapportTypeId, existing: RapportData[]): string {
  const prefix = RAPPORT_TYPES.find(t => t.id === type)?.prefix ?? 'DOC'
  const year = new Date().getFullYear()
  const same = existing.filter(r => r.reference.startsWith(`${prefix}-${year}-`))
  const next = (same.length + 1).toString().padStart(3, '0')
  return `${prefix}-${year}-${next}`
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  rapport:         FileText,
  avis:            Scale,
  memorandum:      ScrollText,
  opinion_fiscale: Shield,
  note_juridique:  BookOpen,
  consultation:    BookUser,
}

// ── Éditeur de section ───────────────────────────────────────────────────────
// ── Bouton IA rédige ─────────────────────────────────────────────────────────
function AIWriteButton({ onGenerate, label = 'IA rédige' }: { onGenerate: () => Promise<void>; label?: string }) {
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const run = async () => {
    setLoading(true)
    try { await onGenerate(); setOk(true); setTimeout(() => setOk(false), 2500) }
    catch (e) { alert('Erreur IA : ' + (e instanceof Error ? e.message : 'Réessayez')) }
    finally { setLoading(false) }
  }
  return (
    <button onClick={run} disabled={loading}
      className="flex items-center gap-1.5 text-[10px] font-medium border border-gold/20 text-gold/60 hover:text-gold hover:border-gold/40 px-2.5 py-1 transition-colors disabled:opacity-40">
      {loading ? <><Circle size={10} className="animate-spin" /> Génération…</>
       : ok     ? <><CheckCircle size={10} className="text-green-400" /> Inséré</>
                : <><Pencil size={10} strokeWidth={1.5} /> {label}</>}
    </button>
  )
}

// ── Injection rapport → Documents client ─────────────────────────────────────
function injectRapportAsDocument(rapport: RapportData, pdfContent: string): string {
  if (!rapport.clientId) return ''
  const docId = crypto.randomUUID()
  const doc: Document = {
    id:         docId,
    name:       `${rapport.reference} — ${rapport.titre}.txt`,
    size:       pdfContent.length,
    type:       'text/plain',
    uploadedAt: new Date().toISOString(),
    dossierId:  rapport.clientRef,
    content:    `data:text/plain;base64,${btoa(unescape(encodeURIComponent(pdfContent)))}`,
  }
  const existing: Document[] = JSON.parse(localStorage.getItem(`avocat_documents_${rapport.clientId}`) ?? '[]')
  localStorage.setItem(`avocat_documents_${rapport.clientId}`, JSON.stringify([doc, ...existing]))
  return docId
}

// ── Création d'une tâche liée au rapport ─────────────────────────────────────
function createRapportTodo(rapport: RapportData, action: string) {
  if (!rapport.clientId) return
  const todo: Todo = {
    id:        crypto.randomUUID(),
    title:     `${action} — ${rapport.reference} : ${rapport.titre.substring(0, 60)}`,
    done:      false,
    priority:  'urgente',
    dueDate:   rapport.dateEcheance?.substring(0, 10),
    clientId:  rapport.clientId,
    dossierId: rapport.clientRef,
    createdAt: new Date().toISOString(),
  }
  const existing = JSON.parse(localStorage.getItem(`avocat_todos_${rapport.clientId}`) ?? '[]')
  localStorage.setItem(`avocat_todos_${rapport.clientId}`, JSON.stringify([todo, ...existing]))
}

function SectionEditor({
  section, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  section: RapportSection; index: number; total: number
  onChange: (s: RapportSection) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [open, setOpen] = useState(true)
  const labelCls = 'text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-1.5'

  return (
    <div className="border border-gold/15 bg-dark-surface">
      {/* En-tête section */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gold/10">
        <div className="flex flex-col gap-0.5 flex-none">
          <button onClick={onMoveUp} disabled={index === 0} className="text-light/20 hover:text-light disabled:opacity-20 transition-colors"><ChevronUp size={12} /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-light/20 hover:text-light disabled:opacity-20 transition-colors"><ChevronDown size={12} /></button>
        </div>
        <GripVertical size={14} strokeWidth={1.5} className="text-light/20 flex-none" />
        <span className="text-[10px] font-bold text-light/30 tracking-widest uppercase flex-none w-5">{index + 1}</span>
        <input
          type="text"
          value={section.titre}
          onChange={e => onChange({ ...section, titre: e.target.value })}
          placeholder="Titre de la section…"
          className="flex-1 bg-transparent text-sm font-semibold text-light placeholder:text-light/20 focus:outline-none"
        />
        <button onClick={() => setOpen(o => !o)} className="text-light/30 hover:text-light transition-colors p-1">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        <button onClick={onDelete} className="text-light/20 hover:text-red-500 transition-colors p-1">
          <Trash2 size={12} strokeWidth={1.5} />
        </button>
      </div>
      {/* Contenu section */}
      {open && (
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>Contenu</label>
            <AIWriteButton
              onGenerate={async () => {
                if (!section.titre) return
                const text = await callAI(
                  `Tu es un juriste d'affaires senior tunisien. Rédige le contenu de la section "${section.titre}" pour un document juridique professionnel.
Contexte existant : ${section.contenu ? section.contenu.substring(0, 300) : 'section vierge'}.
Écris en français juridique rigoureux, 3-5 paragraphes structurés, sans titres supplémentaires. Uniquement le contenu.`,
                  1200
                )
                onChange({ ...section, contenu: section.contenu ? section.contenu + '\n\n' + text : text })
              }}
            />
          </div>
          <textarea
            value={section.contenu}
            onChange={e => onChange({ ...section, contenu: e.target.value })}
            placeholder="Développez votre analyse juridique ici…&#10;&#10;Citez les textes de loi, la jurisprudence, les références réglementaires."
            rows={6}
            className="w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/30 p-3 resize-y transition-colors"
          />
          <p className="text-[10px] text-light/25">{section.contenu.length} caractères</p>
        </div>
      )}
    </div>
  )
}

// ── Formulaire principal ─────────────────────────────────────────────────────
function RapportForm({
  initial, clients,
  onSave, onCancel,
}: {
  initial?: RapportData
  clients: ClientData[]
  onSave: (r: RapportData) => void
  onCancel: () => void
}) {
  const existing = getRapports()
  const defaultType: RapportTypeId = 'rapport'
  const [type,          setType]          = useState<RapportTypeId>(initial?.type ?? defaultType)
  const [titre,         setTitre]         = useState(initial?.titre ?? '')
  const [objet,         setObjet]         = useState(initial?.objet ?? '')
  const [clientNom,     setClientNom]     = useState(initial?.clientNom ?? '')
  const [clientRef,     setClientRef]     = useState(initial?.clientRef ?? '')
  const [clientMF,      setClientMF]      = useState(initial?.clientMF ?? '')
  const [dateDoc,       setDateDoc]       = useState(initial?.dateDoc ?? new Date().toISOString().slice(0, 10))
  const [confidentiel,  setConfidentiel]  = useState(initial?.confidentiel ?? false)
  const [sections,      setSections]      = useState<RapportSection[]>(
    initial?.sections ?? [{ titre: '', contenu: '' }]
  )
  const [conclusion,    setConclusion]    = useState(initial?.conclusion ?? '')
  const [reservations,  setReservations]  = useState(initial?.reservations ?? '')
  const [clientMode,    setClientMode]    = useState<'select' | 'manual'>(
    initial?.clientNom ? 'manual' : 'select'
  )

  const reference = initial?.reference ?? nextRef(type, existing)

  // Synchroniser clientNom si sélection client existant
  const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = clients.find(c => c.user.id === e.target.value)
    if (found) {
      setClientNom(found.user.name)
      setClientRef(found.dossiers[0]?.titre ?? '')
    }
  }

  const addSection = () => setSections(s => [...s, { titre: '', contenu: '' }])
  const updateSection = (i: number, s: RapportSection) => setSections(prev => prev.map((sec, idx) => idx === i ? s : sec))
  const deleteSection = (i: number) => setSections(prev => prev.filter((_, idx) => idx !== i))
  const moveSection = (i: number, dir: -1 | 1) => {
    setSections(prev => {
      const next = [...prev]
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const handleSave = () => {
    if (!titre.trim() || !clientNom.trim()) return

    // Trouver le clientId correspondant
    const matchedClient = clientMode === 'select'
      ? clients.find(c => c.user.name === clientNom)
      : undefined

    const rapport: RapportData = {
      id:           initial?.id ?? crypto.randomUUID(),
      type, reference, titre, objet, clientNom, clientRef, clientMF,
      clientId:     matchedClient?.user.id ?? initial?.clientId,
      dateDoc, confidentiel,
      sections:     sections.filter(s => s.titre || s.contenu),
      conclusion:   conclusion || undefined,
      reservations: reservations || undefined,
      status:       initial?.status ?? 'draft',
      requestedBy:  initial?.requestedBy ?? 'admin',
      linkedDocId:  initial?.linkedDocId,
      createdAt:    initial?.createdAt ?? new Date().toISOString(),
    }
    onSave(rapport)
  }

  const inputCls = 'w-full border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/25 focus:outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-1.5'

  return (
    <div className="flex flex-col gap-6">
      {/* Navigation retour */}
      <button onClick={onCancel} className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors w-fit">
        <ArrowLeft size={13} strokeWidth={1.5} /> Retour à la liste
      </button>

      {/* Titre page */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">
            {initial ? 'Modifier le document' : 'Nouveau document'}
          </p>
          <h2 className="font-serif text-2xl text-light">
            {initial ? initial.reference : reference}
          </h2>
        </div>
        {/* Confidentialité toggle */}
        <button
          onClick={() => setConfidentiel(c => !c)}
          className={`flex items-center gap-2 text-xs font-medium px-4 py-2.5 border transition-colors ${
            confidentiel
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-gold/20 text-light/40 hover:text-light hover:border-gold/40'
          }`}
        >
          {confidentiel ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />}
          {confidentiel ? 'Confidentiel' : 'Non confidentiel'}
        </button>
      </div>

      {/* ── Section 1 : Type + Identification ─────────────────────────────── */}
      <div className="border border-gold/15 bg-dark-surface p-6">
        <p className="text-[10px] font-bold text-light/30 tracking-[0.25em] uppercase mb-5">Identification du document</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Type de document */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Type de document</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RAPPORT_TYPES.map(t => {
                const Icon = TYPE_ICONS[t.id] ?? FileText
                return (
                  <button key={t.id} onClick={() => setType(t.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 border text-xs font-medium transition-colors text-left ${
                      type === t.id
                        ? 'border-gold bg-gold/10 text-light'
                        : 'border-gold/10 text-light/40 hover:border-gold/30 hover:text-light/70'
                    }`}>
                    <Icon size={13} strokeWidth={1.5} className={type === t.id ? 'text-gold' : 'text-light/25'} />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Référence (auto) */}
          <div>
            <label className={labelCls}>Référence (auto)</label>
            <p className="py-2 text-sm font-mono text-gold/80 border-b border-gold/10">{reference}</p>
          </div>

          {/* Date */}
          <div>
            <label className={labelCls}>Date du document</label>
            <input type="date" value={dateDoc} onChange={e => setDateDoc(e.target.value)} className={inputCls} />
          </div>

          {/* Titre */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Titre *</label>
            <input type="text" value={titre} onChange={e => setTitre(e.target.value)}
              placeholder="Ex : Analyse juridique de la restructuration du capital social" className={inputCls} />
          </div>

          {/* Objet */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Objet / Résumé</label>
            <input type="text" value={objet} onChange={e => setObjet(e.target.value)}
              placeholder="Synthèse de l'objet de ce document en une phrase" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Section 2 : Client + Dossier ──────────────────────────────────── */}
      <div className="border border-gold/15 bg-dark-surface p-6">
        <p className="text-[10px] font-bold text-light/30 tracking-[0.25em] uppercase mb-5">Destinataire</p>

        <div className="flex gap-3 mb-5">
          {(['select', 'manual'] as const).map(m => (
            <button key={m} onClick={() => setClientMode(m)}
              className={`text-xs px-3 py-1.5 border transition-colors ${
                clientMode === m
                  ? 'border-gold/40 text-light bg-gold/5'
                  : 'border-gold/10 text-light/30 hover:text-light/60'
              }`}>
              {m === 'select' ? 'Client enregistré' : 'Saisie manuelle'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {clientMode === 'select' ? (
            <div>
              <label className={labelCls}>Choisir un client</label>
              <select onChange={handleSelectClient} className={`${inputCls} bg-dark-surface`}>
                <option value="">— Sélectionner —</option>
                {clients.map(c => (
                  <option key={c.user.id} value={c.user.id}>{c.user.name} {c.user.company ? `— ${c.user.company}` : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Nom du destinataire *</label>
              <input type="text" value={clientNom} onChange={e => setClientNom(e.target.value)}
                placeholder="Entreprise ou nom complet" className={inputCls} />
            </div>
          )}

          <div>
            <label className={labelCls}>Référence dossier</label>
            <input type="text" value={clientRef} onChange={e => setClientRef(e.target.value)}
              placeholder="Ex : DOS-2026-001" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Matricule fiscal client <span className="normal-case text-light/25">(optionnel)</span></label>
            <input type="text" value={clientMF} onChange={e => setClientMF(e.target.value)}
              placeholder="000/X/X/000000/X" className={inputCls} />
          </div>
        </div>
      </div>

      {/* ── Section 3 : Corps du document ─────────────────────────────────── */}
      <div className="border border-gold/15 bg-dark-surface p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[10px] font-bold text-light/30 tracking-[0.25em] uppercase">
            Sections du document <span className="text-light/20">({sections.length})</span>
          </p>
          <button onClick={addSection}
            className="flex items-center gap-2 text-xs text-gold/70 hover:text-gold border border-gold/20 hover:border-gold/40 px-3 py-1.5 transition-colors">
            <FilePlus size={12} strokeWidth={1.5} /> Ajouter une section
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {sections.map((sec, i) => (
            <SectionEditor key={i} section={sec} index={i} total={sections.length}
              onChange={s => updateSection(i, s)}
              onDelete={() => deleteSection(i)}
              onMoveUp={() => moveSection(i, -1)}
              onMoveDown={() => moveSection(i, 1)}
            />
          ))}
          {sections.length === 0 && (
            <button onClick={addSection}
              className="border border-dashed border-gold/15 py-8 text-xs text-light/25 hover:text-light/50 hover:border-gold/30 transition-colors flex flex-col items-center gap-2">
              <FilePlus size={20} strokeWidth={1} /> Cliquez pour ajouter la première section
            </button>
          )}
        </div>
      </div>

      {/* ── Section 4 : Conclusion + Réserves ─────────────────────────────── */}
      <div className="border border-gold/15 bg-dark-surface p-6">
        <p className="text-[10px] font-bold text-light/30 tracking-[0.25em] uppercase mb-5">Conclusion & Réserves</p>
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelCls}>Conclusion</label>
            <textarea value={conclusion} onChange={e => setConclusion(e.target.value)}
              placeholder="Synthèse finale de l'analyse, recommandations, conclusions juridiques…"
              rows={4}
              className="w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/30 p-3 resize-y transition-colors" />
          </div>
          <div>
            <label className={labelCls}>Réserves et limites <span className="normal-case text-light/25">(optionnel)</span></label>
            <textarea value={reservations} onChange={e => setReservations(e.target.value)}
              placeholder="Le présent document est établi sur la base des informations communiquées. Toute modification substantielle des faits ou de la législation applicable pourrait en modifier les conclusions…"
              rows={3}
              className="w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/30 p-3 resize-y transition-colors" />
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={handleSave} disabled={!titre.trim() || !clientNom.trim()}
          className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-40">
          <Save size={13} strokeWidth={1.5} /> Enregistrer le document
        </button>
        <button onClick={onCancel} className="text-xs text-light/35 hover:text-light transition-colors px-4 py-3">
          Annuler
        </button>
      </div>
    </div>
  )
}

// ── Liste des rapports ────────────────────────────────────────────────────────
function RapportsAdmin({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const [rapports,    setRapports]    = useState<RapportData[]>(getRapports)
  const [requests,    setRequests]    = useState<RapportRequest[]>(() => {
    try { return JSON.parse(localStorage.getItem(RAPPORT_REQUESTS_KEY) ?? '[]') } catch { return [] }
  })
  const [view,        setView]        = useState<'list' | 'form' | 'preview'>('list')
  const [editing,     setEditing]     = useState<RapportData | null>(null)
  const [preview,     setPreview]     = useState<RapportData | null>(null)
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState<RapportTypeId | 'all'>('all')
  const [statusFilter,setStatusFilter]= useState<string>('all')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [injecting,   setInjecting]   = useState<string | null>(null)
  const [feedback,    setFeedback]    = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const pendingRequests = requests.filter(r => !r.processed)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rapports
      .filter(r => typeFilter === 'all' || r.type === typeFilter)
      .filter(r => statusFilter === 'all' || r.status === statusFilter)
      .filter(r =>
        r.titre.toLowerCase().includes(q) ||
        r.clientNom.toLowerCase().includes(q) ||
        r.reference.toLowerCase().includes(q)
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [rapports, search, typeFilter, statusFilter])

  const handleSave = (rapport: RapportData) => {
    const isNew = !rapports.some(r => r.id === rapport.id)
    const updated = isNew
      ? [rapport, ...rapports]
      : rapports.map(r => r.id === rapport.id ? rapport : r)
    setRapports(updated)
    saveRapports(updated)
    // Créer un todo si nouveau rapport avec client lié
    if (isNew && rapport.clientId) {
      createRapportTodo(rapport, 'Réviser et envoyer')
    }
    setView('list')
    setEditing(null)
    onRefresh()
  }

  // ── Injecter dans Documents + marquer comme envoyé ──────────────────────────
  const handleInjectAndSend = async (rapport: RapportData) => {
    if (!rapport.clientId) {
      setFeedback({ id: rapport.id, ok: false, msg: 'Aucun compte client lié — sélectionnez un client enregistré.' })
      return
    }
    setInjecting(rapport.id)
    try {
      // Générer contenu texte du rapport
      const content = [
        `${rapport.reference} — ${rapport.titre}`,
        `Date : ${rapport.dateDoc}`,
        `Client : ${rapport.clientNom}`,
        rapport.clientRef ? `Dossier : ${rapport.clientRef}` : '',
        '',
        rapport.objet ? `OBJET : ${rapport.objet}` : '',
        '',
        ...rapport.sections.map((s, i) => `${i + 1}. ${s.titre}\n\n${s.contenu}`),
        '',
        rapport.conclusion ? `CONCLUSION :\n${rapport.conclusion}` : '',
        rapport.reservations ? `\nRÉSERVES :\n${rapport.reservations}` : '',
      ].filter(Boolean).join('\n')

      const docId = injectRapportAsDocument(rapport, content)

      // Mettre à jour le rapport avec status envoyé + linkedDocId
      const updated = rapports.map(r => r.id === rapport.id
        ? { ...r, status: 'sent' as const, linkedDocId: docId }
        : r
      )
      setRapports(updated)
      saveRapports(updated)

      // Créer un todo "Document envoyé au client"
      createRapportTodo({ ...rapport, status: 'sent', linkedDocId: docId }, 'Document transmis — archiver')

      setFeedback({ id: rapport.id, ok: true, msg: `Injecté dans l'espace client de ${rapport.clientNom} ✓` })
      setTimeout(() => setFeedback(null), 4000)
      onRefresh()
    } catch (e) {
      setFeedback({ id: rapport.id, ok: false, msg: 'Erreur d\'injection : ' + (e instanceof Error ? e.message : '') })
    } finally {
      setInjecting(null)
    }
  }

  // ── Traiter une demande client → ouvrir le formulaire pré-rempli ────────────
  const handleProcessRequest = (req: RapportRequest) => {
    const client = clients.find(c => c.user.id === req.clientId)
    const base: Partial<RapportData> = {
      type:        req.type,
      titre:       req.titre,
      objet:       req.objet,
      clientNom:   req.clientName,
      clientId:    req.clientId,
      clientRef:   client?.dossiers[0]?.titre,
      status:      'in_progress',
      requestedBy: req.source,
      sections:    [],
      confidentiel:false,
      dateDoc:     new Date().toISOString().slice(0, 10),
      createdAt:   new Date().toISOString(),
    }
    // Marquer la demande comme traitée
    const updatedReqs = requests.map(r => r.id === req.id ? { ...r, processed: true } : r)
    setRequests(updatedReqs)
    localStorage.setItem(RAPPORT_REQUESTS_KEY, JSON.stringify(updatedReqs))
    setEditing(base as RapportData)
    setView('form')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce document définitivement ?')) return
    const updated = rapports.filter(r => r.id !== id)
    setRapports(updated)
    saveRapports(updated)
    onRefresh()
  }

  const handleDownload = async (rapport: RapportData) => {
    setDownloading(rapport.id)
    try { await downloadRapportPdf(rapport) }
    finally { setDownloading(null) }
  }

  if (view === 'form') {
    return (
      <RapportForm
        initial={editing ?? undefined}
        clients={clients}
        onSave={handleSave}
        onCancel={() => { setView('list'); setEditing(null) }}
      />
    )
  }

  if (view === 'preview' && preview) {
    return (
      <div className="flex flex-col gap-6">
        <button onClick={() => { setView('list'); setPreview(null) }}
          className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors w-fit">
          <ArrowLeft size={13} strokeWidth={1.5} /> Retour
        </button>
        {/* Fiche récap avant PDF */}
        <div className="border border-gold/15 bg-dark-surface p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-1">{preview.reference}</p>
              <h2 className="font-serif text-xl text-light">{preview.titre}</h2>
              <p className="text-xs text-light/40 mt-1">{preview.objet}</p>
            </div>
            {preview.confidentiel && (
              <span className="text-[9px] font-bold tracking-widest uppercase text-red-400 border border-red-500/30 px-2 py-1">CONFIDENTIEL</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div><p className="text-light/30 mb-1">Destinataire</p><p className="text-light font-medium">{preview.clientNom}</p></div>
            <div><p className="text-light/30 mb-1">Dossier</p><p className="text-light font-medium">{preview.clientRef || '—'}</p></div>
            <div><p className="text-light/30 mb-1">Date</p><p className="text-light font-medium">{new Date(preview.dateDoc).toLocaleDateString('fr-FR')}</p></div>
            <div><p className="text-light/30 mb-1">Sections</p><p className="text-light font-medium">{preview.sections.length}</p></div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-gold/10">
            <button onClick={() => handleDownload(preview)} disabled={downloading === preview.id}
              className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-50">
              {downloading === preview.id
                ? <><Circle size={12} className="animate-spin" /> Génération…</>
                : <><Download size={12} strokeWidth={1.5} /> Télécharger PDF</>}
            </button>
            <button onClick={() => { setEditing(preview); setView('form') }}
              className="flex items-center gap-2 text-xs border border-gold/20 text-light/50 hover:text-light hover:border-gold/40 px-4 py-2.5 transition-colors">
              <Pencil size={12} strokeWidth={1.5} /> Modifier
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Vue liste ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Documents juridiques</p>
          <h2 className="font-serif text-2xl text-light">Rapports & Avis</h2>
          <p className="text-xs text-light/35 mt-1">Papier à lettres complet — cachet fiscal MF : 000/P/A/834881/F</p>
        </div>
        <button onClick={() => { setEditing(null); setView('form') }}
          className="flex items-center gap-2 text-xs font-medium bg-gold text-dark-bg px-4 py-2.5 hover:bg-gold/90 transition-colors">
          <Plus size={13} strokeWidth={1.5} /> Nouveau document
        </button>
      </div>

      {/* ── Demandes en attente ─────────────────────────────────────────────── */}
      {pendingRequests.length > 0 && (
        <div className="border border-amber-500/20 bg-amber-500/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} strokeWidth={1.5} className="text-amber-400" />
            <p className="text-xs font-bold text-amber-400 tracking-widest uppercase">
              {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente de traitement
            </p>
          </div>
          {pendingRequests.map(req => {
            const srcLabel = req.source === 'client' ? 'Espace client' : req.source === 'email' ? 'Email' : 'Messagerie'
            return (
              <div key={req.id} className="flex items-start justify-between gap-4 bg-dark-surface px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-amber-400/70 border border-amber-500/20 px-1.5 py-0.5 uppercase tracking-widest">{srcLabel}</span>
                    <span className="text-[9px] text-light/30">{new Date(req.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm font-medium text-light">{req.titre || '(sans titre)'}</p>
                  <p className="text-xs text-light/40">{req.clientName} · {RAPPORT_TYPES.find(t => t.id === req.type)?.label}</p>
                  {req.objet && <p className="text-xs text-light/30 mt-0.5 italic">{req.objet}</p>}
                </div>
                <button onClick={() => handleProcessRequest(req)}
                  className="flex items-center gap-1.5 text-xs bg-gold text-dark-bg px-3 py-2 hover:bg-gold/90 transition-colors flex-none font-medium">
                  <FilePlus size={11} strokeWidth={1.5} /> Traiter
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Feedback injection */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 text-xs border ${feedback.ok ? 'border-green-500/20 bg-green-500/8 text-green-400' : 'border-red-500/20 bg-red-500/8 text-red-400'}`}>
          {feedback.ok ? <CheckCircle size={12} strokeWidth={1.5} /> : <AlertCircle size={12} strokeWidth={1.5} />}
          {feedback.msg}
        </div>
      )}

      {/* Filtres type + statut */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className={`text-xs px-3 py-1.5 border transition-colors ${typeFilter === 'all' ? 'border-gold/50 text-light bg-gold/8' : 'border-gold/10 text-light/30 hover:text-light/60'}`}>Tous types</button>
        {RAPPORT_TYPES.map(t => (
          <button key={t.id} onClick={() => setTypeFilter(t.id)} className={`text-xs px-3 py-1.5 border transition-colors ${typeFilter === t.id ? 'border-gold/50 text-light bg-gold/8' : 'border-gold/10 text-light/30 hover:text-light/60'}`}>{t.label}</button>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {([['all','Tous'],[ 'draft','Brouillon'],['in_progress','En cours'],['pending_request','Demandé'],['sent','Envoyé']]) .map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)} className={`text-xs px-3 py-1 border transition-colors ${statusFilter === val ? 'border-gold/40 text-light' : 'border-gold/10 text-light/25 hover:text-light/50'}`}>{label}</button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par titre, client, référence…"
          className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
      </div>

      <p className="text-xs text-light/35">{filtered.length} document{filtered.length > 1 ? 's' : ''}</p>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="border border-gold/10 py-16 flex flex-col items-center gap-4">
          <Scale size={32} strokeWidth={1} className="text-light/15" />
          <div className="text-center px-6">
            <p className="text-sm font-medium text-light/40 mb-1">Aucun document</p>
            <p className="text-xs text-light/25 max-w-xs">Créez votre premier rapport juridique, avis ou mémorandum avec papier à lettres et cachet fiscal.</p>
          </div>
          <button onClick={() => { setEditing(null); setView('form') }}
            className="flex items-center gap-2 text-xs bg-gold text-dark-bg px-4 py-2.5 hover:bg-gold/90 transition-colors">
            <Plus size={13} strokeWidth={1.5} /> Nouveau document
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/8">
          {filtered.map(rapport => {
            const Icon = TYPE_ICONS[rapport.type] ?? FileText
            const typeLabel = RAPPORT_TYPES.find(t => t.id === rapport.type)?.label ?? rapport.type
            return (
              <div key={rapport.id}
                className="bg-dark-surface px-4 sm:px-6 py-5 flex items-center gap-4 hover:bg-dark-card transition-colors group">
                {/* Icône type */}
                <div className="w-9 h-9 border border-gold/15 flex items-center justify-center flex-none bg-dark-bg">
                  <Icon size={15} strokeWidth={1.5} className="text-gold/50" />
                </div>

                {/* Info principale */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-[9px] font-bold text-gold/50 tracking-widest uppercase">{typeLabel}</p>
                    <span className="text-light/15 text-[9px]">·</span>
                    <p className="text-[9px] text-light/30 font-mono">{rapport.reference}</p>
                    {rapport.confidentiel && (
                      <span className="text-[8px] font-bold text-red-400/70 border border-red-500/20 px-1.5 py-0.5 tracking-widest uppercase">Confidentiel</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-light truncate">{rapport.titre}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-light/40">{rapport.clientNom}</p>
                    {rapport.clientRef && (
                      <>
                        <span className="text-light/15 text-xs">·</span>
                        <p className="text-xs text-light/30">{rapport.clientRef}</p>
                      </>
                    )}
                    <span className="text-light/15 text-xs">·</span>
                    <p className="text-xs text-light/30">{new Date(rapport.dateDoc).toLocaleDateString('fr-FR')}</p>
                    <span className="text-light/15 text-xs">·</span>
                    <p className="text-xs text-light/25">{rapport.sections.length} section{rapport.sections.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setPreview(rapport); setView('preview') }} title="Aperçu"
                    className="text-light/30 hover:text-light p-1.5 border border-gold/10 hover:border-gold/30 transition-colors">
                    <Eye size={12} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => handleDownload(rapport)} disabled={downloading === rapport.id} title="Télécharger PDF"
                    className="text-light/30 hover:text-gold p-1.5 border border-gold/10 hover:border-gold/30 transition-colors disabled:opacity-40">
                    {downloading === rapport.id ? <Circle size={12} className="animate-spin" /> : <Download size={12} strokeWidth={1.5} />}
                  </button>
                  {rapport.status !== 'sent' && (
                    <button onClick={() => handleInjectAndSend(rapport)} disabled={injecting === rapport.id || !rapport.clientId} title="Injecter dans l'espace client"
                      className="text-light/30 hover:text-emerald-400 p-1.5 border border-gold/10 hover:border-emerald-500/30 transition-colors disabled:opacity-30"
                      style={{ display: 'flex', alignItems: 'center' }}>
                      {injecting === rapport.id ? <Circle size={12} className="animate-spin" /> : <FileUp size={12} strokeWidth={1.5} />}
                    </button>
                  )}
                  {rapport.status === 'sent' && (
                    <span title="Document transmis au client" className="p-1.5 text-emerald-400/60">
                      <CheckCircle size={12} strokeWidth={1.5} />
                    </span>
                  )}
                  <button onClick={() => { setEditing(rapport); setView('form') }} title="Modifier"
                    className="text-light/30 hover:text-light p-1.5 border border-gold/10 hover:border-gold/30 transition-colors">
                    <Pencil size={12} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => handleDelete(rapport.id)} title="Supprimer"
                    className="text-light/20 hover:text-red-500 p-1.5 border border-gold/10 hover:border-red-500/30 transition-colors">
                    <Trash2 size={12} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Contacts Admin ───────────────────────────────────────────────────────────

function getContacts(): ContactEntry[] {
  try { return JSON.parse(localStorage.getItem(CONTACTS_KEY) ?? '[]') }
  catch { return [] }
}
function saveContacts(contacts: ContactEntry[]) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts))
}

function ContactsAdmin({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const [contacts, setContacts] = useState<ContactEntry[]>(() => {
    // Fusionner contacts manuels + contacts auto-générés depuis les clients enregistrés
    const manual = getContacts()
    const manualClientIds = new Set(manual.filter(c => c.clientId).map(c => c.clientId))

    // Auto-dériver les clients enregistrés non présents dans les contacts manuels
    const autoContacts: ContactEntry[] = clients
      .filter(c => !manualClientIds.has(c.user.id))
      .map(c => ({
        id: `auto_${c.user.id}`,
        nom: c.user.name,
        email: c.user.email,
        societe: c.user.company,
        clientId: c.user.id,
        dossierRef: c.dossiers.length > 0 ? c.dossiers.map(d => d.titre).join(', ') : undefined,
        createdAt: new Date().toISOString(),
      }))

    return [...autoContacts, ...manual]
  })

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editContact, setEditContact] = useState<ContactEntry | null>(null)

  const emptyForm: Omit<ContactEntry, 'id' | 'createdAt'> = {
    nom: '', email: '', telephone: '', adresse: '', societe: '', dossierRef: '', clientId: '', notes: '',
  }
  const [form, setForm] = useState<Omit<ContactEntry, 'id' | 'createdAt'>>(emptyForm)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.telephone ?? '').includes(q) ||
      (c.societe ?? '').toLowerCase().includes(q) ||
      (c.dossierRef ?? '').toLowerCase().includes(q)
    )
  }, [contacts, search])

  const openNew = () => {
    setForm(emptyForm)
    setEditContact(null)
    setShowForm(true)
  }

  const openEdit = (c: ContactEntry) => {
    setForm({ nom: c.nom, email: c.email ?? '', telephone: c.telephone ?? '', adresse: c.adresse ?? '', societe: c.societe ?? '', dossierRef: c.dossierRef ?? '', clientId: c.clientId ?? '', notes: c.notes ?? '' })
    setEditContact(c)
    setShowForm(true)
  }

  const handleSave = () => {
    if (!form.nom.trim()) return
    if (editContact) {
      // Mise à jour
      const updated = contacts.map(c => c.id === editContact.id ? { ...c, ...form } : c)
      setContacts(updated)
      // Ne sauvegarder que les contacts manuels (pas les auto-dérivés)
      saveContacts(updated.filter(c => !c.id.startsWith('auto_')))
    } else {
      const newContact: ContactEntry = { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
      const updated = [newContact, ...contacts]
      setContacts(updated)
      saveContacts(updated.filter(c => !c.id.startsWith('auto_')))
    }
    setShowForm(false)
    setEditContact(null)
    setForm(emptyForm)
    onRefresh()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    const updated = contacts.filter(c => c.id !== id)
    setContacts(updated)
    saveContacts(updated.filter(c => !c.id.startsWith('auto_')))
    onRefresh()
  }

  const inputCls = 'w-full border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/25 focus:outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-1.5'

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Répertoire</p>
          <h2 className="font-serif text-2xl text-light">Contacts clients</h2>
          <p className="text-xs text-light/35 mt-1">Coordonnées, références dossiers et historique</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 text-xs font-medium bg-gold text-dark-bg px-4 py-2.5 hover:bg-gold/90 transition-colors">
          <UserPlus size={13} strokeWidth={1.5} /> Ajouter un contact
        </button>
      </div>

      {/* Formulaire ajout / édition */}
      {showForm && (
        <div className="border border-gold/20 bg-dark-surface p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-light">{editContact ? 'Modifier le contact' : 'Nouveau contact'}</p>
            <button onClick={() => setShowForm(false)} className="text-light/30 hover:text-light transition-colors"><X size={14} strokeWidth={1.5} /></button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom */}
            <div>
              <label className={labelCls}>Nom complet / Raison sociale *</label>
              <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder="Ahmed Ben Ali" className={inputCls} />
            </div>
            {/* Société */}
            <div>
              <label className={labelCls}>Société <span className="normal-case text-light/30">(optionnel)</span></label>
              <input type="text" value={form.societe} onChange={e => setForm(f => ({ ...f, societe: e.target.value }))}
                placeholder="Startup Tunisie SARL" className={inputCls} />
            </div>
            {/* Email */}
            <div>
              <label className={labelCls}>
                <AtSign size={10} className="inline mr-1 -mt-0.5" />
                Email
              </label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="client@entreprise.com" className={inputCls} />
            </div>
            {/* Téléphone */}
            <div>
              <label className={labelCls}>
                <Phone size={10} className="inline mr-1 -mt-0.5" />
                Téléphone
              </label>
              <input type="tel" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                placeholder="+216 XX XXX XXX" className={inputCls} />
            </div>
            {/* Adresse */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                <MapPin size={10} className="inline mr-1 -mt-0.5" />
                Adresse
              </label>
              <input type="text" value={form.adresse} onChange={e => setForm(f => ({ ...f, adresse: e.target.value }))}
                placeholder="Rue, ville, code postal" className={inputCls} />
            </div>
            {/* Référence dossier */}
            <div className="sm:col-span-2">
              <label className={labelCls}>
                <FolderOpen size={10} className="inline mr-1 -mt-0.5" />
                Référence dossier(s)
              </label>
              <input type="text" value={form.dossierRef} onChange={e => setForm(f => ({ ...f, dossierRef: e.target.value }))}
                placeholder="Ex : DOS-2026-001 · Levée de fonds Série A" className={inputCls} />
            </div>
            {/* Notes */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Notes internes</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Informations complémentaires…" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={!form.nom.trim()}
              className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-40">
              <Save size={12} strokeWidth={1.5} /> {editContact ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-xs text-light/40 hover:text-light transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, téléphone, dossier…"
          className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
      </div>

      {/* Compteur */}
      <p className="text-xs text-light/35">{filtered.length} contact{filtered.length > 1 ? 's' : ''}</p>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="border border-gold/10 py-16 flex flex-col items-center gap-4">
          <BookUser size={32} strokeWidth={1} className="text-light/15" />
          <div className="text-center px-6">
            <p className="text-sm font-medium text-light/40 mb-1">Aucun contact</p>
            <p className="text-xs text-light/25 leading-relaxed max-w-xs">
              Les clients enregistrés apparaissent automatiquement. Ajoutez des contacts manuellement pour les clients externes.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/8">
          {filtered.map(contact => (
            <div key={contact.id} className="bg-dark-surface px-4 sm:px-6 py-5 flex items-start gap-4 hover:bg-dark-card transition-colors group">
              {/* Avatar initiales */}
              <div className="w-9 h-9 bg-dark-bg border border-gold/15 flex items-center justify-center flex-none mt-0.5">
                <span className="text-xs font-semibold text-light/50">
                  {contact.nom.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* Nom + Société */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-light">{contact.nom}</p>
                  {contact.id.startsWith('auto_') && (
                    <span className="text-[9px] font-medium text-blue-400/70 border border-blue-400/20 px-1.5 py-0.5 tracking-widest uppercase">Enregistré</span>
                  )}
                  {!contact.id.startsWith('auto_') && !contact.clientId && (
                    <span className="text-[9px] font-medium text-gold/60 border border-gold/20 px-1.5 py-0.5 tracking-widest uppercase">Manuel</span>
                  )}
                </div>
                {contact.societe && (
                  <p className="text-xs text-light/45 mb-2 flex items-center gap-1">
                    <Building2 size={10} strokeWidth={1.5} className="text-light/25 flex-none" /> {contact.societe}
                  </p>
                )}

                {/* Coordonnées */}
                <div className="flex flex-col gap-1.5">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-xs text-light/55 hover:text-gold transition-colors w-fit">
                      <AtSign size={11} strokeWidth={1.5} className="text-light/30 flex-none" />
                      {contact.email}
                    </a>
                  )}
                  {contact.telephone && (
                    <a href={`tel:${contact.telephone}`}
                      className="flex items-center gap-2 text-xs text-light/55 hover:text-gold transition-colors w-fit">
                      <Phone size={11} strokeWidth={1.5} className="text-light/30 flex-none" />
                      {contact.telephone}
                    </a>
                  )}
                  {contact.adresse && (
                    <p className="flex items-start gap-2 text-xs text-light/40">
                      <MapPin size={11} strokeWidth={1.5} className="text-light/25 flex-none mt-0.5" />
                      {contact.adresse}
                    </p>
                  )}
                  {contact.dossierRef && (
                    <p className="flex items-center gap-2 text-xs text-gold/55">
                      <FolderOpen size={11} strokeWidth={1.5} className="text-gold/35 flex-none" />
                      {contact.dossierRef}
                    </p>
                  )}
                  {contact.notes && (
                    <p className="text-xs text-light/30 italic mt-0.5">{contact.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-none opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(contact)} title="Modifier"
                  className="text-light/30 hover:text-light p-1.5 border border-gold/10 hover:border-gold/30 transition-colors">
                  <Pencil size={12} strokeWidth={1.5} />
                </button>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} title="Envoyer un email"
                    className="text-light/30 hover:text-gold p-1.5 border border-gold/10 hover:border-gold/30 transition-colors inline-flex items-center">
                    <Mail size={12} strokeWidth={1.5} />
                  </a>
                )}
                <button onClick={() => handleDelete(contact.id)} title="Supprimer"
                  className="text-light/20 hover:text-red-500 p-1.5 border border-gold/10 hover:border-red-500/30 transition-colors">
                  <Trash2 size={12} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

// ─── AFRB Admin ───────────────────────────────────────────────────────────────

const RISK_COLORS_ADMIN: Record<string, string> = {
  'Faible':   'text-emerald-400 border-emerald-500/25 bg-emerald-500/8',
  'Modéré':  'text-amber-400 border-amber-500/25 bg-amber-500/8',
  'Élevé':   'text-orange-400 border-orange-500/25 bg-orange-500/8',
  'Critique': 'text-red-400 border-red-500/30 bg-red-500/10',
}

function riskCls(level: string) {
  const key = Object.keys(RISK_COLORS_ADMIN).find(k => level?.includes(k)) ?? 'Modéré'
  return RISK_COLORS_ADMIN[key]
}

// ── Envoi email AFRB admin ────────────────────────────────────────────────────
function AdminSendAFRBEmail({ analysis }: { analysis: AFRBAnalysis }) {
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [feedback, setFeedback] = useState<{ok: boolean; msg: string} | null>(null)

  const send = async () => {
    if (!email.trim()) return
    setLoading(true); setFeedback(null)
    try {
      const pdfBase64 = await generateAFRBBase64(analysis)
      const res = await fetch('/api/send-afrb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: email.trim(),
          clientName: analysis.clientName,
          riskLevel: analysis.result?.risk_matrix.overall_risk_level ?? '—',
          pdfBase64,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFeedback({ ok: true, msg: `Envoyé à ${email.trim()}` })
    } catch (e) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : 'Erreur' })
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-[10px] text-light/30 uppercase tracking-widest">Envoyer le rapport par email</p>
      <div className="flex gap-2 items-center">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@client.com"
          className="flex-1 min-w-0 border border-gold/20 bg-dark-bg py-2 px-3 text-sm text-light placeholder:text-light/25 focus:outline-none focus:border-gold/50 transition-colors"
        />
        <button
          onClick={send}
          disabled={loading || !email.trim()}
          className="flex items-center gap-2 text-xs font-semibold bg-dark-surface border border-gold/30 text-gold hover:bg-gold hover:text-dark-bg px-4 py-2 transition-colors disabled:opacity-40 whitespace-nowrap flex-none"
        >
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Envoi…</>
            : <><Mail size={12} strokeWidth={1.5} /> Envoyer</>}
        </button>
      </div>
      {feedback && (
        <p className={`text-xs px-3 py-2 border ${feedback.ok
          ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/8'
          : 'text-red-400 border-red-500/20 bg-red-500/8'}`}>
          {feedback.ok ? '✓ ' : '✗ '}{feedback.msg}
        </p>
      )}
    </div>
  )
}

function AFRBAdmin({ clients: _clients }: { clients: ClientData[] }) {
  const [analyses, setAnalyses] = useState<AFRBAnalysis[]>(getAFRBAnalyses)
  const [selected, setSelected] = useState<AFRBAnalysis | null>(null)
  const [search,   setSearch]   = useState('')
  const [copied,   setCopied]   = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return analyses.filter(a =>
      a.clientName.toLowerCase().includes(q) ||
      a.scenario.toLowerCase().includes(q) ||
      (a.result?.risk_matrix.overall_risk_level ?? '').toLowerCase().includes(q)
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [analyses, search])

  const copyJSON = (a: AFRBAnalysis) => {
    navigator.clipboard.writeText(JSON.stringify(a.result, null, 2))
    setCopied(a.id); setTimeout(() => setCopied(''), 2000)
  }

  const deleteAnalysis = (id: string) => {
    if (!confirm('Supprimer cette analyse ?')) return
    const updated = analyses.filter(a => a.id !== id)
    setAnalyses(updated)
    localStorage.setItem(AFRB_KEY, JSON.stringify(updated))
  }

  if (selected) return (
    <div className="flex flex-col gap-6">
      <button onClick={() => setSelected(null)}
        className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors w-fit">
        <ArrowLeft size={13} strokeWidth={1.5} /> Retour à la liste
      </button>
      <div className="border border-gold/15 bg-dark-surface p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] text-light/30 uppercase tracking-widest mb-1">
              {selected.clientName} · {new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-sm text-light/70 leading-relaxed">{selected.scenario.substring(0, 200)}{selected.scenario.length > 200 ? '…' : ''}</p>
          </div>
          {selected.result && (
            <span className={`text-[10px] font-bold border px-2 py-1 flex-none ${riskCls(selected.result.risk_matrix.overall_risk_level)}`}>
              {selected.result.risk_matrix.overall_risk_level}
            </span>
          )}
        </div>
        <button onClick={() => copyJSON(selected)}
          className="flex items-center gap-2 text-xs text-light/40 hover:text-light border border-gold/15 px-3 py-2 w-fit transition-colors">
          {copied === selected.id ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier JSON</>}
        </button>
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={() => downloadAFRBReport(selected)}
            className="flex items-center gap-2 text-xs bg-gold text-dark-bg px-4 py-2.5 hover:bg-gold/90 transition-colors font-semibold w-fit"
          >
            <Download size={12} strokeWidth={1.5} /> Télécharger PDF
          </button>
          <AdminSendAFRBEmail analysis={selected} />
        </div>
      </div>

      {selected.result && (
        <div className="flex flex-col gap-3">
          {/* Résumé */}
          {[
            ['Contexte', selected.result.case_context_summary],
            ['Observations', selected.result.observations],
            ['Inférences', selected.result.inferences],
            ['Hypothèses de crise', selected.result.hypotheses],
          ].map(([label, value]) => (
            <div key={label} className="border border-gold/10 bg-dark-surface px-5 py-4">
              <p className="text-[10px] text-light/30 uppercase tracking-widest mb-2">{label}</p>
              <p className="text-xs text-light/60 leading-relaxed">{value}</p>
            </div>
          ))}

          {/* Matrice */}
          <div className="border border-gold/10 bg-dark-surface px-5 py-4">
            <p className="text-[10px] text-light/30 uppercase tracking-widest mb-3">Matrice de risques</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gold/8">
              {[
                ['Conformité', selected.result.risk_matrix.compliance_risk_level],
                ['Exposition juridique', selected.result.risk_matrix.legal_exposure_level],
                ['Impact opérationnel', selected.result.risk_matrix.operational_risk_level],
              ].map(([label, val]) => (
                <div key={label} className={`bg-dark-bg px-4 py-3 border-l-2 ${riskCls(val)}`}>
                  <p className="text-[10px] text-light/30 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-xs text-light/60 leading-relaxed">{val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AFRB + Actions */}
          <div className="border border-gold/10 bg-dark-surface px-5 py-4">
            <p className="text-[10px] text-light/30 uppercase tracking-widest mb-2">Classification AFRB</p>
            <p className="text-xs font-semibold text-gold/70 mb-2">{selected.result.afrb_classification.field}</p>
            <p className="text-xs text-light/55 leading-relaxed mb-3">{selected.result.afrb_classification.strategy}</p>
            <p className="text-[10px] text-light/30 uppercase tracking-widest mb-2">Clauses à risque</p>
            <div className="flex flex-col gap-1">
              {(selected.result.afrb_classification.risk_flags || '').split(/[·•\-\n]/).filter(f => f.trim()).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-400/70">
                  <AlertCircle size={11} strokeWidth={1.5} className="flex-none mt-0.5" />
                  <span>{f.trim()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-red-500/15 bg-red-500/5 px-5 py-4">
            <p className="text-[10px] text-red-400/60 uppercase tracking-widest mb-2">Deal-breakers</p>
            <p className="text-xs text-red-400/70 leading-relaxed">{selected.result.recommended_actions.escalation_thresholds}</p>
          </div>

          {/* JSON brut */}
          <details className="border border-gold/10">
            <summary className="px-4 py-3 text-xs text-light/30 cursor-pointer hover:text-light/50">
              JSON brut de l'analyse
            </summary>
            <pre className="px-4 pb-4 text-[11px] text-light/40 overflow-auto max-h-96 font-mono leading-relaxed">
              {JSON.stringify(selected.result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Analyses clients</p>
          <h2 className="font-serif text-2xl text-light">Moteur AFRB</h2>
          <p className="text-xs text-light/35 mt-1">{analyses.length} analyse{analyses.length > 1 ? 's' : ''} enregistrée{analyses.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par client, scénario, niveau de risque…"
          className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors" />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-gold/10 py-16 flex flex-col items-center gap-3">
          <BarChart3 size={28} strokeWidth={1} className="text-light/15" />
          <p className="text-sm text-light/30">Aucune analyse AFRB disponible</p>
          <p className="text-xs text-light/20">Les analyses soumises par vos clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/8">
          {filtered.map(a => {
            const level = a.result?.risk_matrix.overall_risk_level ?? '—'
            return (
              <div key={a.id} className="bg-dark-surface px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-dark-card transition-colors group">
                <div className={`text-[9px] font-bold border px-2 py-1 flex-none ${riskCls(level)}`}>{level}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-light mb-0.5">{a.clientName}</p>
                  <p className="text-xs text-light/40 truncate">{a.scenario.substring(0, 80)}…</p>
                </div>
                <p className="text-[10px] text-light/25 flex-none hidden sm:block">
                  {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setSelected(a)}
                    className="text-xs text-light/40 hover:text-gold border border-gold/10 px-3 py-1.5 transition-colors">
                    <Eye size={11} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => copyJSON(a)}
                    className="text-xs text-light/30 hover:text-light border border-gold/10 px-3 py-1.5 transition-colors">
                    {copied === a.id ? <Check size={11} /> : <Copy size={11} />}
                  </button>
                  <button onClick={() => deleteAnalysis(a.id)}
                    className="text-light/20 hover:text-red-500 border border-gold/10 px-2 py-1.5 transition-colors">
                    <Trash2 size={11} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const navItems = [
  { id: 'overview',    label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'clients',     label: 'Clients',         icon: Users },
  { id: 'contacts',    label: 'Contacts',        icon: BookUser },
  { id: 'documents',   label: 'Documents',       icon: FileUp },
  { id: 'rapports',    label: 'Rapports',        icon: Scale },
  { id: 'afrb_admin',  label: 'AFRB',           icon: BarChart3 },
  { id: 'agenda',      label: 'Agenda',          icon: CalendarDays },
  { id: 'facturation', label: 'Facturation',     icon: Receipt },
]

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState('overview')
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [rdvNotif, setRdvNotif] = useState<string | null>(null)

  const clients = useMemo(() => {
    purgeDemoDossiers()   // nettoie les dossiers fictifs à chaque refresh
    return getAllClients()
  }, [tick])
  const refresh = () => setTick(t => t + 1)

  // ── Magic link : /admin?rdv=BASE64 → crée le RDV automatiquement ──────────
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const encoded = params.get('rdv')
    if (!encoded) return

    try {
      const rdvData = JSON.parse(atob(decodeURIComponent(encoded)))
      const { name, email, subject, notes, date, time, type } = rdvData

      // Trouver ou simuler le client par email
      const allAccounts: Record<string, { user: { id: string; name: string; email: string } }> =
        JSON.parse(localStorage.getItem('avocat_accounts') || '{}')

      const clientEntry = Object.values(allAccounts).find(
        (a: any) => a.user?.email?.toLowerCase() === email?.toLowerCase() && a.user?.role !== 'admin'
      ) as { user: { id: string; name: string; email: string } } | undefined

      // Créer un ID client temporaire si pas encore inscrit
      const clientId = clientEntry?.user?.id ?? `rdv_${btoa(email).replace(/=/g, '')}`

      const newRdv: Appointment = {
        id:      crypto.randomUUID(),
        title:   subject || `RDV ${name}`,
        date,
        time,
        type:    (type as Appointment['type']) || 'visio',
        notes:   notes ? `[${name} — ${email}] ${notes}` : `[${name} — ${email}]`,
        clientId,
      }

      const existing = JSON.parse(localStorage.getItem(`avocat_rdv_${clientId}`) || '[]')
      localStorage.setItem(`avocat_rdv_${clientId}`, JSON.stringify([...existing, newRdv]))

      setRdvNotif(`✓ RDV de ${name} ajouté — ${date} à ${time}`)
      setTab('agenda')
      refresh()

      // Nettoyer l'URL
      navigate('/admin', { replace: true })
    } catch {
      // Paramètre invalide — ignorer silencieusement
    }
  }, [location.search])

  const handleLogout = () => { logout(); navigate('/') }

  const changeTab = (id: string) => {
    setTab(id)
    setSelectedClient(null)
    setMobileOpen(false)
  }

  const handleSelectClient = (c: ClientData) => {
    setSelectedClient({ ...c })
    setTab('clients')
  }

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
      {/* Notification RDV auto-créé */}
      {rdvNotif && (
        <div className="bg-gold/10 border-b border-gold/20 px-6 py-2.5 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-gold">{rdvNotif}</p>
          <button onClick={() => setRdvNotif(null)} className="text-gold/50 hover:text-gold text-xs">✕</button>
        </div>
      )}
      {/* Header Admin — visuellement distinct de l'Espace Client */}
      <header className="border-b border-gold/25 bg-dark-bg flex items-center justify-between px-4 sm:px-6 h-14 sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="font-serif text-sm sm:text-base font-semibold text-light leading-tight">Maître Mokadmi Sami</span>
            <span className="inline-flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-gold rounded-full"></span>
              <span className="text-[10px] text-gold tracking-widest uppercase font-bold">Dashboard Avocat</span>
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs font-medium text-light/60">{user?.name}</span>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="flex items-center gap-1.5 text-xs text-light/40 hover:text-light transition-colors"
          >
            <LogOut size={15} strokeWidth={1.5} />
            <span className="hidden sm:inline text-xs">Déconnexion</span>
          </button>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-light/50 hover:text-light transition-colors p-1"
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 border-r border-gold/10 pt-8 pb-6 px-4 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                  tab === id ? 'bg-gold text-dark-bg' : 'text-light/50 hover:text-light hover:bg-dark-card'
                }`}
              >
                <Icon size={15} strokeWidth={1.25} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-gold/10 pt-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-xs text-light/40 hover:text-light transition-colors"
            >
              Vue client →
            </Link>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-30 flex">
            <div className="w-64 bg-dark-surface border-r border-gold/15 flex flex-col py-4 px-3 shadow-2xl">
              <nav className="flex flex-col gap-1">
                {navItems.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => changeTab(id)}
                    className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left rounded-sm ${
                      tab === id ? 'bg-gold text-dark-bg' : 'text-light/60 hover:text-light hover:bg-dark-card'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.25} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
            {/* Backdrop semi-transparent */}
            <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main */}
        <main className="flex-1 px-4 sm:px-6 md:px-10 py-5 md:py-8 max-w-4xl pb-24 md:pb-8 min-w-0">
          {tab === 'overview' && <Overview clients={clients} />}
          {tab === 'clients' && !selectedClient && (
            <ClientsList clients={clients} onSelect={handleSelectClient} onRefresh={refresh} />
          )}
          {tab === 'clients' && selectedClient && (
            <ClientDetail
              data={selectedClient}
              onBack={() => setSelectedClient(null)}
              onRefresh={refresh}
            />
          )}
          {tab === 'contacts' && <ContactsAdmin clients={clients} onRefresh={refresh} />}
          {tab === 'documents' && <AllDocuments clients={clients} onRefresh={refresh} />}
          {tab === 'rapports' && <RapportsAdmin clients={clients} onRefresh={refresh} />}
          {tab === 'afrb_admin' && <AFRBAdmin clients={clients} />}
          {tab === 'agenda' && <AgendaAdmin clients={clients} onRefresh={refresh} />}
          {tab === 'facturation' && <AllInvoicesAdmin clients={clients} onRefresh={refresh} />}
        </main>
      </div>

      {/* ── Bottom nav mobile Admin ─────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark-surface border-t border-gold/20 flex">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => changeTab(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-h-[56px] ${
              tab === id ? 'text-gold' : 'text-light/35 hover:text-light/60'
            }`}
          >
            <Icon size={20} strokeWidth={tab === id ? 2 : 1.25} />
            <span className="text-[9px] font-medium leading-none mt-0.5 tracking-wide">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
