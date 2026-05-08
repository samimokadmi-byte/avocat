import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, User } from '../contexts/AuthContext'
import { Document } from './DashboardPage'
import CalendarView, { Appointment } from '../components/CalendarView'
import TodoList, { Todo } from '../components/TodoList'
import {
  LayoutDashboard, Users, FileUp, LogOut, ChevronRight,
  Download, Trash2, CheckCircle2, Clock, Circle, Search,
  FolderOpen, ArrowLeft, FileText, File as FileIcon, AlertCircle,
  CalendarDays, Plus, X, Receipt
} from 'lucide-react'
import { Invoice, computeAmounts, fmtAmount, CURRENCIES } from '../components/BillingModule'
import { STORAGE_KEYS } from '../constants/storageKeys'
import type { Etape, Dossier } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

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
    localStorage.getItem(STORAGE_KEYS.accounts) || '{}'
  )
  return Object.values(accounts)
    .filter(a => a.user.role === 'client')
    .map(a => ({
      user: a.user,
      dossiers: JSON.parse(localStorage.getItem(STORAGE_KEYS.dossiers(a.user.id)) || '[]'),
      documents: JSON.parse(localStorage.getItem(STORAGE_KEYS.documents(a.user.id)) || '[]'),
    }))
}

function saveDossiers(userId: string, dossiers: Dossier[]) {
  localStorage.setItem(STORAGE_KEYS.dossiers(userId), JSON.stringify(dossiers))
}

function deleteDocument(userId: string, docId: string) {
  const docs: Document[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.documents(userId)) || '[]')
  localStorage.setItem(STORAGE_KEYS.documents(userId), JSON.stringify(docs.filter(d => d.id !== docId)))
}

function getAllRdvs(): (Appointment & { clientName: string })[] {
  const accounts: Record<string, { password: string; user: User }> = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.accounts) || '{}'
  )
  return Object.values(accounts)
    .filter(a => a.user.role === 'client')
    .flatMap(a => {
      const rdvs: Appointment[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.rdvs(a.user.id)) || '[]')
      return rdvs.map(r => ({ ...r, clientName: a.user.name }))
    })
}

function saveRdvForClient(clientId: string, rdvs: Appointment[]) {
  localStorage.setItem(STORAGE_KEYS.rdvs(clientId), JSON.stringify(rdvs))
}

function getRdvsForClient(clientId: string): Appointment[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.rdvs(clientId)) || '[]')
}

function getTodosForClient(clientId: string): Todo[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.todos(clientId)) || '[]')
}

function saveTodosForClient(clientId: string, todos: Todo[]) {
  localStorage.setItem(STORAGE_KEYS.todos(clientId), JSON.stringify(todos))
}

function getInvoicesForClient(clientId: string): Invoice[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.invoices(clientId)) || '[]')
}

