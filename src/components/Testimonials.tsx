const quotes = [
  {
    text: "En six mois, notre cap table était propre, notre série A sécurisée et nos BSPCE structurés. Ce n'est pas de la prestation juridique, c'est de l'ingénierie de croissance.",
    author: 'Thomas R.',
    role: 'Co-fondateur & CEO, SaaS B2B',
    year: '2023',
  },
  {
    text: "J'ai rencontré beaucoup d'avocats d'affaires. Ici, c'est différent — la précision technique est au niveau des meilleurs fonds, et la réactivité est celle d'un co-fondateur.",
    author: 'Isabelle M.',
    role: 'Partner, Fonds de Venture Capital',
    year: '2024',
  },
  {
    text: "Les workflows automatisés livrés avec notre structuration nous ont fait gagner plusieurs semaines sur le closing. On a reçu un système, pas des documents.",
    author: 'Karim B.',
    role: 'Fondateur, FinTech Series A',
    year: '2025',
  },
]

export default function Testimonials() {
  return (
    <section id="temoignages" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
        Témoignages
      </p>
      <h2 className="font-serif text-heading text-light mb-16 max-w-xl">
        Ce que disent ceux qui ont franchi le pas.
      </h2>

      <div className="flex flex-col gap-px bg-gold/10">
        {quotes.map(({ text, author, role, year }) => (
          <div key={author} className="bg-dark-surface py-12 px-1">
            <p className="font-serif text-5xl text-gold/10 leading-none mb-4 select-none">&ldquo;</p>
            <blockquote className="font-serif text-lg italic text-light/65 leading-relaxed max-w-2xl mb-8">
              {text}
            </blockquote>
            <footer>
              <p className="text-sm font-medium text-light">{author}</p>
              <p className="text-xs text-gold/50 mt-0.5">{role} · {year}</p>
            </footer>
          </div>
        ))}
      </div>
    </section>
  )
}
