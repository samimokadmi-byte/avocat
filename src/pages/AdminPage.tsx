import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth, User } from '../contexts/AuthContext'
import { Document } from './DashboardPage'
import CalendarView, { Appointment } from '../components/CalendarView'
import TodoList, { Todo } from '../components/TodoList'
import {
  LayoutDashboard, Users, FileUp, LogOut, ChevronRight,
  Download, Trash2, CheckCircle2, Clock, Circle, Search,
  FolderOpen, ArrowLeft, FileText, File as FileIcon, AlertCircle,
  CalendarDays, Plus, X, Menu, Receipt, Pencil, Mail, CheckCircle
} from 'lucide-react'
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
  const totalSize = clients.reduce((s, c) => s + c.documents.reduce((ss, d) => ss + d.size, 0), 0)

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
          { label: 'Documents reçus', value: `${totalDocs} (${formatSize(totalSize)})` },
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

function AllDocuments({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const allDocs = useMemo(() =>
    clients.flatMap(c => c.documents.map(d => ({ ...d, client: c.user }))),
    [clients]
  )
  const filtered = useMemo(() =>
    allDocs.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.client.name.toLowerCase().includes(search.toLowerCase())
    ), [allDocs, search])

  const handleDelete = (userId: string, docId: string) => {
    deleteDocument(userId, docId)
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Documents</p>
        <h2 className="font-serif text-2xl text-light">{allDocs.length} document{allDocs.length > 1 ? 's' : ''}</h2>
      </div>

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

      {filtered.length === 0 ? (
        <div className="border border-gold/10 px-6 py-12 text-center text-sm text-light/30">Aucun document reçu.</div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/10">
          {filtered.map(doc => (
            <div key={`${doc.client.id}-${doc.id}`} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
              {fileIcon(doc.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-light truncate">{doc.name}</p>
                <p className="text-xs text-light/40 mt-0.5">
                  <span className="font-medium">{doc.client.name}</span>
                  {doc.client.company ? ` · ${doc.client.company}` : ''} ·{' '}
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
                  onClick={() => handleDelete(doc.client.id, doc.id)}
                  className="text-light/20 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
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
  const TVA_RATE     = 13
  const RETENUE_RATE = 10
  const TIMBRE       = 1

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
              { label: '+ Timbre fiscal',               value: fmt(TIMBRE),  sub: 'Fixe',                               bold: false, red: false },
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
    const clientEmail = clientUser?.email ?? ''

    if (!clientEmail && !inv.clientId.startsWith('manual_')) {
      setEmailFeedback({ id: inv.id, ok: false, msg: 'Email client introuvable. Vérifiez le profil client.' })
      return
    }
    if (!clientEmail) {
      setEmailFeedback({ id: inv.id, ok: false, msg: 'Impossible d\'envoyer : client manuel sans email. Saisissez l\'email manuellement.' })
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
        setEmailFeedback({ id: inv.id, ok: true, msg: `Email envoyé à ${clientEmail}` })
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

// ─── Admin Page ───────────────────────────────────────────────────────────────

const navItems = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileUp },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'facturation', label: 'Facturation', icon: Receipt },
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

  const clients = useMemo(() => getAllClients(), [tick])
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
          {tab === 'documents' && <AllDocuments clients={clients} onRefresh={refresh} />}
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
