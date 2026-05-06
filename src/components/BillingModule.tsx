import { useState } from 'react'
import { Appointment } from './CalendarView'
import { Todo } from './TodoList'
import {
  Plus, X, Pencil, Trash2, ChevronRight, ChevronDown, ChevronUp,
  Receipt, ArrowLeft, Printer, FolderOpen, CalendarDays, CheckSquare
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  dossierId?: string
  status: 'brouillon' | 'envoyee' | 'payee' | 'en_retard'
  dateEmission: string
  dateEcheance: string
  lines: InvoiceLine[]
  linkedRdvIds: string[]
  linkedTodoIds: string[]
  notes?: string
  currency: string    // 'TND' | 'EUR' | 'USD' | 'GBP' | 'MAD'
  tvaRate: number     // 13 for TND
  retenueRate: number // 10 for TND (applied on TTC)
  timbreFiscal: number // 1 DT for TND
  createdAt: string
}

interface SimpleDossier { id: string; titre: string }

// ─── Fiscal config ────────────────────────────────────────────────────────────

export const CURRENCIES: Record<string, { label: string; symbol: string; decimals: number }> = {
  TND: { label: 'Dinar tunisien (DT)',  symbol: 'DT',  decimals: 3 },
  EUR: { label: 'Euro (€)',             symbol: '€',   decimals: 2 },
  USD: { label: 'Dollar US ($)',        symbol: '$',   decimals: 2 },
  GBP: { label: 'Livre sterling (£)',   symbol: '£',   decimals: 2 },
  MAD: { label: 'Dirham marocain (DH)', symbol: 'DH',  decimals: 2 },
  CHF: { label: 'Franc suisse (CHF)',   symbol: 'CHF', decimals: 2 },
}

const CURRENCY_DEFAULTS: Record<string, { tvaRate: number; retenueRate: number; timbreFiscal: number }> = {
  TND: { tvaRate: 13, retenueRate: 10, timbreFiscal: 1 },
  EUR: { tvaRate: 20, retenueRate: 0,  timbreFiscal: 0 },
  USD: { tvaRate: 0,  retenueRate: 0,  timbreFiscal: 0 },
  GBP: { tvaRate: 20, retenueRate: 0,  timbreFiscal: 0 },
  MAD: { tvaRate: 20, retenueRate: 0,  timbreFiscal: 0 },
  CHF: { tvaRate: 7.7, retenueRate: 0, timbreFiscal: 0 },
}

