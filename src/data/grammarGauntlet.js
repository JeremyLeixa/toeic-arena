// ═══════════════════════════════════════════════════════════
// GRAMMAR GAUNTLET — 4 sub-modules
//   • IRREGULAR_VERBS   → Irregular Crypt   (memorization drill)
//   • TENSE_CHRONOMANCER → Chronomancer     (tense mastery)
//   • PASSIVE_FORGE     → Passive Forge    (active↔passive transforms + fill-in)
//   • RELATIVE_WEAVER   → Relative Weaver  (defining, non-defining, reduced)
// Prototype: 15 items per type for dev/QA. Full pool ~270 items planned.
// ═══════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────
// 1. IRREGULAR CRYPT — high-frequency TOEIC irregular verbs
// Fields: id, base, past (V2), pp (V3), fr, freq (high|medium|low), ex
// ───────────────────────────────────────────────────────────
export var IRREGULAR_VERBS = [
  {id:"irr01",base:"drive",past:"drove",pp:"driven",fr:"conduire",freq:"high",ex:"She has driven to headquarters every Monday this year."},
  {id:"irr02",base:"take",past:"took",pp:"taken",fr:"prendre",freq:"high",ex:"The CEO took the decision after careful review."},
  {id:"irr03",base:"bring",past:"brought",pp:"brought",fr:"apporter",freq:"high",ex:"The consultant brought new insights to the project."},
  {id:"irr04",base:"give",past:"gave",pp:"given",fr:"donner",freq:"high",ex:"He was given a promotion last quarter."},
  {id:"irr05",base:"write",past:"wrote",pp:"written",fr:"écrire",freq:"high",ex:"The report was written by the marketing team."},
  {id:"irr06",base:"speak",past:"spoke",pp:"spoken",fr:"parler",freq:"high",ex:"She has spoken to over 200 clients this month."},
  {id:"irr07",base:"make",past:"made",pp:"made",fr:"faire, fabriquer",freq:"high",ex:"The board has made its final decision."},
  {id:"irr08",base:"break",past:"broke",pp:"broken",fr:"casser, enfreindre",freq:"medium",ex:"The printer has broken down again."},
  {id:"irr09",base:"hold",past:"held",pp:"held",fr:"tenir, organiser",freq:"medium",ex:"The conference will be held in Berlin next year."},
  {id:"irr10",base:"understand",past:"understood",pp:"understood",fr:"comprendre",freq:"high",ex:"She understood the terms of the contract immediately."},
  {id:"irr11",base:"choose",past:"chose",pp:"chosen",fr:"choisir",freq:"medium",ex:"The candidate was chosen after three rounds of interviews."},
  {id:"irr12",base:"lead",past:"led",pp:"led",fr:"diriger, mener",freq:"medium",ex:"She has led the team for over a decade."},
  {id:"irr13",base:"rise",past:"rose",pp:"risen",fr:"augmenter, s'élever",freq:"medium",ex:"Sales have risen sharply since the launch."},
  {id:"irr14",base:"pay",past:"paid",pp:"paid",fr:"payer",freq:"high",ex:"The invoice was paid on time."},
  {id:"irr15",base:"begin",past:"began",pp:"begun",fr:"commencer",freq:"high",ex:"The meeting has just begun."},
  // ── Batch 1 — V2 = V3 patterns (high-freq business TOEIC) ──
  {id:"irr16",base:"catch",past:"caught",pp:"caught",fr:"attraper, saisir",freq:"high",ex:"She caught the error before it reached production."},
  {id:"irr17",base:"teach",past:"taught",pp:"taught",fr:"enseigner",freq:"high",ex:"He has taught economics for twenty years."},
  {id:"irr18",base:"think",past:"thought",pp:"thought",fr:"penser, réfléchir",freq:"high",ex:"The board thought the deal was too risky."},
  {id:"irr19",base:"buy",past:"bought",pp:"bought",fr:"acheter",freq:"high",ex:"The company bought new equipment last quarter."},
  {id:"irr20",base:"seek",past:"sought",pp:"sought",fr:"chercher, rechercher",freq:"medium",ex:"They sought legal advice before signing the NDA."},
  {id:"irr21",base:"fight",past:"fought",pp:"fought",fr:"combattre, lutter",freq:"medium",ex:"Management fought hard to keep the account."},
  {id:"irr22",base:"feel",past:"felt",pp:"felt",fr:"sentir, ressentir",freq:"high",ex:"She felt confident about the merger terms."},
  {id:"irr23",base:"keep",past:"kept",pp:"kept",fr:"garder, conserver, maintenir",freq:"high",ex:"We have kept all client records since 2010."},
  {id:"irr24",base:"sell",past:"sold",pp:"sold",fr:"vendre",freq:"high",ex:"They sold the Berlin office for two million euros."},
  {id:"irr25",base:"tell",past:"told",pp:"told",fr:"dire, raconter",freq:"high",ex:"The CEO told us about the restructuring yesterday."},
  {id:"irr26",base:"meet",past:"met",pp:"met",fr:"rencontrer, respecter (un délai)",freq:"high",ex:"We have met every quarterly target this year."},
  {id:"irr27",base:"lose",past:"lost",pp:"lost",fr:"perdre",freq:"high",ex:"The firm lost its biggest account last spring."},
  {id:"irr28",base:"send",past:"sent",pp:"sent",fr:"envoyer",freq:"high",ex:"I sent the signed contract this morning."},
  {id:"irr29",base:"spend",past:"spent",pp:"spent",fr:"dépenser, passer (du temps)",freq:"high",ex:"We spent three weeks reviewing the proposal."},
  {id:"irr30",base:"build",past:"built",pp:"built",fr:"construire, bâtir",freq:"medium",ex:"They built a strong brand over the decade."}
];

