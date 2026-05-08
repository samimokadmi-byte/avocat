export interface KnowledgeEntry {
  keywords: string[]
  response: string
}

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    keywords: ['expertise', 'services', 'faites', 'domaine', 'compétence'],
    response: "Nous intervenons sur trois piliers majeurs : l'Ingénierie Juridique (levées de fonds, pactes), la Stratégie Fiscale Avancée (optimisation, holdings) et l'Architecture IA (automatisation de workflows, conformité IA Act)."
  },
  {
    keywords: ['levée', 'fonds', 'seed', 'série', 'investisseur', 'equity'],
    response: "Nous structurons des levées de fonds du Seed à la Série B. Notre approche consiste à construire des systèmes robustes (Term sheets, Cap tables) qui résistent aux exigences des fonds de VC les plus rigoureux."
  },
  {
    keywords: ['ia', 'intelligence artificielle', 'algorithme', 'ia act', 'automatisation'],
    response: "L'IA est au cœur de notre cabinet. Nous conseillons sur la conformité IA Act et intégrons l'IA pour automatiser vos processus juridiques (due diligence augmentée, smart contracts)."
  },
  {
    keywords: ['fiscal', 'impôt', 'holding', 'optimisation', 'exit', 'bsa', 'bspce'],
    response: "Nous concevons des architectures fiscales globales : holdings patrimoniales, schémas d'incitation (BSPCE) et optimisation lors de l'exit pour minimiser les frictions fiscales."
  },
  {
    keywords: ['contact', 'rendez-vous', 'rdv', 'parler', 'appel', 'téléphone', 'email'],
    response: "Vous pouvez prendre rendez-vous pour un Diagnostic Stratégique de 90 minutes via le bouton 'Consultation' en haut de page, ou nous contacter directement à office@mokadmi.lawyer."
  },
  {
    keywords: ['prix', 'tarif', 'honoraires', 'coût', 'combien'],
    response: "Nos interventions se font généralement au forfait pour garantir une totale transparence. Le diagnostic initial de 90 minutes est facturé 350 € HT (imputable sur mission)."
  },
  {
    keywords: ['expérience', 'ancienneté', 'qui est', 'mokadmi', 'sami'],
    response: "Maître Mokadmi Sami est l'Architecte Juridique du cabinet, fort de 24 ans d'expérience en droit des affaires et ingénierie stratégique entre Tunis et Paris."
  }
]

export const FALLBACK_RESPONSE =
  "C'est une excellente question. Pour vous apporter une réponse précise et adaptée à votre architecture spécifique, je vous suggère d'en discuter directement avec Maître Mokadmi lors d'un diagnostic stratégique."
