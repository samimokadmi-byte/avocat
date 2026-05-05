import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, FolderOpen, FileUp, MessageSquare, LogOut,
  CheckCircle2, Clock, Circle, ChevronRight, Upload, File,
  FileText, Trash2, Menu, X, Shield
} from 'lucide-react'

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

interface Document {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  dossierId?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useLocalState<T>(key: string, fallback: T) {
  const [state, setStateRaw] = useState<T>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback }
    catch { return fallback }
  })
  const setState = (val: T) => {
    setStateRaw(val)
    localStorage.setItem(key, JSON.stringify(val))
  }
  return [state, setState] as const
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function StatusBadge({ statut }: { statut: Dossier['statut'] }) {
  const map = {
    en_cours: { label: 'En cours', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    complete: { label: 'Clôturé', className: 'bg-green-50 text-green-700 border-green-200' },
    attente: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
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
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Tableau de bord</p>
        <h2 className="font-serif text-2xl text-navy">Bonjour, {userName.split(' ')[0]}.</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-navy/10">
        <div className="bg-offwhite p-6">
          <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Dossiers actifs</p>
          <p className="font-serif text-3xl font-bold text-navy">{actifs}</p>
        </div>
        <div className="bg-offwhite p-6">
          <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Documents</p>
          <p className="font-serif text-3xl font-bold text-navy">{documents.length}</p>
        </div>
        <div className="bg-offwhite p-6">
          <p className="text-xs text-navy/40 uppercase tracking-wide mb-2">Prochaine échéance</p>
          <p className="font-serif text-base font-semibold text-navy leading-tight">
            {prochaine ? new Date(prochaine.prochainEcheance!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
          </p>
          {prochaine && <p className="text-xs text-navy/40 mt-0.5">{prochaine.titre}</p>}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-4">Dossiers récents</p>
        <div className="flex flex-col gap-px bg-navy/10">
          {dossiers.slice(0, 3).map(d => (
            <div key={d.id} className="bg-offwhite px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FolderOpen size={15} strokeWidth={1.25} className="text-navy/30 flex-none" />
                <span className="text-sm font-medium text-navy truncate">{d.titre}</span>
              </div>
              <StatusBadge statut={d.statut} />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-navy/10 px-6 py-4 flex items-center gap-3">
        <Shield size={14} strokeWidth={1.25} className="text-navy/30 flex-none" />
        <p className="text-xs text-navy/40">Connexion sécurisée · Chiffrement SSL 256 bits · Données hébergées en France</p>
      </div>
    </div>
  )
}

// ─── Dossiers ─────────────────────────────────────────────────────────────────

function Dossiers({ dossiers }: { dossiers: Dossier[] }) {
  const [selected, setSelected] = useState<Dossier | null>(null)

  if (selected) {
    return (
      <div className="flex flex-col gap-6">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-xs text-navy/40 hover:text-navy transition-colors"
        >
          ← Retour aux dossiers
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-1">
              Dossier · {new Date(selected.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 className="font-serif text-2xl text-navy">{selected.titre}</h2>
          </div>
          <StatusBadge statut={selected.statut} />
        </div>

        <p className="text-sm text-navy/60 leading-relaxed max-w-prose">{selected.description}</p>

        <div>
          <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-6">Avancement</p>
          <div className="flex flex-col gap-0">
            {selected.etapes.map((etape, i) => (
              <div key={i} className="flex gap-5 pb-8 last:pb-0 relative">
                {i < selected.etapes.length - 1 && (
                  <div className="absolute left-[10px] top-6 bottom-0 w-px bg-navy/10" />
                )}
                <div className="flex-none mt-0.5 z-10">
                  {etape.statut === 'done' && <CheckCircle2 size={20} strokeWidth={1.5} className="text-navy" />}
                  {etape.statut === 'current' && <Clock size={20} strokeWidth={1.5} className="text-blue-600" />}
                  {etape.statut === 'pending' && <Circle size={20} strokeWidth={1.5} className="text-navy/20" />}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-medium ${etape.statut === 'pending' ? 'text-navy/30' : 'text-navy'}`}>
                    {etape.label}
                  </p>
                  {etape.date && (
                    <p className="text-xs text-navy/40 mt-0.5">{etape.date}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selected.prochainEcheance && (
          <div className="border border-navy/10 px-6 py-4">
            <p className="text-xs text-navy/40 uppercase tracking-wide mb-1">Prochaine échéance</p>
            <p className="text-sm font-medium text-navy">
              {new Date(selected.prochainEcheance).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Mes Dossiers</p>
        <h2 className="font-serif text-2xl text-navy">Suivi de vos missions</h2>
      </div>

      <div className="flex flex-col gap-px bg-navy/10">
        {dossiers.map(dossier => (
          <button
            key={dossier.id}
            onClick={() => setSelected(dossier)}
            className="bg-offwhite px-8 py-6 flex items-center justify-between gap-4 text-left hover:bg-navy/[0.02] transition-colors group"
          >
            <div className="flex items-start gap-4 min-w-0">
              <FolderOpen size={16} strokeWidth={1.25} className="text-navy/30 flex-none mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy mb-1">{dossier.titre}</p>
                <p className="text-xs text-navy/40 truncate">{dossier.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-navy/30">
                    Ouvert le {new Date(dossier.dateOuverture).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-navy/20">·</span>
                  <span className="text-xs text-navy/30">
                    {dossier.etapes.filter(e => e.statut === 'done').length}/{dossier.etapes.length} étapes
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-none">
              <StatusBadge statut={dossier.statut} />
              <ChevronRight size={14} strokeWidth={1.5} className="text-navy/20 group-hover:text-navy/50 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Documents ────────────────────────────────────────────────────────────────

function Documents({ documents, setDocuments }: { documents: Document[]; setDocuments: (d: Document[]) => void }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newDocs: Document[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date().toISOString(),
    }))
    setDocuments([...documents, ...newDocs])
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
    return <File size={15} strokeWidth={1.25} className="text-navy/30" />
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Documents</p>
        <h2 className="font-serif text-2xl text-navy">Gestion documentaire</h2>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed px-8 py-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          dragging ? 'border-navy bg-navy/5' : 'border-navy/15 hover:border-navy/30 hover:bg-navy/[0.02]'
        }`}
      >
        <Upload size={24} strokeWidth={1.25} className="text-navy/30" />
        <div className="text-center">
          <p className="text-sm font-medium text-navy">Déposer vos fichiers ici</p>
          <p className="text-xs text-navy/40 mt-1">ou cliquez pour parcourir · PDF, Word, Excel acceptés</p>
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
        <div className="flex flex-col gap-px bg-navy/10">
          {documents.map(doc => (
            <div key={doc.id} className="bg-offwhite px-6 py-4 flex items-center gap-4">
              <div className="flex-none">{fileIcon(doc.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">{doc.name}</p>
                <p className="text-xs text-navy/40 mt-0.5">
                  {formatSize(doc.size)} · Déposé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => remove(doc.id)}
                className="flex-none text-navy/20 hover:text-red-500 transition-colors"
                aria-label="Supprimer"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      {documents.length === 0 && (
        <p className="text-sm text-navy/30 text-center py-4">Aucun document déposé pour le moment.</p>
      )}
    </div>
  )
}

// ─── Messagerie ───────────────────────────────────────────────────────────────

function Messagerie() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Messagerie</p>
        <h2 className="font-serif text-2xl text-navy">Échanges sécurisés</h2>
      </div>
      <div className="border border-navy/10 px-8 py-12 flex flex-col items-center text-center gap-3">
        <MessageSquare size={28} strokeWidth={1.25} className="text-navy/20" />
        <p className="text-sm font-medium text-navy">Messagerie en cours d'activation</p>
        <p className="text-xs text-navy/40 max-w-xs leading-relaxed">
          Pour toute question urgente, contactez le cabinet directement à{' '}
          <a href="mailto:contact@samimokadmi-avocat.fr" className="text-navy underline">
            contact@samimokadmi-avocat.fr
          </a>
        </p>
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const navItems = [
  { id: 'apercu', label: 'Aperçu', icon: LayoutDashboard },
  { id: 'dossiers', label: 'Dossiers', icon: FolderOpen },
  { id: 'documents', label: 'Documents', icon: FileUp },
  { id: 'messagerie', label: 'Messagerie', icon: MessageSquare },
]

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('apercu')
  const [mobileOpen, setMobileOpen] = useState(false)

  const [dossiers] = useLocalState<Dossier[]>(`avocat_dossiers_${user?.id}`, [])
  const [documents, setDocuments] = useLocalState<Document[]>(`avocat_documents_${user?.id}`, [])

  const handleLogout = () => { logout(); navigate('/') }

  const changeTab = (id: string) => { setTab(id); setMobileOpen(false) }

  return (
    <div className="min-h-screen bg-offwhite flex flex-col">
      {/* Top bar */}
      <header className="border-b border-navy/10 bg-offwhite flex items-center justify-between px-6 h-14 sticky top-0 z-40">
        <Link to="/" className="flex flex-col">
          <span className="font-serif text-base font-semibold text-navy leading-tight">Sami Mokadmi</span>
          <span className="text-[10px] text-navy/40 tracking-wide">Espace Client</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-navy">{user?.name}</span>
            {user?.company && <span className="text-[10px] text-navy/40">{user.company}</span>}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-navy/40 hover:text-navy transition-colors"
          >
            <LogOut size={13} strokeWidth={1.5} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden text-navy/50 hover:text-navy transition-colors"
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-56 border-r border-navy/10 pt-8 pb-6 px-4 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeTab(id)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                  tab === id
                    ? 'bg-navy text-offwhite'
                    : 'text-navy/50 hover:text-navy hover:bg-navy/5'
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
            <div className="mt-auto pt-6 border-t border-navy/10">
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-navy/40 hover:text-navy transition-colors">
                <LogOut size={14} strokeWidth={1.5} /> Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 px-6 md:px-12 py-10 max-w-3xl">
          {tab === 'apercu' && <Apercu dossiers={dossiers} documents={documents} userName={user?.name ?? ''} />}
          {tab === 'dossiers' && <Dossiers dossiers={dossiers} />}
          {tab === 'documents' && <Documents documents={documents} setDocuments={setDocuments} />}
          {tab === 'messagerie' && <Messagerie />}
        </main>
      </div>
    </div>
  )
}
