const stats = [
  {
    value: '15M€',
    label: 'sécurisés en levées de fonds',
    note: 'Séries A et B accompagnées depuis 2019',
  },
  {
    value: '22%',
    label: "d'optimisation fiscale",
    note: 'Réduction moyenne sur holdings constituées',
  },
  {
    value: '97%',
    label: 'de dossiers finalisés',
    note: 'Taux de closing sur transactions engagées',
  },
]

export default function Results() {
  return (
    <section id="resultats" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        Résultats
      </p>
      <h2 className="font-serif text-heading text-navy mb-16 max-w-xl">
        Des chiffres, pas des promesses.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-navy/10">
        {stats.map(({ value, label, note }) => (
          <div key={value} className="bg-offwhite p-10 flex flex-col gap-3">
            <span className="font-serif text-stat font-bold text-navy">{value}</span>
            <span className="text-sm font-medium text-navy">{label}</span>
            <span className="text-xs text-navy/40 leading-snug">{note}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
