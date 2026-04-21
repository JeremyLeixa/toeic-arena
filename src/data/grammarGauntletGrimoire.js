// ═══════════════════════════════════════════════════════════
// GRAMMAR GAUNTLET — GRIMOIRES (théorie)
// 3 manuscrits consultables depuis le hub + in-game :
//   • GRIMOIRE_CHRONOMANCER    → temps verbaux   (10 chapitres)
//   • GRIMOIRE_PASSIVE_FORGE   → voix passive    (7 chapitres)
//   • GRIMOIRE_RELATIVE_WEAVER → relatives       (9 chapitres)
//
// Principe de pagination : UNE IDÉE PAR CHAPITRE (= une page lisible).
// Préférer 3 chapitres courts à 1 chapitre dense.
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
  readingTime: "10 min",
  icon: "⏳",
  chapters: [
    {
      id: "ch1_regle_or",
      title: "I. La règle d'or",
      intro: "Le piège numéro un pour les francophones. En français, le passé composé fait double emploi. En anglais, deux temps distincts, deux logiques.",
      blocks: [
        {type:"rule",label:"Simple Past",formula:"Action TERMINÉE à un moment précis du passé."},
        {type:"rule",label:"Present Perfect",formula:"has / have + V3 — Action avec un LIEN au présent."},
        {type:"paragraph",text:"La différence n'est pas une question de temps écoulé, mais de perspective. Est-ce que l'action compte encore maintenant ?"},
        {type:"example",en:"I worked in Paris for two years.",fr:"J'ai travaillé à Paris pendant deux ans.",note:"Simple past : c'est fini, je n'y travaille plus."},
        {type:"example",en:"I have worked in Paris for two years.",fr:"Je travaille à Paris depuis deux ans.",note:"Present perfect : j'y travaille encore aujourd'hui."}
      ]
    },
    {
      id: "ch2_marqueurs",
      title: "II. Les marqueurs temporels",
      intro: "Le choix du temps est dicté à 90% par le marqueur temporel présent dans la phrase. Apprends ces deux listes par cœur.",
      blocks: [
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
        {type:"trap",text:"JAMAIS de present perfect avec un marqueur de temps DATÉ. 'I have seen him yesterday' est FAUX. Si tu vois 'yesterday / ago / in 2020', c'est simple past obligatoire."}
      ]
    },
    {
      id: "ch3_this_morning",
      title: "III. Le piège 'this morning'",
      intro: "Certains marqueurs comme 'this morning', 'today' ou 'this week' sont ambigus : le choix du temps dépend du moment où tu parles.",
      blocks: [
        {type:"example",en:"I've had three coffees this morning.",fr:"J'ai bu trois cafés ce matin.",note:"Il est encore matin → present perfect."},
        {type:"example",en:"I had three coffees this morning.",fr:"J'ai bu trois cafés ce matin.",note:"Il est 18h, le matin est révolu → simple past."},
        {type:"paragraph",text:"Pose-toi toujours la question : la période mentionnée est-elle encore en cours, oui ou non ?"}
      ]
    },
    {
      id: "ch4_pp_simple_vs_continuous",
      title: "IV. Present Perfect — simple ou continuous ?",
      intro: "Deux variantes du present perfect. Le simple met l'accent sur le résultat ; le continuous sur la durée ou le processus.",
      blocks: [
        {type:"rule",label:"Present Perfect Simple",formula:"has / have + V3 — Résultat, quantité, expérience."},
        {type:"rule",label:"Present Perfect Continuous",formula:"has / have been + V-ing — Durée, processus, activité récente."},
        {type:"example",en:"She has written three reports this week.",fr:"Elle a rédigé trois rapports cette semaine.",note:"Simple : résultat quantifié (3 rapports)."},
        {type:"example",en:"She has been writing reports all morning.",fr:"Elle rédige des rapports depuis ce matin.",note:"Continuous : durée de l'activité, peut-être encore en cours."}
      ]
    },
    {
      id: "ch5_pp_when_to_use",
      title: "V. Simple ou continuous — quand choisir quoi",
      intro: "Trois cas où le simple est obligatoire, trois cas où le continuous est préféré.",
      blocks: [
        {type:"heading",text:"Le simple est obligatoire"},
        {type:"list",items:[
          "Avec des verbes d'état (know, understand, believe, love, own, belong) : 'I have known him for years' — jamais 'I have been knowing'.",
          "Quand on mentionne une quantité : 'He has read five books this month.'",
          "Pour une expérience de vie : 'I have never been to Japan.'"
        ]},
        {type:"heading",text:"Le continuous est préféré"},
        {type:"list",items:[
          "Insister sur la durée d'une activité : 'How long have you been waiting ?'",
          "Action récente avec résultat visible : 'You look tired — have you been running ?'",
          "Activité temporaire ou en cours : 'I have been working on this project for two weeks.'"
        ]}
      ]
    },
    {
      id: "ch6_past_perfect",
      title: "VI. Past Perfect — l'antériorité",
      intro: "Quand on raconte deux actions passées, le past perfect sert à marquer celle qui s'est produite AVANT.",
      blocks: [
        {type:"rule",label:"Past Perfect",formula:"had + V3 — Action antérieure à une autre action passée."},
        {type:"paragraph",text:"C'est un temps de narration. Il n'a de sens qu'en présence d'un autre repère passé."},
        {type:"example",en:"By the time we arrived, the meeting had started.",fr:"Quand nous sommes arrivés, la réunion avait commencé.",note:"'arrived' (simple past) et 'had started' (past perfect, antérieur)."},
        {type:"example",en:"She had already left when I called.",fr:"Elle était déjà partie quand j'ai appelé.",note:"'had left' précède 'called'."},
        {type:"trap",text:"N'utilise pas le past perfect systématiquement pour 'tout le passé éloigné'. Il doit y avoir un autre passé de référence dans la phrase ou le contexte immédiat."}
      ]
    },
    {
      id: "ch7_past_perfect_continuous",
      title: "VII. Past Perfect Continuous",
      intro: "Pour exprimer la durée d'une action antérieure à un autre passé.",
      blocks: [
        {type:"rule",label:"Past Perfect Continuous",formula:"had been + V-ing — Durée antérieure à un point passé."},
        {type:"example",en:"They had been working for two hours when the system crashed.",fr:"Ils travaillaient depuis deux heures quand le système a planté.",note:"Durée antérieure au point de rupture."},
        {type:"example",en:"She was exhausted — she had been preparing the presentation all night.",fr:"Elle était épuisée — elle avait préparé la présentation toute la nuit.",note:"Cause visible d'un état passé."}
      ]
    },
    {
      id: "ch8_futures",
      title: "VIII. Les trois futurs",
      intro: "Anglais a 3 façons principales d'exprimer le futur. Le choix dépend de la nature de la prédiction.",
      blocks: [
        {type:"rule",label:"Will + base",formula:"Décision spontanée, prédiction neutre, promesse."},
        {type:"rule",label:"Be going to + base",formula:"Intention préméditée, prédiction basée sur un indice présent."},
        {type:"rule",label:"Present continuous",formula:"be + V-ing — Arrangement futur déjà organisé (rendez-vous, réservation)."},
        {type:"example",en:"The phone's ringing. I'll get it.",fr:"Le téléphone sonne. Je réponds.",note:"Will : décision prise à l'instant."},
        {type:"example",en:"We're going to launch the product in June.",fr:"On va lancer le produit en juin.",note:"Going to : intention planifiée en amont."},
        {type:"example",en:"I'm meeting the client at 3 p.m.",fr:"Je rencontre le client à 15h.",note:"Present continuous : rendez-vous fixé."}
      ]
    },
    {
      id: "ch9_future_perfect",
      title: "IX. Future Perfect",
      intro: "Pour dire qu'une action sera ACCOMPLIE avant un point futur.",
      blocks: [
        {type:"rule",label:"Future Perfect",formula:"will have + V3 — Action accomplie AVANT un point futur."},
        {type:"example",en:"By next June, she will have worked here for ten years.",fr:"D'ici juin prochain, elle aura travaillé ici pendant dix ans.",note:"'by + date future' → future perfect."},
        {type:"example",en:"By the time you arrive, we will have finished the meeting.",fr:"Quand tu arriveras, on aura terminé la réunion.",note:"'by the time + présent' → future perfect dans la principale."},
        {type:"trap",text:"TOEIC aime tester 'by + date future' et 'by the time + présent'. Ces deux marqueurs imposent le future perfect dans la proposition principale."}
      ]
    },
    {
      id: "ch10_time_clauses",
      title: "X. Time clauses — jamais 'will'",
      intro: "Règle absolue TOEIC. Dans une proposition subordonnée temporelle, on N'UTILISE JAMAIS le futur. On met le présent simple, même si le sens est futur.",
      blocks: [
        {type:"rule",label:"Structure",formula:"[Subordonnée présent] + [Principale will + V]"},
        {type:"heading",text:"Connecteurs concernés"},
        {type:"list",items:["when","as soon as","after","before","until","once","by the time","the moment"]},
        {type:"example",en:"I'll call you when I arrive.",fr:"Je t'appelle dès que j'arrive.",note:"NON : 'when I will arrive'."},
        {type:"example",en:"As soon as the client arrives, we'll start.",fr:"Dès que le client arrive, on commence.",note:"Présent dans la subordonnée même si l'action est future."},
        {type:"trap",text:"Ce piège tombe presque à chaque TOEIC Part 5. Dès que tu vois 'when / as soon as / before / after / until' + futur dans les options, écarte les 'will' de la subordonnée."}
      ]
    },
    {
      id: "ch11_used_to",
      title: "XI. Used to / would — les habitudes passées",
      intro: "Pour évoquer des habitudes ou états passés qui n'existent plus aujourd'hui. Attention à ne pas confondre 'used to' et 'be used to'.",
      blocks: [
        {type:"rule",label:"Used to + base",formula:"Habitude OU état passé qui n'existe plus."},
        {type:"rule",label:"Would + base",formula:"Habitude passée uniquement (pas les états). Registre narratif."},
        {type:"example",en:"I used to work part-time at a bookstore.",fr:"Je travaillais à mi-temps dans une librairie.",note:"Avant, plus maintenant."},
        {type:"example",en:"She used to be very shy.",fr:"Elle était très timide.",note:"État passé → SEUL 'used to' marche. PAS 'would be'."},
        {type:"example",en:"Every Friday, we would have lunch together.",fr:"Chaque vendredi, on déjeunait ensemble.",note:"Habitude répétée → would OK."},
        {type:"trap",text:"Ne confonds pas 'used to do' (habitude passée) avec 'be used to doing' (avoir l'habitude de) ni 'get used to doing' (s'habituer à). Trois structures différentes."},
        {type:"example",en:"I'm used to working late.",fr:"J'ai l'habitude de travailler tard.",note:"Présent, pas passé. Structure be used to + V-ing."}
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
  readingTime: "8 min",
  icon: "⚒️",
  chapters: [
    {
      id: "ch1_when_passive",
      title: "I. Pourquoi utiliser le passif",
      intro: "Le passif n'est pas une simple variante stylistique. Il a des usages précis, très fréquents dans le monde TOEIC (rapports, notices, emails professionnels).",
      blocks: [
        {type:"heading",text:"Les 4 raisons d'utiliser le passif"},
        {type:"list",items:[
          "Focus sur l'OBJET plutôt que sur l'agent : 'The contract was signed.'",
          "Agent INCONNU ou évident : 'My laptop has been stolen.'",
          "Registre FORMEL / impersonnel : 'Passengers are requested to fasten their seatbelts.'",
          "Processus scientifiques ou procéduraux : 'The sample is then analyzed under a microscope.'"
        ]},
        {type:"example",en:"Actif : The CEO made the decision.",fr:"Le PDG a pris la décision.",note:"Focus sur le PDG."},
        {type:"example",en:"Passif : The decision was made.",fr:"La décision a été prise.",note:"Focus sur la décision — l'agent disparaît ou devient secondaire."}
      ]
    },
    {
      id: "ch2_formula",
      title: "II. La formule universelle",
      intro: "Quel que soit le temps, la voix passive obéit à une seule formule.",
      blocks: [
        {type:"rule",label:"Formule universelle",formula:"BE (au temps voulu) + V3 (past participle)"},
        {type:"paragraph",text:"Tout le reste n'est que déclinaison de cette formule selon le temps. Maîtrise 'be' conjugué + V3, et tu as maîtrisé le passif."},
        {type:"rule",label:"Transformation active → passive",formula:"[Sujet] [Verbe] [Objet]  →  [Objet] [BE + V3] [by + Agent]"},
        {type:"example",en:"They signed the contract.  →  The contract was signed (by them).",fr:"Ils ont signé le contrat. → Le contrat a été signé.",note:"L'objet devient sujet. L'agent 'by + ...' est souvent supprimé."},
        {type:"paragraph",text:"L'agent introduit par 'by' est supprimé dans 80% des cas — sauf s'il est informatif ou surprenant."}
      ]
    },
    {
      id: "ch3_tenses_table",
      title: "III. Le passif à tous les temps",
      intro: "Le tableau à graver dans ta mémoire. C'est la boussole du passif TOEIC.",
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
          ["Modal (must, should...)","must write","must be written"],
          ["Modal Perfect","should have written","should have been written"],
          ["Infinitive","to write","to be written"],
          ["Gerund (V-ing)","writing","being written"]
        ]},
        {type:"example",en:"The report has been reviewed.",fr:"Le rapport a été relu.",note:"Present perfect passive."},
        {type:"example",en:"The issue should be addressed immediately.",fr:"Le problème doit être traité immédiatement.",note:"Modal passive."}
      ]
    },
    {
      id: "ch4_double_object",
      title: "IV. Verbes à double objet",
      intro: "Certains verbes (give, offer, send, tell, show, pay, teach...) acceptent deux objets. Au passif, c'est presque toujours la personne qui devient sujet.",
      blocks: [
        {type:"rule",label:"Structure active",formula:"[Sujet] [give] [personne] [chose]"},
        {type:"rule",label:"Passif privilégié TOEIC",formula:"[Personne] [is/was given] [chose] (by X)"},
        {type:"example",en:"The manager offered her a senior position.",fr:"Le manager lui a offert un poste senior."},
        {type:"example",en:"She was offered a senior position.",fr:"On lui a offert un poste senior.",note:"La personne (she) devient sujet du passif."},
        {type:"example",en:"All employees were given a bonus last December.",fr:"Tous les employés ont reçu un bonus en décembre."},
        {type:"trap",text:"Beaucoup d'étudiants mettent la chose en sujet par réflexe français. 'A bonus was given to all employees' est correct, mais TOEIC préfère systématiquement la version avec la personne en sujet."}
      ]
    },
    {
      id: "ch5_trap_agreement",
      title: "V. Piège TOEIC — l'accord sujet-verbe",
      intro: "Le TOEIC glisse souvent un long groupe nominal entre le sujet et le verbe pour te faire perdre l'accord.",
      blocks: [
        {type:"example",en:"The reports were submitted yesterday.",fr:"Les rapports ont été rendus hier.",note:"Sujet pluriel → were, pas was."},
        {type:"example",en:"The list of candidates has been reviewed.",fr:"La liste des candidats a été examinée.",note:"Sujet réel = 'list' (singulier), pas 'candidates'."},
        {type:"trap",text:"Identifie toujours le SUJET RÉEL avant de choisir is/are, was/were, has/have. Ignore les groupes nominaux intercalés (of X, for Y, with Z)."}
      ]
    },
    {
      id: "ch6_get_passive",
      title: "VI. 'Get' passive — registre informel",
      intro: "'Get + V3' est un passif informel, fréquent en anglais parlé et dans les emails business décontractés.",
      blocks: [
        {type:"rule",label:"Structure",formula:"get + V3 (équivalent à be + V3 mais plus oral)"},
        {type:"example",en:"He got promoted last month.",fr:"Il a été promu le mois dernier.",note:"= 'He was promoted' mais plus oral."},
        {type:"example",en:"The package got damaged during shipping.",fr:"Le colis a été abîmé pendant la livraison."},
        {type:"example",en:"They got married in June.",fr:"Ils se sont mariés en juin.",note:"Usage classique informel."}
      ]
    },
    {
      id: "ch7_modal_perfect",
      title: "VII. Passif + modal composé",
      intro: "Niveau TOEIC 750+. Les modaux composés (should have, could have, must have) se combinent au passif.",
      blocks: [
        {type:"rule",label:"Modal Perfect Passive",formula:"modal + have been + V3"},
        {type:"example",en:"The invoice should have been paid last week.",fr:"La facture aurait dû être payée la semaine dernière.",note:"Reproche/regret."},
        {type:"example",en:"The issue could have been avoided.",fr:"Le problème aurait pu être évité."},
        {type:"example",en:"The mistake must have been made by the new intern.",fr:"L'erreur a dû être faite par le nouveau stagiaire.",note:"Déduction au passif."}
      ]
    },
    {
      id: "ch8_infinitive_gerund",
      title: "VIII. Passif infinitif et gérondif",
      intro: "Les formes non-conjuguées du passif — souvent testées en TOEIC Part 5.",
      blocks: [
        {type:"rule",label:"Passif infinitif",formula:"to be + V3"},
        {type:"rule",label:"Passif gérondif",formula:"being + V3"},
        {type:"example",en:"The machine needs to be serviced.",fr:"La machine doit être révisée.",note:"'need + to be + V3'."},
        {type:"example",en:"I hate being interrupted during meetings.",fr:"Je déteste être interrompu en réunion.",note:"'being + V3' après hate / like / enjoy."},
        {type:"example",en:"He deserves to be promoted.",fr:"Il mérite d'être promu.",note:"'deserve + to be + V3'."}
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
  readingTime: "9 min",
  icon: "🕸️",
  chapters: [
    {
      id: "ch1_defining_vs_non",
      title: "I. Defining vs non-defining",
      intro: "Deux types de relatives. La virgule n'est pas une coquetterie de style : elle change le SENS de la phrase.",
      blocks: [
        {type:"rule",label:"Defining (sans virgule)",formula:"Information INDISPENSABLE — elle identifie le nom."},
        {type:"rule",label:"Non-defining (entre virgules)",formula:"Information SUPPLÉMENTAIRE — elle ajoute un commentaire."},
        {type:"example",en:"The employees who work in R&D received a bonus.",fr:"Les employés qui travaillent en R&D ont reçu un bonus.",note:"Defining : SEULS ceux de R&D, pas les autres."},
        {type:"example",en:"The employees, who work in R&D, received a bonus.",fr:"Les employés, qui travaillent tous en R&D, ont reçu un bonus.",note:"Non-defining : TOUS les employés (tous sont en R&D)."}
      ]
    },
    {
      id: "ch2_3_rules",
      title: "II. Les 3 règles critiques TOEIC",
      intro: "Trois règles à appliquer automatiquement dès que tu vois une virgule avant le pronom relatif.",
      blocks: [
        {type:"list",items:[
          "'that' est INTERDIT en non-defining. Seulement who/which après virgule.",
          "On ne peut PAS omettre le pronom relatif en non-defining.",
          "En defining, on peut souvent omettre le pronom quand il est objet."
        ]},
        {type:"trap",text:"Si tu vois une virgule AVANT le trou, élimine 'that' des options. C'est une erreur piégeuse classique du Part 5."}
      ]
    },
    {
      id: "ch3_pronoun_table",
      title: "III. Le tableau des pronoms",
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
        {type:"example",en:"The project which we launched in June is successful.",fr:"Le projet que nous avons lancé en juin est un succès.",note:"Chose + objet → which."}
      ]
    },
    {
      id: "ch4_where_when",
      title: "IV. Where / when — lieu et temps",
      intro: "Deux pronoms circonstanciels très fréquents au TOEIC, souvent confondus avec which/that.",
      blocks: [
        {type:"example",en:"This is the office where I used to work.",fr:"C'est le bureau où je travaillais.",note:"Lieu → where. Alternative formelle : 'in which'."},
        {type:"example",en:"I'll never forget the day when I signed my first contract.",fr:"Je n'oublierai jamais le jour où j'ai signé mon premier contrat.",note:"Temps → when. Alternative : 'on which'."},
        {type:"trap",text:"Ne mets PAS 'which' après un nom de lieu ou de temps s'il n'y a pas de préposition. 'The office which I work' est FAUX — c'est 'where I work'."}
      ]
    },
    {
      id: "ch5_omission_allowed",
      title: "V. Omission — quand on peut",
      intro: "L'anglais adore l'économie. Quand le pronom est OBJET et la relative DEFINING, on peut (et souvent on doit) l'omettre.",
      blocks: [
        {type:"rule",label:"Règle d'omission",formula:"Objet + defining → omission possible"},
        {type:"example",en:"The software (that / which) we use is outdated.",fr:"Le logiciel qu'on utilise est dépassé.",note:"'that/which' objet → omission fréquente."},
        {type:"example",en:"The consultant (whom / who) we hired is excellent.",fr:"Le consultant qu'on a engagé est excellent.",note:"'whom/who' objet → omission possible."}
      ]
    },
    {
      id: "ch6_omission_forbidden",
      title: "VI. Omission — quand c'est interdit",
      intro: "Quatre cas où l'omission est strictement interdite. Pièges TOEIC classiques.",
      blocks: [
        {type:"list",items:[
          "Pronom SUJET : 'The employee WHO won the award' (qui = sujet, jamais omis).",
          "Non-defining : 'Mr. Tanaka, who has worked here for 20 years...' (jamais omis après virgule).",
          "'whose' : jamais omis, quel que soit le contexte.",
          "'where / when' : jamais omis dans un registre standard."
        ]},
        {type:"trap",text:"Dans les QCM TOEIC, si la phrase 'marche' sans pronom, regarde si ce pronom serait sujet ou objet. S'il était sujet, l'omission est une erreur."}
      ]
    },
    {
      id: "ch7_whose",
      title: "VII. Whose — la possession universelle",
      intro: "'Whose' ne se limite PAS aux humains. Il s'applique aussi aux choses, animaux, organisations.",
      blocks: [
        {type:"rule",label:"Whose",formula:"Possession → dont le / dont la / dont les"},
        {type:"example",en:"The client whose laptop was stolen filed a complaint.",fr:"Le client dont l'ordinateur a été volé a porté plainte.",note:"Personne."},
        {type:"example",en:"The company whose headquarters are in Tokyo opened a Paris office.",fr:"L'entreprise dont le siège est à Tokyo a ouvert un bureau à Paris.",note:"Organisation."},
        {type:"example",en:"A project whose budget exceeds 1M€ requires board approval.",fr:"Un projet dont le budget dépasse 1M€ nécessite l'accord du board.",note:"Chose abstraite."},
        {type:"trap",text:"Ne traduis pas 'dont' par 'of which' ou 'of whom' automatiquement. Dans 90% des cas, 'whose' est la bonne réponse TOEIC, beaucoup plus naturelle."}
      ]
    },
    {
      id: "ch8_reduced_forms",
      title: "VIII. Reduced relatives — les 2 formes",
      intro: "Une relative peut être 'réduite' : on supprime le pronom ET l'auxiliaire, il ne reste que le verbe. Très fréquent en TOEIC, très piégeant.",
      blocks: [
        {type:"rule",label:"Réduite ACTIVE",formula:"V-ing (participe présent) = relative au présent / continuous"},
        {type:"rule",label:"Réduite PASSIVE",formula:"V3 (participe passé) = relative au passif"},
        {type:"example",en:"The employees working in R&D received a bonus.",fr:"Les employés travaillant en R&D ont reçu un bonus.",note:"= 'who work in R&D'. Réduction active."},
        {type:"example",en:"The documents submitted before Friday will be reviewed.",fr:"Les documents soumis avant vendredi seront examinés.",note:"= 'which are submitted before Friday'. Réduction passive."}
      ]
    },
    {
      id: "ch9_reduced_recognition",
      title: "IX. Reduced — comment les reconnaître",
      intro: "Le piège classique : confondre une relative réduite avec un gérondif ou un adjectif, et perdre l'accord.",
      blocks: [
        {type:"list",items:[
          "Un participe (V-ing ou V3) placé APRÈS un nom, sans pronom relatif.",
          "Si on peut reformuler en ajoutant 'who/which + be', c'est une réduction.",
          "Attention : un nom suivi de V-ing n'est PAS toujours une réduction. 'The man walking fast' = réduction. 'Walking is healthy' = gérondif sujet."
        ]},
        {type:"example",en:"The meeting scheduled for Monday has been postponed.",fr:"La réunion prévue lundi a été reportée.",note:"= 'which is scheduled for Monday'. Sujet réel = meeting (singulier) → has been."},
        {type:"trap",text:"Une phrase longue avec une relative réduite entre le sujet et le verbe principal te fait perdre l'accord. Repère le VRAI sujet et ignore la réduction."}
      ]
    },
    {
      id: "ch10_prepositions",
      title: "X. Prépositions + relatives",
      intro: "Quand la relative implique une préposition, l'anglais offre deux registres : formel (prép + whom/which) et naturel (prép à la fin).",
      blocks: [
        {type:"rule",label:"Formel / écrit TOEIC",formula:"préposition + whom / which (jamais that, jamais who)"},
        {type:"rule",label:"Naturel / oral",formula:"pronom (souvent omis) + ... + préposition à la fin"},
        {type:"example",en:"The person to whom I spoke was very helpful.",fr:"La personne à qui j'ai parlé a été très serviable.",note:"Registre formel TOEIC."},
        {type:"example",en:"The person (who) I spoke to was very helpful.",fr:"Idem, registre naturel, préposition à la fin."},
        {type:"example",en:"The project on which we're working is complex.",fr:"Le projet sur lequel on travaille est complexe.",note:"Formel."},
        {type:"trap",text:"Après une préposition, N'UTILISE JAMAIS 'that' ni 'who'. C'est 'whom' pour les personnes et 'which' pour les choses. 'The client on THAT I called' est FAUX."}
      ]
    }
  ]
};
