// ═══════════════════════════════════════════════════════════
// MODAL COUNCIL — GRIMOIRE (théorie complète, 7 chapitres FR)
//
// Pattern partagé avec les autres grimoires (voir
// data/grammarGauntletGrimoire.js et data/CLAUDE.md).
// Une idée par chapitre. Bilingue dans les exemples.
//
// Types de blocs : paragraph | rule | heading | example | trap | table | list
// ═══════════════════════════════════════════════════════════

export var GRIMOIRE_MODALS = {
  id: "modals",
  title: "Modal Council — Manuscrit des Modaux",
  subtitle: "Obligation, conseil, possibilité, déduction",
  readingTime: "12 min",
  icon: "⚖️",
  chapters: [
    {
      id: "ch1_must_vs_have_to",
      title: "I. Must vs Have to — la nuance interne / externe",
      intro: "Les deux se traduisent par « devoir » en français, mais ils ne portent pas la même intention. La règle qui dicte ton choix tient en un mot : qui décide ?",
      blocks: [
        {type:"rule",label:"Must",formula:"Obligation INTERNE. C'est moi qui décide, ou la règle vient de moi (ou d'une autorité morale forte)."},
        {type:"rule",label:"Have to",formula:"Obligation EXTERNE. Quelqu'un d'autre, une loi, un règlement m'oblige."},
        {type:"example",en:"I must call my mother — I haven't talked to her in weeks.",fr:"Je dois appeler ma mère — je ne lui ai pas parlé depuis des semaines.",note:"Obligation que je me donne à moi-même → must."},
        {type:"example",en:"I have to wear a suit at the office every Friday.",fr:"Je dois porter un costume au bureau tous les vendredis.",note:"C'est le règlement de l'entreprise qui l'impose → have to."},
        {type:"paragraph",text:"En anglais TOEIC moderne, « have to » est statistiquement plus fréquent que « must » à l'oral. « Must » garde une saveur formelle, juridique ou morale."},
        {type:"trap",text:"« Must » ne se conjugue PAS au passé. Pour parler d'une obligation passée, on utilise obligatoirement « had to ». Jamais « musted »."}
      ]
    },
    {
      id: "ch2_mustnt_vs_dont_have_to",
      title: "II. Mustn't ≠ Don't have to — le piège n°1",
      intro: "C'est le contresens le plus fréquent au TOEIC. Les deux ressemblent à « ne pas devoir » en français, mais ils disent EXACTEMENT le contraire.",
      blocks: [
        {type:"rule",label:"Mustn't",formula:"INTERDICTION absolue. Tu ne dois pas faire ça."},
        {type:"rule",label:"Don't have to",formula:"ABSENCE d'obligation. Tu peux le faire ou non, au choix."},
        {type:"example",en:"You mustn't smoke in the building.",fr:"Tu ne dois (vraiment) pas fumer dans l'immeuble.",note:"Interdiction. Si tu le fais, c'est une faute."},
        {type:"example",en:"You don't have to come to the meeting if you're sick.",fr:"Tu n'es pas obligé de venir à la réunion si tu es malade.",note:"Aucune obligation. Tu peux venir, tu peux ne pas venir."},
        {type:"trap",text:"En français, on dit « tu ne dois pas venir » dans les deux sens. En anglais, choisis selon l'INTENTION : interdire ou simplement libérer ?"},
        {type:"paragraph",text:"Question-test : si l'autre personne a le DROIT de faire l'action sans conséquence négative → don't have to. Si elle n'a PAS le droit → mustn't."}
      ]
    },
    {
      id: "ch3_advice_gradient",
      title: "III. Should / Ought to / Had better — gradient du conseil",
      intro: "Trois modaux pour donner un conseil, mais ils ne pèsent pas le même poids. Du plus doux au plus pressant.",
      blocks: [
        {type:"rule",label:"Should",formula:"Conseil neutre. La forme par défaut, polie et standard."},
        {type:"rule",label:"Ought to",formula:"Synonyme de should, légèrement plus formel ou moral. Connotation de devoir social."},
        {type:"rule",label:"Had better (= 'd better)",formula:"Conseil FORT, presque une mise en garde. Sous-entend une conséquence négative si on ignore."},
        {type:"table",headers:["Modal","Force","Tonalité"],rows:[
          ["should","douce","conseil amical"],
          ["ought to","douce-moyenne","conseil moral / formel"],
          ["had better","forte","mise en garde, urgence"]
        ]},
        {type:"example",en:"You should drink more water.",fr:"Tu devrais boire plus d'eau.",note:"Conseil santé courant."},
        {type:"example",en:"You ought to thank her for the gift.",fr:"Tu devrais la remercier pour le cadeau.",note:"Conseil moral, devoir social."},
        {type:"example",en:"You'd better leave now or you'll miss the train.",fr:"Tu ferais mieux de partir maintenant, sinon tu vas rater le train.",note:"Mise en garde forte, urgence."},
        {type:"trap",text:"« Had better » est TOUJOURS suivi de la base verbale (sans 'to'). On dit 'You'd better GO', pas 'You'd better TO GO'."}
      ]
    },
    {
      id: "ch4_permission",
      title: "IV. Can / Could / May / Might — gradient de formalité",
      intro: "Quatre façons de demander la permission, classées par niveau de politesse. Choisir le bon, c'est éviter le contre-emploi social.",
      blocks: [
        {type:"table",headers:["Modal","Niveau","Contexte typique"],rows:[
          ["can","informel","entre amis, famille, collègues proches"],
          ["could","poli","standard professionnel, inconnus"],
          ["may","formel","client, supérieur hiérarchique, contexte très soigné"],
          ["might","ultra-formel / hésitant","rare, écrit ou diplomatique"]
        ]},
        {type:"example",en:"Can I borrow your pen?",fr:"Je peux t'emprunter ton stylo ?",note:"Familier, entre collègues."},
        {type:"example",en:"Could I leave at four today?",fr:"Pourrais-je partir à seize heures aujourd'hui ?",note:"Demande polie standard, à un manager."},
        {type:"example",en:"May I speak with the director, please?",fr:"Puis-je parler au directeur, s'il vous plaît ?",note:"Très formel, accueil téléphonique d'entreprise."},
        {type:"trap",text:"Au TOEIC, dans les dialogues professionnels « Could / May » sont les plus probables. « Can » suggère un registre trop familier pour un client."},
        {type:"paragraph",text:"Pour répondre OUI : 'Yes, you can / Yes, you may / Of course'. Pour répondre NON poliment : 'I'm afraid not' plutôt que 'No, you can't' (trop sec)."}
      ]
    },
    {
      id: "ch5_certainty_ladder",
      title: "V. La ladder of certainty — déduction au présent",
      intro: "Pour exprimer une déduction logique au présent, l'anglais propose une échelle complète, du 100 % certain au 5 % impossible.",
      blocks: [
        {type:"heading",text:"L'échelle (du plus certain au moins certain)"},
        {type:"table",headers:["Modal","Certitude","Sens"],rows:[
          ["must be","~95 %","Je suis presque sûr que c'est le cas."],
          ["should be","~80 %","C'est très probable, attendu."],
          ["may be","~50 %","C'est possible, ouvert."],
          ["might be","~40 %","C'est possible mais incertain."],
          ["could be","~30-40 %","Une éventualité parmi d'autres."],
          ["can't be","~5 %","C'est logiquement impossible."]
        ]},
        {type:"example",en:"He must be at home — his car is in the driveway.",fr:"Il doit être chez lui — sa voiture est dans l'allée.",note:"Indice visible → forte certitude (must be)."},
        {type:"example",en:"She might be in a meeting.",fr:"Elle est peut-être en réunion.",note:"Hypothèse moyenne (might be)."},
        {type:"example",en:"That can't be true — I just saw him in Paris yesterday.",fr:"Ça ne peut pas être vrai — je viens de le voir à Paris hier.",note:"Rejet logique (can't be)."},
        {type:"trap",text:"Pour la déduction négative, on utilise « can't » et JAMAIS « mustn't ». 'He mustn't be home' est faux. La bonne forme : 'He can't be home'."}
      ]
    },
    {
      id: "ch6_modal_perfect",
      title: "VI. Modal + have V3 — déduire et regretter au passé",
      intro: "Pour appliquer la même logique de certitude au passé, on combine le modal avec « have + participe passé ». C'est la structure la plus testée au TOEIC.",
      blocks: [
        {type:"rule",label:"must have V3",formula:"Forte déduction au passé (presque certain que ça s'est passé)."},
        {type:"rule",label:"can't have V3",formula:"Déduction négative au passé (impossibilité logique)."},
        {type:"rule",label:"might / may have V3",formula:"Hypothèse plausible au passé."},
        {type:"rule",label:"could have V3",formula:"Possibilité au passé OU regret / reproche."},
        {type:"rule",label:"should have V3",formula:"Regret ou reproche : « j'aurais dû »."},
        {type:"example",en:"They must have left already — the lights are off.",fr:"Ils ont dû partir déjà — les lumières sont éteintes.",note:"Indice présent → cause déduite au passé."},
        {type:"example",en:"She can't have heard the announcement.",fr:"Elle ne peut pas avoir entendu l'annonce.",note:"Déduction négative au passé."},
        {type:"example",en:"You should have called me.",fr:"Tu aurais dû m'appeler.",note:"Reproche / regret."},
        {type:"example",en:"I could have helped you if I had known.",fr:"J'aurais pu t'aider si j'avais su.",note:"Possibilité passée non réalisée (regret)."},
        {type:"trap",text:"Piège francophone : « j'aurais pu » se dit « I could have V3 », pas « I would could ». Les modaux ne se cumulent jamais."}
      ]
    },
    {
      id: "ch7_toeic_traps",
      title: "VII. Pièges TOEIC francophones",
      intro: "Une compilation des erreurs les plus fréquentes chez les apprenants francophones. Les connaître = gagner 30 secondes de réflexion par question.",
      blocks: [
        {type:"heading",text:"1. Would vs Used to (habitudes passées)"},
        {type:"paragraph",text:"« Used to » = habitude passée révolue (état OU action). « Would » = habitude répétée passée (action seulement, pas un état)."},
        {type:"example",en:"I used to live in Lyon.",fr:"J'ai vécu à Lyon (autrefois).",note:"État passé → used to obligatoire."},
        {type:"example",en:"Every summer, we would visit our grandparents.",fr:"Chaque été, nous rendions visite à nos grands-parents.",note:"Action répétée → would possible."},
        {type:"trap",text:"On ne dit JAMAIS « I would live in Lyon » pour exprimer un état passé. Réservé aux actions répétées."},

        {type:"heading",text:"2. Used to (habitude) vs Be used to (avoir l'habitude de)"},
        {type:"rule",label:"used to + V",formula:"Habitude passée révolue. → I used to smoke."},
        {type:"rule",label:"be used to + V-ing / nom",formula:"Être habitué à. → I am used to working at night."},
        {type:"trap",text:"« I am used to work » est faux. Toujours -ING ou nom après « be used to »."},

        {type:"heading",text:"3. Mustn't ≠ Don't have to (rappel critique)"},
        {type:"paragraph",text:"Voir Chapitre II. C'est le piège le plus testé. Mustn't = interdiction. Don't have to = absence d'obligation."},

        {type:"heading",text:"4. Can / Could pour le futur — le piège"},
        {type:"paragraph",text:"« Can » exprime une capacité présente. Pour parler d'une capacité FUTURE, l'anglais préfère « will be able to »."},
        {type:"example",en:"I will be able to attend the meeting next week.",fr:"Je pourrai assister à la réunion la semaine prochaine.",note:"Futur → will be able to (pas 'I will can')."},
        {type:"trap",text:"« I will can » n'existe PAS. Deux modaux ne se cumulent jamais. Toujours « will be able to »."},

        {type:"heading",text:"5. Shall — quasi-disparu mais TOEIC le teste encore"},
        {type:"paragraph",text:"« Shall » survit dans deux contextes : les propositions formelles à la 1re personne (Shall I open the window? = Voulez-vous que j'ouvre la fenêtre ?) et les contrats juridiques (The tenant shall pay = Le locataire devra payer)."}
      ]
    }
  ]
};