// ───────────────────────────────────────────────────────────
// 2. CHRONOMANCER — tense mastery with context markers
// Fields: id, s (sentence w/ _____), marker (highlighted cue), o (4 opts),
//         c (correct idx), tense (category), x (explanation)
// ───────────────────────────────────────────────────────────
export var TENSE_CHRONOMANCER = [
  {id:"td01",s:"I _____ in Lyon since 2020.",marker:"since",o:["live","lived","have lived","had lived"],c:2,tense:"present_perfect",x:"'since + point de départ' + lien avec le présent → present perfect obligatoire."},
  {id:"td02",s:"She _____ the report yesterday afternoon.",marker:"yesterday",o:["finishes","finished","has finished","had finished"],c:1,tense:"simple_past",x:"'yesterday' = temps précis révolu → simple past obligatoire. 'has finished' interdit avec un marqueur temporel daté."},
  {id:"td03",s:"By the time we arrived, the meeting _____.",marker:"by the time",o:["started","has started","had started","was starting"],c:2,tense:"past_perfect",x:"Action terminée AVANT une autre action passée → past perfect (had + V3)."},
  {id:"td04",s:"They _____ for this company for five years.",marker:"for",o:["work","worked","are working","have worked"],c:3,tense:"present_perfect",x:"'for + durée' + lien avec présent (ils y travaillent encore) → present perfect."},
  {id:"td05",s:"As soon as the client _____, we'll start the presentation.",marker:"as soon as",o:["arrives","will arrive","arrived","has arrived"],c:0,tense:"simple_present_future",x:"Dans une subordonnée temporelle (after, as soon as, when, before...), JAMAIS de 'will'. Present simple → sens futur."},
  {id:"td06",s:"I _____ to this restaurant before — it's my first time.",marker:"before / never",o:["didn't go","haven't gone","hadn't been","have never been"],c:3,tense:"present_perfect",x:"'never + expérience de vie jusqu'à maintenant' → present perfect. 'hadn't been' exigerait un repère passé."},
  {id:"td07",s:"He _____ his keys this morning, so he couldn't get in.",marker:"this morning (révolu)",o:["lost","has lost","had lost","was losing"],c:0,tense:"simple_past",x:"'this morning' est ici révolu (conséquence 'couldn't' au passé) → simple past."},
  {id:"td08",s:"We _____ each other since the Tokyo conference.",marker:"since",o:["didn't see","haven't seen","hadn't seen","don't see"],c:1,tense:"present_perfect",x:"'since + événement passé' + état qui dure jusqu'à présent → present perfect."},
  {id:"td09",s:"When I was a student, I _____ part-time at a bookstore.",marker:"when I was",o:["work","have worked","used to work","would have worked"],c:2,tense:"used_to",x:"Habitude passée qui n'existe plus → 'used to + base'. 'would + base' possible aussi pour action répétée."},
  {id:"td10",s:"She _____ her presentation when the power went out.",marker:"when + past",o:["gave","was giving","has given","had given"],c:1,tense:"past_continuous",x:"Action en cours interrompue par une autre action passée → past continuous (was/were + V-ing)."},
  {id:"td11",s:"They _____ in this building for two years before they moved.",marker:"before + moved",o:["worked","have worked","had been working","are working"],c:2,tense:"past_perfect_continuous",x:"Durée d'action antérieure à une autre action passée → past perfect continuous (had been + V-ing)."},
  {id:"td12",s:"I _____ you as soon as I have more information.",marker:"as soon as (prop. principale)",o:["contact","contacted","will contact","would contact"],c:2,tense:"simple_future",x:"Proposition principale = futur avec 'will'. La subordonnée 'as soon as I have' reste au present."},
  {id:"td13",s:"The new policy _____ into effect last January.",marker:"last January",o:["comes","came","has come","had come"],c:1,tense:"simple_past",x:"'last + période' = temps précis révolu → simple past."},
  {id:"td14",s:"I _____ this proposal several times, and I still don't agree.",marker:"several times",o:["read","have read","had read","was reading"],c:1,tense:"present_perfect",x:"Fréquence d'expérience cumulée jusqu'à présent → present perfect."},
  {id:"td15",s:"By next June, she _____ here for ten years.",marker:"by next June",o:["works","will work","will have worked","has worked"],c:2,tense:"future_perfect",x:"'by + date future' + durée accomplie à cette date → future perfect (will have + V3)."}
];

