import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, User } from '../contexts/AuthContext'
import { Document } from './DashboardPage'
import {
  LayoutDashboard, Users, FileUp, LogOut, ChevronRight,
  Download, Trash2, CheckCircle2, Clock, Circle, Search,
  FolderOpen, ArrowLeft, FileText, File as FileIcon, AlertCircle
} from 'lucide-react'

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
    en_cours: { label: 'En cours', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    complete: { label: 'Clôturé', cls: 'bg-green-50 text-green-700 border-green-200' },
    attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
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
  return <FileIcon size={14} strokeWidth={1.25} className="text-navy/30 flex-none" />
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

// ─── Vue d'ensemble ───────────────────────────────────────────────────────────

function Overview({ clients }: { clients: ClientData[] }) {
  const totalDossiers = clients.reduce((s, c) => s + c.dossiers.length, 0)
  const dossiersActifs = clients.reduce((s, c) => s + c.dossiers.filter(d => d.statut === 'en_cours').length, 0)
  const totalDocs = clients.reduce((s, c) => s + c.documents.length, 0)
  const totalSize = clients.reduce((s, c) => s + c.documents.reduce((ss, d) => ss + d.size, 0), 0)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Administration</p>
        <h2 className="font-serif text-2xl text-navy">Tableau de bord</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-navy/10">
        {[
          { label: 'Clients actifs', value: clients.length },
          { label: 'Dossiers en cours', value: dossiersActifs },
          { label: 'Dossiers totaux', value: totalDossiers },
          { label: 'Documents reçus', value: `${totalDocs} (${formatSize(totalSize)})` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-offwhite p-6">
            <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">{label}</p>
            <p className="font-serif text-2xl font-bold text-navy">{value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-4">Dossiers actifs</p>
        <div className="flex flex-col gap-px bg-navy/10">
          {clients.flatMap(c =>
            c.dossiers.filter(d => d.statut === 'en_cours').map(d => (
              <div key={d.id} className="bg-offwhite px-6 py-4 flex items-center gap-4">
                <FolderOpen size={14} strokeWidth={1.25} className="text-navy/30 flex-none" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{d.titre}</p>
                  <p className="text-xs text-navy/40">{c.user.name}{c.user.company ? ` · ${c.user.company}` : ''}</p>
                </div>
                <StatusBadge statut={d.statut} />
              </div>
            ))
          )}
          {clients.every(c => c.dossiers.every(d => d.statut !== 'en_cours')) && (
            <div className="bg-offwhite px-6 py-8 text-center text-sm text-navy/30">Aucun dossier en cours.</div>
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

  const removeDoc = (docId: string) => {
    deleteDocument(data.user.id, docId)
    setDocumentsState(prev => prev.filter(d => d.id !== docId))
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="flex items-center gap-2 text-xs text-navy/40 hover:text-navy transition-colors">
        <ArrowLeft size={12} strokeWidth={1.5} /> Retour aux clients
      </button>

      <div className="border border-navy/10 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-navy">{data.user.name}</p>
          <p className="text-xs text-navy/40 mt-0.5">{data.user.email}{data.user.company ? ` · ${data.user.company}` : ''}</p>
        </div>
        <div className="flex gap-3 text-xs text-navy/40">
          <span>{dossiers.length} dossier{dossiers.length > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>{documents.length} document{documents.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Dossiers */}
      <div>
        <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-3">Dossiers</p>
        {selectedDossier ? (
          <div className="border border-navy/10 p-6 flex flex-col gap-5">
            <button onClick={() => setSelectedDossier(null)} className="flex items-center gap-2 text-xs text-navy/40 hover:text-navy transition-colors">
              <ArrowLeft size={12} strokeWidth={1.5} /> Retour à la liste
            </button>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h3 className="font-serif text-lg text-navy">{selectedDossier.titre}</h3>
              <StatusBadge statut={selectedDossier.statut} />
            </div>
            <div className="flex flex-col gap-4">
              {selectedDossier.etapes.map((etape, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-navy/5 last:border-0 last:pb-0">
                  <div className="flex-none mt-0.5">
                    {etape.statut === 'done' && <CheckCircle2 size={18} strokeWidth={1.5} className="text-navy" />}
                    {etape.statut === 'current' && <Clock size={18} strokeWidth={1.5} className="text-blue-600" />}
                    {etape.statut === 'pending' && <Circle size={18} strokeWidth={1.5} className="text-navy/20" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${etape.statut === 'pending' ? 'text-navy/40' : 'text-navy'}`}>{etape.label}</p>
                    {etape.date && <p className="text-xs text-navy/40 mt-0.5">{etape.date}</p>}
                  </div>
                  <div className="flex gap-1 flex-none">
                    {(['done', 'current', 'pending'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateEtape(selectedDossier.id, i, s)}
                        className={`text-[10px] font-medium px-2 py-1 border transition-colors ${
                          etape.statut === s
                            ? 'bg-navy text-offwhite border-navy'
                            : 'text-navy/40 border-navy/15 hover:border-navy/30'
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
          <div className="flex flex-col gap-px bg-navy/10">
            {dossiers.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDossier(d)}
                className="bg-offwhite px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-navy/[0.02] group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen size={14} strokeWidth={1.25} className="text-navy/30 flex-none" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{d.titre}</p>
                    <p className="text-xs text-navy/40 mt-0.5">
                      {d.etapes.filter(e => e.statut === 'done').length}/{d.etapes.length} étapes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <StatusBadge statut={d.statut} />
                  <ChevronRight size={13} strokeWidth={1.5} className="text-navy/20 group-hover:text-navy/50 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-3">
          Documents ({documents.length})
        </p>
        {documents.length === 0 ? (
          <div className="border border-navy/10 px-6 py-8 text-center text-sm text-navy/30">Aucun document déposé.</div>
        ) : (
          <div className="flex flex-col gap-px bg-navy/10">
            {documents.map(doc => (
              <div key={doc.id} className="bg-offwhite px-6 py-4 flex items-center gap-4">
                {fileIcon(doc.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{doc.name}</p>
                  <p className="text-xs text-navy/40 mt-0.5">
                    {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  {doc.content ? (
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="flex items-center gap-1.5 text-xs text-navy/50 hover:text-navy border border-navy/15 hover:border-navy/30 px-3 py-1.5 transition-colors"
                    >
                      <Download size={11} strokeWidth={1.5} />
                      Télécharger
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-navy/30">
                      <AlertCircle size={11} strokeWidth={1.5} /> Indisponible
                    </span>
                  )}
                  <button
                    onClick={() => removeDoc(doc.id)}
                    className="text-navy/20 hover:text-red-500 transition-colors p-1"
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
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Clients</p>
        <h2 className="font-serif text-2xl text-navy">{clients.length} client{clients.length > 1 ? 's' : ''}</h2>
      </div>

      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email ou société…"
          className="w-full border border-navy/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-navy/30 text-center py-8">Aucun client trouvé.</p>
      ) : (
        <div className="flex flex-col gap-px bg-navy/10">
          {filtered.map(c => (
            <button
              key={c.user.id}
              onClick={() => onSelect(c)}
              className="bg-offwhite px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-navy/[0.02] group transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-8 h-8 bg-navy/5 flex items-center justify-center flex-none">
                  <span className="text-xs font-semibold text-navy/50">
                    {c.user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy">{c.user.name}</p>
                  <p className="text-xs text-navy/40 mt-0.5">{c.user.email}{c.user.company ? ` · ${c.user.company}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-none">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-navy/40">{c.dossiers.length} dossier{c.dossiers.length > 1 ? 's' : ''}</p>
                  <p className="text-xs text-navy/30">{c.documents.length} document{c.documents.length > 1 ? 's' : ''}</p>
                </div>
                <ChevronRight size={13} strokeWidth={1.5} className="text-navy/20 group-hover:text-navy/50 transition-colors" />
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
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Documents</p>
        <h2 className="font-serif text-2xl text-navy">{allDocs.length} document{allDocs.length > 1 ? 's' : ''}</h2>
      </div>

      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom de fichier ou client…"
          className="w-full border border-navy/15 bg-transparent pl-9 pr-4 py-2.5 text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="border border-navy/10 px-6 py-12 text-center text-sm text-navy/30">Aucun document reçu.</div>
      ) : (
        <div className="flex flex-col gap-px bg-navy/10">
          {filtered.map(doc => (
            <div key={`${doc.client.id}-${doc.id}`} className="bg-offwhite px-6 py-4 flex items-center gap-4">
              {fileIcon(doc.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">{doc.name}</p>
                <p className="text-xs text-navy/40 mt-0.5">
                  <span className="font-medium">{doc.client.name}</span>
                  {doc.client.company ? ` · ${doc.client.company}` : ''} ·{' '}
                  {formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-none">
                {doc.content ? (
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="flex items-center gap-1.5 text-xs text-navy/50 hover:text-navy border border-navy/15 hover:border-navy/30 px-3 py-1.5 transition-colors"
                  >
                    <Download size={11} strokeWidth={1.5} />
                    Télécharger
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-navy/30">
                    <AlertCircle size={11} strokeWidth={1.5} /> Indisponible
                  </span>
                )}
                <button
                  onClick={() => handleDelete(doc.client.id, doc.id)}
                  className="text-navy/20 hover:text-red-500 transition-colors p-1"
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

// ─── Admin Page ───────────────────────────────────────────────────────────────

const navItems = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'documents', label: 'Documents', icon: FileUp },
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
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Header */}
      <header className="border-b border-navy/10 bg-navy flex items-center justify-between px-6 h-14 sticky top-0 z-40">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-base font-semibold text-white leading-tight">Sami Mokadmi</span>
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
        <aside className="hidden md:flex flex-col w-56 border-r border-navy/10 pt-8 pb-6 px-4 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                  tab === id ? 'bg-navy text-offwhite' : 'text-navy/50 hover:text-navy hover:bg-navy/5'
                }`}
              >
                <Icon size={15} strokeWidth={1.25} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto border-t border-navy/10 pt-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-xs text-navy/40 hover:text-navy transition-colors"
            >
              Vue client →
            </Link>
          </div>
        </aside>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 top-14 z-30 bg-offwhite border-t border-navy/10 p-6 flex flex-col gap-2">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  tab === id ? 'bg-navy text-offwhite' : 'text-navy/60 hover:text-navy hover:bg-navy/5'
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
        </main>
      </div>
    </div>
  )
}
