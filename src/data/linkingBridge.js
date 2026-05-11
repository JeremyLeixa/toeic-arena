// ═══════════════════════════════════════════════════════════
// LINKING BRIDGE — 40 contextual connector-fill items
// Fill-in-the-blank format: student picks the connector that
// fits both the logical relation AND the grammatical structure.
// Each option carries its FR translation, shown in feedback.
// ═══════════════════════════════════════════════════════════

export var LINKING_BRIDGE = [
  // ─────────── TIER 1 — 12 items (basics) ───────────
  {
    id:"bf01", tier:1, cat:"consequence",
    prompt:"The team worked overtime for weeks. _____, the project was delivered on time.",
    opts:[
      {w:"Therefore", fr:"donc / par conséquent", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Whereas", fr:"alors que (+ clause)", correct:false}
    ],
    exp:"Cause directe → conséquence. « Therefore » relie deux phrases complètes après un point."
  },
  {
    id:"bf02", tier:1, cat:"contrast",
    prompt:"The new policy is unpopular. _____, management refuses to revise it.",
    opts:[
      {w:"However", fr:"cependant", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false},
      {w:"Because", fr:"parce que (+ clause)", correct:false}
    ],
    exp:"Contraste entre les deux phrases. « However » s'ouvre par un point ou un point-virgule."
  },
  {
    id:"bf03", tier:1, cat:"addition",
    prompt:"The product is affordable. _____, it has excellent customer reviews.",
    opts:[
      {w:"Moreover", fr:"de plus", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false}
    ],
    exp:"Argument supplémentaire qui renforce. « Moreover » introduit une nouvelle phrase positive."
  },
  {
    id:"bf04", tier:1, cat:"consequence",
    prompt:"Demand has surged. _____, the company is hiring more staff.",
    opts:[
      {w:"As a result", fr:"de ce fait", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false}
    ],
    exp:"« As a result » introduit la conséquence d'un événement précédent."
  },
  {
    id:"bf05", tier:1, cat:"contrast",
    prompt:"Sales targets were ambitious. _____, the team exceeded them.",
    opts:[
      {w:"Nevertheless", fr:"néanmoins", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Because", fr:"parce que (+ clause)", correct:false},
      {w:"So that", fr:"afin que (+ clause)", correct:false}
    ],
    exp:"Contraste fort : malgré l'ambition des objectifs, ils ont été dépassés. « Nevertheless » = malgré tout."
  },
  {
    id:"bf06", tier:1, cat:"addition",
    prompt:"The merger will reduce costs. _____, it will streamline operations.",
    opts:[
      {w:"Furthermore", fr:"en outre", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Whereas", fr:"alors que (+ clause)", correct:false}
    ],
    exp:"« Furthermore » ajoute un argument qui creuse l'idée précédente. Ton formel business."
  },
  {
    id:"bf07", tier:1, cat:"consequence",
    prompt:"Shipping was delayed. _____, customers are frustrated.",
    opts:[
      {w:"Consequently", fr:"en conséquence", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"Conséquence en cascade : retard → frustration. « Consequently » marque un effet dans le temps."
  },
  {
    id:"bf08", tier:1, cat:"contrast",
    prompt:"Many companies are cutting jobs. _____, ours is hiring.",
    opts:[
      {w:"However", fr:"cependant", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false},
      {w:"Because", fr:"parce que (+ clause)", correct:false}
    ],
    exp:"Opposition entre la tendance du marché et la situation de l'entreprise. « However » est le choix standard."
  },
  {
    id:"bf09", tier:1, cat:"contrast",
    prompt:"The CEO publicly supports remote work. _____, she works from the office every day.",
    opts:[
      {w:"However", fr:"cependant", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Furthermore", fr:"en outre", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false}
    ],
    exp:"Contradiction entre le discours et l'action. « However » signale l'opposition."
  },
  {
    id:"bf10", tier:1, cat:"consequence",
    prompt:"Our team is growing fast. _____, we need a bigger office.",
    opts:[
      {w:"Therefore", fr:"donc / par conséquent", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Whereas", fr:"alors que (+ clause)", correct:false}
    ],
    exp:"Croissance → besoin de plus d'espace. Conséquence directe avec « Therefore »."
  },
  {
    id:"bf11", tier:1, cat:"contrast",
    prompt:"The training course is intensive. _____, it is highly rated by participants.",
    opts:[
      {w:"Nevertheless", fr:"néanmoins", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false},
      {w:"Moreover", fr:"de plus", correct:false}
    ],
    exp:"Contraste : malgré l'intensité, la formation est appréciée. « Nevertheless » = malgré tout."
  },
  {
    id:"bf12", tier:1, cat:"consequence",
    prompt:"The contract is complex. _____, we should consult a lawyer.",
    opts:[
      {w:"Therefore", fr:"donc / par conséquent", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Whereas", fr:"alors que (+ clause)", correct:false}
    ],
    exp:"Complexité → besoin de conseil. Lien causal direct, « Therefore » convient."
  },

  // ─────────── TIER 2 — 18 items (nuances + discriminate) ───────────
  {
    id:"bf13", tier:2, cat:"contrast",
    prompt:"The new system is more efficient. _____, it costs significantly more.",
    opts:[
      {w:"However", fr:"cependant", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Furthermore", fr:"en outre", correct:false},
      {w:"Moreover", fr:"de plus", correct:false}
    ],
    exp:"Contraste entre l'avantage (efficacité) et l'inconvénient (coût). « However » s'impose."
  },
  {
    id:"bf14", tier:2, cat:"addition",
    prompt:"Customer satisfaction has improved. _____, complaint volumes have halved.",
    opts:[
      {w:"In addition", fr:"de plus", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false}
    ],
    exp:"Deux progrès simultanés. « In addition » (nouvelle phrase) ≠ « in addition to » (+ nom)."
  },
  {
    id:"bf15", tier:2, cat:"contrast",
    prompt:"The financial report was clear and thorough. _____, several details still need clarification.",
    opts:[
      {w:"Nonetheless", fr:"néanmoins (formel)", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Moreover", fr:"de plus", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false}
    ],
    exp:"Contraste fort en registre formel. « Nonetheless » convient à l'écrit business."
  },
  {
    id:"bf16", tier:2, cat:"consequence",
    prompt:"Inflation is rising rapidly. _____, central banks are raising interest rates.",
    opts:[
      {w:"Consequently", fr:"en conséquence", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"Effet en cascade dans la chaîne économique. « Consequently » marque ce type de causalité."
  },
  {
    id:"bf17", tier:2, cat:"contrast",
    prompt:"The application is free to download. _____, premium features require a subscription.",
    opts:[
      {w:"However", fr:"cependant", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false},
      {w:"Moreover", fr:"de plus", correct:false}
    ],
    exp:"Nuance : la gratuité est partielle. « However » introduit la restriction."
  },
  {
    id:"bf18", tier:2, cat:"consequence",
    prompt:"Software bugs were detected during testing. _____, the release was postponed.",
    opts:[
      {w:"As a result", fr:"de ce fait", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"Cause (bugs) → conséquence (report). « As a result » est neutre et limpide."
  },
  {
    id:"bf19", tier:2, cat:"consequence",
    prompt:"Our analysis showed strong returns. _____, we recommend additional investment.",
    opts:[
      {w:"Therefore", fr:"donc / par conséquent", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Whereas", fr:"alors que (+ clause)", correct:false}
    ],
    exp:"Lien logique direct entre analyse et recommandation. « Therefore » est le pivot business courant."
  },
  {
    id:"bf20", tier:2, cat:"contrast",
    prompt:"Some employees enjoy remote work. _____, others prefer the office environment.",
    opts:[
      {w:"On the other hand", fr:"d'un autre côté", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Moreover", fr:"de plus", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false}
    ],
    exp:"Comparaison de deux perspectives parallèles. « On the other hand » présente l'autre face."
  },
  {
    id:"bf21", tier:2, cat:"illustration",
    prompt:"The proposal had several flaws. _____, the budget was unrealistic and the deadlines too tight.",
    opts:[
      {w:"For instance", fr:"par exemple", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Therefore", fr:"donc", correct:false}
    ],
    exp:"Illustration par exemples concrets. « For instance » = « for example », interchangeables."
  },
  {
    id:"bf22", tier:2, cat:"addition",
    prompt:"Productivity has stalled. _____, employee morale is declining.",
    opts:[
      {w:"Furthermore", fr:"en outre", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"So", fr:"alors / donc (familier)", correct:false}
    ],
    exp:"Deux problèmes qui s'aggravent. « Furthermore » accumule les points négatifs."
  },
  {
    id:"bf23", tier:2, cat:"condition",
    prompt:"Cancel your subscription before Friday. _____, you will be charged for another month.",
    opts:[
      {w:"Otherwise", fr:"sinon", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Moreover", fr:"de plus", correct:false},
      {w:"Because", fr:"parce que (+ clause)", correct:false}
    ],
    exp:"« Otherwise » = sans cela, dans le cas contraire. Conséquence d'une condition non remplie."
  },
  {
    id:"bf24", tier:2, cat:"substitution",
    prompt:"She declined the promotion. _____, she requested a six-month sabbatical.",
    opts:[
      {w:"Instead", fr:"à la place", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Furthermore", fr:"en outre", correct:false}
    ],
    exp:"Substitution : un choix remplace l'autre. « Instead » signale le remplacement."
  },
  {
    id:"bf25", tier:2, cat:"emphasis",
    prompt:"Critics predicted the launch would fail. _____, sales exceeded all forecasts.",
    opts:[
      {w:"In fact", fr:"en fait", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Moreover", fr:"de plus", correct:false}
    ],
    exp:"« In fact » corrige et renforce, souvent à l'opposé d'une attente. Plus fort qu'un simple « however »."
  },
  {
    id:"bf26", tier:2, cat:"consequence",
    prompt:"The committee approved the plan. _____, implementation will start next month.",
    opts:[
      {w:"Accordingly", fr:"en conséquence", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"« Accordingly » = conformément à ce qui précède. Registre formel, business courant en TOEIC."
  },
  {
    id:"bf27", tier:2, cat:"consequence",
    prompt:"Sales have grown for three consecutive quarters. _____, the team deserves a bonus.",
    opts:[
      {w:"Thus", fr:"ainsi", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Whereas", fr:"alors que (+ clause)", correct:false}
    ],
    exp:"« Thus » = ainsi, formel et conclusif. Souvent en TOEIC Reading 700+."
  },
  {
    id:"bf28", tier:2, cat:"consequence",
    prompt:"Reports indicate strong fourth-quarter sales. _____, hiring will accelerate in Q1.",
    opts:[
      {w:"Hence", fr:"d'où", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"« Hence » = d'où, conséquence formelle et concise. Registre TOEIC haut niveau."
  },
  {
    id:"bf29", tier:2, cat:"specification",
    prompt:"The product will launch in three regions. _____, North America, Europe, and Asia-Pacific.",
    opts:[
      {w:"Namely", fr:"à savoir", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false},
      {w:"Therefore", fr:"donc", correct:false}
    ],
    exp:"« Namely » précise / énumère ce qui vient d'être annoncé. Outil de clarification."
  },
  {
    id:"bf30", tier:2, cat:"conclusion",
    prompt:"Our review covered all major findings and recommendations. _____, the new strategy is on track.",
    opts:[
      {w:"In conclusion", fr:"en conclusion", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Moreover", fr:"de plus", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false}
    ],
    exp:"Synthèse finale. « In conclusion » ferme un raisonnement ou un rapport."
  },

  // ─────────── TIER 3 — 10 items (inversion + advanced) ───────────
  {
    id:"bf31", tier:3, cat:"inversion",
    prompt:"_____ had we launched the campaign than orders started flooding in.",
    opts:[
      {w:"No sooner", fr:"à peine", correct:true},
      {w:"Hardly when", fr:"à peine que", correct:false},
      {w:"Rarely", fr:"rarement", correct:false},
      {w:"As soon as", fr:"dès que (+ clause sans inversion)", correct:false}
    ],
    exp:"« No sooner... than » : structure corrélative avec inversion (had + sujet + V-en). Action immédiatement suivie d'une autre."
  },
  {
    id:"bf32", tier:3, cat:"inversion",
    prompt:"_____ have we faced a market this volatile.",
    opts:[
      {w:"Rarely", fr:"rarement", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false}
    ],
    exp:"Adverbe négatif en tête → inversion (have we faced). Construction TOEIC 800+."
  },
  {
    id:"bf33", tier:3, cat:"inversion",
    prompt:"_____ did the company grow rapidly, but it also opened three new offices.",
    opts:[
      {w:"Not only", fr:"non seulement", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Although", fr:"bien que (+ clause)", correct:false}
    ],
    exp:"« Not only... but also » : structure corrélative avec inversion (did + sujet + V base)."
  },
  {
    id:"bf34", tier:3, cat:"inversion",
    prompt:"_____ should employees disclose confidential client data to third parties.",
    opts:[
      {w:"Under no circumstances", fr:"en aucun cas", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"Furthermore", fr:"en outre", correct:false}
    ],
    exp:"Locution négative restrictive en tête → inversion modale (should + sujet + V base)."
  },
  {
    id:"bf35", tier:3, cat:"inversion",
    prompt:"_____ had the meeting started when the fire alarm rang.",
    opts:[
      {w:"Hardly", fr:"à peine", correct:true},
      {w:"Therefore", fr:"donc", correct:false},
      {w:"As soon as", fr:"dès que (sans inversion)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"« Hardly... when » : corrélatif avec inversion (had + sujet + V-en). Frère jumeau de « No sooner... than »."
  },
  {
    id:"bf36", tier:3, cat:"inversion",
    prompt:"_____ does management consult the entire staff before a strategic shift.",
    opts:[
      {w:"Seldom", fr:"rarement", correct:true},
      {w:"Often", fr:"souvent (sans inversion)", correct:false},
      {w:"Always", fr:"toujours (sans inversion)", correct:false},
      {w:"Sometimes", fr:"parfois (sans inversion)", correct:false}
    ],
    exp:"« Seldom » = rarement, déclenche l'inversion (does + sujet + V base) en début de phrase."
  },
  {
    id:"bf37", tier:3, cat:"inversion",
    prompt:"_____ then did we realize the full impact of the policy change.",
    opts:[
      {w:"Only", fr:"seulement", correct:true},
      {w:"However", fr:"cependant", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false},
      {w:"Therefore", fr:"donc", correct:false}
    ],
    exp:"« Only then » : adverbe restrictif en tête, inversion (did + sujet + V base)."
  },
  {
    id:"bf38", tier:3, cat:"inversion",
    prompt:"_____ before had we seen such enthusiasm at a product launch.",
    opts:[
      {w:"Never", fr:"jamais", correct:true},
      {w:"Sometimes", fr:"parfois (sans inversion)", correct:false},
      {w:"Often", fr:"souvent (sans inversion)", correct:false},
      {w:"Always", fr:"toujours (sans inversion)", correct:false}
    ],
    exp:"« Never before » négatif en tête → inversion (had + sujet + V-en). Construction emphatique."
  },
  {
    id:"bf39", tier:3, cat:"formal-condition",
    prompt:"_____ this situation arise again, please contact your supervisor immediately.",
    opts:[
      {w:"Should", fr:"si jamais (conditionnel formel)", correct:true},
      {w:"If", fr:"si (sans inversion)", correct:false},
      {w:"Unless", fr:"à moins que", correct:false},
      {w:"Even if", fr:"même si (sans inversion)", correct:false}
    ],
    exp:"« Should + sujet + V base » : conditionnel formel par inversion = « si jamais ». Remplace « If this should arise »."
  },
  {
    id:"bf40", tier:3, cat:"formal-condition",
    prompt:"_____ for the auditor's review, the irregularities would not have been detected.",
    opts:[
      {w:"Were it not", fr:"s'il n'y avait pas eu", correct:true},
      {w:"If not", fr:"sinon", correct:false},
      {w:"Because of", fr:"à cause de (+ nom)", correct:false},
      {w:"Despite", fr:"malgré (+ nom)", correct:false}
    ],
    exp:"« Were it not for X » : subjonctif formel inversé = « sans X / s'il n'y avait pas eu X ». Niveau écrit business avancé."
  }
];
