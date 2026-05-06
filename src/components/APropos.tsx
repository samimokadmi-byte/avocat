import { Award, BookOpen, Scale, Cpu } from 'lucide-react'

const parcours = [
  {
    icon: Scale,
    periode: '2001 — 2010',
    titre: 'Fondation du cabinet',
    detail: 'Installation au Barreau de Tunis. Premiers dossiers structurants en droit des sociétés et accompagnement de groupes industriels tunisiens.',
  },
  {
    icon: Award,
    periode: '2010 — 2018',
    titre: 'Spécialisation en ingénierie capitalistique',
    detail: 'Développement d\'une expertise pointue en structuration de levées de fonds, pactes d\'associés et opérations de M&A transfrontalières.',
  },
  {
    icon: BookOpen,
    periode: '2018 — 2022',
    titre: 'Architecture fiscale & holdings',
    detail: 'Construction de structures holding optimisées pour entrepreneurs et family offices. Maîtrise des conventions fiscales bilatérales Tunisie–Europe.',
  },
  {
    icon: Cpu,
    periode: '2022 — aujourd\'hui',
    titre: 'Gouvernance de l\'IA & droit Tech',
    detail: 'Anticipation de l\'IA Act et des régulations algorithmiques. Conseil aux startups Tech sur la conformité, la propriété intellectuelle et l\'automatisation juridique.',
  },
]

const valeurs = [
  { titre: 'Systémique',   texte: 'Chaque dossier est traité comme une architecture, pas comme un problème isolé. Nous pensons en flux, en risques et en trajectoires.' },
  { titre: 'Discret',      texte: 'La confidentialité absolue est une condition de l\'excellence. Aucun nom de client, aucun dossier ne circule.' },
  { titre: 'Exigeant',     texte: 'Nous choisissons nos clients autant qu\'ils nous choisissent. La qualité de l\'exécution dépend de la qualité de la collaboration.' },
]

export default function APropos() {
  return (
    <section id="apropos" className="bg-dark-bg">
      <div className="px-6 py-12 md:py-section max-w-content mx-auto">

        {/* ── En-tête ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-10 md:mb-section">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-4">
              À propos
            </p>
            <h2 className="font-serif text-heading text-light mb-6">
              Un avocat qui pense comme un architecte.
            </h2>
            <p className="text-sm text-light/50 leading-relaxed mb-4">
              Maître Mokadmi Sami exerce depuis 24 ans au Barreau de Tunis. Sa singularité : ne jamais
              traiter le droit comme une contrainte, mais comme un levier de construction.
            </p>
            <p className="text-sm text-light/40 leading-relaxed">
              Formé au droit des affaires internationales, il a développé une méthode propre —
              <span className="text-light/60"> l'ingénierie juridique systémique </span> — qui combine
              structuration capitalistique, optimisation fiscale et anticipation réglementaire IA
              en un seul système cohérent, pensé pour durer.
            </p>
          </div>

          {/* Valeurs */}
          <div className="flex flex-col gap-6 justify-center">
            {valeurs.map(v => (
              <div key={v.titre} className="border-l border-gold/20 pl-6">
                <p className="text-xs font-semibold tracking-[0.15em] uppercase text-gold mb-1">
                  {v.titre}
                </p>
                <p className="text-sm text-light/45 leading-relaxed">{v.texte}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ligne de séparation ────────────────────────────────────── */}
        <div className="border-t border-gold/10 mb-10 md:mb-section" />

        {/* ── Parcours chronologique ─────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-gold/60 mb-6 md:mb-10">
            Parcours
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gold/8">
            {parcours.map(({ icon: Icon, periode, titre, detail }) => (
              <div key={titre} className="bg-dark-bg p-5 md:p-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-gold/20 flex items-center justify-center flex-none">
                    <Icon size={14} strokeWidth={1.5} className="text-gold/70" />
                  </div>
                  <span className="text-xs font-medium text-gold/50 tracking-wide">{periode}</span>
                </div>
                <div>
                  <p className="font-serif text-base font-semibold text-light mb-2">{titre}</p>
                  <p className="text-sm text-light/40 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Citation ───────────────────────────────────────────────── */}
        <div className="mt-section-sm border-t border-gold/10 pt-12 max-w-2xl">
          <blockquote className="font-serif text-xl italic text-light/60 leading-relaxed">
            "Le droit n'est pas une protection contre le risque — c'est l'art de le structurer
            pour qu'il devienne un avantage compétitif."
          </blockquote>
          <p className="mt-4 text-xs text-gold/50 tracking-wide uppercase">
            Maître Mokadmi Sami
          </p>
        </div>

      </div>
    </section>
  )
}
