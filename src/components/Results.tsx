const stats = [
  {
    value: '24',
    label: "ans d'expérience",
    note: 'Droit des affaires, fiscalité et IA juridique depuis 2003',
  },
  {
    value: '22%',
    label: "d'optimisation fiscale",
    note: 'Réduction moyenne obtenue sur les holdings structurées',
  },
  {
    value: '97%',
    label: 'de dossiers finalisés',
    note: 'Taux de closing sur les transactions engagées',
  },
]

export default function Results() {
  return (
    <section id="resultats" className="bg-ink-soft">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">[04]</span>
          <span className="w-8 h-px bg-paper/15 flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-paper/35">Résultats</span>
        </div>

        <h2 className="font-display text-heading text-paper font-normal mb-4 max-w-xl text-pretty">
          Des chiffres,{' '}
          <span className="italic text-accent">pas des promesses.</span>
        </h2>
        <p className="text-body text-paper/45 mb-10 md:mb-16 max-w-prose-luxury leading-relaxed">
          Des missions closes, des structures qui tiennent, des systèmes qui continuent de tourner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-paper/8">
          {stats.map(({ value, label, note }) => (
            <div key={value} className="bg-ink p-6 md:p-10 flex flex-col gap-3">
              <span className="font-display text-stat font-normal text-accent">{value}</span>
              <span className="text-body font-medium text-paper/80">{label}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-paper/30 leading-snug">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