// ───────────────────────────────────────────────────────────
// 3. PASSIVE FORGE — active↔passive transformations + fill-in
// Fields: id, mode ("transform"|"fillin"), active (if transform),
//         prompt (passive sentence w/ blank), o, c, type, x
// ───────────────────────────────────────────────────────────
export var PASSIVE_FORGE = [
  {id:"pf01",mode:"transform",active:"They signed the contract yesterday.",prompt:"The contract _____ yesterday.",o:["signed","was signed","has been signed","is signed"],c:1,type:"simple_past_passive",x:"Simple past actif → was/were + V3. 'yesterday' impose le simple past (pas de present perfect)."},
  {id:"pf02",mode:"fillin",prompt:"The new software _____ by the IT team next week.",o:["installs","will install","will be installed","has installed"],c:2,type:"future_passive",x:"Le sujet (software) subit l'action + futur → will be + V3."},
  {id:"pf03",mode:"transform",active:"Someone has stolen my laptop.",prompt:"My laptop _____.",o:["stole","has stolen","has been stolen","was stolen"],c:2,type:"present_perfect_passive",x:"Present perfect actif (has stolen) → has/have been + V3. 'was stolen' serait possible mais change le sens (événement passé vs effet présent)."},
  {id:"pf04",mode:"fillin",prompt:"This report _____ before Friday.",o:["must submit","must submitted","must be submitting","must be submitted"],c:3,type:"modal_passive",x:"Modal + passif → modal + be + V3. Structure : must/should/can + be + V3."},
  {id:"pf05",mode:"fillin",prompt:"The machine needs _____ regularly.",o:["to service","servicing","to be serviced","be serviced"],c:2,type:"passive_infinitive",x:"'need + to be + V3' pour dire qu'un sujet doit subir une action. 'needs servicing' (V-ing) marche aussi mais pas dans ces options."},
  {id:"pf06",mode:"transform",active:"They are renovating the office.",prompt:"The office _____.",o:["is renovating","is being renovated","has been renovated","renovates"],c:1,type:"present_continuous_passive",x:"Present continuous actif → is/are being + V3 au passif."},
  {id:"pf07",mode:"fillin",prompt:"All employees _____ a bonus last December.",o:["gave","were gave","were given","have given"],c:2,type:"simple_past_passive_double_object",x:"Verbes à double objet (give sb sth) : au passif, la PERSONNE devient sujet → 'were given [qch]'. Piège TOEIC classique."},
  {id:"pf08",mode:"fillin",prompt:"The proposal _____ by the board before it can be implemented.",o:["must approve","must be approved","should approving","has approved"],c:1,type:"modal_passive",x:"Modal + be + V3. Le sujet (proposal) subit l'approbation."},
  {id:"pf09",mode:"transform",active:"They had finished the project before the deadline.",prompt:"The project _____ before the deadline.",o:["finished","had finished","had been finished","was finished"],c:2,type:"past_perfect_passive",x:"Past perfect actif (had finished) → had been + V3."},
  {id:"pf10",mode:"fillin",prompt:"The conference room _____ at the moment.",o:["cleans","is cleaning","is being cleaned","has cleaned"],c:2,type:"present_continuous_passive",x:"Action en cours + sujet passif → is/are being + V3."},
  {id:"pf11",mode:"fillin",prompt:"The documents _____ to you by courier tomorrow.",o:["deliver","will deliver","will be delivering","will be delivered"],c:3,type:"future_passive",x:"Sujet (documents) subit + futur → will be + V3."},
  {id:"pf12",mode:"fillin",prompt:"The issue _____ as soon as possible.",o:["should address","should be addressed","should addressing","is addressing"],c:1,type:"modal_passive",x:"'should + be + V3'. Le sujet (issue) subit l'action de traitement."},
  {id:"pf13",mode:"transform",active:"The manager offered her a senior position.",prompt:"She _____ a senior position.",o:["offered","was offering","was offered","has offered"],c:2,type:"simple_past_passive_double_object",x:"Verbe à double objet (offer sb sth). La personne (she) devient sujet du passif → 'was offered [qch]'."},
  {id:"pf14",mode:"fillin",prompt:"The invoice should have _____ last week.",o:["paid","been paid","being paid","pay"],c:1,type:"perfect_modal_passive",x:"'should have + V3' + passif → 'should have been + V3'. Exprime un reproche (aurait dû être payée)."},
  {id:"pf15",mode:"transform",active:"They're going to build a new factory here.",prompt:"A new factory _____ here.",o:["is going to build","is going to built","is going to be built","will going to build"],c:2,type:"be_going_to_passive",x:"'be going to + V' au passif → 'be going to be + V3'."}
];

