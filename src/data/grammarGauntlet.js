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
  {id:"irr30",base:"build",past:"built",pp:"built",fr:"construire, bâtir",freq:"medium",ex:"They built a strong brand over the decade."},
  // ── Batch 2 — Ablaut patterns (vowel-change V1→V2→V3) ──
  {id:"irr31",base:"sing",past:"sang",pp:"sung",fr:"chanter",freq:"medium",ex:"The choir has sung at every corporate event this year."},
  {id:"irr32",base:"swim",past:"swam",pp:"swum",fr:"nager",freq:"low",ex:"She has swum competitively since she was twelve."},
  {id:"irr33",base:"drink",past:"drank",pp:"drunk",fr:"boire",freq:"medium",ex:"They had drunk all the coffee by 10 a.m."},
  {id:"irr34",base:"ring",past:"rang",pp:"rung",fr:"sonner, appeler",freq:"medium",ex:"The receptionist rang twice before leaving a message."},
  {id:"irr35",base:"run",past:"ran",pp:"run",fr:"courir, diriger",freq:"high",ex:"She has run the marketing department for five years."},
  {id:"irr36",base:"win",past:"won",pp:"won",fr:"gagner, remporter",freq:"high",ex:"Our team won the innovation award last quarter."},
  {id:"irr37",base:"come",past:"came",pp:"come",fr:"venir",freq:"high",ex:"The consultant has come to every board meeting."},
  {id:"irr38",base:"become",past:"became",pp:"become",fr:"devenir",freq:"high",ex:"She has become the youngest partner in the firm."},
  {id:"irr39",base:"freeze",past:"froze",pp:"frozen",fr:"geler, suspendre",freq:"medium",ex:"Hiring has been frozen until Q3."},
  {id:"irr40",base:"steal",past:"stole",pp:"stolen",fr:"voler, dérober",freq:"medium",ex:"My laptop was stolen from the hotel lobby."},
  {id:"irr41",base:"strike",past:"struck",pp:"struck",fr:"frapper, marquer",freq:"medium",ex:"The new slogan has struck a chord with customers."},
  {id:"irr42",base:"shine",past:"shone",pp:"shone",fr:"briller",freq:"low",ex:"She shone during the Q&A session."},
  {id:"irr43",base:"dig",past:"dug",pp:"dug",fr:"creuser, fouiller",freq:"medium",ex:"The analysts dug deep into the financial records."},
  {id:"irr44",base:"stick",past:"stuck",pp:"stuck",fr:"coller, rester bloqué",freq:"medium",ex:"The negotiation got stuck on the pricing clause."},
  {id:"irr45",base:"bite",past:"bit",pp:"bitten",fr:"mordre",freq:"low",ex:"The firm has bitten off more than it can chew."},
  {id:"irr46",base:"wake",past:"woke",pp:"woken",fr:"(se) réveiller",freq:"medium",ex:"The industry was woken by the regulation change."}
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
  {id:"td15",s:"By next June, she _____ here for ten years.",marker:"by next June",o:["works","will work","will have worked","has worked"],c:2,tense:"future_perfect",x:"'by + date future' + durée accomplie à cette date → future perfect (will have + V3)."},
  // ── Batch 1 — Present Perfect vs Simple Past deep dive ──
  {id:"td16",s:"The delivery _____ an hour ago.",marker:"ago",o:["arrives","arrived","has arrived","had arrived"],c:1,tense:"simple_past",x:"'ago' = temps précis révolu → simple past obligatoire."},
  {id:"td17",s:"We _____ the budget three times this week.",marker:"this week (non terminée)",o:["review","reviewed","have reviewed","had reviewed"],c:2,tense:"present_perfect",x:"'this week' non terminée + fréquence cumulée jusqu'à maintenant → present perfect."},
  {id:"td18",s:"She _____ for the company since 2015.",marker:"since",o:["works","worked","has worked","had worked"],c:2,tense:"present_perfect",x:"'since + date' + lien avec présent (elle y travaille encore) → present perfect."},
  {id:"td19",s:"Have you _____ the new manager yet?",marker:"yet (question)",o:["meet","met","meeting","have met"],c:1,tense:"present_perfect",x:"Structure present perfect : have + V3. 'yet' = marqueur standard du present perfect."},
  {id:"td20",s:"He _____ that report last Friday.",marker:"last Friday",o:["submits","submitted","has submitted","had submitted"],c:1,tense:"simple_past",x:"'last + jour' = temps précis révolu → simple past. Interdit avec present perfect."},
  {id:"td21",s:"The quarterly results _____ better than expected.",marker:"bilan sans date",o:["are","were","have been","had been"],c:2,tense:"present_perfect",x:"Bilan pertinent au présent, sans marqueur daté → present perfect."},
  {id:"td22",s:"I _____ my keys in the office this morning.",marker:"this morning (révolu)",o:["leave","left","have left","had left"],c:1,tense:"simple_past",x:"'this morning' = période matinale terminée (on est l'après-midi/soir) → simple past."},
  {id:"td23",s:"The team _____ three deadlines so far.",marker:"so far",o:["missed","has missed","had missed","miss"],c:1,tense:"present_perfect",x:"'so far' = jusqu'à présent → present perfect obligatoire."},
  {id:"td24",s:"The new CEO _____ the team three times already.",marker:"already",o:["briefs","briefed","has briefed","had briefed"],c:2,tense:"present_perfect",x:"'already' = action accomplie avec effet présent → present perfect."},
  {id:"td25",s:"It _____ a remarkable year for the industry.",marker:"bilan d'une période en cours",o:["is","was","has been","had been"],c:2,tense:"present_perfect",x:"Bilan d'une année qui n'est pas encore close → present perfect."},
  {id:"td26",s:"The CEO _____ three major acquisitions since 2020.",marker:"since 2020",o:["announces","announced","has announced","had announced"],c:2,tense:"present_perfect",x:"'since + date passée' + accumulation jusqu'à présent → present perfect."},
  {id:"td27",s:"They _____ the factory in 1998.",marker:"in 1998",o:["open","opened","have opened","had opened"],c:1,tense:"simple_past",x:"'in + année passée' = temps précis révolu → simple past."},
  {id:"td28",s:"I _____ him at the conference two weeks ago.",marker:"two weeks ago",o:["meet","met","have met","had met"],c:1,tense:"simple_past",x:"'ago' = temps précis révolu → simple past obligatoire."},
  {id:"td29",s:"_____ you ever _____ to Japan?",marker:"ever (expérience de vie)",o:["Did / go","Have / been","Are / going","Had / been"],c:1,tense:"present_perfect",x:"Question d'expérience de vie avec 'ever' → present perfect. 'Have you ever been to...'."},
  {id:"td30",s:"The assistant _____ your message an hour ago.",marker:"an hour ago",o:["delivers","delivered","has delivered","had delivered"],c:1,tense:"simple_past",x:"'ago' = simple past obligatoire."},
  // ── Batch 2 — Past Perfect + Past Perfect Continuous ──
  {id:"td31",s:"By the time we arrived, the meeting _____.",marker:"by the time",o:["started","had started","has started","was starting"],c:1,tense:"past_perfect",x:"'by the time' + passé → action antérieure → past perfect (had + V3)."},
  {id:"td32",s:"He told me he _____ the report the day before.",marker:"the day before",o:["finished","had finished","has finished","finishes"],c:1,tense:"past_perfect",x:"Discours rapporté + antériorité ('the day before') → past perfect."},
  {id:"td33",s:"She _____ for the company for ten years when she got promoted.",marker:"for + duration + when",o:["worked","had worked","has worked","was working"],c:1,tense:"past_perfect",x:"Durée accomplie au moment d'un autre événement passé → past perfect."},
  {id:"td34",s:"When I arrived, the team _____ on the project for two hours.",marker:"when + duration",o:["worked","was working","had been working","has been working"],c:2,tense:"past_perfect_continuous",x:"Durée d'activité en cours antérieure à un point passé → past perfect continuous (had been + V-ing)."},
  {id:"td35",s:"They _____ in London before moving to Paris.",marker:"before + past action",o:["live","lived","had lived","have lived"],c:2,tense:"past_perfect",x:"'before + action passée' → action antérieure → past perfect."},
  {id:"td36",s:"She _____ the proposal when I sent mine.",marker:"already + past context",o:["already reviewed","had already reviewed","has already reviewed","was already reviewing"],c:1,tense:"past_perfect",x:"'already' dans un contexte passé + antériorité → past perfect."},
  {id:"td37",s:"By 2015, the company _____ to three continents.",marker:"by 2015",o:["expands","expanded","had expanded","has expanded"],c:2,tense:"past_perfect",x:"'by + année passée' = action accomplie à ce point → past perfect."},
  {id:"td38",s:"When we reached him, he _____ for two hours.",marker:"when + duration",o:["waited","had waited","had been waiting","was waiting"],c:2,tense:"past_perfect_continuous",x:"Activité en cours sur une durée, antérieure au point passé → past perfect continuous."},
  {id:"td39",s:"By the time we launched, we _____ every channel.",marker:"by the time + already",o:["already tested","had already tested","have already tested","were already testing"],c:1,tense:"past_perfect",x:"'by the time' + 'already' dans contexte passé → past perfect."},
  {id:"td40",s:"The manager _____ the email before we arrived.",marker:"before + past",o:["sent","had sent","has sent","was sending"],c:1,tense:"past_perfect",x:"Action antérieure à un autre passé → past perfect."},
  {id:"td41",s:"They _____ on the proposal for weeks when the deal fell through.",marker:"for weeks when",o:["worked","had worked","had been working","have been working"],c:2,tense:"past_perfect_continuous",x:"Durée d'activité en cours antérieure à un événement passé → past perfect continuous."},
  {id:"td42",s:"The package _____ arrived when we checked the tracker.",marker:"when + discovery",o:["already","had already","has already","is already"],c:1,tense:"past_perfect",x:"'had already arrived' = action antérieure au moment du check → past perfect."},
  {id:"td43",s:"She didn't attend because she _____ the agenda.",marker:"because + explanation",o:["didn't read","hadn't read","hasn't read","wasn't reading"],c:1,tense:"past_perfect",x:"Cause antérieure à l'action passée (didn't attend) → past perfect négatif : hadn't + V3."},
  {id:"td44",s:"By yesterday evening, all employees _____ the training.",marker:"by yesterday evening",o:["completed","had completed","have completed","complete"],c:1,tense:"past_perfect",x:"'by + moment passé' + action accomplie à ce point → past perfect."}
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
  {id:"pf15",mode:"transform",active:"They're going to build a new factory here.",prompt:"A new factory _____ here.",o:["is going to build","is going to built","is going to be built","will going to build"],c:2,type:"be_going_to_passive",x:"'be going to + V' au passif → 'be going to be + V3'."},
  // ── Batch 1 — Simple Past + Present Perfect Passive core coverage ──
  {id:"pf16",mode:"transform",active:"The auditor examined the accounts last week.",prompt:"The accounts _____ last week.",o:["examined","was examined","were examined","have been examined"],c:2,type:"simple_past_passive",x:"Sujet pluriel (accounts) + simple past actif → were + V3. 'last week' exclut le present perfect."},
  {id:"pf17",mode:"fillin",prompt:"The new CEO _____ announced yesterday.",o:["is","was","has been","had been"],c:1,type:"simple_past_passive",x:"'yesterday' impose le simple past → was + V3. 'has been' interdit avec un marqueur daté."},
  {id:"pf18",mode:"transform",active:"The committee has approved the proposal.",prompt:"The proposal _____.",o:["approved","was approved","has been approved","is approved"],c:2,type:"present_perfect_passive",x:"Present perfect actif (has approved) → has/have been + V3."},
  {id:"pf19",mode:"fillin",prompt:"Office supplies _____ delivered every Monday.",o:["is","are","was","have been"],c:1,type:"simple_present_passive",x:"Action récurrente au présent + sujet pluriel → are + V3."},
  {id:"pf20",mode:"transform",active:"They have reviewed all contracts this month.",prompt:"All contracts _____ this month.",o:["reviewed","have reviewed","have been reviewed","were reviewed"],c:2,type:"present_perfect_passive",x:"Present perfect actif (have reviewed) → have been + V3 (sujet pluriel)."},
  {id:"pf21",mode:"fillin",prompt:"The factory _____ closed in 2019 due to low demand.",o:["is","was","has been","had been"],c:1,type:"simple_past_passive",x:"'in 2019' + contexte historique révolu → simple past : was closed."},
  {id:"pf22",mode:"transform",active:"Employees complete the survey annually.",prompt:"The survey _____ annually.",o:["completes","is completed","was completed","has completed"],c:1,type:"simple_present_passive",x:"Simple present actif (complete) → is/are + V3. Sujet singulier (survey) → is completed."},
  {id:"pf23",mode:"fillin",prompt:"The project _____ evaluated by the board next month.",o:["evaluates","will evaluate","will be evaluated","has evaluated"],c:2,type:"future_passive",x:"'next month' → futur ; le projet subit l'évaluation → will be + V3."},
  {id:"pf24",mode:"transform",active:"The interns have already completed the training.",prompt:"The training _____ by the interns.",o:["already completed","has already been completed","have already completed","was already completed"],c:1,type:"present_perfect_passive",x:"Present perfect actif → has been + V3 (sujet singulier : training)."},
  {id:"pf25",mode:"fillin",prompt:"Several improvements _____ suggested during the meeting.",o:["is","are","was","were"],c:3,type:"simple_past_passive",x:"Sujet pluriel (improvements) + contexte passé (meeting) → were + V3."},
  {id:"pf26",mode:"fillin",prompt:"New security measures _____ implemented across all branches.",o:["is being","are being","was being","had been"],c:1,type:"present_continuous_passive",x:"Action en cours + sujet pluriel → are being + V3."},
  {id:"pf27",mode:"transform",active:"Someone has contacted the supplier.",prompt:"The supplier _____.",o:["contacted","has contacted","has been contacted","was contacted"],c:2,type:"present_perfect_passive",x:"Agent indéterminé ('someone') + effet présent → has been + V3."},
  {id:"pf28",mode:"fillin",prompt:"The presentation slides _____ printed for everyone.",o:["was","were","has been","have been"],c:3,type:"present_perfect_passive",x:"Sujet pluriel + action récente avec effet présent (tout le monde les a) → have been + V3."},
  {id:"pf29",mode:"fillin",prompt:"The report _____ edited twice before publication.",o:["was","has been","had been","were"],c:1,type:"present_perfect_passive",x:"Expérience cumulée (twice) sans marqueur daté → has been + V3."},
  {id:"pf30",mode:"transform",active:"We will inform all stakeholders next week.",prompt:"All stakeholders _____ next week.",o:["will inform","will be informed","have been informed","were informed"],c:1,type:"future_passive",x:"Futur simple passif → will be + V3 (sujet pluriel, mais 'will' est invariable)."},
  // ── Batch 2 — Modal + Modal Perfect Passive ──
  {id:"pf31",mode:"fillin",prompt:"The expense report _____ by the end of the month.",o:["must submit","must submitted","must be submitted","must being submitted"],c:2,type:"modal_passive",x:"Modal + passif → modal + be + V3. Ici must be submitted."},
  {id:"pf32",mode:"fillin",prompt:"Sensitive data _____ at all times.",o:["should protect","should be protected","should been protected","is should protect"],c:1,type:"modal_passive",x:"'should + be + V3'. Le sujet (data) subit la protection."},
  {id:"pf33",mode:"fillin",prompt:"This document _____ before the meeting — we forgot.",o:["should have reviewed","should have been reviewed","should be reviewed","should been reviewed"],c:1,type:"modal_perfect_passive",x:"Reproche/regret passé + passif → 'should have been + V3'."},
  {id:"pf34",mode:"transform",active:"Someone might have sent it by mistake.",prompt:"It _____ by mistake.",o:["might send","might have sent","might have been sent","might being sent"],c:2,type:"modal_perfect_passive",x:"Déduction au passé + passif → modal + have been + V3."},
  {id:"pf35",mode:"fillin",prompt:"Employees _____ of any policy changes immediately.",o:["must inform","must be informed","must informed","must be informing"],c:1,type:"modal_passive",x:"Le sujet (employees) subit l'information → must be + V3."},
  {id:"pf36",mode:"fillin",prompt:"The error _____ if we had double-checked.",o:["could avoid","could be avoided","could have avoided","could have been avoided"],c:3,type:"modal_perfect_passive",x:"Regret contrefactuel passif → 'could have been + V3'."},
  {id:"pf37",mode:"transform",active:"They should update the software urgently.",prompt:"The software _____ urgently.",o:["should update","should be updated","should have updated","should be updating"],c:1,type:"modal_passive",x:"'should + be + V3'. Le logiciel subit la mise à jour."},
  {id:"pf38",mode:"fillin",prompt:"The client _____ about the delay yesterday — nobody told them.",o:["should notify","should be notified","should have been notified","should have notified"],c:2,type:"modal_perfect_passive",x:"Reproche passé + passif → 'should have been + V3'."},
  {id:"pf39",mode:"fillin",prompt:"All laptops _____ to the IT team for security updates.",o:["can bring","can be brought","can have brought","can be brings"],c:1,type:"modal_passive",x:"'can + be + V3'. Les laptops subissent l'action d'être apportés."},
  {id:"pf40",mode:"fillin",prompt:"This decision _____ without board approval.",o:["cannot make","cannot be made","cannot have made","cannot be making"],c:1,type:"modal_passive_negative",x:"'cannot + be + V3'. Modal négatif au passif."},
  {id:"pf41",mode:"fillin",prompt:"The file _____ somewhere — nobody can find it.",o:["must misplace","must be misplaced","must have misplaced","must have been misplaced"],c:3,type:"modal_perfect_passive",x:"Déduction sur un événement passé + passif → 'must have been + V3'."},
  {id:"pf42",mode:"fillin",prompt:"Expense reports _____ through the new portal starting Monday.",o:["must submit","must be submitted","must submitting","must been submitted"],c:1,type:"modal_passive",x:"Modal + passif : must be + V3."},
  {id:"pf43",mode:"fillin",prompt:"The issue _____ before the product launched.",o:["should address","should be addressed","should have addressed","should have been addressed"],c:3,type:"modal_perfect_passive",x:"Regret (action attendue mais non faite) + passif → 'should have been + V3'."},
  {id:"pf44",mode:"transform",active:"You should have signed this form.",prompt:"This form _____.",o:["should have signed","should have been signed","should be signing","should sign"],c:1,type:"modal_perfect_passive",x:"Modal perfect actif → 'should have been + V3' au passif."},
  {id:"pf45",mode:"fillin",prompt:"Confidential documents _____ in the locked drawer.",o:["must keep","must be kept","must have kept","must been kept"],c:1,type:"modal_passive",x:"'must + be + V3'. Les documents subissent la conservation."}
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
  {id:"rw15",s:"The proposal _____ by the finance team was approved unanimously.",o:["prepare","preparing","prepared","who prepared"],c:2,type:"reduced_relative_passive",x:"Relative réduite passive = V3. '= which was prepared by the finance team'."},
  // ── Batch 1 — Defining relatives business TOEIC ──
  {id:"rw16",s:"The client _____ we met yesterday was impressed by the pitch.",o:["who","whom","which","whose"],c:1,type:"formal_object_person",x:"Personne + objet de la relative + registre formel TOEIC → whom. 'who' accepté à l'oral."},
  {id:"rw17",s:"The document _____ arrived this morning needs signing.",o:["who","which","whose","where"],c:1,type:"defining_subject_thing",x:"Chose (document) + sujet → which (ou that). 'who' est réservé aux personnes."},
  {id:"rw18",s:"The team, _____ worked all weekend, deserves recognition.",o:["who","which","that","whose"],c:0,type:"non_defining_person",x:"Non-defining (entre virgules) + personne collective + sujet → who. 'that' INTERDIT en non-defining."},
  {id:"rw19",s:"Projects _____ exceed the budget require executive approval.",o:["who","which","whose","where"],c:1,type:"defining_subject_thing",x:"Chose + sujet → which (ou that). Formel : which est préféré."},
  {id:"rw20",s:"The conference _____ we were invited was cancelled.",o:["which","that","where","to which"],c:3,type:"preposition_formal",x:"'invite TO' → la préposition est 'to'. Registre formel → 'to which'. Alternative orale : 'The conference we were invited to'."},
  {id:"rw21",s:"The candidates _____ applications arrived late were rejected.",o:["who","which","whose","that"],c:2,type:"possession_person",x:"'leurs' candidatures (possession) → whose. Whose fonctionne pour les pluriels aussi."},
  {id:"rw22",s:"This is the software _____ revolutionized our workflow.",o:["who","which","whose","where"],c:1,type:"defining_subject_thing",x:"Chose (software) + sujet → which (ou that)."},
  {id:"rw23",s:"All reports _____ before the deadline are accepted.",o:["submit","submitting","submitted","who submitted"],c:2,type:"reduced_relative_passive",x:"Relative réduite passive = V3 (participe passé). '= which are submitted before the deadline'."},
  {id:"rw24",s:"The manager _____ team hit all targets received a bonus.",o:["who","whose","that","which"],c:1,type:"possession_person",x:"'son équipe' → whose team. Possession humaine."},
  {id:"rw25",s:"Companies _____ invest in R&D tend to outperform competitors.",o:["who","which","whose","that"],c:1,type:"defining_subject_thing",x:"Organisations (companies) + sujet → which (ou that). 'who' rare dans ce contexte formel."},
  {id:"rw26",s:"The year _____ we signed the partnership was 2022.",o:["which","that","where","when"],c:3,type:"time",x:"Référent temporel (year) + circonstance → when. Alternative : 'in which'."},
  {id:"rw27",s:"She's the consultant _____ I trust the most.",o:["who","whom","whose","which"],c:1,type:"formal_object_person",x:"Personne + objet + registre formel → whom. Orale : 'who I trust' accepté."},
  {id:"rw28",s:"The contracts _____ in the boardroom are confidential.",o:["store","storing","stored","who stored"],c:2,type:"reduced_relative_passive",x:"Relative réduite passive = V3. '= which are stored in the boardroom'."},
  {id:"rw29",s:"Mr. Chen, _____ has just arrived, will lead the meeting.",o:["who","which","that","whom"],c:0,type:"non_defining_person",x:"Non-defining + personne + sujet → who. 'that' INTERDIT après une virgule."},
  {id:"rw30",s:"The intern _____ helped us with the audit got hired.",o:["who","whom","whose","which"],c:0,type:"defining_subject_person",x:"Personne + sujet de la relative → who (ou that). 'whom' serait faux car c'est le sujet, pas l'objet."},
  // ── Batch 2 — Non-defining + deeper possession ──
  {id:"rw31",s:"Our CFO, _____ joined last year, has transformed the finance team.",o:["who","that","whom","which"],c:0,type:"non_defining_person",x:"Non-defining (entre virgules) + personne + sujet → who. 'that' INTERDIT après virgule."},
  {id:"rw32",s:"The Tokyo office, _____ opened in 2020, is now our APAC hub.",o:["who","which","that","whose"],c:1,type:"non_defining_thing",x:"Non-defining + chose + sujet → which obligatoire. 'that' INTERDIT en non-defining."},
  {id:"rw33",s:"Sarah's team, _____ consists of five analysts, delivered on time.",o:["who","which","that","whose"],c:1,type:"non_defining_thing",x:"Non-defining + entité (team comme unité) + sujet → which. 'who' possible mais 'which' plus courant avec collectif."},
  {id:"rw34",s:"The company _____ stock just split is in our portfolio.",o:["who","which","whose","that"],c:2,type:"possession_thing",x:"Possession appliquée à une organisation → whose. Fonctionne aussi pour les choses."},
  {id:"rw35",s:"We hired candidates _____ experience matched the profile perfectly.",o:["who","which","whose","that"],c:2,type:"possession_person",x:"'leur' expérience → whose. Whose fonctionne pour les pluriels."},
  {id:"rw36",s:"Departments _____ budgets exceed 1M need board approval.",o:["who","which","whose","that"],c:2,type:"possession_thing",x:"'leurs' budgets (possession organisationnelle) → whose."},
  {id:"rw37",s:"The year 2020, _____ changed everything, taught us resilience.",o:["who","which","that","when"],c:1,type:"non_defining_thing",x:"Non-defining + année traitée comme entité + sujet → which. 'when' serait pour une relative temporelle defining ('the year when...')."},
  {id:"rw38",s:"Mr. Tanaka, _____ we consulted last quarter, will join the board.",o:["who","whom","that","which"],c:1,type:"non_defining_formal_object",x:"Non-defining + personne + objet + registre formel → whom. 'that' INTERDIT en non-defining."},
  {id:"rw39",s:"The startup _____ founder left last year is struggling.",o:["who","which","whose","that"],c:2,type:"possession_thing",x:"'son' fondateur → whose (s'applique aussi aux organisations)."},
  {id:"rw40",s:"The strategy _____ we adopted proved effective.",o:["who","which","whose","where"],c:1,type:"defining_object_thing",x:"Chose + objet → which (ou that). Omission possible : 'The strategy we adopted...'."},
  {id:"rw41",s:"An approach _____ focuses on results outperforms one focused on process.",o:["who","which","whose","that"],c:1,type:"defining_subject_thing",x:"Chose (approach) + sujet → which ou that. 'who' réservé aux personnes."},
  {id:"rw42",s:"The main competitor, _____ market share we want to capture, is weakening.",o:["who","which","whose","that"],c:2,type:"possession_thing",x:"Possession en non-defining → whose. 'leur' part de marché."},
  {id:"rw43",s:"The consultant _____ we relied on has retired.",o:["who","whom","whose","which"],c:1,type:"formal_object_person",x:"Personne + objet d'un phrasal verb (rely on) + formel → whom. Version formelle : 'on whom we relied'."},
  {id:"rw44",s:"The partners _____ we consulted provided valuable input.",o:["who","whom","whose","which"],c:1,type:"formal_object_person",x:"Personnes + objet + registre formel TOEIC → whom."},
  {id:"rw45",s:"Candidates _____ backgrounds include finance tend to excel here.",o:["who","whom","whose","that"],c:2,type:"possession_person",x:"'leurs' parcours (possession plurielle) → whose."}
];
