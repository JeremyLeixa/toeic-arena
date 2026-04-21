// ═══════════════════════════════════════════════════════════
// GRAMMAR GAUNTLET — GRIMOIRES (théorie)
// 3 manuscrits consultables depuis le hub + in-game :
//   • GRIMOIRE_CHRONOMANCER  → temps verbaux
//   • GRIMOIRE_PASSIVE_FORGE → voix passive
//   • GRIMOIRE_RELATIVE_WEAVER → propositions relatives
//
// Structure commune : chapters[] avec blocks[] typés.
// Types de blocs consommés par le <GrimoireReader/> :
//   • "paragraph"  → prose simple. { text }
//   • "rule"       → encadré règle/formule. { label?, formula }
//   • "heading"    → sous-titre intra-chapitre. { text }
//   • "example"    → exemple bilingue. { en, fr?, note? }
//   • "trap"       → encadré piège TOEIC rouge. { text }
//   • "table"      → { headers: [], rows: [[], []] }
//   • "list"       → liste à puces. { items: [] }
// ═══════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────
// CHRONOMANCER — Manuscrit du Temps
// ───────────────────────────────────────────────────────────
export var GRIMOIRE_CHRONOMANCER = {
  id: "chronomancer",
  title: "Chronomancer — Manuscrit du Temps",
  subtitle: "Maîtrise des temps verbaux TOEIC",
  readingTime: "8 min",
  icon: "⏳",
  chapters: [
    {
      id: "ch1_pp_vs_sp",
      title: "I. Simple Past vs Present Perfect",
      intro: "Le piège numéro un pour les francophones. En français, le passé composé fait double emploi. En anglais, deux temps distincts, deux logiques.",
      blocks: [
        {type:"heading",text:"La règle d'or"},
        {type:"rule",label:"Simple Past",formula:"Action TERMINÉE à un moment précis du passé."},
        {type:"rule",label:"Present Perfect",formula:"has / have + V3 — Action avec un LIEN au présent."},
        {type:"paragraph",text:"La différence n'est pas une question de temps écoulé, mais de perspective. Est-ce que l'action compte encore maintenant ?"},
        {type:"example",en:"I worked in Paris for two years.",fr:"J'ai travaillé à Paris pendant deux ans.",note:"Simple past : c'est fini, je n'y travaille plus."},
        {type:"example",en:"I have worked in Paris for two years.",fr:"Je travaille à Paris depuis deux ans.",note:"Present perfect : j'y travaille encore aujourd'hui."},

        {type:"heading",text:"Les marqueurs temporels — le guide infaillible"},
        {type:"paragraph",text:"Le choix du temps est dicté à 90% par le marqueur temporel présent dans la phrase. Apprends ces deux listes par cœur :"},
        {type:"table",headers:["Simple Past","Present Perfect"],rows:[
          ["yesterday","since (+ point de départ)"],
          ["ago (two days ago)","for (+ durée qui continue)"],
          ["last week / month / year","already"],
          ["in 2020 / in July","yet (questions, négations)"],
          ["when I was young","just"],
          ["at 3 p.m.","ever / never"],
          ["this morning (si révolu)","so far / up to now"],
          ["—","recently / lately"]
        ]},

        {type:"heading",text:"Le piège 'this morning'"},
        {type:"paragraph",text:"Un marqueur comme 'this morning', 'today', 'this week' est ambigu : il dépend du contexte."},
        {type:"example",en:"I've had three coffees this morning.",fr:"J'ai bu trois cafés ce matin.",note:"Il est encore matin → present perfect."},
        {type:"example",en:"I had three coffees this morning.",fr:"J'ai bu trois cafés ce matin.",note:"Il est 18h, le matin est révolu → simple past."},

        {type:"trap",text:"JAMAIS de present perfect avec un marqueur de temps DATÉ. 'I have seen him yesterday' est FAUX. Si tu vois 'yesterday / ago / in 2020', c'est simple past obligatoire."}
      ]
    },
    {
      id: "ch2_pp_simple_vs_continuous",
      title: "II. Present Perfect Simple vs Continuous",
      intro: "Deux variantes du present perfect. Le simple met l'accent sur le résultat ; le continuous sur la durée ou le processus.",
      blocks: [
        {type:"rule",label:"Present Perfect Simple",formula:"has / have + V3 — Résultat, quantité, expérience."},
        {type:"rule",label:"Present Perfect Continuous",formula:"has / have been + V-ing — Durée, processus en cours, activité récente."},
        {type:"example",en:"She has written three reports this week.",fr:"Elle a rédigé trois rapports cette semaine.",note:"Simple : résultat quantifié (3 rapports)."},
        {type:"example",en:"She has been writing reports all morning.",fr:"Elle rédige des rapports depuis ce matin.",note:"Continuous : durée de l'activité, peut-être encore en cours."},

        {type:"heading",text:"Quand le simple est obligatoire"},
        {type:"list",items:[
          "Avec des verbes d'état (know, understand, believe, love, own, belong) : 'I have known him for years' (jamais *I have been knowing*).",
          "Quand on mentionne une quantité : 'He has read five books this month.'",
          "Pour une expérience de vie : 'I have never been to Japan.'"
        ]},

        {type:"heading",text:"Quand le continuous est préféré"},
        {type:"list",items:[
          "Insister sur la durée d'une activité : 'How long have you been waiting ?'",
          "Action récente avec résultat visible : 'You look tired — have you been running ?'",
          "Activité qui peut être temporaire : 'I have been working on this project for two weeks.'"
        ]}
      ]
    },
    {
      id: "ch3_past_perfect",
      title: "III. Past Perfect — l'antériorité dans le passé",
      intro: "Quand on raconte deux actions passées, le past perfect sert à marquer celle qui s'est produite AVANT.",
      blocks: [
        {type:"rule",label:"Past Perfect",formula:"had + V3 — Action antérieure à une autre action passée."},
        {type:"paragraph",text:"C'est un temps de narration. Il n'a de sens qu'en présence d'un autre repère passé."},
        {type:"example",en:"By the time we arrived, the meeting had started.",fr:"Quand nous sommes arrivés, la réunion avait commencé.",note:"Deux actions : 'arrived' (simple past) et 'started' (past perfect, antérieur)."},
        {type:"example",en:"She had already left when I called.",fr:"Elle était déjà partie quand j'ai appelé.",note:"'had left' précède 'called'."},

        {type:"heading",text:"Past Perfect Continuous"},
        {type:"rule",label:"Past Perfect Continuous",formula:"had been + V-ing — Durée d'une action antérieure à un autre passé."},
        {type:"example",en:"They had been working for two hours when the system crashed.",fr:"Ils travaillaient depuis deux heures quand le système a planté.",note:"Durée antérieure au point de rupture."},

        {type:"trap",text:"N'utilise pas le past perfect systématiquement pour 'tout le passé éloigné'. Il doit y avoir un autre passé de référence dans la phrase ou le contexte immédiat."}
      ]
    },
    {
      id: "ch4_futures",
      title: "IV. Les futurs — will, be going to, present continuous",
      intro: "Anglais a 3 façons principales d'exprimer le futur. Le choix dépend de la nature de la prédiction.",
      blocks: [
        {type:"rule",label:"Will + base",formula:"Décision spontanée, prédiction neutre, promesse."},
        {type:"rule",label:"Be going to + base",formula:"Intention préméditée, prédiction basée sur un indice présent."},
        {type:"rule",label:"Present continuous (be + V-ing)",formula:"Arrangement futur déjà organisé (rendez-vous, réservation)."},
        {type:"example",en:"The phone's ringing. I'll get it.",fr:"Le téléphone sonne. Je réponds.",note:"Will : décision prise à l'instant."},
        {type:"example",en:"We're going to launch the product in June.",fr:"On va lancer le produit en juin.",note:"Going to : intention planifiée en amont."},
        {type:"example",en:"I'm meeting the client at 3 p.m.",fr:"Je rencontre le client à 15h.",note:"Present continuous : rendez-vous fixé."},

        {type:"heading",text:"Future Perfect — 'will have + V3'"},
        {type:"rule",label:"Future Perfect",formula:"will have + V3 — Action accomplie AVANT un point futur."},
        {type:"example",en:"By next June, she will have worked here for ten years.",fr:"D'ici juin prochain, elle aura travaillé ici pendant dix ans.",note:"'by + date future' → future perfect."},

        {type:"trap",text:"TOEIC aime tester 'by + date future' et 'by the time + présent'. Ces deux marqueurs imposent le future perfect dans la proposition principale."}
      ]
    },
    {
      id: "ch5_time_clauses",
      title: "V. Time clauses — jamais 'will' dans la subordonnée",
      intro: "Règle absolue TOEIC. Dans une proposition subordonnée temporelle, on N'UTILISE JAMAIS le futur. On met le présent simple, même si le sens est futur.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Subordonnée présent] + [Principale will + V]"},
        {type:"list",items:[
          "when", "as soon as", "after", "before", "until", "once", "by the time", "the moment"
        ]},
        {type:"example",en:"I'll call you when I arrive.",fr:"Je t'appelle dès que j'arrive.",note:"NON : 'when I will arrive'."},
        {type:"example",en:"As soon as the client arrives, we'll start.",fr:"Dès que le client arrive, on commence.",note:"Présent dans la subordonnée même si l'action est future."},
        {type:"example",en:"Once we receive the payment, we'll ship the order.",fr:"Dès qu'on reçoit le paiement, on expédie.",note:""},

        {type:"trap",text:"Ce piège tombe presque à chaque TOEIC Part 5. Dès que tu vois 'when / as soon as / before / after / until' + futur dans les options, écarte les 'will' de la subordonnée."}
      ]
    },
    {
      id: "ch6_used_to",
      title: "VI. Used to / would — les habitudes passées",
      intro: "Pour évoquer des habitudes ou états passés qui n'existent plus aujourd'hui.",
      blocks: [
        {type:"rule",label:"Used to + base",formula:"Habitude OU état passé qui n'existe plus."},
        {type:"rule",label:"Would + base",formula:"Habitude passée uniquement (pas les états). Registre narratif."},
        {type:"example",en:"I used to work part-time at a bookstore.",fr:"Je travaillais à mi-temps dans une librairie (avant, plus maintenant)."},
        {type:"example",en:"She used to be very shy.",fr:"Elle était très timide (état, ne l'est plus).",note:"Avec un état, SEUL 'used to' marche. PAS 'would be'."},
        {type:"example",en:"Every Friday, we would have lunch together.",fr:"Chaque vendredi, on déjeunait ensemble.",note:"Habitude répétée → would OK."},

        {type:"trap",text:"Ne confonds pas 'used to do' (habitude passée) avec 'be used to doing' (avoir l'habitude de) ni 'get used to doing' (s'habituer à). Trois structures différentes !"},
        {type:"example",en:"I'm used to working late.",fr:"J'ai l'habitude de travailler tard.",note:"Présent, pas passé."}
      ]
    }
  ]
};

