import { Award, BookOpen, Scale, Cpu } from 'lucide-react'

const parcours = [
  {
    icon: Scale,
    periode: '2003 — 2010',
    titre: 'Inscription au Barreau & fondation du cabinet',
    detail: 'Inscription au Barreau de Tunis en 2003. Fondation du cabinet en 2006. Premiers dossiers structurants en droit des sociétés et accompagnement de groupes industriels tunisiens.',
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
    <section id="apropos" className="bg-paper">
      <div className="px-8 py-16 md:py-section max-w-content mx-auto">

        {/* ── Section header ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-10 md:mb-16">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2">[01]</span>
          <span className="w-8 h-px bg-hairline-strong flex-none" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2">À Propos</span>
        </div>

        {/* ── En-tête ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mb-12 md:mb-section">
          <div>
            <h2 className="font-display text-heading text-ink font-normal mb-6 text-pretty">
              Un avocat qui pense{' '}
              <span className="italic text-accent">comme un architecte.</span>
            </h2>
            <p className="text-body text-text2 leading-relaxed mb-4">
              Maître Mokadmi Sami exerce depuis 24 ans au Barreau de Tunis. Sa singularité : ne jamais
              traiter le droit comme une contrainte, mais comme un levier de construction.
            </p>
            <p className="text-body text-text2 leading-relaxed">
              Formé au droit des affaires internationales, il a développé une méthode propre —
              <span className="text-ink"> l'ingénierie juridique systémique </span> — qui combine
              structuration capitalistique, optimisation fiscale et anticipation réglementaire IA
              en un seul système cohérent, pensé pour durer.
            </p>
          </div>

          {/* Valeurs */}
          <div className="flex flex-col gap-7 justify-center">
            {valeurs.map(v => (
              <div key={v.titre} className="border-l-2 border-accent pl-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent mb-1.5">
                  {v.titre}
                </p>
                <p className="text-small text-text2 leading-relaxed">{v.texte}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Séparateur ─────────────────────────────────────────────── */}
        <div className="border-t border-hairline mb-12 md:mb-section" />

        {/* ── Parcours chronologique ─────────────────────────────────── */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-text2 mb-8 md:mb-10">
            Parcours
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-hairline">
            {parcours.map(({ icon: Icon, periode, titre, detail }) => (
              <div key={titre} className="bg-paper p-6 md:p-8 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 border border-hairline-strong flex items-center justify-center flex-none">
                    <Icon size={14} strokeWidth={1.25} className="text-text2" />
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text2">{periode}</span>
                </div>
                <div>
                  <p className="font-display text-base font-normal text-ink mb-2">{titre}</p>
                  <p className="text-small text-text2 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Citation ───────────────────────────────────────────────── */}
        <div className="mt-section-sm border-t border-hairline pt-12 max-w-2xl">
          <blockquote className="border-l-2 border-ink pl-8 font-display text-2xl italic text-ink/60 leading-relaxed font-normal">
            "Le droit n'est pas une protection contre le risque — c'est l'art de le structurer
            pour qu'il devienne un avantage compétitif."
          </blockquote>
          <p className="mt-5 pl-8 font-mono text-[11px] uppercase tracking-[0.08em] text-text2">
            Maître Mokadmi Sami
          </p>
        </div>

      </div>
    </section>
  )
}
