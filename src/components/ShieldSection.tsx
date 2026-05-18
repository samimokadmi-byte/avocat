import { Link } from 'react-router-dom'
import {
  ShieldCheck, FileText, Search, Radar, Library, FileSignature,
  ArrowRight, Lock, Zap, Scale
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Générateur de contrat',
    desc: 'Décrivez votre mission en quelques champs. L\'IA génère un contrat complet — périmètre, propriété intellectuelle, pénalités de retard, résiliation — conforme au droit tunisien et français.',
  },
  {
    icon: Search,
    title: 'Réviseur de contrat',
    desc: 'Collez un contrat reçu d\'un client. Shield identifie les 5 clauses les plus risquées, vous explique pourquoi, et vous propose une reformulation protectrice.',
  },
  {
    icon: Radar,
    title: 'Radar de risques',
    desc: 'Décrivez votre activité en 3 phrases. Shield cartographie vos 5 principales expositions juridiques — requalification, responsabilité, fiscalité — avec une mesure de mitigation pour chacune.',
  },
  {
    icon: Library,
    title: 'Bibliothèque de modèles',
    desc: '10 contrats types prêts à l\'emploi : prestation de services, design, développement web, consulting, NDA, sous-traitance. Téléchargeables et modifiables.',
  },
  {
    icon: FileSignature,
    title: 'Générateur NDA',
    desc: 'Accord de confidentialité mutuel ou unilatéral en moins de 30 secondes. Saisissez les deux parties, le périmètre et la durée — Shield fait le reste.',
  },
]

const stats = [
  { value: '5', label: 'outils juridiques intégrés' },
  { value: '10', label: 'modèles de contrats types' },
  { value: '< 30s', label: 'pour générer un NDA complet' },
]

export default function ShieldSection() {
  return (
    <section id="shield" className="bg-dark-bg py-section">
      <div className="max-w-content mx-auto px-6">

        {/* ── En-tête ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-start gap-6 mb-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-gold/30 flex items-center justify-center">
              <ShieldCheck size={15} strokeWidth={1.5} className="text-gold" />
            </div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-gold/70">Shield by Mokadmi</p>
          </div>

          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl sm:text-4xl text-light leading-tight mb-4">
              Vous exercez en freelance.<br />
              <span className="text-gold/80">Vos contrats méritent mieux qu'un modèle Word.</span>
            </h2>
            <p className="text-sm text-light/50 leading-relaxed">
              Shield est l'outil de protection juridique intégré à l'espace client du cabinet Mokadmi.
              Contrats générés sur mesure, analyse de risques, NDA — alimentés par l'IA,
              supervisés par 24 ans d'expérience en droit des affaires.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-px bg-gold/10 mt-2 w-full">
            {stats.map((s, i) => (
              <div key={i} className="bg-dark-surface px-6 py-4">
                <p className="font-serif text-2xl text-light font-bold mb-0.5">{s.value}</p>
                <p className="text-[10px] text-light/35 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Fonctionnalités ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gold/8 mb-16">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div key={i} className="bg-dark-surface p-6 flex flex-col gap-4 group hover:bg-dark-card transition-colors">
                <div className="w-9 h-9 border border-gold/20 flex items-center justify-center group-hover:border-gold/40 transition-colors">
                  <Icon size={16} strokeWidth={1.5} className="text-gold/60 group-hover:text-gold transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-light mb-2">{f.title}</p>
                  <p className="text-xs text-light/45 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}

          {/* 6e case — CTA */}
          <div className="bg-dark-surface p-6 flex flex-col justify-between gap-6 border-gold/20 col-span-1 sm:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={13} strokeWidth={1.5} className="text-gold/50" />
                <p className="text-[10px] font-bold tracking-widest uppercase text-gold/50">Accès exclusif</p>
              </div>
              <p className="text-sm font-semibold text-light mb-2">Réservé aux clients du cabinet</p>
              <p className="text-xs text-light/40 leading-relaxed">
                Shield est disponible dans l'espace client sécurisé.
                Créez un compte ou prenez rendez-vous pour y accéder.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/signup"
                className="flex items-center justify-between group/btn bg-gold text-dark-bg text-xs font-semibold px-4 py-3 hover:bg-gold/90 transition-colors">
                Créer mon espace client
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login"
                className="flex items-center justify-between group/btn text-xs text-light/50 border border-gold/20 px-4 py-3 hover:text-light hover:border-gold/40 transition-colors">
                J'ai déjà un compte
                <ArrowRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Disclaimer + RDV ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-gold/10 pt-10">
          <div className="flex items-start gap-3 max-w-lg">
            <Scale size={14} strokeWidth={1.5} className="text-light/20 flex-none mt-0.5" />
            <p className="text-[11px] text-light/30 leading-relaxed">
              Shield fournit des modèles et des informations générales. Il ne constitue pas un conseil juridique.
              Pour tout enjeu contractuel significatif, une consultation avec Maître Mokadmi reste indispensable.
            </p>
          </div>
          <button
            onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 text-xs font-medium text-gold/70 border border-gold/25 px-5 py-2.5 hover:text-gold hover:border-gold/50 transition-colors whitespace-nowrap flex-none">
            <Zap size={12} strokeWidth={1.5} />
            Prendre rendez-vous
          </button>
        </div>

      </div>
    </section>
  )
}