// ───────────────────────────────────────────────────────────
// PASSIVE FORGE — Manuscrit du Passif
// ───────────────────────────────────────────────────────────
export var GRIMOIRE_PASSIVE_FORGE = {
  id: "passive_forge",
  title: "Passive Forge — Manuscrit du Passif",
  subtitle: "L'art de renverser la phrase",
  readingTime: "6 min",
  icon: "⚒️",
  chapters: [
    {
      id: "ch1_when_passive",
      title: "I. Pourquoi et quand utiliser le passif",
      intro: "Le passif n'est pas une simple variante stylistique. Il a des usages précis, particulièrement fréquents dans le monde TOEIC (rapports, notices, emails professionnels).",
      blocks: [
        {type:"heading",text:"Les 4 raisons d'utiliser le passif"},
        {type:"list",items:[
          "Focus sur l'OBJET plutôt que sur l'agent : 'The contract was signed.' (peu importe qui a signé).",
          "Agent INCONNU ou évident : 'My laptop has been stolen.' (on ne sait pas par qui).",
          "Registre FORMEL / impersonnel : 'Passengers are requested to fasten their seatbelts.'",
          "Processus scientifiques ou procéduraux : 'The sample is then analyzed under a microscope.'"
        ]},
        {type:"example",en:"Actif : The CEO made the decision.",fr:"Le PDG a pris la décision.",note:"Focus sur le PDG."},
        {type:"example",en:"Passif : The decision was made.",fr:"La décision a été prise.",note:"Focus sur la décision — l'agent disparaît ou devient secondaire."}
      ]
    },
    {
      id: "ch2_construction",
      title: "II. La formule universelle",
      intro: "Quel que soit le temps, la voix passive obéit à une seule formule.",
      blocks: [
        {type:"rule",label:"Formule universelle",formula:"BE (au temps voulu) + V3 (past participle)"},
        {type:"paragraph",text:"Tout le reste n'est que déclinaison de cette formule selon le temps. Maîtrise 'be' conjugué + V3, et tu as maîtrisé le passif."},

        {type:"heading",text:"Structure de transformation"},
        {type:"rule",label:"Active → Passive",formula:"[Sujet] [Verbe] [Objet]  →  [Objet] [BE + V3] [by + Agent]"},
        {type:"example",en:"They signed the contract.  →  The contract was signed (by them).",fr:"Ils ont signé le contrat. → Le contrat a été signé (par eux).",note:"L'objet devient sujet. L'agent est souvent supprimé."},

        {type:"paragraph",text:"L'agent introduit par 'by' est supprimé dans 80% des cas — sauf s'il est informatif ou surprenant."}
      ]
    },
    {
      id: "ch3_tenses_table",
      title: "III. Le passif à tous les temps",
      intro: "Le tableau à graver dans ta mémoire. C'est la boussole du passif.",
      blocks: [
        {type:"table",headers:["Temps","Actif","Passif"],rows:[
          ["Simple Present","writes","is / are written"],
          ["Present Continuous","is writing","is / are being written"],
          ["Simple Past","wrote","was / were written"],
          ["Past Continuous","was writing","was / were being written"],
          ["Present Perfect","has written","has / have been written"],
          ["Past Perfect","had written","had been written"],
          ["Simple Future (will)","will write","will be written"],
          ["Be going to","is going to write","is going to be written"],
          ["Future Perfect","will have written","will have been written"],
          ["Modal (must, can, should...)","must write","must be written"],
          ["Modal Perfect","should have written","should have been written"],
          ["Infinitive","to write","to be written"],
          ["Gerund (V-ing)","writing","being written"]
        ]},
        {type:"example",en:"The report has been reviewed.",fr:"Le rapport a été relu.",note:"Present perfect passive."},
        {type:"example",en:"The issue should be addressed immediately.",fr:"Le problème doit être traité immédiatement.",note:"Modal passive."},
        {type:"example",en:"This machine needs to be serviced.",fr:"Cette machine doit être révisée.",note:"Passive infinitive après 'need'."}
      ]
    },
    {
      id: "ch4_double_object",
      title: "IV. Verbes à double objet — le piège TOEIC",
      intro: "Certains verbes (give, offer, send, tell, show, pay, teach...) acceptent DEUX objets : un direct, un indirect. Au passif, c'est presque toujours la PERSONNE qui devient sujet.",
      blocks: [
        {type:"rule",label:"Structure active",formula:"[Sujet] [give] [personne] [chose]"},
        {type:"rule",label:"Structure passive privilégiée",formula:"[Personne] [is/was given] [chose] (by X)"},
        {type:"example",en:"The manager offered her a senior position.",fr:"Le manager lui a offert un poste senior.",note:""},
        {type:"example",en:"She was offered a senior position.",fr:"On lui a offert un poste senior.",note:"La personne (she) devient sujet du passif."},
        {type:"example",en:"All employees were given a bonus last December.",fr:"Tous les employés ont reçu un bonus en décembre.",note:""},

        {type:"trap",text:"Beaucoup d'étudiants mettent la chose en sujet par réflexe français. 'A bonus was given to all employees' est correct aussi, mais TOEIC préfère systématiquement la version avec la personne en sujet."}
      ]
    },
    {
      id: "ch5_traps",
      title: "V. Les pièges TOEIC classiques",
      intro: "Les structures passives qui font chuter les scores.",
      blocks: [
        {type:"heading",text:"1. L'accord sujet-verbe"},
        {type:"example",en:"The reports were submitted yesterday.",fr:"Les rapports ont été rendus hier.",note:"Sujet pluriel → were, pas was."},
        {type:"trap",text:"Vérifie toujours si le sujet est singulier ou pluriel. Le TOEIC glisse souvent un long groupe nominal pour te perdre."},

        {type:"heading",text:"2. 'get' passive (registre informel)"},
        {type:"paragraph",text:"'get + V3' est un passif informel, fréquent en anglais parlé et dans les emails business décontractés."},
        {type:"example",en:"He got promoted last month.",fr:"Il a été promu le mois dernier.",note:"= 'He was promoted' mais plus oral."},
        {type:"example",en:"The package got damaged during shipping.",fr:"Le colis a été abîmé pendant la livraison.",note:""},

        {type:"heading",text:"3. Passif avec modaux composés"},
        {type:"rule",label:"Modal Perfect Passive",formula:"modal + have been + V3"},
        {type:"example",en:"The invoice should have been paid last week.",fr:"La facture aurait dû être payée la semaine dernière.",note:"Reproche/regret."},
        {type:"example",en:"The issue could have been avoided.",fr:"Le problème aurait pu être évité.",note:""},

        {type:"heading",text:"4. Passif infinitif et gérondif"},
        {type:"example",en:"The machine needs to be serviced.",fr:"La machine doit être révisée.",note:"'need + to be + V3'."},
        {type:"example",en:"I hate being interrupted during meetings.",fr:"Je déteste être interrompu en réunion.",note:"'being + V3' après 'hate / like / enjoy'."}
      ]
    }
  ]
};

