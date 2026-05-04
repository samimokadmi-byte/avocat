import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const items = [
  {
    q: 'Quels sont vos honoraires ?',
    a: "Nos honoraires sont fixés au forfait après audit initial. Le diagnostic stratégique (90 min) est facturé 350 € HT et imputable sur toute mission engagée. Les forfaits d'accompagnement démarrent à 3 500 € HT pour une structuration simple.",
  },
  {
    q: 'Intervenez-vous en dehors de Paris ?',
    a: "Oui. L'ensemble de notre travail est dématérialisé. Nous accompagnons des fondateurs à Lyon, Bordeaux, Londres et Barcelone. Les réunions se tiennent en visio ou en présentiel selon votre préférence.",
  },
  {
    q: 'Dans quels délais pouvez-vous intervenir ?',
    a: "Nous maintenons une liste d'attente courte pour garantir la qualité. En général, le premier diagnostic peut être fixé dans la semaine. Pour les urgences (closing imminent), contactez-nous directement.",
  },
  {
    q: 'Accompagnez-vous aussi des entreprises étrangères ?',
    a: "Oui, notamment pour les structures françaises avec des investisseurs étrangers ou les fondateurs étrangers souhaitant s'établir en France. Nous travaillons en français et en anglais.",
  },
  {
    q: 'Prenez-vous des participations au capital ?',
    a: "Non. Notre modèle est purement honoraire. Cette indépendance est la garantie d'un conseil objectif, sans conflit d'intérêts avec vos autres actionnaires.",
  },
  {
    q: 'Quels documents préparer pour le premier rendez-vous ?',
    a: "Pour une levée de fonds : statuts, pacte d'associés existant, cap table actuel, dernières liasses fiscales et deck investisseurs. Pour une structuration : documents constitutifs et accords entre associés. En l'absence de documents, le diagnostic reste possible — nous partons de votre situation réelle.",
  },
  {
    q: 'Quels sont les délais moyens pour une levée de fonds ?',
    a: "Un processus bien préparé dure entre 3 et 6 mois, du premier contact investisseur à la signature des actes définitifs. La phase juridique (term sheet → closing) représente généralement 6 à 10 semaines. Une préparation en amont réduit significativement ces délais.",
  },
  {
    q: 'Comment se déroule le suivi de mon dossier ?',
    a: "Chaque client dispose d'un espace numérique sécurisé pour suivre l'avancement, consulter les documents et poser ses questions. Un point hebdomadaire est organisé sur les missions actives. Nous répondons à tout email sous 24h ouvrées.",
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-navy/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-6 py-6 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-navy">{q}</span>
        {open
          ? <Minus size={14} strokeWidth={1.5} className="flex-none text-navy/50" />
          : <Plus size={14} strokeWidth={1.5} className="flex-none text-navy/50" />
        }
      </button>

      {open && (
        <div className="pb-6">
          <p className="text-sm text-navy/60 leading-relaxed max-w-prose-luxury">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="px-6 py-section max-w-content mx-auto">
      <p className="text-xs font-medium tracking-[0.2em] uppercase text-navy/50 mb-4">
        FAQ
      </p>
      <h2 className="font-serif text-heading text-navy mb-16 max-w-xl">
        Questions fréquentes.
      </h2>

      <div className="max-w-2xl">
        {items.map(item => (
          <FAQItem key={item.q} {...item} />
        ))}
      </div>
    </section>
  )
}