const STATUS_MAP = {
  brouillon: { label: 'Brouillon',   cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  envoyee:   { label: 'Envoyée',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  payee:     { label: 'Payée',       cls: 'bg-green-50 text-green-700 border-green-200' },
  en_retard: { label: 'En retard',   cls: 'bg-red-50 text-red-700 border-red-200' },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function fmtAmount(n: number, currency = 'TND') {
  const cfg = CURRENCIES[currency] ?? { symbol: currency, decimals: 2 }
  return (
    n.toLocaleString('fr-FR', {
      minimumFractionDigits: cfg.decimals,
      maximumFractionDigits: cfg.decimals,
    }) + ' ' + cfg.symbol
  )
}

export function computeAmounts(inv: Invoice) {
  const ht      = inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
  const tva     = ht * (inv.tvaRate ?? 0) / 100
  const ttc     = ht + tva
  const retenue = ttc * (inv.retenueRate ?? 0) / 100
  const timbre  = inv.timbreFiscal ?? 0
  const net     = ttc - retenue + timbre
  return { ht, tva, ttc, retenue, timbre, net }
}

export function invoiceTotalHT(inv: Invoice) {
  return inv.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
}

function lineTotal(l: InvoiceLine) { return l.quantity * l.unitPrice }

function nextNumber(userId: string) {
  const y = new Date().getFullYear()
  const key = `avocat_inv_seq_${userId}_${y}`
  const n = (parseInt(localStorage.getItem(key) ?? '0') || 0) + 1
  localStorage.setItem(key, String(n))
  return `${y}-${String(n).padStart(3, '0')}`
}

const todayStr = () => new Date().toISOString().split('T')[0]
const in30Str  = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0] }

// ─── Totals block (shared between form & detail) ─────────────────────────────

function TotalsBlock({ ht, tva, ttc, retenue, timbre, net, tvaRate, retenueRate, timbreFiscal, currency }: {
  ht: number; tva: number; ttc: number; retenue: number; timbre: number; net: number
  tvaRate: number; retenueRate: number; timbreFiscal: number; currency: string
}) {
  const R = ({ label, value, bold, red, plus }: { label: string; value: string; bold?: boolean; red?: boolean; plus?: boolean }) => (
    <div className="flex gap-8 w-64">
      <p className={`flex-1 text-xs ${red ? 'text-red-500' : 'text-navy/40'}`}>{label}</p>
      <p className={`text-right text-sm ${bold ? 'font-bold text-navy' : red ? 'text-red-600' : 'text-navy/70'} ${plus ? 'text-emerald-600' : ''}`}>{value}</p>
    </div>
  )
  const Sep = () => <div className="w-64 h-px bg-navy/10" />
  return (
    <div className="flex flex-col items-end gap-1.5">
      <R label="Montant HT"            value={fmtAmount(ht, currency)} />
      {tvaRate > 0 && <R label={`TVA (${tvaRate} %)`} value={fmtAmount(tva, currency)} />}
      <Sep />
      <R label="Montant TTC" value={fmtAmount(ttc, currency)} bold />
      {retenueRate > 0 && <R label={`Retenue à la source (${retenueRate} %)`} value={'– ' + fmtAmount(retenue, currency)} red />}
      {timbreFiscal > 0 && <R label="Timbre fiscal" value={'+ ' + fmtAmount(timbre, currency)} plus />}
      <Sep />
      <div className="flex gap-8 w-64">
        <p className="flex-1 text-sm font-bold text-navy">Net à payer</p>
        <p className="text-base font-bold text-navy">{fmtAmount(net, currency)}</p>
      </div>
    </div>
  )
}

// ─── InvoiceForm ──────────────────────────────────────────────────────────────

function InvoiceForm({ invoice, rdvs, todos, dossiers, userId, onSave, onCancel }: {
  invoice: Invoice | null
  rdvs: Appointment[]
  todos: Todo[]
  dossiers: SimpleDossier[]
  userId: string
  onSave: (inv: Invoice) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(() => ({
    number:       invoice?.number       ?? nextNumber(userId),
    dossierId:    invoice?.dossierId    ?? '',
    status:       invoice?.status       ?? 'brouillon' as Invoice['status'],
    dateEmission: invoice?.dateEmission ?? todayStr(),
    dateEcheance: invoice?.dateEcheance ?? in30Str(),
    currency:     invoice?.currency     ?? 'TND',
    tvaRate:      invoice?.tvaRate      ?? 13,
    retenueRate:  invoice?.retenueRate  ?? 10,
    timbreFiscal: invoice?.timbreFiscal ?? 1,
    notes:        invoice?.notes        ?? '',
    linkedRdvIds:  invoice?.linkedRdvIds  ?? [] as string[],
    linkedTodoIds: invoice?.linkedTodoIds ?? [] as string[],
  }))

  const [lines, setLines] = useState<InvoiceLine[]>(
    () => invoice?.lines ?? [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
  )
  const [showRdv,  setShowRdv]  = useState(false)
  const [showTodo, setShowTodo] = useState(false)

  const onCurrencyChange = (currency: string) => {
    const defs = CURRENCY_DEFAULTS[currency] ?? { tvaRate: 0, retenueRate: 0, timbreFiscal: 0 }
    setForm(f => ({ ...f, currency, ...defs }))
  }

  const addLine  = () => setLines(p => [...p, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }])
  const updLine  = (id: string, field: keyof InvoiceLine, v: string | number) =>
    setLines(p => p.map(l => l.id === id ? { ...l, [field]: field === 'description' ? v : Number(v) } : l))
  const delLine  = (id: string) => setLines(p => p.filter(l => l.id !== id))

  const toggleRdv = (r: Appointment) => {
    const has = form.linkedRdvIds.includes(r.id)
    setForm(f => ({ ...f, linkedRdvIds: has ? f.linkedRdvIds.filter(x => x !== r.id) : [...f.linkedRdvIds, r.id] }))
    if (has) setLines(p => p.filter(l => l.id !== `rdv-${r.id}`))
    else setLines(p => [...p, { id: `rdv-${r.id}`, description: `RDV — ${r.title} (${r.date} ${r.time})`, quantity: 1, unitPrice: 0 }])
  }

  const toggleTodo = (t: Todo) => {
    const has = form.linkedTodoIds.includes(t.id)
    setForm(f => ({ ...f, linkedTodoIds: has ? f.linkedTodoIds.filter(x => x !== t.id) : [...f.linkedTodoIds, t.id] }))
    if (has) setLines(p => p.filter(l => l.id !== `todo-${t.id}`))
    else setLines(p => [...p, { id: `todo-${t.id}`, description: `Prestation — ${t.title}`, quantity: 1, unitPrice: 0 }])
  }

  const { ht, tva, ttc, retenue, timbre, net } = (() => {
    const ht      = lines.reduce((s, l) => s + lineTotal(l), 0)
    const tva     = ht * form.tvaRate / 100
    const ttc     = ht + tva
    const retenue = ttc * form.retenueRate / 100
    const timbre  = form.timbreFiscal
    return { ht, tva, ttc, retenue, timbre, net: ttc - retenue + timbre }
  })()

  const save = () => onSave({
    id: invoice?.id ?? crypto.randomUUID(),
    clientId: userId,
    ...form,
    dossierId: form.dossierId || undefined,
    lines,
    createdAt: invoice?.createdAt ?? new Date().toISOString(),
  })

  const F = 'border-b border-navy/15 bg-transparent py-2 text-sm text-navy focus:outline-none focus:border-navy transition-colors'
  const L = 'text-xs font-medium text-navy/40 uppercase tracking-wide'

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onCancel} className="flex items-center gap-2 text-xs text-navy/40 hover:text-navy transition-colors print:hidden">
        <ArrowLeft size={13} strokeWidth={1.5} /> Retour aux factures
      </button>
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Facturation</p>
        <h2 className="font-serif text-2xl text-navy">{invoice ? 'Modifier la facture' : "Nouvelle note d'honoraires"}</h2>
      </div>

      {/* ── Informations générales ── */}
      <div className="border border-navy/10 p-6 flex flex-col gap-4">
        <p className={L}>Informations générales</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={L}>N° Facture</label>
            <input type="text" value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} className={`${F} font-mono`} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Statut</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Invoice['status'] }))} className={F}>
              <option value="brouillon">Brouillon</option>
              <option value="envoyee">Envoyée</option>
              <option value="payee">Payée</option>
              <option value="en_retard">En retard</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Date d'émission</label>
            <input type="date" value={form.dateEmission} onChange={e => setForm(f => ({ ...f, dateEmission: e.target.value }))} className={F} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Date d'échéance</label>
            <input type="date" value={form.dateEcheance} onChange={e => setForm(f => ({ ...f, dateEcheance: e.target.value }))} className={F} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Dossier <span className="normal-case text-navy/30">(optionnel)</span></label>
            <select value={form.dossierId} onChange={e => setForm(f => ({ ...f, dossierId: e.target.value }))} className={F}>
              <option value="">— Aucun dossier —</option>
              {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Devise</label>
            <select value={form.currency} onChange={e => onCurrencyChange(e.target.value)} className={F}>
              {Object.entries(CURRENCIES).map(([code, { label }]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Paramètres fiscaux ── */}
      <div className="border border-navy/10 p-6 flex flex-col gap-4">
        <p className={L}>Paramètres fiscaux</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={L}>TVA (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={form.tvaRate} onChange={e => setForm(f => ({ ...f, tvaRate: Number(e.target.value) }))} className={F} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Retenue à la source (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={form.retenueRate} onChange={e => setForm(f => ({ ...f, retenueRate: Number(e.target.value) }))} className={F} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={L}>Timbre fiscal ({CURRENCIES[form.currency]?.symbol ?? form.currency})</label>
            <input type="number" min="0" step="0.001" value={form.timbreFiscal} onChange={e => setForm(f => ({ ...f, timbreFiscal: Number(e.target.value) }))} className={F} />
          </div>
        </div>
        <p className="text-[10px] text-navy/30">La retenue à la source est calculée sur le montant TTC (HT + TVA).</p>
      </div>

      {/* ── Prestations ── */}
      <div className="border border-navy/10 p-6 flex flex-col gap-4">
        <p className={L}>Prestations</p>

        <div className="flex flex-col gap-px bg-navy/10">
          <div className="bg-navy/5 grid grid-cols-[1fr_72px_96px_80px_28px] gap-2 px-4 py-2">
            {['Description', 'Qté/h', `PU (${CURRENCIES[form.currency]?.symbol ?? ''})`, 'Total', ''].map(h => (
              <p key={h} className="text-[10px] font-medium text-navy/40 uppercase tracking-wide text-right first:text-left">{h}</p>
            ))}
          </div>
          {lines.map(line => (
            <div key={line.id} className="bg-offwhite grid grid-cols-[1fr_72px_96px_80px_28px] gap-2 px-4 py-2 items-center">
              <input type="text" value={line.description} onChange={e => updLine(line.id, 'description', e.target.value)} placeholder="Description de la prestation…" className="text-sm text-navy bg-transparent border-b border-transparent focus:border-navy/30 py-1 focus:outline-none transition-colors min-w-0" />
              <input type="number" min="0" step="0.5"  value={line.quantity}  onChange={e => updLine(line.id, 'quantity', e.target.value)}  className="text-sm text-navy text-right bg-transparent border-b border-transparent focus:border-navy/30 py-1 focus:outline-none transition-colors" />
              <input type="number" min="0" step="1"    value={line.unitPrice} onChange={e => updLine(line.id, 'unitPrice', e.target.value)} className="text-sm text-navy text-right bg-transparent border-b border-transparent focus:border-navy/30 py-1 focus:outline-none transition-colors" />
              <p className="text-sm text-navy/60 text-right">{fmtAmount(lineTotal(line), form.currency)}</p>
              <button onClick={() => delLine(line.id)} className="text-navy/20 hover:text-red-500 transition-colors flex justify-center"><X size={13} strokeWidth={1.5} /></button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button onClick={addLine} className="flex items-center gap-1.5 text-xs font-medium text-navy/40 hover:text-navy border border-navy/15 hover:border-navy/30 px-3 py-1.5 transition-colors">
            <Plus size={11} strokeWidth={1.5} /> Ajouter une ligne
          </button>
          <button onClick={() => setShowRdv(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-navy/40 hover:text-navy border border-navy/15 hover:border-navy/30 px-3 py-1.5 transition-colors">
            <CalendarDays size={11} strokeWidth={1.5} /> Importer RDV {showRdv ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
          <button onClick={() => setShowTodo(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-navy/40 hover:text-navy border border-navy/15 hover:border-navy/30 px-3 py-1.5 transition-colors">
            <CheckSquare size={11} strokeWidth={1.5} /> Importer tâches {showTodo ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
        </div>

        {showRdv && (
          <div className="border border-navy/10 p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-1">Rendez-vous à facturer</p>
            {rdvs.length === 0 ? <p className="text-xs text-navy/30">Aucun rendez-vous disponible.</p>
              : rdvs.map(r => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.linkedRdvIds.includes(r.id)} onChange={() => toggleRdv(r)} className="accent-navy" />
                  <span className="text-sm text-navy">{r.title} <span className="text-xs text-navy/40">{r.date} · {r.time}</span></span>
                </label>
              ))}
          </div>
        )}

        {showTodo && (
          <div className="border border-navy/10 p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-1">Tâches réalisées à facturer</p>
            {todos.filter(t => t.done).length === 0 ? <p className="text-xs text-navy/30">Aucune tâche complétée.</p>
              : todos.filter(t => t.done).map(t => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.linkedTodoIds.includes(t.id)} onChange={() => toggleTodo(t)} className="accent-navy" />
                  <span className="text-sm text-navy">{t.title}</span>
                </label>
              ))}
          </div>
        )}

        <div className="border-t border-navy/10 pt-4">
          <TotalsBlock {...{ ht, tva, ttc, retenue, timbre, net, tvaRate: form.tvaRate, retenueRate: form.retenueRate, timbreFiscal: form.timbreFiscal, currency: form.currency }} />
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-navy/40 uppercase tracking-wide">Notes <span className="normal-case text-navy/30">(optionnel)</span></label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Conditions de paiement, mentions légales…" className="border-b border-navy/15 bg-transparent py-2 text-sm text-navy placeholder:text-navy/25 focus:outline-none focus:border-navy transition-colors resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={save} className="bg-navy text-offwhite text-xs font-medium px-5 py-2.5 hover:bg-navy/90 transition-colors">
          {invoice ? 'Enregistrer' : 'Créer la facture'}
        </button>
        <button onClick={onCancel} className="text-xs text-navy/40 hover:text-navy transition-colors px-3">Annuler</button>
      </div>
    </div>
  )
}

// ─── InvoiceDetail ────────────────────────────────────────────────────────────

function InvoiceDetail({ invoice, dossiers, userName, userCompany, onBack, onEdit }: {
  invoice: Invoice
  dossiers: SimpleDossier[]
  userName: string
  userCompany?: string
  onBack: () => void
  onEdit: () => void
}) {
  const { ht, tva, ttc, retenue, timbre, net } = computeAmounts(invoice)
  const { label, cls } = STATUS_MAP[invoice.status]
  const dossierName = invoice.dossierId ? dossiers.find(d => d.id === invoice.dossierId)?.titre : undefined
  const sym  = CURRENCIES[invoice.currency]?.symbol ?? invoice.currency
  const fmtD = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-xs text-navy/40 hover:text-navy transition-colors">
          <ArrowLeft size={13} strokeWidth={1.5} /> Retour
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-medium text-navy/50 border border-navy/15 px-3 py-1.5 hover:text-navy hover:border-navy/30 transition-colors">
            <Pencil size={11} strokeWidth={1.5} /> Modifier
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs font-medium text-navy/50 border border-navy/15 px-3 py-1.5 hover:text-navy hover:border-navy/30 transition-colors">
            <Printer size={11} strokeWidth={1.5} /> Imprimer
          </button>
        </div>
      </div>

      <div className="border border-navy/10 p-8 flex flex-col gap-8 print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-serif text-xl font-semibold text-navy">Sami Mokadmi</p>
            <p className="text-xs text-navy/50 mt-0.5">Avocat — Droit des Affaires & Tech</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-1">Note d'honoraires</p>
            <p className="font-mono font-semibold text-navy text-lg">{invoice.number}</p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
              <span className="text-[10px] text-navy/40 border border-navy/10 px-1.5 py-0.5">{sym}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-navy/10" />

        {/* Client & Dates */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-2">Facturé à</p>
            <p className="text-sm font-semibold text-navy">{userName}</p>
            {userCompany && <p className="text-xs text-navy/50">{userCompany}</p>}
            {dossierName && (
              <p className="flex items-center gap-1 text-xs text-navy/40 mt-1">
                <FolderOpen size={10} strokeWidth={1.5} /> {dossierName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 items-end">
            <div className="flex gap-6 w-full justify-end">
              <p className="text-xs text-navy/40">Date d'émission</p>
              <p className="text-xs font-medium text-navy">{fmtD(invoice.dateEmission)}</p>
            </div>
            <div className="flex gap-6 w-full justify-end">
              <p className="text-xs text-navy/40">Date d'échéance</p>
              <p className="text-xs font-medium text-navy">{fmtD(invoice.dateEcheance)}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="bg-navy/5 grid grid-cols-[1fr_64px_96px_96px] gap-4 px-4 py-2.5">
            {['Description', 'Qté / h', `PU HT (${sym})`, `Total HT`].map((h, i) => (
              <p key={h} className={`text-xs font-semibold text-navy ${i > 0 ? 'text-right' : ''}`}>{h}</p>
            ))}
          </div>
          <div className="flex flex-col gap-px bg-navy/10">
            {invoice.lines.map(l => (
              <div key={l.id} className="bg-offwhite grid grid-cols-[1fr_64px_96px_96px] gap-4 px-4 py-3">
                <p className="text-sm text-navy">{l.description || '—'}</p>
                <p className="text-sm text-navy text-right">{l.quantity}</p>
                <p className="text-sm text-navy text-right">{fmtAmount(l.unitPrice, invoice.currency)}</p>
                <p className="text-sm font-medium text-navy text-right">{fmtAmount(lineTotal(l), invoice.currency)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <TotalsBlock
            ht={ht} tva={tva} ttc={ttc} retenue={retenue} timbre={timbre} net={net}
            tvaRate={invoice.tvaRate} retenueRate={invoice.retenueRate}
            timbreFiscal={invoice.timbreFiscal} currency={invoice.currency}
          />
        </div>

        {invoice.notes && (
          <>
            <div className="h-px bg-navy/10" />
            <div>
              <p className="text-xs font-medium text-navy/40 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-xs text-navy/60 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </>
        )}

        <div className="h-px bg-navy/10" />
        <p className="text-xs text-navy/30 text-center">Cabinet Sami Mokadmi · Avocat au Barreau · contact@samimokadmi-avocat.fr</p>
      </div>
    </div>
  )
}

// ─── BillingModule (client view) ─────────────────────────────────────────────

interface Props {
  invoices: Invoice[]
  setInvoices: (i: Invoice[] | ((p: Invoice[]) => Invoice[])) => void
  rdvs: Appointment[]
  todos: Todo[]
  dossiers: SimpleDossier[]
  userId: string
  userName: string
  userCompany?: string
}

export default function BillingModule({ invoices, setInvoices, rdvs, todos, dossiers, userId, userName, userCompany }: Props) {
  const [view,     setView]     = useState<'list' | 'form' | 'detail'>('list')
  const [selected, setSelected] = useState<Invoice | null>(null)

  const openNew  = () => { setSelected(null);  setView('form') }
  const openEdit = (i: Invoice) => { setSelected(i); setView('form') }
  const openView = (i: Invoice) => { setSelected(i); setView('detail') }
  const del      = (id: string) => setInvoices(p => p.filter(i => i.id !== id))

  const handleSave = (inv: Invoice) => {
    setInvoices(p => selected ? p.map(i => i.id === inv.id ? inv : i) : [...p, inv])
    setView('list')
  }

  if (view === 'form')
    return <InvoiceForm invoice={selected} rdvs={rdvs} todos={todos} dossiers={dossiers} userId={userId} onSave={handleSave} onCancel={() => setView('list')} />

  if (view === 'detail' && selected)
    return <InvoiceDetail invoice={selected} dossiers={dossiers} userName={userName} userCompany={userCompany} onBack={() => setView('list')} onEdit={() => setView('form')} />

  // ── List ──
  const sorted = [...invoices].sort((a, b) => b.dateEmission.localeCompare(a.dateEmission))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/40 mb-2">Facturation</p>
          <h2 className="font-serif text-2xl text-navy">Notes d'honoraires</h2>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-navy text-offwhite text-xs font-medium px-4 py-2.5 hover:bg-navy/90 transition-colors flex-none">
          <Plus size={13} strokeWidth={1.5} /> Nouvelle facture
        </button>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-navy/10">
          {[
            { label: 'Factures',   value: String(invoices.length) },
            { label: 'En attente', value: String(invoices.filter(i => i.status === 'envoyee' || i.status === 'en_retard').length) },
            { label: 'Payées',     value: String(invoices.filter(i => i.status === 'payee').length) },
            { label: 'En retard',  value: String(invoices.filter(i => i.status === 'en_retard').length) },
          ].map(s => (
            <div key={s.label} className="bg-offwhite p-5">
              <p className="text-xs text-navy/40 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="font-serif text-xl font-semibold text-navy">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="border border-dashed border-navy/15 px-8 py-12 flex flex-col items-center text-center gap-3">
          <Receipt size={28} strokeWidth={1.25} className="text-navy/20" />
          <p className="text-sm font-medium text-navy">Aucune note d'honoraires</p>
          <p className="text-xs text-navy/40 max-w-xs leading-relaxed">
            Créez votre première facture. Vous pouvez y associer un dossier, des rendez-vous ou des tâches réalisées.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-navy/10">
          {sorted.map(inv => {
            const { net } = computeAmounts(inv)
            const { label, cls } = STATUS_MAP[inv.status]
            const dossierName = inv.dossierId ? dossiers.find(d => d.id === inv.dossierId)?.titre : undefined
            return (
              <div key={inv.id} className="bg-offwhite px-6 py-4 flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-navy font-mono">{inv.number}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
                    <span className="text-[10px] text-navy/30 border border-navy/10 px-1.5 py-0.5">{inv.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-navy/40">
                      {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {dossierName && (
                      <span className="flex items-center gap-1 text-[10px] text-navy/40 border border-navy/10 px-1.5 py-0.5">
                        <FolderOpen size={9} strokeWidth={1.5} /> {dossierName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <p className="text-sm font-semibold text-navy">{fmtAmount(net, inv.currency)}</p>
                  <p className="text-[10px] text-navy/40">net à payer</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openView(inv)} className="text-navy/30 hover:text-navy p-1.5 transition-colors"><ChevronRight size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => openEdit(inv)} className="text-navy/30 hover:text-navy p-1.5 transition-colors"><Pencil size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => del(inv.id)}   className="text-navy/20 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={13} strokeWidth={1.5} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