function saveInvoicesForClient(clientId: string, invoices: Invoice[]) {
  localStorage.setItem(STORAGE_KEYS.invoices(clientId), JSON.stringify(invoices))
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
                        onClick={() => {
                          const updated = clientInvoices.map(i => i.id === inv.id ? { ...i, status: s } : i)
                          saveInvoicesForClient(data.user.id, updated)
                          setClientInvoicesState(updated)
                          onRefresh()
                        }}
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

function AllInvoicesAdmin({ clients, onRefresh }: { clients: ClientData[]; onRefresh: () => void }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<Invoice['status'] | 'all'>('all')

  const allInvoices = useMemo(() =>
    clients.flatMap(c =>
      getInvoicesForClient(c.user.id).map(inv => ({ ...inv, clientName: c.user.name, clientCompany: c.user.company }))
    ), [clients]
  )

  const filtered = useMemo(() =>
    allInvoices.filter(inv => {
      const matchSearch = search === '' ||
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        (inv.clientCompany ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus
      return matchSearch && matchStatus
    }).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission)),
    [allInvoices, search, filterStatus]
  )

  const totalNet = filtered.reduce((s, inv) => s + computeAmounts(inv).net, 0)
  const paidNet  = filtered.filter(i => i.status === 'payee').reduce((s, inv) => s + computeAmounts(inv).net, 0)

  const updateStatus = (inv: typeof allInvoices[number], status: Invoice['status']) => {
    const existing = getInvoicesForClient(inv.clientId)
    saveInvoicesForClient(inv.clientId, existing.map(i => i.id === inv.id ? { ...i, status } : i))
    onRefresh()
  }

  const deleteInvoice = (inv: typeof allInvoices[number]) => {
    saveInvoicesForClient(inv.clientId, getInvoicesForClient(inv.clientId).filter(i => i.id !== inv.id))
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Facturation</p>
        <h2 className="font-serif text-2xl text-light">Notes d'honoraires</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gold/10">
        {[
          { label: 'Total factures',  value: String(allInvoices.length) },
          { label: 'En attente',      value: String(allInvoices.filter(i => i.status === 'envoyee' || i.status === 'en_retard').length) },
          { label: 'Payées',          value: String(allInvoices.filter(i => i.status === 'payee').length) },
          { label: 'Chiffre encaissé', value: paidNet > 0 ? fmtAmount(paidNet, 'TND') : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-dark-surface p-6">
            <p className="text-xs text-light/40 uppercase tracking-wide mb-2">{label}</p>
            <p className="font-serif text-xl font-bold text-light">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-light/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par n°, client ou société…"
            className="w-full border border-gold/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'brouillon', 'envoyee', 'payee', 'en_retard'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs font-medium px-3 py-1.5 border transition-colors ${
                filterStatus === s ? 'bg-gold text-dark-bg border-gold' : 'text-light/40 border-gold/15 hover:border-gold/30'
              }`}
            >
              {s === 'all' ? 'Toutes' : INV_STATUS_MAP[s].label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-light/40">
          {filtered.length} facture{filtered.length > 1 ? 's' : ''} · Total net : <span className="font-medium text-light">{fmtAmount(totalNet, 'TND')}</span>
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="border border-gold/10 px-6 py-12 text-center text-sm text-light/30">Aucune facture trouvée.</div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/10">
          {filtered.map(inv => {
            const { net } = computeAmounts(inv)
            const { label, cls } = INV_STATUS_MAP[inv.status]
            const sym = CURRENCIES[inv.currency]?.symbol ?? inv.currency
            return (
              <div key={inv.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-light font-mono">{inv.number}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
                    <span className="text-[10px] text-light/30 border border-gold/10 px-1.5 py-0.5">{sym}</span>
                  </div>
                  <p className="text-xs text-light/40">
                    <span className="font-medium text-light/60">{inv.clientName}</span>
                    {inv.clientCompany ? ` · ${inv.clientCompany}` : ''} ·{' '}
                    {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' — échéance '}
                    {new Date(inv.dateEcheance + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex-none text-right mr-2">
                  <p className="text-sm font-semibold text-light">{fmtAmount(net, inv.currency)}</p>
                  <p className="text-[10px] text-light/40">net à payer</p>
                </div>
                {/* Quick status change */}
                <div className="flex gap-1 flex-none">
                  {(['brouillon', 'envoyee', 'payee', 'en_retard'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(inv, s)}
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
                  onClick={() => deleteInvoice(inv)}
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
  const [tab, setTab] = useState('overview')
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tick, setTick] = useState(0)

  const clients = useMemo(() => getAllClients(), [tick])

  const refresh = () => setTick(t => t + 1)

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
      {/* Header */}
      <header className="border-b border-gold/10 bg-dark-surface flex items-center justify-between px-6 h-14 sticky top-0 z-40">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-base font-semibold text-white leading-tight">Maître Mokadmi Sami</span>
          <span className="text-[10px] text-white/40 tracking-wide uppercase">Administration</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs text-white/50">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <LogOut size={13} strokeWidth={1.5} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-white/50 hover:text-white transition-colors text-lg"
          >
            ☰
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

        {/* Mobile menu */}
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
          </div>
        )}

        {/* Main */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-4xl">
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
    </div>
  )
}
