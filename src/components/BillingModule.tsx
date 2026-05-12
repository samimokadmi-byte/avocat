import { useState, useEffect, useId } from 'react'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { Appointment } from './CalendarView'
import { Todo } from './TodoList'
import {
  Plus, X, Pencil, Trash2, ChevronRight, ChevronDown, ChevronUp,
  Receipt, ArrowLeft, Printer, FolderOpen, CalendarDays, CheckSquare,
  Mail, Copy, Send, Download
} from 'lucide-react'
import { downloadInvoicePdf } from '../utils/invoicePdf'

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
  brouillon: { label: 'Brouillon',   cls: 'bg-light/5 text-light/40 border-light/15' },
  envoyee:   { label: 'Envoyée',     cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  payee:     { label: 'Payée',       cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  en_retard: { label: 'En retard',   cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
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
      <p className={`flex-1 text-xs ${red ? 'text-red-500' : 'text-light/40'}`}>{label}</p>
      <p className={`text-right text-sm ${bold ? 'font-bold text-light' : red ? 'text-red-600' : 'text-light/70'} ${plus ? 'text-emerald-600' : ''}`}>{value}</p>
    </div>
  )
  const Sep = () => <div className="w-64 h-px bg-gold/10" />
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
        <p className="flex-1 text-sm font-bold text-light">Net à payer</p>
        <p className="text-base font-bold text-light">{fmtAmount(net, currency)}</p>
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
    () => invoice?.lines ?? [{ id: crypto.randomUUID(), description: 'Honoraires', quantity: 1, unitPrice: 0 }]
  )
  const [showDetail, setShowDetail] = useState(false)
  const [showRdv,    setShowRdv]    = useState(false)
  const [showTodo,   setShowTodo]   = useState(false)

  const onCurrencyChange = (currency: string) => {
    const defs = CURRENCY_DEFAULTS[currency] ?? { tvaRate: 0, retenueRate: 0, timbreFiscal: 0 }
    setForm(f => ({ ...f, currency, ...defs }))
  }

  // ── HT direct input ──────────────────────────────────────────────────────────
  const ht = lines.reduce((s, l) => s + lineTotal(l), 0)

  const setHtDirect = (val: number) => {
    // Update first line (main honoraires line) to match the entered HT
    setLines(prev => {
      if (prev.length === 0) return [{ id: crypto.randomUUID(), description: 'Honoraires', quantity: 1, unitPrice: val }]
      const [first, ...rest] = prev
      return [{ ...first, quantity: 1, unitPrice: val }, ...rest]
    })
  }

  const tva     = ht * form.tvaRate / 100
  const ttc     = ht + tva
  const retenue = ttc * form.retenueRate / 100
  const timbre  = form.timbreFiscal
  const net     = ttc - retenue + timbre

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

  const save = () => onSave({
    id: invoice?.id ?? crypto.randomUUID(),
    clientId: userId,
    ...form,
    dossierId: form.dossierId || undefined,
    lines,
    createdAt: invoice?.createdAt ?? new Date().toISOString(),
  })

  const sym = CURRENCIES[form.currency]?.symbol ?? form.currency
  const F = 'border-b border-gold/15 bg-transparent py-2 text-sm text-light focus:outline-none focus:border-gold transition-colors'
  const L = 'text-xs font-medium text-light/40 uppercase tracking-wide'

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onCancel} className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors print:hidden">
        <ArrowLeft size={13} strokeWidth={1.5} /> Retour aux factures
      </button>
      <div>
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Facturation</p>
        <h2 className="font-serif text-2xl text-light">{invoice ? 'Modifier la facture' : "Nouvelle note d'honoraires"}</h2>
      </div>

      {/* ── Montant HT + calcul automatique ── */}
      <div className="border border-gold/10 p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className={L}>Montant HT <span className="normal-case text-light/30">({sym})</span></label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="0.001"
              value={ht === 0 ? '' : ht}
              onChange={e => setHtDirect(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-full text-2xl font-serif font-semibold text-light border-b-2 border-gold/20 bg-transparent py-2 focus:outline-none focus:border-gold transition-colors placeholder:text-light/20"
            />
            <span className="text-lg text-light/40 font-medium flex-none">{sym}</span>
          </div>
        </div>

        {/* Live breakdown */}
        {ht > 0 && (
          <div className="border border-gold/10 bg-dark-card p-5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-light/50">Montant HT</span>
              <span className="font-medium text-light">{fmtAmount(ht, form.currency)}</span>
            </div>
            {form.tvaRate > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-light/50">TVA ({form.tvaRate} %)</span>
                <span className="text-light/70">+ {fmtAmount(tva, form.currency)}</span>
              </div>
            )}
            <div className="h-px bg-gold/10 my-1" />
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-light">Montant TTC</span>
              <span className="font-semibold text-light">{fmtAmount(ttc, form.currency)}</span>
            </div>
            {form.retenueRate > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-red-500">Retenue à la source ({form.retenueRate} %)</span>
                <span className="text-red-600 font-medium">− {fmtAmount(retenue, form.currency)}</span>
              </div>
            )}
            {form.timbreFiscal > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-600">Timbre fiscal</span>
                <span className="text-emerald-600 font-medium">+ {fmtAmount(timbre, form.currency)}</span>
              </div>
            )}
            <div className="h-px bg-gold/10 my-1" />
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-light">Net à payer</span>
              <span className="text-xl font-bold text-light font-serif">{fmtAmount(net, form.currency)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Informations générales ── */}
      <div className="border border-gold/10 p-6 flex flex-col gap-4">
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
            <label className={L}>Dossier <span className="normal-case text-light/30">(optionnel)</span></label>
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
      <div className="border border-gold/10 p-6 flex flex-col gap-4">
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
            <label className={L}>Timbre fiscal ({sym})</label>
            <input type="number" min="0" step="0.001" value={form.timbreFiscal} onChange={e => setForm(f => ({ ...f, timbreFiscal: Number(e.target.value) }))} className={F} />
          </div>
        </div>
        <p className="text-[10px] text-light/30">La retenue à la source est calculée sur le montant TTC (HT + TVA).</p>
      </div>

      {/* ── Détail des prestations (optionnel) ── */}
      <div className="border border-gold/10">
        <button
          onClick={() => setShowDetail(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-dark-card transition-colors"
        >
          <span className={L}>Détail des prestations <span className="normal-case text-light/30">(optionnel)</span></span>
          {showDetail ? <ChevronUp size={14} strokeWidth={1.5} className="text-light/30" /> : <ChevronDown size={14} strokeWidth={1.5} className="text-light/30" />}
        </button>

        {showDetail && (
          <div className="px-3 sm:px-6 pb-6 flex flex-col gap-4">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[440px] px-3 sm:px-0">
            <div className="flex flex-col gap-px bg-gold/10">
              <div className="bg-dark-card grid grid-cols-[1fr_72px_96px_80px_28px] gap-2 px-4 py-2">
                {['Description', 'Qté/h', `PU (${sym})`, 'Total', ''].map(h => (
                  <p key={h} className="text-[10px] font-medium text-light/40 uppercase tracking-wide text-right first:text-left">{h}</p>
                ))}
              </div>
              {lines.map(line => (
                <div key={line.id} className="bg-dark-surface grid grid-cols-[1fr_72px_96px_80px_28px] gap-2 px-4 py-2 items-center">
                  <input type="text" value={line.description} onChange={e => updLine(line.id, 'description', e.target.value)} placeholder="Description…" className="text-sm text-light bg-transparent border-b border-transparent focus:border-gold/30 py-1 focus:outline-none transition-colors min-w-0" />
                  <input type="number" min="0" step="0.5"  value={line.quantity}  onChange={e => updLine(line.id, 'quantity', e.target.value)}  className="text-sm text-light text-right bg-transparent border-b border-transparent focus:border-gold/30 py-1 focus:outline-none transition-colors" />
                  <input type="number" min="0" step="1"    value={line.unitPrice} onChange={e => updLine(line.id, 'unitPrice', e.target.value)} className="text-sm text-light text-right bg-transparent border-b border-transparent focus:border-gold/30 py-1 focus:outline-none transition-colors" />
                  <p className="text-sm text-light/60 text-right">{fmtAmount(lineTotal(line), form.currency)}</p>
                  <button onClick={() => delLine(line.id)} className="text-light/20 hover:text-red-500 transition-colors flex justify-center"><X size={13} strokeWidth={1.5} /></button>
                </div>
              ))}
            </div>
            </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={addLine} className="flex items-center gap-1.5 text-xs font-medium text-light/40 hover:text-light border border-gold/15 hover:border-gold/30 px-3 py-1.5 transition-colors">
                <Plus size={11} strokeWidth={1.5} /> Ajouter une ligne
              </button>
              <button onClick={() => setShowRdv(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-light/40 hover:text-light border border-gold/15 hover:border-gold/30 px-3 py-1.5 transition-colors">
                <CalendarDays size={11} strokeWidth={1.5} /> Importer RDV {showRdv ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              </button>
              <button onClick={() => setShowTodo(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-light/40 hover:text-light border border-gold/15 hover:border-gold/30 px-3 py-1.5 transition-colors">
                <CheckSquare size={11} strokeWidth={1.5} /> Importer tâches {showTodo ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              </button>
            </div>

            {showRdv && (
              <div className="border border-gold/10 p-4 flex flex-col gap-2">
                <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-1">Rendez-vous à facturer</p>
                {rdvs.length === 0 ? <p className="text-xs text-light/30">Aucun rendez-vous disponible.</p>
                  : rdvs.map(r => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.linkedRdvIds.includes(r.id)} onChange={() => toggleRdv(r)} className="accent-gold" />
                      <span className="text-sm text-light">{r.title} <span className="text-xs text-light/40">{r.date} · {r.time}</span></span>
                    </label>
                  ))}
              </div>
            )}

            {showTodo && (
              <div className="border border-gold/10 p-4 flex flex-col gap-2">
                <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-1">Tâches réalisées à facturer</p>
                {todos.filter(t => t.done).length === 0 ? <p className="text-xs text-light/30">Aucune tâche complétée.</p>
                  : todos.filter(t => t.done).map(t => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.linkedTodoIds.includes(t.id)} onChange={() => toggleTodo(t)} className="accent-gold" />
                      <span className="text-sm text-light">{t.title}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-light/40 uppercase tracking-wide">Notes <span className="normal-case text-light/30">(optionnel)</span></label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Conditions de paiement, mentions légales…" className="border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors resize-none" />
      </div>

      <div className="flex gap-3">
        <button onClick={save} className="bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">
          {invoice ? 'Enregistrer' : 'Créer la facture'}
        </button>
        <button onClick={onCancel} className="text-xs text-light/40 hover:text-light transition-colors px-3">Annuler</button>
      </div>
    </div>
  )
}

// ─── SendModal ────────────────────────────────────────────────────────────────

function SendModal({ invoice, dossiers, userName, userEmail: initEmail, onClose }: {
  invoice: Invoice
  dossiers: SimpleDossier[]
  userName: string
  userEmail?: string
  onClose: () => void
}) {
  const { ht, tva, ttc, retenue, timbre, net } = computeAmounts(invoice)
  const dossierName = invoice.dossierId ? dossiers.find(d => d.id === invoice.dossierId)?.titre : undefined
  const fmtD = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const [toEmail, setToEmail] = useState(initEmail ?? '')
  const [copied, setCopied] = useState(false)
  const titleId = useId()

  // Focus trap — keyboard navigation stays inside the modal (WCAG 2.1.2)
  const dialogRef = useFocusTrap(true)

  // Cleanup: clear the copied timer if the modal unmounts before it fires
  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const subject = `Note d'honoraires N° ${invoice.number} — Maître Mokadmi Sami`
  const msgLines = [
    `Madame, Monsieur ${userName},`,
    ``,
    `Veuillez trouver ci-dessous votre note d'honoraires.`,
    ``,
    `Référence    : ${invoice.number}`,
    `Émission     : ${fmtD(invoice.dateEmission)}`,
    `Échéance     : ${fmtD(invoice.dateEcheance)}`,
    ...(dossierName ? [`Dossier      : ${dossierName}`] : []),
    ``,
    `——— Détail fiscal ———`,
    `Montant HT   : ${fmtAmount(ht, invoice.currency)}`,
    ...(invoice.tvaRate > 0 ? [`TVA (${invoice.tvaRate} %)  : + ${fmtAmount(tva, invoice.currency)}`] : []),
    `Montant TTC  : ${fmtAmount(ttc, invoice.currency)}`,
    ...(invoice.retenueRate > 0 ? [`Retenue (${invoice.retenueRate} %): − ${fmtAmount(retenue, invoice.currency)}`] : []),
    ...(invoice.timbreFiscal > 0 ? [`Timbre fiscal : + ${fmtAmount(timbre, invoice.currency)}`] : []),
    ``,
    `NET À PAYER  : ${fmtAmount(net, invoice.currency)}`,
    ...(invoice.notes ? [``, `Notes : ${invoice.notes}`] : []),
    ``,
    `Cordialement,`,
    `Maître Mokadmi Sami · Avocat — Droit des Affaires & Tech`,
    `Bloc B Espace Tunis Monplaisir 1073 Tunis · office@mokadmi.lawyer · +216 29784651`,
  ]
  const body = msgLines.join('\n')
  const mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  const copy = () => {
    navigator.clipboard.writeText(body).then(() => setCopied(true))
  }

  return (
    /*
     * The backdrop is NOT aria-hidden — it contains the dialog.
     * aria-modal="true" on the inner div is what tells AT to ignore background content.
     * Putting aria-hidden on the backdrop would hide the dialog from screen readers.
     */
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-dark-surface border border-gold/10 w-full max-w-lg flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10 flex-none">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-0.5">Envoi par email</p>
            <p id={titleId} className="text-sm font-semibold text-light">Facture {invoice.number}</p>
          </div>
          <button onClick={onClose} aria-label="Fermer la modale" className="text-light/30 hover:text-light transition-colors"><X size={16} strokeWidth={1.5} /></button>
        </div>
        <div className="px-6 py-4 border-b border-gold/10 flex-none">
          <label className="text-xs font-medium text-light/40 uppercase tracking-wide block mb-1.5">Destinataire</label>
          <input
            type="email"
            value={toEmail}
            onChange={e => setToEmail(e.target.value)}
            placeholder="email@client.com"
            className="w-full border-b border-gold/15 bg-transparent py-2 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div className="px-6 py-3 border-b border-gold/10 flex-none">
          <p className="text-[10px] text-light/40 uppercase tracking-wide mb-0.5">Objet</p>
          <p className="text-sm text-light">{subject}</p>
        </div>
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-0">
          <p className="text-[10px] font-medium text-light/40 uppercase tracking-wide mb-2">Message</p>
          <pre className="text-xs text-light/70 leading-relaxed whitespace-pre-wrap font-sans bg-dark-card border border-gold/10 p-4">{body}</pre>
        </div>
        <div className="px-6 py-4 border-t border-gold/10 flex gap-3 flex-wrap flex-none">
          <a href={mailtoUrl} className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-5 py-2.5 hover:bg-gold/90 transition-colors">
            <Mail size={12} strokeWidth={1.5} /> Ouvrir dans la messagerie
          </a>
          <button onClick={copy} className="flex items-center gap-2 text-xs font-medium text-light/50 border border-gold/15 px-4 py-2.5 hover:text-light hover:border-gold/30 transition-colors">
            <Copy size={12} strokeWidth={1.5} /> {copied ? '✓ Copié !' : 'Copier le message'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── InvoiceDetail ────────────────────────────────────────────────────────────

function InvoiceDetail({ invoice, dossiers, userName, userCompany, userEmail, onBack, onEdit }: {
  invoice: Invoice
  dossiers: SimpleDossier[]
  userName: string
  userCompany?: string
  userEmail?: string
  onBack: () => void
  onEdit: () => void
}) {
  const [showSend,   setShowSend]   = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const { ht, tva, ttc, retenue, timbre, net } = computeAmounts(invoice)
  const { label, cls } = STATUS_MAP[invoice.status]
  const dossierName = invoice.dossierId ? dossiers.find(d => d.id === invoice.dossierId)?.titre : undefined
  const sym  = CURRENCIES[invoice.currency]?.symbol ?? invoice.currency
  const fmtD = (s: string) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const handlePrint = () => {
    const style = document.createElement('style')
    style.id = '__inv_print__'
    style.textContent = `@media print {
      header, aside, nav, [data-print-hide] { display: none !important; }
      main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }`
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById('__inv_print__')?.remove(), 800)
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadInvoicePdf(invoice, userName, userCompany, dossierName)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <>
      {showSend && (
        <SendModal invoice={invoice} dossiers={dossiers} userName={userName} userEmail={userEmail} onClose={() => setShowSend(false)} />
      )}
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 print:hidden" data-print-hide>
        <button onClick={onBack} className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors">
          <ArrowLeft size={13} strokeWidth={1.5} /> Retour
        </button>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={onEdit} className="flex items-center gap-1.5 text-xs font-medium text-light/50 border border-gold/15 px-3 py-1.5 hover:text-light hover:border-gold/30 transition-colors">
            <Pencil size={11} strokeWidth={1.5} /> Modifier
          </button>
          <button onClick={() => setShowSend(true)} className="flex items-center gap-1.5 text-xs font-medium text-light/50 border border-gold/15 px-3 py-1.5 hover:text-light hover:border-gold/30 transition-colors">
            <Send size={11} strokeWidth={1.5} /> Envoyer
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-medium text-light/50 border border-gold/15 px-3 py-1.5 hover:text-light hover:border-gold/30 transition-colors">
            <Printer size={11} strokeWidth={1.5} /> Imprimer
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 text-xs font-medium bg-gold text-dark-bg px-3 py-1.5 hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download size={11} strokeWidth={1.5} />
            {pdfLoading ? 'Génération…' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      <div className="border border-gold/10 p-8 flex flex-col gap-8 print:border-none print:p-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-serif text-xl font-semibold text-light">Maître Mokadmi Sami</p>
            <p className="text-xs text-light/50 mt-0.5">Avocat — Droit des Affaires & Tech</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-1">Note d'honoraires</p>
            <p className="font-mono font-semibold text-light text-lg">{invoice.number}</p>
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
              <span className="text-[10px] text-light/40 border border-gold/10 px-1.5 py-0.5">{sym}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gold/10" />

        {/* Client & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div>
            <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-2">Facturé à</p>
            <p className="text-sm font-semibold text-light">{userName}</p>
            {userCompany && <p className="text-xs text-light/50">{userCompany}</p>}
            {dossierName && (
              <p className="flex items-center gap-1 text-xs text-light/40 mt-1">
                <FolderOpen size={10} strokeWidth={1.5} /> {dossierName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end">
            <div className="flex gap-4 sm:gap-6 w-full sm:justify-end">
              <p className="text-xs text-light/40">Date d'émission</p>
              <p className="text-xs font-medium text-light">{fmtD(invoice.dateEmission)}</p>
            </div>
            <div className="flex gap-4 sm:gap-6 w-full sm:justify-end">
              <p className="text-xs text-light/40">Date d'échéance</p>
              <p className="text-xs font-medium text-light">{fmtD(invoice.dateEcheance)}</p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[480px] px-4 sm:px-0">
          <div className="bg-dark-card grid grid-cols-[1fr_64px_96px_96px] gap-4 px-4 py-2.5">
            {['Description', 'Qté / h', `PU HT (${sym})`, `Total HT`].map((h, i) => (
              <p key={h} className={`text-xs font-semibold text-light ${i > 0 ? 'text-right' : ''}`}>{h}</p>
            ))}
          </div>
          <div className="flex flex-col gap-px bg-gold/10">
            {invoice.lines.map(l => (
              <div key={l.id} className="bg-dark-surface grid grid-cols-[1fr_64px_96px_96px] gap-4 px-4 py-3">
                <p className="text-sm text-light">{l.description || '—'}</p>
                <p className="text-sm text-light text-right">{l.quantity}</p>
                <p className="text-sm text-light text-right">{fmtAmount(l.unitPrice, invoice.currency)}</p>
                <p className="text-sm font-medium text-light text-right">{fmtAmount(lineTotal(l), invoice.currency)}</p>
              </div>
            ))}
          </div>
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
            <div className="h-px bg-gold/10" />
            <div>
              <p className="text-xs font-medium text-light/40 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-xs text-light/60 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </>
        )}

        <div className="h-px bg-gold/10" />
        <p className="text-xs text-light/30 text-center">Maître Mokadmi Sami · Avocat · Bloc B Espace Tunis Monplaisir 1073 Tunis · office@mokadmi.lawyer · +216 29784651</p>
      </div>
    </div>
    </>
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
  userEmail?: string
}

export default function BillingModule({ invoices, setInvoices, rdvs, todos, dossiers, userId, userName, userCompany, userEmail }: Props) {
  const [view,      setView]      = useState<'list' | 'form' | 'detail'>('list')
  const [selected,  setSelected]  = useState<Invoice | null>(null)
  const [sendInv,   setSendInv]   = useState<Invoice | null>(null)

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
    return <InvoiceDetail invoice={selected} dossiers={dossiers} userName={userName} userCompany={userCompany} userEmail={userEmail} onBack={() => setView('list')} onEdit={() => setView('form')} />

  // ── List ──
  const sorted = [...invoices].sort((a, b) => b.dateEmission.localeCompare(a.dateEmission))

  return (
    <>
    {sendInv && (
      <SendModal invoice={sendInv} dossiers={dossiers} userName={userName} userEmail={userEmail} onClose={() => setSendInv(null)} />
    )}
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-light/40 mb-2">Facturation</p>
          <h2 className="font-serif text-2xl text-light">Notes d'honoraires</h2>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-medium px-4 py-2.5 hover:bg-gold/90 transition-colors flex-none">
          <Plus size={13} strokeWidth={1.5} /> Nouvelle facture
        </button>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gold/10">
          {[
            { label: 'Factures',   value: String(invoices.length) },
            { label: 'En attente', value: String(invoices.filter(i => i.status === 'envoyee' || i.status === 'en_retard').length) },
            { label: 'Payées',     value: String(invoices.filter(i => i.status === 'payee').length) },
            { label: 'En retard',  value: String(invoices.filter(i => i.status === 'en_retard').length) },
          ].map(s => (
            <div key={s.label} className="bg-dark-surface p-5">
              <p className="text-xs text-light/40 uppercase tracking-wide mb-1">{s.label}</p>
              <p className="font-serif text-xl font-semibold text-light">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="border border-dashed border-gold/15 px-8 py-12 flex flex-col items-center text-center gap-3">
          <Receipt size={28} strokeWidth={1.25} className="text-light/20" />
          <p className="text-sm font-medium text-light">Aucune note d'honoraires</p>
          <p className="text-xs text-light/40 max-w-xs leading-relaxed">
            Créez votre première facture. Vous pouvez y associer un dossier, des rendez-vous ou des tâches réalisées.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-gold/10">
          {sorted.map(inv => {
            const { net } = computeAmounts(inv)
            const { label, cls } = STATUS_MAP[inv.status]
            const dossierName = inv.dossierId ? dossiers.find(d => d.id === inv.dossierId)?.titre : undefined
            return (
              <div key={inv.id} className="bg-dark-surface px-6 py-4 flex items-center gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold text-light font-mono">{inv.number}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 border ${cls}`}>{label}</span>
                    <span className="text-[10px] text-light/30 border border-gold/10 px-1.5 py-0.5">{inv.currency}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-light/40">
                      {new Date(inv.dateEmission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {dossierName && (
                      <span className="flex items-center gap-1 text-[10px] text-light/40 border border-gold/10 px-1.5 py-0.5">
                        <FolderOpen size={9} strokeWidth={1.5} /> {dossierName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-none text-right">
                  <p className="text-sm font-semibold text-light">{fmtAmount(net, inv.currency)}</p>
                  <p className="text-[10px] text-light/40">net à payer</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openView(inv)} title="Voir"      className="text-light/30 hover:text-light p-1.5 transition-colors"><ChevronRight size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => setSendInv(inv)} title="Envoyer" className="text-light/30 hover:text-light p-1.5 transition-colors"><Send size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => downloadInvoicePdf(inv, userName, userCompany)} title="Télécharger PDF" className="text-light/30 hover:text-gold p-1.5 transition-colors"><Download size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => { setSelected(inv); setView('detail'); setTimeout(() => { const s = document.createElement('style'); s.id = '__inv_print__'; s.textContent = '@media print { header, aside, nav, [data-print-hide] { display: none !important; } main { max-width: 100% !important; padding: 0 !important; margin: 0 !important; } }'; document.head.appendChild(s); window.print(); setTimeout(() => document.getElementById('__inv_print__')?.remove(), 800) }, 50) }} title="Imprimer" className="text-light/30 hover:text-light p-1.5 transition-colors"><Printer size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => openEdit(inv)} title="Modifier"  className="text-light/30 hover:text-light p-1.5 transition-colors"><Pencil size={13} strokeWidth={1.5} /></button>
                  <button onClick={() => del(inv.id)}   title="Supprimer" className="text-light/20 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={13} strokeWidth={1.5} /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
