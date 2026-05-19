import { useState } from 'react'
import {
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, Copy, Check, FileSearch,
  Loader2, Scale, Zap
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
export interface AFRBAnalysis {
  id: string
  clientId: string
  clientName: string
  scenario: string
  reciprocity: string
  enforcement: string
  personalExposure: string
  structuralThreat: string
  result: AFRBResult | null
  createdAt: string
}

interface RiskMatrix {
  overall_risk_level: string
  compliance_risk_level: string
  legal_exposure_level: string
  operational_risk_level: string
}

interface AFRBResult {
  case_context_summary: string
  observations: string
  inferences: string
  hypotheses: string
  risk_matrix: RiskMatrix
  afrb_classification: {
    field: string
    strategy: string
    risk_flags: string
  }
  recommended_actions: {
    immediate_next_steps: string
    documentation_checklist: string
    escalation_thresholds: string
  }
  missing_information: string
}

// ── Storage ───────────────────────────────────────────────────────────────────
export const AFRB_KEY = 'avocat_afrb_analyses'

export function getAFRBAnalyses(): AFRBAnalysis[] {
  try { return JSON.parse(localStorage.getItem(AFRB_KEY) ?? '[]') }
  catch { return [] }
}

function saveAnalysis(a: AFRBAnalysis) {
  const all = getAFRBAnalyses()
  const updated = [a, ...all.filter(x => x.id !== a.id)]
  localStorage.setItem(AFRB_KEY, JSON.stringify(updated))
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function callAI(prompt: string): Promise<string> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: 3000 }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? `Erreur ${res.status}`)
  return data.text ?? ''
}

const RISK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Faible':    { bg: 'bg-emerald-500/8',  text: 'text-emerald-400', border: 'border-emerald-500/25' },
  'Modéré':   { bg: 'bg-amber-500/8',    text: 'text-amber-400',   border: 'border-amber-500/25' },
  'Élevé':    { bg: 'bg-orange-500/8',   text: 'text-orange-400',  border: 'border-orange-500/25' },
  'Critique': { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30' },
}

function riskStyle(level: string) {
  const key = Object.keys(RISK_COLORS).find(k => level?.includes(k)) ?? 'Modéré'
  return RISK_COLORS[key]
}

const inputCls = 'w-full border-b border-gold/15 bg-transparent py-2.5 text-sm text-light placeholder:text-light/20 focus:outline-none focus:border-gold/40 transition-colors'
const labelCls = 'text-[10px] font-medium text-light/40 tracking-widest uppercase block mb-2'
const textareaCls = 'w-full border border-gold/10 bg-dark-bg text-sm text-light/80 leading-relaxed placeholder:text-light/20 focus:outline-none focus:border-gold/25 p-3 resize-y transition-colors'