// ───────────────────────────────────────────────────────────
// RELATIVE WEAVER — Manuscrit du Tisserand
// ───────────────────────────────────────────────────────────
export var GRIMOIRE_RELATIVE_WEAVER = {
  id: "relative_weaver",
  title: "Relative Weaver — Manuscrit du Tisserand",
  subtitle: "Tisser les propositions relatives",
  readingTime: "7 min",
  icon: "🕸️",
  chapters: [
    {
      id: "ch1_defining_vs_non",
      title: "I. Defining vs non-defining — la virgule change tout",
      intro: "Deux types de relatives. La virgule n'est pas une coquetterie de style : elle change le SENS de la phrase.",
      blocks: [
        {type:"rule",label:"Defining (sans virgule)",formula:"Information INDISPENSABLE — elle identifie le nom."},
        {type:"rule",label:"Non-defining (entre virgules)",formula:"Information SUPPLÉMENTAIRE — elle ajoute un commentaire."},

        {type:"example",en:"The employees who work in R&D received a bonus.",fr:"Les employés qui travaillent en R&D ont reçu un bonus.",note:"Defining : SEULS ceux de R&D, pas les autres."},
        {type:"example",en:"The employees, who work in R&D, received a bonus.",fr:"Les employés, qui travaillent tous en R&D, ont reçu un bonus.",note:"Non-defining : TOUS les employés (tous sont en R&D)."},

        {type:"heading",text:"Trois règles critiques TOEIC"},
        {type:"list",items:[
          "'that' est INTERDIT en non-defining. Seulement who/which après virgule.",
          "On ne peut PAS omettre le pronom relatif en non-defining.",
          "En defining, on peut souvent omettre le pronom quand il est objet."
        ]},

        {type:"trap",text:"Si tu vois une virgule AVANT le trou, élimine 'that' des options. C'est une erreur piégeuse classique du Part 5."}
      ]
    },
    {
      id: "ch2_pronoun_table",
      title: "II. Le tableau des pronoms relatifs",
      intro: "Six pronoms pour tisser toutes les relatives. Mémorise leur domaine d'usage.",
      blocks: [
        {type:"table",headers:["Pronom","Référent","Fonction","Defining","Non-defining"],rows:[
          ["who","personne","sujet / objet","oui","oui"],
          ["whom","personne","objet (formel)","oui","oui"],
          ["which","chose / animal","sujet / objet","oui","oui"],
          ["that","personne / chose","sujet / objet","oui","NON"],
          ["whose","possession","déterminant","oui","oui"],
          ["where","lieu","circonstance","oui","oui"],
          ["when","temps","circonstance","oui","oui"]
        ]},
        {type:"example",en:"The client who called yesterday is on line 2.",fr:"Le client qui a appelé hier est en ligne 2.",note:"Personne + sujet → who."},
        {type:"example",en:"The project which we launched in June is successful.",fr:"Le projet que nous avons lancé en juin est un succès.",note:"Chose + objet → which (ou that, ou rien)."},
        {type:"example",en:"This is the office where I used to work.",fr:"C'est le bureau où je travaillais.",note:"Lieu → where."},
        {type:"example",en:"I'll never forget the day when I signed my first contract.",fr:"Je n'oublierai jamais le jour où j'ai signé mon premier contrat.",note:"Temps → when."}
      ]
    },
    {
      id: "ch3_omission",
      title: "III. Quand on peut omettre le pronom",
      intro: "L'anglais adore l'économie. Dans certains cas, le pronom relatif peut (et souvent doit) disparaître.",
      blocks: [
        {type:"rule",label:"Règle d'omission",formula:"On PEUT omettre le pronom quand il est OBJET de la relative, dans une relative DEFINING."},
        {type:"example",en:"The software (that / which) we use is outdated.",fr:"Le logiciel qu'on utilise est dépassé.",note:"'that/which' objet → omission fréquente."},
        {type:"example",en:"The consultant (whom / who) we hired is excellent.",fr:"Le consultant qu'on a engagé est excellent.",note:"'whom/who' objet → omission possible."},

        {type:"heading",text:"Quand on NE PEUT PAS omettre"},
        {type:"list",items:[
          "Pronom sujet : 'The employee WHO won the award' (qui = sujet, jamais omis).",
          "Non-defining : 'Mr. Tanaka, who has worked here for 20 years...' (jamais omis après virgule).",
          "'whose' : jamais omis, quel que soit le contexte.",
          "'where / when' : jamais omis dans un registre standard."
        ]},

        {type:"trap",text:"Dans les QCM TOEIC, si la phrase 'marche' sans pronom, regarde si ce pronom serait sujet ou objet. S'il était sujet, l'omission est une erreur — choisis l'option avec pronom."}
      ]
    },
    {
      id: "ch4_whose",
      title: "IV. Whose — la possession universelle",
      intro: "'Whose' ne se limite PAS aux humains. Il s'applique aussi aux choses, animaux, organisations.",
      blocks: [
        {type:"rule",label:"Whose",formula:"Possession → dont le / dont la / dont les"},
        {type:"example",en:"The client whose laptop was stolen filed a complaint.",fr:"Le client dont l'ordinateur a été volé a porté plainte.",note:"Personne."},
        {type:"example",en:"The company whose headquarters are in Tokyo opened a Paris office.",fr:"L'entreprise dont le siège est à Tokyo a ouvert un bureau à Paris.",note:"Organisation — whose fonctionne aussi."},
        {type:"example",en:"A project whose budget exceeds 1M€ requires board approval.",fr:"Un projet dont le budget dépasse 1M€ nécessite l'accord du board.",note:"Chose abstraite — whose marche."},

        {type:"trap",text:"Ne traduis pas 'dont' par 'of which' ou 'of whom' automatiquement. Dans 90% des cas, 'whose' est la bonne réponse TOEIC, beaucoup plus naturelle."}
      ]
    },
    {
      id: "ch5_reduced",
      title: "V. Reduced relatives — le piège haut niveau",
      intro: "Une relative peut être 'réduite' : on supprime le pronom ET l'auxiliaire, il ne reste que le verbe. C'est très fréquent dans les rapports TOEIC et très piégeant.",
      blocks: [
        {type:"heading",text:"Deux formes réduites"},
        {type:"rule",label:"Relative réduite ACTIVE",formula:"V-ing (participe présent) = relative au présent / continuous"},
        {type:"rule",label:"Relative réduite PASSIVE",formula:"V3 (participe passé) = relative au passif"},

        {type:"example",en:"The employees working in R&D received a bonus.",fr:"Les employés travaillant en R&D ont reçu un bonus.",note:"= 'The employees WHO WORK in R&D'. Réduction active."},
        {type:"example",en:"The documents submitted before Friday will be reviewed.",fr:"Les documents soumis avant vendredi seront examinés.",note:"= 'The documents WHICH ARE SUBMITTED before Friday'. Réduction passive."},
        {type:"example",en:"The meeting scheduled for Monday has been postponed.",fr:"La réunion prévue lundi a été reportée.",note:"= 'The meeting WHICH IS SCHEDULED for Monday'. Piège d'accord : sujet réel = meeting (singulier)."},

        {type:"heading",text:"Comment reconnaître une réduction"},
        {type:"list",items:[
          "Un participe (V-ing ou V3) placé APRÈS un nom, sans pronom relatif.",
          "Si on peut reformuler en ajoutant 'who/which + be', c'est une réduction.",
          "Attention : un nom suivi de V-ing n'est PAS toujours une réduction. 'The man walking fast' = réduction. 'Walking is healthy' = gérondif sujet."
        ]},

        {type:"trap",text:"Le piège TOEIC classique : une phrase longue avec une réduction entre le sujet et le verbe principal te fait perdre l'accord. Repère le VRAI sujet et ignore la relative réduite."}
      ]
    },
    {
      id: "ch6_prepositions",
      title: "VI. Prépositions + relatives",
      intro: "Quand la relative implique une préposition, l'anglais offre deux registres : formel (préposition + whom/which) et naturel (préposition rejetée à la fin).",
      blocks: [
        {type:"rule",label:"Formel / écrit TOEIC",formula:"préposition + whom / which (jamais that, jamais who)"},
        {type:"rule",label:"Naturel / oral",formula:"pronom (souvent omis) + ... + préposition à la fin"},

        {type:"example",en:"The person to whom I spoke was very helpful.",fr:"La personne à qui j'ai parlé a été très serviable.",note:"Registre formel TOEIC."},
        {type:"example",en:"The person (who) I spoke to was very helpful.",fr:"La personne à qui j'ai parlé a été très serviable.",note:"Registre naturel, préposition à la fin."},
        {type:"example",en:"The project on which we're working is complex.",fr:"Le projet sur lequel on travaille est complexe.",note:"Formel."},
        {type:"example",en:"The project (that) we're working on is complex.",fr:"Le projet sur lequel on travaille est complexe.",note:"Naturel."},

        {type:"trap",text:"Après une préposition, N'UTILISE JAMAIS 'that' ni 'who'. C'est 'whom' pour les personnes et 'which' pour les choses. 'The client on THAT I called' est FAUX."}
      ]
    }
  ]
};