// ───────────────────────────────────────────────────────────
// 4. RELATIVE WEAVER — defining, non-defining, reduced
// Fields: id, s (sentence w/ _____), o, c, type, x
// Types cover: defining/non-defining × person/thing/place/time/possession,
//              reduced relatives (active V-ing, passive V3)
// ───────────────────────────────────────────────────────────
export var RELATIVE_WEAVER = [
  {id:"rw01",s:"The employee _____ won the innovation award works in R&D.",o:["who","which","whose","where"],c:0,type:"defining_subject_person",x:"Personne (employee) + fonction sujet de la relative → who (ou that). 'which' réservé aux choses."},
  {id:"rw02",s:"The report _____ I sent yesterday contained a typo.",o:["who","which","whose","when"],c:1,type:"defining_object_thing",x:"Chose (report) + fonction objet de la relative → which ou that. On peut aussi omettre : 'The report I sent yesterday...'."},
  {id:"rw03",s:"Paris, _____ is the capital of France, is hosting the conference.",o:["who","which","that","where"],c:1,type:"non_defining_thing",x:"Non-defining (entre virgules) + chose → which obligatoire. 'that' est INTERDIT en non-defining."},
  {id:"rw04",s:"The client _____ laptop was stolen filed a complaint.",o:["who","whose","which","that"],c:1,type:"possession_person",x:"Possession ('son/sa laptop') → whose, quel que soit le possesseur (personne ou chose)."},
  {id:"rw05",s:"This is the office _____ I used to work ten years ago.",o:["which","that","where","when"],c:2,type:"place",x:"Lieu sans préposition explicite → where. Alternative formelle : 'in which'."},
  {id:"rw06",s:"I'll never forget the day _____ I signed my first contract.",o:["which","that","where","when"],c:3,type:"time",x:"Référent temporel (day) + circonstance temporelle → when. Alternative : 'on which'."},
  {id:"rw07",s:"The meeting scheduled for Monday _____ postponed.",o:["have been","has been","is been","has"],c:1,type:"reduced_relative_agreement_trap",x:"'scheduled for Monday' est une relative réduite (= 'which is scheduled for Monday'). Le vrai sujet est 'meeting' (singulier) → has been postponed. Piège TOEIC d'accord."},
  {id:"rw08",s:"The employees _____ in the R&D department received a bonus.",o:["work","working","worked","who working"],c:1,type:"reduced_relative_active",x:"Relative réduite active = participe présent (V-ing). '= who work in R&D'. 'who working' est agrammatical."},
  {id:"rw09",s:"All documents _____ before Friday will be reviewed Monday.",o:["submit","submitting","submitted","who submitted"],c:2,type:"reduced_relative_passive",x:"Relative réduite passive = V3 (participe passé). '= which are submitted before Friday'."},
  {id:"rw10",s:"The consultant _____ we hired last month is excellent.",o:["who","whom","whose","which"],c:1,type:"formal_object_person",x:"Personne + fonction objet + registre formel TOEIC → whom. 'who' accepté à l'oral mais 'whom' attendu ici."},
  {id:"rw11",s:"The company _____ headquarters are in Tokyo opened a Paris office.",o:["who","which","whose","that"],c:2,type:"possession_thing",x:"Possession applicable aussi aux organisations → whose ('dont les bureaux')."},
  {id:"rw12",s:"That's the candidate _____ CV impressed the committee.",o:["who","which","whose","that"],c:2,type:"possession_person",x:"'son CV' (possession) → whose CV."},
  {id:"rw13",s:"The software _____ we're using now is much faster than the old version.",o:["who","which","whose","where"],c:1,type:"defining_object_thing",x:"Chose + objet → which ou that. Omission possible : 'The software we're using...'."},
  {id:"rw14",s:"Mr. Tanaka, _____ has worked here for 20 years, will retire next month.",o:["who","which","that","whom"],c:0,type:"non_defining_person",x:"Non-defining + personne + sujet → who. 'that' INTERDIT en non-defining."},
  {id:"rw15",s:"The proposal _____ by the finance team was approved unanimously.",o:["prepare","preparing","prepared","who prepared"],c:2,type:"reduced_relative_passive",x:"Relative réduite passive = V3. '= which was prepared by the finance team'."}
];
