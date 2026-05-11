// ═══════════════════════════════════════════════════════════
// CONNECTORS — GRIMOIRE
// Adds pedagogical theory to ConnSort (which had no Study Mode).
// Same format as Gauntlet / Gerund / Phrasal grimoires.
// ═══════════════════════════════════════════════════════════

export var GRIMOIRE_CONNECTORS = {
  id: "connectors",
  title: "Connectors — Manuscrit des Liens Logiques",
  subtitle: "Trois structures, des nuances précises, un glossaire de référence",
  readingTime: "14 min",
  icon: "🔀",
  chapters: [
    {
      id: "ch1_three_categories",
      title: "I. Les trois catégories grammaticales",
      intro: "Un connecteur logique anglais n'est pas interchangeable. Sa CATÉGORIE GRAMMATICALE dicte ce qui DOIT suivre. Une erreur de catégorie = une phrase agrammaticale.",
      blocks: [
        {type:"rule",label:"La règle d'or",formula:"Le CONNECTEUR choisit la STRUCTURE. Pas l'inverse."},
        {type:"heading",text:"Les trois catégories"},
        {type:"table",headers:["Catégorie","Structure","Exemple-type"],rows:[
          ["+ Clause","connecteur + sujet + verbe","Although SALES dropped, profits rose."],
          ["+ Nom / V-ing","connecteur + nom ou V-ing","Despite THE DROP, profits rose."],
          ["Nouvelle phrase",". Connecteur,","Sales dropped. However, profits rose."]
        ]},
        {type:"paragraph",text:"Même idée (le contraste), trois structures rigoureusement différentes. Le TOEIC adore tester cette distinction en Part 5 et Part 6."},
        {type:"trap",text:"Le réflexe francophone est de traduire littéralement : 'malgré qu'il ait plu' → 'despite it rained' est FAUX. Despite veut un nom ou V-ing."}
      ]
    },
    {
      id: "ch2_clause",
      title: "II. Catégorie 1 — Connecteurs de CLAUSE",
      intro: "Les plus courants. Introduisent une proposition subordonnée (sujet + verbe).",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Connecteur] [sujet] [verbe]..."},
        {type:"heading",text:"Par fonction sémantique"},
        {type:"table",headers:["Fonction","Connecteurs","Exemple"],rows:[
          ["Contraste","although, even though, whereas, while, though","Although it rained, we went."],
          ["Cause","because, since, as, now that","Because sales rose, we hired more staff."],
          ["Condition","if, unless, provided that, as long as","Unless we act, we'll lose the deal."],
          ["Temps","when, while, before, after, as soon as, until","As soon as he arrives, call me."],
          ["But","so that","We hired extra staff so that we could meet the deadline."]
        ]},
        {type:"example",en:"Although the budget was tight, the project succeeded.",fr:"Bien que le budget ait été serré, le projet a réussi.",note:"Although + sujet + verbe."},
        {type:"example",en:"Unless we receive payment by Friday, we will cancel the order.",fr:"À moins que nous recevions le paiement avant vendredi, nous annulerons.",note:"Unless = if not. JAMAIS 'unless if'."},
        {type:"trap",text:"'Since' a DEUX sens selon le contexte : 'parce que' (causal) ou 'depuis' (temporel). Le contexte tranche."}
      ]
    },
    {
      id: "ch3_noun",
      title: "III. Catégorie 2 — Connecteurs de NOM ou V-ing",
      intro: "Ces connecteurs fonctionnent comme des prépositions. Ils sont suivis d'un GROUPE NOMINAL ou d'un GÉRONDIF (V-ing). Jamais d'un sujet + verbe conjugué.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Connecteur] [NOM]  ou  [Connecteur] [V-ing]"},
        {type:"heading",text:"Par fonction sémantique"},
        {type:"table",headers:["Fonction","Connecteurs","Exemple"],rows:[
          ["Contraste","despite, in spite of, regardless of","Despite the delay, we met the deadline."],
          ["Cause","due to, because of, owing to","Due to heavy traffic, the delivery was late."],
          ["Addition","in addition to, apart from","In addition to his salary, he gets a bonus."],
          ["But","in order to + base","In order to reduce costs, we outsourced."]
        ]},
        {type:"example",en:"Despite the bad weather, the event went ahead.",fr:"Malgré le mauvais temps, l'événement a eu lieu.",note:"Despite + nom."},
        {type:"example",en:"Despite feeling tired, she finished the report.",fr:"Malgré la fatigue, elle a terminé le rapport.",note:"Despite + V-ing."},
        {type:"trap",text:"Tu veux utiliser 'despite' + une clause ? Ajoute 'the fact that' : 'Despite the fact that it rained'. Correct mais lourd — mieux vaut utiliser 'although' dans ces cas-là."},
        {type:"trap",text:"JAMAIS 'despite of' ni 'in spite'. C'est soit 'despite' tout court, soit 'in spite of'. Pas de mélange."}
      ]
    },
    {
      id: "ch4_sentence",
      title: "IV. Catégorie 3 — Connecteurs de NOUVELLE PHRASE",
      intro: "Les adverbes de liaison. Ils NE relient PAS deux clauses au sein d'une même phrase — ils ouvrent une nouvelle phrase ou suivent un point-virgule.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Phrase 1]. [Connecteur,] [Phrase 2].   OU   [Phrase 1] ; [connecteur,] [phrase 2]."},
        {type:"heading",text:"Par fonction sémantique"},
        {type:"table",headers:["Fonction","Connecteurs","Exemple"],rows:[
          ["Contraste","however, nevertheless, on the other hand","Sales fell. However, morale stayed high."],
          ["Conséquence","therefore, consequently, as a result, thus","Demand rose. Therefore, prices increased."],
          ["Addition","furthermore, moreover, in addition","The plan saves money. Moreover, it cuts waste."]
        ]},
        {type:"example",en:"The budget was tight. However, we managed to finish on time.",fr:"Le budget était serré. Cependant, nous avons fini à temps."},
        {type:"example",en:"Costs exceeded the budget; thus, the project was paused.",fr:"Les coûts ont dépassé le budget ; ainsi, le projet a été suspendu.",note:"Point-virgule accepté pour garder le lien logique dans une même phrase."},
        {type:"trap",text:"JAMAIS 'Sales fell, however profits rose' (virgule seule). Virgule entre deux phrases complètes = comma splice = erreur grammaticale. Il faut un POINT ou un POINT-VIRGULE avant 'however'."}
      ]
    },
    {
      id: "ch5_same_idea",
      title: "V. Même idée, 3 structures",
      intro: "Pour chaque fonction (contraste, cause, résultat), il existe les 3 catégories. Comparer côte à côte fixe la règle.",
      blocks: [
        {type:"heading",text:"Contraste"},
        {type:"example",en:"Although sales dropped, profits rose.",fr:"Clause : although + sujet + verbe."},
        {type:"example",en:"Despite the sales drop, profits rose.",fr:"Nom : despite + nom."},
        {type:"example",en:"Sales dropped. However, profits rose.",fr:"Nouvelle phrase : . However, ..."},

        {type:"heading",text:"Cause"},
        {type:"example",en:"Because the shipment was late, we lost the client.",fr:"Clause : because + sujet + verbe."},
        {type:"example",en:"Because of the late shipment, we lost the client.",fr:"Nom : because OF + nom."},
        {type:"example",en:"The shipment was late. As a result, we lost the client.",fr:"Nouvelle phrase (résultat) : . As a result, ..."},

        {type:"heading",text:"Addition"},
        {type:"example",en:"In addition to his salary, he receives a bonus.",fr:"Nom : in addition TO + nom."},
        {type:"example",en:"He earns a good salary. In addition, he gets a bonus.",fr:"Nouvelle phrase : . In addition, (PAS 'in addition to')."},
        {type:"trap",text:"'in addition' (nouvelle phrase) vs 'in addition to' (+ nom) : un seul mot de différence, deux structures distinctes. Piège TOEIC Part 5 et Part 6 récurrent."}
      ]
    },
    {
      id: "ch6_traps",
      title: "VI. Pièges TOEIC & ponctuation",
      intro: "Les erreurs qui coûtent les points en Part 5-6.",
      blocks: [
        {type:"heading",text:"1. Because vs Because of"},
        {type:"example",en:"Because it was raining, we stayed inside.",fr:"Because + clause."},
        {type:"example",en:"Because of the rain, we stayed inside.",fr:"Because of + nom."},
        {type:"trap",text:"'Because of it was raining' ✗ agrammatical. 'Because the rain' ✗ agrammatical. Les deux formes ne se mélangent pas."},

        {type:"heading",text:"2. Although vs Despite"},
        {type:"example",en:"Although the report was long, it was clear.",fr:"Although + clause."},
        {type:"example",en:"Despite the length, the report was clear.",fr:"Despite + nom."},
        {type:"trap",text:"'Despite the report was long' ✗. 'Although the length' ✗. Choisir la catégorie, pas le synonyme."},

        {type:"heading",text:"3. Ponctuation avec 'however'"},
        {type:"example",en:"The offer is attractive. However, the risks are high.",note:"Point puis However, avec virgule."},
        {type:"example",en:"The offer is attractive; however, the risks are high.",note:"Point-virgule alternative équivalente."},
        {type:"trap",text:"JAMAIS 'The offer is attractive, however the risks are high' (comma splice). Virgule seule = faute de construction."},

        {type:"heading",text:"4. Unless vs If not"},
        {type:"example",en:"Unless you confirm, we cancel.",note:"= 'If you don't confirm, we cancel.'"},
        {type:"trap",text:"'Unless if' n'existe pas. 'Unless you don't confirm' = double négation, sens inversé. Éviter."},

        {type:"heading",text:"5. Due to vs Because of"},
        {type:"paragraph",text:"Historiquement, 'due to' était réservé aux adjectifs ('the delay was due to...'). Aujourd'hui, les deux sont acceptés partout en anglais business. Aucune différence pratique pour le TOEIC."}
      ]
    },
    {
      id: "ch7_nuances",
      title: "VII. Nuances entre synonymes proches",
      intro: "Plusieurs connecteurs partagent la même fonction mais diffèrent par l'intensité, le registre ou la position. Les confondre n'est pas une faute, mais le TOEIC 700+ teste ces subtilités.",
      blocks: [
        {type:"heading",text:"1. Contraste — however / nevertheless / nonetheless"},
        {type:"table",headers:["Connecteur","Intensité","Registre"],rows:[
          ["however","neutre","standard, business courant"],
          ["nevertheless","forte","formel"],
          ["nonetheless","forte","formel écrit, recherché"]
        ]},
        {type:"example",en:"The plan is risky. However, the potential reward is huge.",fr:"Le plan est risqué. Cependant, le gain potentiel est énorme.",note:"however = neutre, le choix par défaut."},
        {type:"example",en:"Sales fell sharply. Nevertheless, the company maintained its dividend.",fr:"Les ventes ont chuté. Néanmoins, l'entreprise a maintenu son dividende.",note:"nevertheless = malgré tout, ton plus solennel."},
        {type:"trap",text:"En contexte TOEIC, however est presque toujours acceptable. Nevertheless/nonetheless sonnent recherché — ne les utilise pas si however suffit."},

        {type:"heading",text:"2. Conséquence — therefore / consequently / thus / hence"},
        {type:"table",headers:["Connecteur","Registre","Nuance"],rows:[
          ["therefore","standard","résultat logique direct"],
          ["consequently","formel","effet en cascade ou dans le temps"],
          ["thus","formel écrit","résultat conclusif, démonstratif"],
          ["hence","très formel","résultat + explication implicite"]
        ]},
        {type:"example",en:"Demand surged. Therefore, we hired more staff.",fr:"La demande a explosé. Par conséquent, nous avons embauché.",note:"therefore = lien direct cause→effet."},
        {type:"example",en:"The factory closed. Consequently, 200 workers lost their jobs.",fr:"L'usine a fermé. En conséquence, 200 ouvriers ont perdu leur emploi.",note:"consequently = effet plus large, en cascade."},

        {type:"heading",text:"3. Addition — moreover / furthermore / in addition / besides"},
        {type:"table",headers:["Connecteur","Force","Usage"],rows:[
          ["moreover","forte","ajoute un argument décisif"],
          ["furthermore","forte","ajoute et creuse l'idée"],
          ["in addition","neutre","simple liste"],
          ["besides","familier","plutôt oral / écrit informel"]
        ]},
        {type:"example",en:"The product is cheap. Moreover, it outperforms the premium version.",fr:"Le produit est bon marché. De plus, il surpasse la version premium.",note:"moreover = argument décisif qui renforce."},
        {type:"trap",text:"« besides » est familier (« d'ailleurs »). À éviter en business writing — préférer moreover ou furthermore."}
      ]
    },
    {
      id: "ch8_inversion",
      title: "VIII. Inversion — niveau avancé (TOEIC 800+)",
      intro: "Certains connecteurs négatifs ou restrictifs placés en TÊTE de phrase déclenchent une inversion sujet/auxiliaire (comme dans une question). Construction formelle, fréquente en TOEIC Reading haut niveau.",
      blocks: [
        {type:"rule",label:"La règle",formula:"Adverbe négatif/restrictif en tête → inversion sujet/auxiliaire"},
        {type:"heading",text:"Connecteurs qui déclenchent l'inversion"},
        {type:"table",headers:["Connecteur","Sens","Construction"],rows:[
          ["rarely / seldom","rarement","+ aux + sujet + V"],
          ["hardly ever / scarcely","presque jamais","+ aux + sujet + V"],
          ["never / not until","jamais / pas avant","+ aux + sujet + V"],
          ["no sooner... than","à peine... que","+ had + sujet + V-en"],
          ["hardly... when","à peine... que","+ had + sujet + V-en"],
          ["not only... but also","non seulement... mais aussi","+ aux + sujet + V"],
          ["under no circumstances","en aucun cas","+ aux + sujet + V"]
        ]},
        {type:"example",en:"Rarely have we seen such a strong response.",fr:"Rarement avons-nous vu une réponse aussi forte.",note:"Rarely + have we seen (inversion). PAS « Rarely we have seen »."},
        {type:"example",en:"No sooner had I sent the email than I noticed the typo.",fr:"À peine avais-je envoyé l'email que j'ai remarqué la coquille.",note:"No sooner + had I sent (inversion past perfect)."},
        {type:"example",en:"Not only did sales rise, but profits doubled.",fr:"Non seulement les ventes ont augmenté, mais les profits ont doublé.",note:"Not only + did + sujet (inversion avec « do » auxiliaire au présent/prétérit)."},
        {type:"trap",text:"En français, on traduit sans inverser : « rarement nous avons vu ». En anglais formel, l'inversion est OBLIGATOIRE. C'est ce qui signe le registre 800+."},
        {type:"trap",text:"L'inversion fonctionne UNIQUEMENT quand l'adverbe est en tête. « We have rarely seen... » (au milieu) ne nécessite PAS d'inversion."}
      ]
    },
    {
      id: "ch9_glossary",
      title: "IX. Glossaire bilingue — référence",
      intro: "Table de correspondances FR ↔ EN par fonction sémantique. À consulter avant un Mock Test ou en cas de doute sur la traduction d'un terme.",
      blocks: [
        {type:"heading",text:"Contraste"},
        {type:"table",headers:["Anglais","Français","Catégorie"],rows:[
          ["although / even though","bien que","+ Clause"],
          ["though","bien que (familier)","+ Clause"],
          ["whereas / while","alors que / tandis que","+ Clause"],
          ["despite / in spite of","malgré","+ Nom / V-ing"],
          ["regardless of","peu importe","+ Nom"],
          ["however","cependant / toutefois","Nouvelle phrase"],
          ["nevertheless","néanmoins","Nouvelle phrase"],
          ["nonetheless","néanmoins (formel)","Nouvelle phrase"],
          ["on the other hand","d'un autre côté","Nouvelle phrase"]
        ]},

        {type:"heading",text:"Cause"},
        {type:"table",headers:["Anglais","Français","Catégorie"],rows:[
          ["because","parce que","+ Clause"],
          ["as / since","puisque / comme","+ Clause"],
          ["now that","maintenant que","+ Clause"],
          ["because of","à cause de","+ Nom"],
          ["due to","en raison de","+ Nom"],
          ["owing to","en raison de (formel)","+ Nom"]
        ]},

        {type:"heading",text:"Conséquence / résultat"},
        {type:"table",headers:["Anglais","Français","Catégorie"],rows:[
          ["so that","afin que / pour que","+ Clause"],
          ["therefore","donc / par conséquent","Nouvelle phrase"],
          ["consequently","en conséquence","Nouvelle phrase"],
          ["as a result","de ce fait","Nouvelle phrase"],
          ["thus","ainsi","Nouvelle phrase"],
          ["hence","d'où","Nouvelle phrase"]
        ]},

        {type:"heading",text:"Addition"},
        {type:"table",headers:["Anglais","Français","Catégorie"],rows:[
          ["in addition to","en plus de","+ Nom"],
          ["apart from","outre / en dehors de","+ Nom"],
          ["moreover","de plus","Nouvelle phrase"],
          ["furthermore","en outre","Nouvelle phrase"],
          ["in addition","de plus","Nouvelle phrase"],
          ["besides","d'ailleurs (familier)","Nouvelle phrase"]
        ]},

        {type:"heading",text:"Condition"},
        {type:"table",headers:["Anglais","Français","Catégorie"],rows:[
          ["if","si","+ Clause"],
          ["unless","à moins que","+ Clause"],
          ["provided that","à condition que","+ Clause"],
          ["as long as","tant que / à condition que","+ Clause"],
          ["in case","au cas où","+ Clause"]
        ]},

        {type:"heading",text:"Temps"},
        {type:"table",headers:["Anglais","Français","Catégorie"],rows:[
          ["when","quand","+ Clause"],
          ["while","pendant que","+ Clause"],
          ["before / after","avant / après","+ Clause"],
          ["as soon as","dès que","+ Clause"],
          ["until / till","jusqu'à ce que","+ Clause"],
          ["since","depuis que (temporel)","+ Clause"]
        ]},

        {type:"heading",text:"But / objectif"},
        {type:"table",headers:["Anglais","Français","Construction"],rows:[
          ["so that","afin que","+ Clause"],
          ["in order to","afin de","+ V base"],
          ["to + V","pour (+ verbe)","+ V base"]
        ]},

        {type:"heading",text:"Exemple / illustration"},
        {type:"table",headers:["Anglais","Français","Position"],rows:[
          ["for example / for instance","par exemple","Nouvelle phrase ou milieu"],
          ["such as","tel que","+ Nom"],
          ["namely","à savoir","Nouvelle phrase"],
          ["that is (i.e.)","c'est-à-dire","Nouvelle phrase"]
        ]},

        {type:"heading",text:"Conclusion / résumé"},
        {type:"table",headers:["Anglais","Français","Position"],rows:[
          ["in conclusion","en conclusion","Nouvelle phrase"],
          ["to sum up","pour résumer","Nouvelle phrase"],
          ["overall","dans l'ensemble","Nouvelle phrase"],
          ["in short","en bref","Nouvelle phrase"]
        ]},

        {type:"heading",text:"Inversion (niveau 800+)"},
        {type:"table",headers:["Anglais","Français","Construction"],rows:[
          ["rarely / seldom","rarement","+ aux + sujet"],
          ["no sooner... than","à peine... que","+ aux + sujet"],
          ["hardly... when","à peine... que","+ aux + sujet"],
          ["not only... but also","non seulement... mais aussi","+ aux + sujet"],
          ["under no circumstances","en aucun cas","+ aux + sujet"]
        ]}
      ]
    }
  ]
};
