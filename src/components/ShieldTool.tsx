import { useState } from 'react'
import {
  ShieldCheck, FileText, Search, Radar, Library, FileSignature,
  ChevronRight, Download, AlertTriangle, CheckCircle2, Loader2,
  TriangleAlert, Copy, Check
} from 'lucide-react'

// ── Disclaimer constant ───────────────────────────────────────────────────────
const DISCLAIMER = "Cet outil fournit des modèles et des informations générales uniquement. Il ne constitue pas un conseil juridique. Consultez un avocat qualifié avant toute utilisation."

// ── API call via proxy serverless (clé API côté serveur) ─────────────────────
async function callAI(prompt: string, maxTokens = 2000): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
  if (!data.text) throw new Error('Réponse vide du serveur')
  return data.text
}

// ── DOCX-like download (plain text formatted) ─────────────────────────────────
function downloadAsDocx(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename + '.txt'
  a.click(); URL.revokeObjectURL(url)
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls = 'w-full border-b border-gold/15 bg-transparent py-2.5 text-sm text-light placeholder:text-light/25 focus:outline-none focus:border-gold/50 transition-colors'
const labelCls = 'text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-2'
const selectCls = 'w-full border-b border-gold/15 bg-dark-surface py-2.5 text-sm text-light focus:outline-none focus:border-gold/50 transition-colors appearance-none cursor-pointer'
const btnPrimary = 'flex items-center gap-2 bg-gold text-dark-bg text-xs font-semibold px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

// ── DisclaimerBanner ──────────────────────────────────────────────────────────
function DisclaimerBanner() {
  return (
    <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 px-4 py-3">
      <TriangleAlert size={14} strokeWidth={1.5} className="text-amber-400 flex-none mt-0.5" />
      <p className="text-xs text-amber-400/80 leading-relaxed">{DISCLAIMER}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONTRACT GENERATOR
// ══════════════════════════════════════════════════════════════════════════════
function ContractGenerator() {
  const [form, setForm] = useState({
    projectType: '', clientType: '', paymentTerms: '',
    projectValue: '', deliverable1: '', deliverable2: '', deliverable3: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState('')
  const [copied, setCopied]   = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const generate = async () => {
    const { projectType, clientType, paymentTerms, projectValue, deliverable1, deliverable2, deliverable3 } = form
    if (!projectType || !clientType || !paymentTerms || !projectValue) return
    setLoading(true); setResult('')
    try {
      const deliverables = [deliverable1, deliverable2, deliverable3].filter(Boolean).join('; ')
      const prompt = `Generate a professional freelance contract in French for the following:
- Project type: ${projectType}
- Client type: ${clientType}
- Payment terms: ${paymentTerms}
- Project value: ${projectValue} DT
- Deliverables: ${deliverables}

The contract must include these sections:
1. PARTIES ET OBJET
2. PÉRIMÈTRE DES PRESTATIONS (liste des livrables)
3. PROPRIÉTÉ INTELLECTUELLE (cession complète à réception du paiement)
4. CALENDRIER ET MODALITÉS DE PAIEMENT (avec pénalités de retard de 1.5%/mois)
5. POLITIQUE DE RÉVISIONS (2 rounds inclus, facturation au-delà)
6. CONFIDENTIALITÉ
7. RÉSILIATION (préavis 15 jours, facturation du travail effectué)
8. LOI APPLICABLE (droit tunisien, tribunaux de Tunis)
9. SIGNATURES

Write in formal French legal language. Format clearly with article numbers. Include blanks like [DATE], [NOM CLIENT], [ADRESSE CLIENT] where needed. Be specific and protective of the freelancer.`
      const text = await callAI(prompt, 2500)
      setResult(text)
    } catch (e) { setResult('Erreur : ' + (e instanceof Error ? e.message : 'Réessayez')) }
    finally { setLoading(false) }
  }

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerBanner />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Type de projet *</label>
          <select value={form.projectType} onChange={set('projectType')} className={selectCls}>
            <option value="">— Sélectionner —</option>
            {['Développement web', 'Rédaction / Copywriting', 'Design graphique', 'Consulting', 'Photographie', 'Autre'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Type de client *</label>
          <select value={form.clientType} onChange={set('clientType')} className={selectCls}>
            <option value="">— Sélectionner —</option>
            {['Particulier', 'TPE / PME', 'Grande entreprise', 'Startup', 'Institution publique'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Modalités de paiement *</label>
          <select value={form.paymentTerms} onChange={set('paymentTerms')} className={selectCls}>
            <option value="">— Sélectionner —</option>
            <option value="Forfait fixe (50% avance, 50% livraison)">Forfait fixe — 50% / 50%</option>
            <option value="Jalons (3 paiements à 33%)">Jalons — 3 × 33%</option>
            <option value="Retainer mensuel">Retainer mensuel</option>
            <option value="Paiement intégral à la livraison">Paiement intégral à livraison</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Valeur du projet (DT) *</label>
          <input type="text" value={form.projectValue} onChange={set('projectValue')} placeholder="Ex : 5000" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Livrable 1</label>
          <input type="text" value={form.deliverable1} onChange={set('deliverable1')} placeholder="Ex : Site web 5 pages responsive avec CMS" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Livrable 2</label>
          <input type="text" value={form.deliverable2} onChange={set('deliverable2')} placeholder="Ex : Formation à l'administration du site (2h)" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Livrable 3 <span className="normal-case text-light/20">(optionnel)</span></label>
          <input type="text" value={form.deliverable3} onChange={set('deliverable3')} placeholder="Ex : Maintenance 3 mois incluse" className={inputCls} />
        </div>
      </div>

      <button onClick={generate} disabled={loading || !form.projectType || !form.clientType || !form.paymentTerms || !form.projectValue} className={btnPrimary}>
        {loading ? <><Loader2 size={13} className="animate-spin" /> Génération en cours…</> : <><FileText size={13} strokeWidth={1.5} /> Générer le contrat</>}
      </button>

      {result && (
        <div className="border border-gold/15 bg-dark-bg flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10">
            <p className="text-xs font-semibold text-light">Contrat généré</p>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 text-xs text-light/40 hover:text-light border border-gold/15 px-3 py-1.5 transition-colors">
                {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
              </button>
              <button onClick={() => downloadAsDocx(result, `Contrat_${form.projectType.replace(/\s/g,'_')}`)} className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold border border-gold/20 px-3 py-1.5 transition-colors">
                <Download size={11} strokeWidth={1.5} /> Télécharger
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs text-light/70 leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-96">{result}</pre>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. CONTRACT REVIEWER
// ══════════════════════════════════════════════════════════════════════════════
interface ClauseFlag { rank: number; title: string; risk: 'high' | 'medium' | 'low'; excerpt: string; issue: string; alternative: string }

function ContractReviewer() {
  const [text, setText]     = useState('')
  const [loading, setLoading] = useState(false)
  const [flags, setFlags]   = useState<ClauseFlag[]>([])
  const [summary, setSummary] = useState('')

  const review = async () => {
    if (text.trim().length < 100) return
    setLoading(true); setFlags([]); setSummary('')
    try {
      const prompt = `You are a senior French-speaking business lawyer. Analyze this contract and return ONLY valid JSON (no markdown, no explanation):

CONTRACT:
${text.substring(0, 6000)}

Return this exact JSON structure:
{
  "summary": "2-sentence overall assessment in French",
  "flags": [
    {
      "rank": 1,
      "title": "Nom de la clause en français",
      "risk": "high|medium|low",
      "excerpt": "Citation exacte de 1-2 phrases de la clause",
      "issue": "Explication du problème en 2 phrases en français",
      "alternative": "Reformulation alternative proposée en français"
    }
  ]
}
Return exactly 5 flags ranked by risk (1=highest). JSON only, no markdown.`
      const raw = await callAI(prompt, 2000)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setFlags(parsed.flags ?? [])
      setSummary(parsed.summary ?? '')
    } catch (e) { setSummary('Erreur : ' + (e instanceof Error ? e.message : 'Réessayez')) }
    finally { setLoading(false) }
  }

  const riskColor = (r: string) => r === 'high' ? 'text-red-400 border-red-500/20 bg-red-500/5' : r === 'medium' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
  const riskLabel = (r: string) => r === 'high' ? 'RISQUE ÉLEVÉ' : r === 'medium' ? 'RISQUE MOYEN' : 'RISQUE FAIBLE'

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerBanner />
      <div>
        <label className={labelCls}>Collez le contrat à analyser</label>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={10}
          placeholder="Collez ici le texte intégral du contrat reçu…&#10;&#10;(minimum 100 caractères pour une analyse pertinente)"
          className="w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/25 p-4 resize-y transition-colors font-mono" />
        <p className="text-[10px] text-light/25 mt-1">{text.length} caractères</p>
      </div>

      <button onClick={review} disabled={loading || text.trim().length < 100} className={btnPrimary}>
        {loading ? <><Loader2 size={13} className="animate-spin" /> Analyse en cours…</> : <><Search size={13} strokeWidth={1.5} /> Analyser le contrat</>}
      </button>

      {summary && (
        <div className="border border-gold/15 bg-dark-surface px-4 py-4">
          <p className="text-[10px] text-gold/50 tracking-widest uppercase mb-2">Synthèse globale</p>
          <p className="text-sm text-light/70 leading-relaxed">{summary}</p>
        </div>
      )}

      {flags.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-[10px] text-light/35 tracking-widest uppercase">5 clauses à surveiller — classées par risque</p>
          {flags.map((f, i) => (
            <div key={i} className={`border rounded-none p-4 flex flex-col gap-3 ${riskColor(f.risk)}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-light/30 border border-light/10 px-1.5 py-0.5">#{f.rank}</span>
                  <p className="text-sm font-semibold text-light">{f.title}</p>
                </div>
                <span className={`text-[8px] font-bold tracking-widest px-2 py-1 border ${riskColor(f.risk)}`}>{riskLabel(f.risk)}</span>
              </div>
              {f.excerpt && <blockquote className="text-[11px] text-light/40 italic border-l-2 border-current pl-3 leading-relaxed">« {f.excerpt} »</blockquote>}
              <div>
                <p className="text-[10px] text-light/40 tracking-widest uppercase mb-1">Problème identifié</p>
                <p className="text-xs text-light/65 leading-relaxed">{f.issue}</p>
              </div>
              <div className="bg-dark-bg/50 p-3 border-l-2 border-emerald-500/40">
                <p className="text-[10px] text-emerald-400/60 tracking-widest uppercase mb-1">Alternative proposée</p>
                <p className="text-xs text-light/65 leading-relaxed italic">{f.alternative}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. RISK RADAR
// ══════════════════════════════════════════════════════════════════════════════
interface RiskItem { title: string; level: 'critical' | 'high' | 'medium'; explanation: string; mitigation: string }

function RiskRadar() {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [risks, setRisks] = useState<RiskItem[]>([])

  const analyze = async () => {
    if (description.trim().length < 20) return
    setLoading(true); setRisks([])
    try {
      const prompt = `You are a French business law expert. Based on this freelance business description, identify the top 5 legal exposure areas.

DESCRIPTION: ${description}

Return ONLY valid JSON (no markdown):
{
  "risks": [
    {
      "title": "Nom du risque juridique en français",
      "level": "critical|high|medium",
      "explanation": "Explication d'un paragraphe du risque concret en français",
      "mitigation": "Mesure concrète de mitigation en 1-2 phrases en français"
    }
  ]
}
Focus on: requalification en contrat de travail, responsabilité contractuelle, propriété intellectuelle, fiscalité, protection des données. Be specific to Tunisian/French law context. JSON only.`
      const raw = await callAI(prompt, 1500)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setRisks(parsed.risks ?? [])
    } catch { setRisks([{ title: 'Erreur d\'analyse', level: 'medium', explanation: 'Impossible d\'analyser. Réessayez.', mitigation: '' }]) }
    finally { setLoading(false) }
  }

  const levelStyle = (l: string) =>
    l === 'critical' ? { bar: 'bg-red-500', label: 'CRITIQUE', text: 'text-red-400' } :
    l === 'high'     ? { bar: 'bg-amber-400', label: 'ÉLEVÉ',   text: 'text-amber-400' } :
                       { bar: 'bg-blue-400',  label: 'MOYEN',   text: 'text-blue-400' }

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerBanner />
      <div>
        <label className={labelCls}>Décrivez votre activité freelance en 3 phrases</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
          placeholder="Ex : Je suis développeur web freelance basé en Tunisie. Je travaille principalement avec des clients PME en France et en Belgique sur des projets de refonte de sites e-commerce. J'utilise des sous-traitants pour les phases de design et de rédaction."
          className="w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/25 p-4 resize-none transition-colors" />
      </div>

      <button onClick={analyze} disabled={loading || description.trim().length < 20} className={btnPrimary}>
        {loading ? <><Loader2 size={13} className="animate-spin" /> Analyse en cours…</> : <><Radar size={13} strokeWidth={1.5} /> Identifier mes risques</>}
      </button>

      {risks.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-[10px] text-light/35 tracking-widest uppercase">Vos 5 principales expositions juridiques</p>
          {risks.map((r, i) => {
            const s = levelStyle(r.level)
            return (
              <div key={i} className="border border-gold/10 bg-dark-surface p-5 flex gap-4">
                <div className="flex flex-col items-center gap-1 flex-none pt-1">
                  <div className={`w-1 h-12 ${s.bar} rounded-full`} />
                  <span className={`text-[8px] font-bold ${s.text} writing-mode-vertical`}>{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-light">{r.title}</p>
                    <span className={`text-[8px] font-bold tracking-widest ${s.text}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-light/55 leading-relaxed mb-3">{r.explanation}</p>
                  {r.mitigation && (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={12} strokeWidth={1.5} className="text-emerald-400/70 flex-none mt-0.5" />
                      <p className="text-xs text-emerald-400/70 leading-relaxed">{r.mitigation}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. TEMPLATE LIBRARY
// ══════════════════════════════════════════════════════════════════════════════
const TEMPLATES = [
  { id: 1, title: 'Contrat de prestation de services', category: 'Généraliste', desc: 'Contrat socle pour toute mission de service — consultable et adaptable.' },
  { id: 2, title: 'Lettre de mission — Développement web', category: 'Tech', desc: 'Mission de développement avec clauses de propriété intellectuelle renforcées.' },
  { id: 3, title: 'Contrat de design graphique', category: 'Créatif', desc: 'Couvre les livrables créatifs, cession de droits et révisions.' },
  { id: 4, title: 'Mission de conseil / Consulting', category: 'Conseil', desc: 'Recommandations, limitations de responsabilité, obligation de moyens vs résultat.' },
  { id: 5, title: 'Contrat de rédaction / Copywriting', category: 'Rédaction', desc: 'Droits d\'auteur, exclusivité, délais de publication et pénalités.' },
  { id: 6, title: 'Contrat de photographie', category: 'Créatif', desc: 'Droits d\'utilisation des images, durée, territoire, usage commercial.' },
  { id: 7, title: 'Contrat de sous-traitance', category: 'Tech', desc: 'Encadre la relation entre freelance principal et sous-traitant.' },
  { id: 8, title: 'Accord de collaboration créative', category: 'Créatif', desc: 'Co-création, partage des droits et répartition des revenus.' },
  { id: 9, title: 'Contrat de maintenance / Support', category: 'Tech', desc: 'SLA, délais d\'intervention, exclusions de responsabilité.' },
  { id: 10, title: 'Lettre de résiliation de mission', category: 'Généraliste', desc: 'Résiliation à l\'initiative du freelance, préavis et facturation du travail effectué.' },
]

function TemplateLibrary() {
  const [generating, setGenerating] = useState<number | null>(null)

  const generate = async (t: typeof TEMPLATES[0]) => {
    setGenerating(t.id)
    try {
      const prompt = `Génère un modèle complet de "${t.title}" en français, droit tunisien applicable, pour un freelance.

Le contrat doit être professionnel, protecteur du prestataire, avec tous les articles standards : parties, objet, prix, paiement, PI, confidentialité, résiliation, loi applicable. Utilise [VARIABLE] pour les champs à remplir. Format structuré avec numéros d'articles.`
      const text = await callAI(prompt, 2000)
      downloadAsDocx(text, t.title.replace(/\s/g, '_'))
    } catch (e) { alert('Erreur : ' + (e instanceof Error ? e.message : 'Réessayez')) }
    finally { setGenerating(null) }
  }

  const catColor: Record<string, string> = {
    'Généraliste': 'text-blue-400/70 border-blue-400/20',
    'Tech': 'text-emerald-400/70 border-emerald-500/20',
    'Créatif': 'text-purple-400/70 border-purple-500/20',
    'Conseil': 'text-gold/60 border-gold/20',
    'Rédaction': 'text-orange-400/70 border-orange-500/20',
  }

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerBanner />
      <p className="text-xs text-light/35">10 modèles de contrats — générés à la demande et téléchargeables.</p>
      <div className="flex flex-col gap-px bg-gold/8">
        {TEMPLATES.map(t => (
          <div key={t.id} className="bg-dark-surface px-5 py-4 flex items-center gap-4 hover:bg-dark-card transition-colors group">
            <div className="w-7 h-7 border border-gold/10 flex items-center justify-center flex-none bg-dark-bg">
              <span className="text-[10px] font-bold text-light/25">{String(t.id).padStart(2, '0')}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-light">{t.title}</p>
                <span className={`text-[8px] font-bold tracking-widest border px-1.5 py-0.5 hidden sm:inline ${catColor[t.category] ?? 'text-light/30 border-light/10'}`}>{t.category}</span>
              </div>
              <p className="text-xs text-light/35">{t.desc}</p>
            </div>
            <button onClick={() => generate(t)} disabled={generating === t.id}
              className="flex items-center gap-1.5 text-xs text-light/40 hover:text-gold border border-gold/10 hover:border-gold/30 px-3 py-1.5 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40 flex-none">
              {generating === t.id ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} strokeWidth={1.5} />}
              {generating === t.id ? 'Génération…' : 'Télécharger'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. NDA GENERATOR
// ══════════════════════════════════════════════════════════════════════════════
function NdaGenerator() {
  const [form, setForm] = useState({ party1: '', party2: '', scope: '', duration: '', type: 'mutual' })
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState('')
  const [copied, setCopied]   = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const generate = async () => {
    if (!form.party1 || !form.party2 || !form.scope || !form.duration) return
    setLoading(true); setResult('')
    try {
      const prompt = `Génère un accord de confidentialité ${form.type === 'mutual' ? 'mutuel' : 'unilatéral'} en français, droit tunisien, entre :
- Partie 1 : ${form.party1}
- Partie 2 : ${form.party2}
- Périmètre des informations confidentielles : ${form.scope}
- Durée : ${form.duration}

L'accord doit couvrir : définition des informations confidentielles, obligations des parties, exceptions, durée et post-contrat, sanctions en cas de violation, loi applicable (droit tunisien, tribunaux de Tunis). Professionnel, complet, format structuré avec articles numérotés. Utilise [DATE] pour la date de signature.`
      const text = await callAI(prompt, 1500)
      setResult(text)
    } catch (e) { setResult('Erreur : ' + (e instanceof Error ? e.message : 'Réessayez')) }
    finally { setLoading(false) }
  }

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="flex flex-col gap-6">
      <DisclaimerBanner />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelCls}>Partie 1 (votre nom / société) *</label>
          <input type="text" value={form.party1} onChange={set('party1')} placeholder="Ex : Ahmed Ben Ali, développeur freelance" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Partie 2 (client / partenaire) *</label>
          <input type="text" value={form.party2} onChange={set('party2')} placeholder="Ex : Startup Tunisie SARL" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type d'accord</label>
          <select value={form.type} onChange={set('type')} className={selectCls}>
            <option value="mutual">Mutuel (les deux parties)</option>
            <option value="unilateral">Unilatéral (client → freelance)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Durée de confidentialité *</label>
          <select value={form.duration} onChange={set('duration')} className={selectCls}>
            <option value="">— Sélectionner —</option>
            <option value="1 an après la fin de la collaboration">1 an</option>
            <option value="2 ans après la fin de la collaboration">2 ans</option>
            <option value="3 ans après la fin de la collaboration">3 ans</option>
            <option value="5 ans après la fin de la collaboration">5 ans</option>
            <option value="indéfiniment">Indéfinie</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Périmètre des informations confidentielles *</label>
          <textarea value={form.scope} onChange={set('scope')} rows={3}
            placeholder="Ex : Codes source, architectures techniques, données clients, stratégies commerciales, projections financières, données personnelles traitées dans le cadre de la mission"
            className="w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/25 p-3 resize-none transition-colors" />
        </div>
      </div>

      <button onClick={generate} disabled={loading || !form.party1 || !form.party2 || !form.scope || !form.duration} className={btnPrimary}>
        {loading ? <><Loader2 size={13} className="animate-spin" /> Génération…</> : <><FileSignature size={13} strokeWidth={1.5} /> Générer l'accord NDA</>}
      </button>

      {result && (
        <div className="border border-gold/15 bg-dark-bg flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gold/10">
            <p className="text-xs font-semibold text-light">Accord de confidentialité généré</p>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 text-xs text-light/40 hover:text-light border border-gold/15 px-3 py-1.5 transition-colors">
                {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
              </button>
              <button onClick={() => downloadAsDocx(result, `NDA_${form.party1.replace(/\s/g,'_')}_${form.party2.replace(/\s/g,'_')}`)}
                className="flex items-center gap-1.5 text-xs text-gold/70 hover:text-gold border border-gold/20 px-3 py-1.5 transition-colors">
                <Download size={11} strokeWidth={1.5} /> Télécharger
              </button>
            </div>
          </div>
          <pre className="p-4 text-xs text-light/70 leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-96">{result}</pre>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SHIELD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const TOOLS = [
  { id: 'generator', label: 'Générateur', shortLabel: 'Contrat', icon: FileText, desc: 'Générez un contrat sur mesure en quelques clics' },
  { id: 'reviewer',  label: 'Réviseur',   shortLabel: 'Révision', icon: Search,    desc: 'Analysez un contrat entrant et identifiez les risques' },
  { id: 'radar',     label: 'Radar',      shortLabel: 'Radar',    icon: Radar,     desc: 'Cartographiez vos 5 principales expositions juridiques' },
  { id: 'library',   label: 'Bibliothèque', shortLabel: 'Modèles', icon: Library, desc: '10 modèles téléchargeables prêts à l\'emploi' },
  { id: 'nda',       label: 'NDA',        shortLabel: 'NDA',      icon: FileSignature, desc: 'Générez un accord de confidentialité en 30 secondes' },
] as const

type ToolId = typeof TOOLS[number]['id']

export default function ShieldTool() {
  const [active, setActive] = useState<ToolId>('generator')
  const current = TOOLS.find(t => t.id === active)!

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête Shield */}
      <div className="flex items-start gap-4 flex-wrap justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} strokeWidth={1.5} className="text-gold" />
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-gold/70">Shield</p>
          </div>
          <h2 className="font-serif text-2xl text-light">Protection Juridique Freelance</h2>
          <p className="text-xs text-light/35 mt-1 max-w-md">Contrats, analyses de risques et NDA — générés par IA, adaptés au droit tunisien et français.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={12} strokeWidth={1.5} className="text-amber-400 flex-none" />
          <p className="text-[10px] text-amber-400/70 font-medium">Outil d'information — non substitutif à un conseil juridique</p>
        </div>
      </div>

      {/* Navigation outils */}
      <div className="flex flex-wrap gap-px bg-gold/8">
        {TOOLS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors flex-1 justify-center min-w-[80px] ${
                active === t.id
                  ? 'bg-dark-card text-light border-b-2 border-gold'
                  : 'bg-dark-surface text-light/40 hover:text-light/70 hover:bg-dark-card'
              }`}>
              <Icon size={13} strokeWidth={1.5} />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden">{t.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Description de l'outil actif */}
      <div className="flex items-center gap-2 px-1">
        <ChevronRight size={12} strokeWidth={1.5} className="text-gold/40" />
        <p className="text-xs text-light/35">{current.desc}</p>
      </div>

      {/* Contenu */}
      {active === 'generator' && <ContractGenerator />}
      {active === 'reviewer'  && <ContractReviewer />}
      {active === 'radar'     && <RiskRadar />}
      {active === 'library'   && <TemplateLibrary />}
      {active === 'nda'       && <NdaGenerator />}
    </div>
  )
}
