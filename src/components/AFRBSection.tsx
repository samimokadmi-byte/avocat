import { Link } from 'react-router-dom'
import { Scale, ArrowRight, AlertTriangle, ShieldCheck, Zap, Lock, BarChart3 } from 'lucide-react'

const criteria = [
  {
    code: 'R',
    label: 'Reciprocity',
    title: 'Réciprocité des engagements',
    desc: 'Analyse l\'équilibre des clauses de sortie, des droits de tag-along / drag-along et des droits d\'information entre actionnaires.',
    color: 'text-blue-400',
    border: 'border-blue-400/20',
  },
  {
    code: 'E',
    label: 'Enforcement',
    title: 'Force exécutoire & Sanctions',
    desc: 'Évalue l\'efficacité des clauses pénales, des conditions de bad leaver, des promesses unilatérales de vente et de l\'exécution forcée.',
    color: 'text-amber-400',
    border: 'border-amber-400/20',
  },
  {
    code: 'P',
    label: 'Personal Exposure',
    title: 'Exposition personnelle',
    desc: 'Quantifie les engagements de non-concurrence non compensés, les garanties de passif sur le patrimoine propre et la responsabilité des fondateurs.',
    color: 'text-red-400',
    border: 'border-red-400/20',
  },
  {
    code: 'S',
    label: 'Structural Threat',
    title: 'Menace structurelle',
    desc: 'Identifie les risques de deadlock de gouvernance, de minorité de blocage abusive, de dilution massive ou de perte de contrôle.',
    color: 'text-purple-400',
    border: 'border-purple-400/20',
  },
]

const outputs = [
  { icon: BarChart3, label: 'Matrice de risques', desc: '4 niveaux : Faible · Modéré · Élevé · Critique' },
  { icon: AlertTriangle, label: 'Clauses à risque', desc: 'Identification des clauses léonines ou abusives' },
  { icon: ShieldCheck, label: 'Plan d\'action', desc: 'Modifications prioritaires & deal-breakers' },
  { icon: Zap, label: 'Stratégie AFRB', desc: 'Contre-proposition ou sortie négociée' },
]

export default function AFRBSection() {
  return (
    <section id="afrb" className="bg-dark-surface py-section">
      <div className="max-w-content mx-auto px-6">

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gold/30 flex items-center justify-center">
              <Scale size={15} strokeWidth={1.5} className="text-gold" />
            </div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-gold/70">Moteur AFRB</p>
          </div>

          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl sm:text-4xl text-light leading-tight mb-4">
              Votre pacte d'actionnaires<br />
              <span className="text-gold/80">cache-t-il des clauses qui vous exposent ?</span>
            </h2>
            <p className="text-sm text-light/50 leading-relaxed">
              Le Moteur AFRB analyse structurellement votre pacte d'actionnaires selon quatre vecteurs de risque déterministes.
              En quelques secondes, il identifie les déséquilibres, les clauses abusives et les scénarios de crise — 
              avec un plan d'action concret avant signature.
            </p>
          </div>

          {/* Citation doctrinale */}
          <blockquote className="border-l-2 border-gold/30 pl-5 max-w-lg">
            <p className="text-sm text-light/40 italic leading-relaxed">
              "Un pacte mal rédigé ne se lit pas au moment de la signature — il se lit au moment du conflit, 
              quand il est trop tard pour négocier."
            </p>
            <footer className="text-[10px] text-light/25 mt-2 not-italic tracking-widest uppercase">
              — Maître Mokadmi Sami · Droit des sociétés
            </footer>
          </blockquote>
        </div>

        {/* ── 4 Critères AFRB ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gold/8 mb-12">
          {criteria.map((c, i) => (
            <div key={i} className="bg-dark-bg p-6 flex flex-col gap-4 group hover:bg-dark-card transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 border ${c.border} flex items-center justify-center flex-none`}>
                  <span className={`text-sm font-bold ${c.color}`}>{c.code}</span>
                </div>
                <div>
                  <p className={`text-[10px] font-bold tracking-widest uppercase ${c.color} mb-0.5`}>{c.label}</p>
                  <p className="text-sm font-semibold text-light">{c.title}</p>
                </div>
              </div>
              <p className="text-xs text-light/40 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Ce que le moteur produit ──────────────────────────────────────── */}
        <div className="mb-12">
          <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-light/30 mb-6">Résultats générés en quelques secondes</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gold/8">
            {outputs.map((o, i) => {
              const Icon = o.icon
              return (
                <div key={i} className="bg-dark-bg px-5 py-5 flex flex-col gap-3">
                  <Icon size={18} strokeWidth={1.5} className="text-gold/50" />
                  <div>
                    <p className="text-xs font-semibold text-light mb-1">{o.label}</p>
                    <p className="text-[11px] text-light/35 leading-relaxed">{o.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-gold/10 pt-10">
          <div className="flex items-start gap-3 max-w-md">
            <Lock size={14} strokeWidth={1.5} className="text-light/20 flex-none mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-light mb-1">Accès exclusif — Espace client sécurisé</p>
              <p className="text-xs text-light/35 leading-relaxed">
                Le moteur AFRB est disponible dans votre espace client. Chaque analyse est enregistrée 
                et peut être transmise au cabinet pour validation juridique approfondie.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-none">
            <Link to="/signup"
              className="flex items-center justify-between gap-8 group/btn bg-gold text-dark-bg text-xs font-semibold px-5 py-3 hover:bg-gold/90 transition-colors">
              Créer mon espace client
              <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="flex items-center justify-between gap-8 group/btn text-xs text-light/50 border border-gold/20 px-5 py-3 hover:text-light hover:border-gold/40 transition-colors">
              J'ai déjà un compte
              <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