// ── ResultBlock ───────────────────────────────────────────────────────────────
function ResultBlock({ result }: { result: AFRBResult }) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    context: true, matrix: true, afrb: true, actions: false, raw: false
  })
  const toggle = (k: string) => setOpen(o => ({ ...o, [k]: !o[k] }))

  const overall = riskStyle(result.risk_matrix.overall_risk_level)

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border border-gold/10 bg-dark-surface">
      <button onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-dark-card transition-colors">
        <p className="text-xs font-semibold text-light tracking-wide">{title}</p>
        {open[id] ? <ChevronUp size={13} className="text-light/30" /> : <ChevronDown size={13} className="text-light/30" />}
      </button>
      {open[id] && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  )

  const Field = ({ label, value, warn }: { label: string; value: string; warn?: boolean }) => (
    <div className="flex flex-col gap-1 py-3 border-b border-gold/8 last:border-0">
      <p className="text-[10px] font-medium text-light/35 tracking-widest uppercase">{label}</p>
      <p className={`text-xs leading-relaxed ${warn ? 'text-amber-400/80' : 'text-light/65'}`}>{value || '—'}</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* ── Niveau de risque global ───────────────────────────────────────── */}
      <div className={`border ${overall.border} ${overall.bg} px-5 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-light/40 mb-1">Risque global AFRB</p>
          <p className={`text-2xl font-bold ${overall.text}`}>{result.risk_matrix.overall_risk_level}</p>
        </div>
        <Scale size={28} strokeWidth={1} className={`${overall.text} opacity-40`} />
      </div>

      {/* ── Contexte & Observations ───────────────────────────────────────── */}
      <Section id="context" title="Contexte · Observations · Inférences">
        <Field label="Résumé du contexte" value={result.case_context_summary} />
        <Field label="Faits & clauses identifiées" value={result.observations} />
        <Field label="Inférences juridiques" value={result.inferences} />
        <Field label="Scénarios de crise" value={result.hypotheses} />
      </Section>

      {/* ── Matrice de risques ────────────────────────────────────────────── */}
      <Section id="matrix" title="Matrice de risques">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gold/8 mt-2">
          {[
            ['Conformité', result.risk_matrix.compliance_risk_level],
            ['Exposition juridique', result.risk_matrix.legal_exposure_level],
            ['Impact opérationnel', result.risk_matrix.operational_risk_level],
          ].map(([label, val]) => {
            const s = riskStyle(val)
            return (
              <div key={label} className={`bg-dark-bg px-4 py-4 ${s.bg} border-l-2 ${s.border}`}>
                <p className="text-[10px] text-light/35 uppercase tracking-widest mb-1.5">{label}</p>
                <p className={`text-sm font-bold ${s.text}`}>{val || '—'}</p>
              </div>
            )
          })}
        </div>
      </Section>

      {/* ── Classification AFRB ───────────────────────────────────────────── */}
      <Section id="afrb" title="Classification AFRB">
        <div className="flex items-center gap-2 mb-3 mt-1">
          <span className="text-[10px] font-bold text-gold/60 border border-gold/20 px-2 py-1 tracking-widest uppercase">
            {result.afrb_classification.field}
          </span>
        </div>
        <Field label="Stratégie recommandée" value={result.afrb_classification.strategy} />
        <div className="mt-3">
          <p className="text-[10px] font-medium text-light/35 tracking-widest uppercase mb-2">Clauses à risque identifiées</p>
          <div className="flex flex-col gap-1.5">
            {(result.afrb_classification.risk_flags || '').split(/[·•\-\n]/).filter(f => f.trim()).map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-400/75">
                <AlertTriangle size={11} strokeWidth={1.5} className="flex-none mt-0.5" />
                <span>{flag.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Actions recommandées ──────────────────────────────────────────── */}
      <Section id="actions" title="Plan d'action recommandé">
        <Field label="Priorités immédiates avant signature" value={result.recommended_actions.immediate_next_steps} warn />
        <Field label="Checklist documentaire" value={result.recommended_actions.documentation_checklist} />
        <div className="flex flex-col gap-1.5 mt-3">
          <p className="text-[10px] font-medium text-light/35 tracking-widest uppercase">Deal-breakers — Points de rupture</p>
          <div className={`border border-red-500/25 bg-red-500/5 px-4 py-3 mt-1`}>
            <p className="text-xs text-red-400/80 leading-relaxed">{result.recommended_actions.escalation_thresholds}</p>
          </div>
        </div>
        {result.missing_information && (
          <div className="mt-4 border border-amber-500/15 bg-amber-500/5 px-4 py-3">
            <p className="text-[10px] text-amber-400/60 uppercase tracking-widest mb-1">Informations manquantes</p>
            <p className="text-xs text-amber-400/70 leading-relaxed">{result.missing_information}</p>
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Formulaire d'analyse ──────────────────────────────────────────────────────
function AFRBForm({ clientId, clientName, onResult }: {
  clientId: string; clientName: string; onResult: (a: AFRBAnalysis) => void
}) {
  const [scenario,         setScenario]         = useState('')
  const [reciprocity,      setReciprocity]      = useState('')
  const [enforcement,      setEnforcement]      = useState('')
  const [personalExposure, setPersonalExposure] = useState('')
  const [structuralThreat, setStructuralThreat] = useState('')
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')

  const run = async () => {
    if (!scenario.trim()) return
    setLoading(true); setError('')

    const prompt = `Tu es un Moteur de Classification des Risques Juridiques & de Conformité, basé strictement sur la logique structurelle AFRB, spécialisé en droit des affaires tunisien et français et dans l'audit des pactes d'actionnaires.

Classifie le scénario suivant en utilisant une évaluation structurelle déterministe.

### SCÉNARIO
${scenario}

### Évaluations fournies
- **Réciprocité des engagements (Reciprocity) :** ${reciprocity || 'Non renseignée — déduire du scénario'}
- **Force exécutoire & Sanctions :** ${enforcement || 'Non renseignée — déduire du scénario'}
- **Niveau d'exposition personnelle :** ${personalExposure || 'Non renseignée — déduire du scénario'}
- **Sévérité de la menace structurelle :** ${structuralThreat || 'Non renseignée — déduire du scénario'}

Applique la logique AFRB strictement au droit des sociétés tunisien (Code des Sociétés Commerciales, COC) et français (Code de commerce).
Renvoie UNIQUEMENT un objet JSON valide (sans markdown, sans backticks) avec exactement ces champs :

{
  "case_context_summary": "Résumé du contexte société, table de capitalisation et typologies d'actionnaires.",
  "observations": "Faits bruts et clauses identifiées textuellement.",
  "inferences": "Déductions juridiques sur les intentions cachées ou déséquilibres contractuels.",
  "hypotheses": "Scénarios de crise envisagés (activation droit de veto, conflit gouvernance, sortie forcée).",
  "risk_matrix": {
    "overall_risk_level": "Faible | Modéré | Élevé | Critique",
    "compliance_risk_level": "Description du risque de non-conformité",
    "legal_exposure_level": "Description de l'exposition juridique et financière",
    "operational_risk_level": "Description du risque de blocage opérationnel"
  },
  "afrb_classification": {
    "field": "Domaine AFRB principal (Gouvernance / Liquidité / Droits Financiers / Protection des Minoritaires)",
    "strategy": "Stratégie de négociation ou d'amendement recommandée",
    "risk_flags": "Liste des clauses abusives ou hautement risquées, séparées par ·"
  },
  "recommended_actions": {
    "immediate_next_steps": "Modifications prioritaires à exiger avant signature",
    "documentation_checklist": "Pièces et annexes à vérifier impérativement",
    "escalation_thresholds": "Deal-breakers non négociables déclenchant arrêt des négociations"
  },
  "missing_information": "Éléments manquants pour compléter l'analyse"
}

JSON uniquement, sans aucun texte avant ou après.`

    try {
      const raw = await callAI(prompt)
      const cleaned = raw.replace(/```json|```/g, '').trim()
      const result: AFRBResult = JSON.parse(cleaned)

      const analysis: AFRBAnalysis = {
        id: crypto.randomUUID(),
        clientId, clientName, scenario,
        reciprocity, enforcement, personalExposure, structuralThreat,
        result, createdAt: new Date().toISOString(),
      }
      saveAnalysis(analysis)
      onResult(analysis)
    } catch (e) {
      setError('Erreur d\'analyse : ' + (e instanceof Error ? e.message : 'Réessayez'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Disclaimer */}
      <div className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <AlertTriangle size={13} strokeWidth={1.5} className="text-amber-400 flex-none mt-0.5" />
        <p className="text-xs text-amber-400/80 leading-relaxed">
          Cet outil produit une analyse structurelle automatisée. Il ne se substitue pas à l'examen juridique approfondi d'un avocat. Toute décision de signature doit être validée par Maître Mokadmi.
        </p>
      </div>

      {/* Scénario */}
      <div>
        <label className={labelCls}>Scénario ou résumé des négociations du pacte *</label>
        <textarea value={scenario} onChange={e => setScenario(e.target.value)} rows={8}
          placeholder="Décrivez le contexte : structure actionnariale, nature du pacte, clauses de sortie envisagées, équilibre des droits de vote, clauses de gouvernance, présence d'un investisseur financier, valorisation retenue, etc.

Ex : SARL en phase de scale-up avec 2 fondateurs (60%) et un fonds VC (40%). Le pacte prévoit un droit de veto du fonds sur toute décision d'investissement > 50 KTND, une clause drag-along activable à 75% sans plafond de prix, une clause bad leaver à 50% de la valorisation en cas de démission, sans tag-along pour les fondateurs."
          className={textareaCls} />
        <p className="text-[10px] text-light/20 mt-1">{scenario.length} car.</p>
      </div>

      {/* Évaluations optionnelles */}
      <div className="border border-gold/10 bg-dark-surface p-5 flex flex-col gap-5">
        <p className="text-[10px] font-bold text-light/30 tracking-[0.25em] uppercase">
          Évaluations AFRB <span className="font-normal text-light/20">(optionnelles — déduites du scénario si vides)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Réciprocité des engagements</label>
            <input type="text" value={reciprocity} onChange={e => setReciprocity(e.target.value)}
              placeholder="Ex : Asymétrie tag-along / drag-along" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Force exécutoire & Sanctions</label>
            <input type="text" value={enforcement} onChange={e => setEnforcement(e.target.value)}
              placeholder="Ex : Clauses pénales, promesse unilatérale" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Exposition personnelle</label>
            <input type="text" value={personalExposure} onChange={e => setPersonalExposure(e.target.value)}
              placeholder="Ex : Garantie de passif sur patrimoine propre" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Menace structurelle</label>
            <input type="text" value={structuralThreat} onChange={e => setStructuralThreat(e.target.value)}
              placeholder="Ex : Deadlock governance, dilution massive" className={inputCls} />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs text-red-400">
          <AlertTriangle size={12} strokeWidth={1.5} /> {error}
        </div>
      )}

      <button onClick={run} disabled={loading || scenario.trim().length < 30}
        className="flex items-center gap-2 bg-gold text-dark-bg text-xs font-bold px-6 py-3.5 hover:bg-gold/90 transition-colors disabled:opacity-40 w-full sm:w-auto justify-center">
        {loading
          ? <><Loader2 size={14} className="animate-spin" /> Analyse AFRB en cours…</>
          : <><Scale size={14} strokeWidth={1.5} /> Lancer la classification AFRB</>}
      </button>
    </div>
  )
}

// ── Historique des analyses ───────────────────────────────────────────────────
function AnalysisHistory({ clientId }: { clientId: string }) {
  const [analyses] = useState<AFRBAnalysis[]>(() =>
    getAFRBAnalyses().filter(a => a.clientId === clientId)
  )
  const [selected, setSelected] = useState<AFRBAnalysis | null>(null)
  const [copied, setCopied] = useState('')

  const copyJSON = (a: AFRBAnalysis) => {
    navigator.clipboard.writeText(JSON.stringify(a.result, null, 2))
    setCopied(a.id)
    setTimeout(() => setCopied(''), 2000)
  }

  if (selected) return (
    <div className="flex flex-col gap-4">
      <button onClick={() => setSelected(null)}
        className="flex items-center gap-2 text-xs text-light/40 hover:text-light transition-colors w-fit">
        ← Retour à l'historique
      </button>
      <div className="border-b border-gold/10 pb-3 mb-1">
        <p className="text-[10px] text-light/30 uppercase tracking-widest mb-1">{new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p className="text-sm text-light/70 leading-relaxed line-clamp-2">{selected.scenario.substring(0, 120)}…</p>
      </div>
      {selected.result && <ResultBlock result={selected.result} />}
    </div>
  )

  if (analyses.length === 0) return (
    <p className="text-xs text-light/30 py-4">Aucune analyse enregistrée.</p>
  )

  return (
    <div className="flex flex-col gap-2">
      {analyses.map(a => {
        const level = a.result?.risk_matrix.overall_risk_level ?? '—'
        const s = riskStyle(level)
        return (
          <div key={a.id} className="flex items-center gap-3 bg-dark-surface px-4 py-3 hover:bg-dark-card transition-colors group">
            <div className={`text-[9px] font-bold border px-2 py-1 ${s.text} ${s.border} ${s.bg} flex-none`}>{level}</div>
            <p className="flex-1 text-xs text-light/60 truncate">{a.scenario.substring(0, 80)}…</p>
            <p className="text-[10px] text-light/25 flex-none hidden sm:block">{new Date(a.createdAt).toLocaleDateString('fr-FR')}</p>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setSelected(a)} className="text-xs text-light/40 hover:text-gold border border-gold/10 px-2 py-1 transition-colors">Voir</button>
              <button onClick={() => copyJSON(a)} className="text-xs text-light/30 hover:text-light border border-gold/10 px-2 py-1 transition-colors">
                {copied === a.id ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Composant principal AFRB ──────────────────────────────────────────────────
export default function AFRBTool({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [tab, setTab] = useState<'analyse' | 'historique'>('analyse')
  const [lastResult, setLastResult] = useState<AFRBAnalysis | null>(null)

  const handleResult = (a: AFRBAnalysis) => {
    setLastResult(a)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scale size={18} strokeWidth={1.5} className="text-gold" />
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-gold/70">Moteur AFRB</p>
          </div>
          <h2 className="font-serif text-2xl text-light">Classification des Risques Juridiques</h2>
          <p className="text-xs text-light/35 mt-1 max-w-md">
            Analyse structurelle déterministe des pactes d'actionnaires selon la logique AFRB — Reciprocity · Enforcement · Personal Exposure · Structural Threat.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-gold/15 px-3 py-2">
          <Zap size={11} strokeWidth={1.5} className="text-gold/50" />
          <p className="text-[10px] text-light/35 font-medium uppercase tracking-widest">Droit tunisien & français</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-px bg-gold/8">
        {[['analyse', 'Nouvelle analyse', FileSearch], ['historique', 'Mes analyses', ClipboardList]].map(([id, label, Icon]) => (
          <button key={id as string} onClick={() => setTab(id as typeof tab)}
            className={`flex items-center gap-2 flex-1 justify-center text-xs font-medium py-3 px-4 transition-colors ${
              tab === id ? 'bg-dark-card text-light border-b-2 border-gold' : 'bg-dark-surface text-light/40 hover:text-light/70'
            }`}>
            <Icon size={13} strokeWidth={1.5} />{label as string}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {tab === 'analyse' && (
        <div className="flex flex-col gap-6">
          <AFRBForm clientId={clientId} clientName={clientName} onResult={handleResult} />
          {lastResult?.result && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} strokeWidth={1.5} className="text-emerald-400" />
                <p className="text-xs font-semibold text-light">Résultat de l'analyse</p>
              </div>
              <ResultBlock result={lastResult.result} />
            </div>
          )}
        </div>
      )}

      {tab === 'historique' && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-light/35">Historique de vos analyses AFRB — conservées localement.</p>
          <AnalysisHistory clientId={clientId} />
        </div>
      )}
    </div>
  )
}
