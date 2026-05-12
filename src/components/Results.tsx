const stats = [
  {
    value: '24',
    label: "ans d'expérience",
    note: 'Droit des affaires, fiscalité et IA juridique depuis 2000',
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
    <section id="resultats" className="bg-dark-surface">
      <div className="px-6 py-section max-w-content mx-auto">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
          Résultats
        </p>
        <h2 className="font-serif text-heading text-light mb-4 max-w-xl">
          Des chiffres, pas des promesses.
        </h2>
        <p className="text-sm text-light/40 mb-10 md:mb-16 max-w-prose-luxury leading-relaxed">
          Des missions closes, des structures qui tiennent, des systèmes qui continuent de tourner.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gold/10">
          {stats.map(({ value, label, note }) => (
            <div key={value} className="bg-dark-card p-6 md:p-10 flex flex-col gap-3">
              <span className="font-serif text-stat font-bold text-gold">{value}</span>
              <span className="text-sm font-medium text-light/80">{label}</span>
              <span className="text-xs text-light/30 leading-snug">{note}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
