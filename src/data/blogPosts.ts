export interface BlogPost {
  slug: string
  title: string
  category: string
  date: string
  excerpt: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'ia-due-diligence-revolution',
    title: "L'IA dans la due diligence : comment nous avons réduit le temps de revue de 60%",
    category: 'IA Juridique',
    date: '12 mai 2025',
    excerpt: "Les outils d'intelligence artificielle transforment en profondeur la revue des data rooms. Retour d'expérience sur notre intégration de l'IA dans les processus de due diligence.",
    content: `La due diligence juridique traditionnelle est un goulot d'étranglement bien connu : des centaines de documents, des délais serrés, un risque d'omission élevé. Notre approche a changé radicalement lorsque nous avons intégré des outils IA dans ce processus.

**Le problème classique**

Sur une transaction M&A standard, la revue d'une data room de 300 documents prenait entre 40 et 60 heures de travail humain. Chaque clause de changement de contrôle, chaque engagement de non-concurrence devait être identifié manuellement.

**Notre intégration IA**

Nous avons déployé un workflow no-code combinant des LLMs spécialisés en droit des contrats avec notre base de connaissance métier. Résultat : la phase d'extraction et de classification des clauses à risque est désormais automatisée à 80%.

**Les 20% humains restants**

C'est là que 24 ans d'expérience font la différence. L'IA identifie, le juriste juge. Les nuances de négociation, les risques contextuels, les implications fiscales d'une clause — cela reste irremplaçable.

**Résultat opérationnel**

60% de réduction du temps de revue. Zéro omission critique sur les 12 dernières missions. Et une capacité à traiter des dossiers plus complexes, plus rapidement.`,
  },
  {
    slug: 'term-sheet-2025-clauses-fondateurs',
    title: "Term sheet 2025 : les nouvelles clauses que chaque fondateur doit maîtriser",
    category: 'Levées de fonds',
    date: '28 avril 2025',
    excerpt: "Les term sheets évoluent vite. Clauses IA, data governance, ESG covenants — voici ce que les investisseurs incluent désormais et comment les négocier.",
    content: `Le term sheet de 2025 ressemble de moins en moins à celui de 2020. Trois nouvelles catégories de clauses ont fait leur apparition dans les négociations Seed et Série A.

**Les clauses IA & données**

Les investisseurs incluent désormais des représentations sur l'utilisation de l'IA dans les processus internes, et des warranties sur la qualité et la propriété des datasets d'entraînement. Pour les startups IA, c'est devenu aussi important que les clauses IP classiques.

**Les covenants ESG**

En particulier pour les fonds européens : obligations de reporting, politique de diversité, gouvernance éthique. Ces clauses peuvent avoir des implications significatives sur les futurs tours.

**Les clauses de liquidité préférentielle**

La tendance 2024-2025 est au retour en force des préférences non-participating. Pour les fondateurs, c'est généralement plus favorable — encore faut-il savoir le négocier.

**Notre conseil**

Ne signez jamais un term sheet sans un audit complet de ces nouvelles clauses. Leur impact sur votre dilution future et votre liberté opérationnelle peut être considérable.`,
  },
  {
    slug: 'holding-tunisie-optimisation-fiscale',
    title: "Holding en Tunisie : structurer intelligemment pour optimiser et protéger",
    category: 'Stratégie Fiscale',
    date: '15 avril 2025',
    excerpt: "La holding patrimoniale reste l'outil le plus puissant d'optimisation fiscale pour les entrepreneurs tunisiens. Mais sa mise en place demande une architecture précise.",
    content: `La holding est souvent présentée comme une solution magique. La réalité est plus nuancée — et plus intéressante.

**Pourquoi une holding ?**

Trois raisons principales justifient la structuration via holding en Tunisie : la remontée de dividendes à faible friction fiscale entre filiales, la protection du patrimoine entre activité opérationnelle et actifs stratégiques, et la préparation à l'exit.

**Les erreurs classiques**

La plus fréquente : créer une holding sans réfléchir à son régime fiscal dès le départ. La deuxième : négliger la substance économique réelle, exposant à une requalification.

**Notre approche**

Nous concevons la holding comme une architecture globale. Cela implique de définir dès le départ : la géographie optimale, le régime fiscal, les flux financiers inter-sociétés et la stratégie d'exit à 5-7 ans.

**Le bon moment pour structurer**

Idéalement avant un tour de table significatif, ou avant toute opération susceptible de créer une plus-value importante. Structurer après, c'est possible mais plus coûteux.`,
  },
  {
    slug: 'bspce-guide-complet-2025',
    title: "BSPCE : le guide complet pour les startups en 2025",
    category: 'Ingénierie Juridique',
    date: '2 avril 2025',
    excerpt: "Les bons de souscription sont devenus incontournables pour attirer les talents tech. Voici comment les structurer correctement pour protéger fondateurs et collaborateurs.",
    content: `Les BSPCE sont l'outil de fidélisation par excellence pour les startups tech. Leur mise en place correcte peut faire la différence entre retenir vos meilleurs ingénieurs et les voir partir à la concurrence.

**Qu'est-ce qu'un BSPCE ?**

Un bon de souscription est un droit d'acheter des actions à un prix fixé à l'avance (prix d'exercice). Si la valeur de la société monte, le bénéficiaire réalise une plus-value.

**Le calendrier d'acquisition (vesting)**

C'est le point le plus critique. Un vesting bien structuré protège la startup en cas de départ prématuré, tout en motivant les collaborateurs sur la durée. Standard : 4 ans avec cliff d'un an.

**L'optimisation fiscale**

Le traitement fiscal à l'exercice et à la cession varie significativement selon la structure mise en place. Une holding intermédiaire peut, dans certains cas, réduire substantiellement la charge fiscale.

**Les erreurs à éviter**

Un prix d'exercice trop bas peut être requalifié. Un plan trop généreux peut créer des problèmes de gouvernance à la dilution. L'architecture doit être pensée globalement, pas ligne par ligne.`,
  },
  {
    slug: 'ia-act-startups-mena',
    title: "IA Act européen : ce que les startups MENA doivent anticiper dès maintenant",
    category: 'Réglementation',
    date: '18 mars 2025',
    excerpt: "L'AI Act européen entre en vigueur progressivement. Pour les startups qui ciblent le marché européen, l'anticipation n'est plus une option.",
    content: `L'IA Act européen est entré en vigueur en août 2024. Son déploiement progressif laisse peu de temps aux startups qui ciblent l'Europe pour se mettre en conformité.

**Pourquoi les startups MENA sont concernées**

Si votre produit IA est utilisé par des clients européens — ou si vous envisagez une expansion en Europe — vous êtes soumis à l'IA Act, quelle que soit votre localisation. Principe de territorialité extraterritoriale.

**La classification des risques IA**

L'IA Act classe les systèmes en 4 catégories : risque inacceptable (interdit), haut risque (réglementé), risque limité (transparence obligatoire), risque minimal (libre).

**Ce qu'il faut anticiper**

Documentation technique du système IA, évaluation de conformité avant mise sur le marché, mise en place d'un système de surveillance continue, désignation d'un représentant autorisé en UE.

**Notre accompagnement**

Nous avons développé un audit IA Act structuré pour les startups MENA en 3 semaines. L'objectif : identifier votre niveau de risque, cartographier les obligations applicables, et construire le plan de conformité opérationnel.`,
  },
  {
    slug: 'no-code-juridique-revolution',
    title: "No-code juridique : comment les workflows automatisés transforment notre cabinet",
    category: 'Innovation',
    date: '5 mars 2025',
    excerpt: "Les outils no-code révolutionnent la pratique juridique. Moins de saisies manuelles, plus de valeur ajoutée stratégique — et des clients livrés en systèmes, pas en PDFs.",
    content: `La révolution no-code n'a pas épargné le secteur juridique. Et c'est une excellente nouvelle pour nos clients.

**Le problème du droit traditionnel**

Un cabinet classique passe une part significative de son temps sur des tâches à faible valeur ajoutée : relances, mises à jour documentaires, suivi de signatures, compilation de reporting. C'est du temps qui n'est pas consacré au conseil stratégique.

**Notre approche no-code**

Nous avons automatisé l'ensemble de notre back-office juridique : workflows de validation documentaire, suivi automatisé des délais contractuels, génération de premiers drafts par templates intelligents, relances automatiques pré-closing.

**Ce que cela change pour nos clients**

Nos clients reçoivent une feuille de route opérationnelle, pas juste un document PDF. Chaque mission inclut désormais les workflows automatisés correspondants — pour que leurs équipes puissent exécuter sans dépendre de nous à chaque étape.

**La limite de l'automatisation**

L'automatisation gère l'exécution. La stratégie, la négociation, l'arbitrage entre options complexes — cela reste irremplaçable. Notre rôle s'est déplacé vers ce qui a le plus de valeur.`,
  },
]
