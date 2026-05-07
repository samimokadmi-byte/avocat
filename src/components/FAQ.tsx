import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const items = [
  {
    q: "Qu'est-ce qui différencie votre approche des avocats d'affaires classiques ?",
    a: "Nous livrons des systèmes, pas des documents. Au-delà de la rédaction juridique, nous intégrons des workflows automatisés et des outils IA dans chaque mission — pour que vos équipes gagnent en agilité sans sacrifier la rigueur. Notre triple compétence Droit × Fiscal × IA est aujourd'hui rarissime sur le marché.",
  },
  {
    q: "Comment intégrez-vous l'IA dans vos missions juridiques ?",
    a: "L'IA intervient à plusieurs niveaux : due diligence augmentée (détection automatique de clauses à risque), génération de premiers drafts contractuels, workflows no-code de suivi de closing, et analyse de data rooms. Vous bénéficiez de la puissance analytique de l'IA couplée à 24 ans d'expérience terrain pour valider et affiner chaque résultat.",
  },
  {
    q: "Quels sont vos honoraires ?",
    a: "Nos honoraires sont fixés au forfait après audit initial. Le diagnostic stratégique (90 min) est facturé et imputable sur toute mission engagée. Les forfaits d'accompagnement sont établis sur mesure selon la complexité de la structure. Contactez-nous à office@mokadmi.lawyer pour une estimation.",
  },
  {
    q: "Intervenez-vous en dehors de Tunis ?",
    a: "Oui. L'essentiel de notre travail est dématérialisé. Nous accompagnons des fondateurs à Sfax, Sousse, à Paris, Dubai, et dans toute la zone MENA. Les réunions se tiennent en visio ou en présentiel à notre cabinet de Monplaisir.",
  },
  {
    q: "Dans quels délais pouvez-vous intervenir ?",
    a: "Nous maintenons une liste d'attente courte pour garantir la qualité. Le premier diagnostic peut généralement être fixé dans la semaine. Pour les urgences (closing imminent), contactez-nous directement au +216 29784651.",
  },
  {
    q: "Accompagnez-vous aussi des entreprises étrangères ?",
    a: "Oui, notamment pour les structures tunisiennes avec des investisseurs étrangers, et les fondateurs de la diaspora souhaitant structurer depuis la Tunisie ou via une holding européenne. Nous travaillons en français, en arabe et en anglais.",
  },
  {
    q: "Prenez-vous des participations au capital ?",
    a: "Non. Notre modèle est purement honoraire. Cette indépendance est la garantie d'un conseil objectif, sans conflit d'intérêts avec vos actionnaires ou vos investisseurs.",
  },
  {
    q: "Comment se déroule le suivi de mon dossier ?",
    a: "Chaque client dispose d'un espace numérique sécurisé pour suivre l'avancement, consulter les documents et poser ses questions. Les missions actives bénéficient d'un point hebdomadaire. Nous répondons à tout email sous 24h ouvrées.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-paper/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left"
        aria-expanded={open}
      >
        <span className="text-body font-medium text-paper/70">{q}</span>
        {open
          ? <Minus size={14} strokeWidth={1.5} className="flex-none text-accent" />
          : <Plus size={14} strokeWidth={1.5} className="flex-none text-paper/30" />
        }
      </button>

      {open && (
        <div className="pb-6">
          <p className="text-body text-paper/70 leading-relaxed max-w-prose-luxury">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="bg-ink-soft">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">[08]</span>
          <span className="w-8 h-px bg-paper/15 flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">FAQ</span>
        </div>

        <h2 className="font-display text-heading text-paper font-normal mb-10 md:mb-16 max-w-xl text-pretty">
          <span className="italic text-accent">Questions fréquentes.</span>
        </h2>

        <div className="max-w-2xl">
          {items.map(item => (
            <FAQItem key={item.q} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
