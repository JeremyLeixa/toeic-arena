// ─── BATTLE SCAN V2 lives below — see V2 exports section.
// V1 (BATTLE_SCAN, SCAN_STATS, FIRST_MISSIONS) was removed during scan-v2 sprint.

// Keep MISSION_MODULES for daily missions (unchanged)
export var MISSION_MODULES=[
  {id:"drill",name:"Part 5 Drill",icon:"📝",reason:"Grammar practice"},
  {id:"wordfam",name:"Word Families",icon:"🧩",reason:"Word form mastery"},
  {id:"connsort",name:"Connectors",icon:"🔀",reason:"Connector rules"},
  {id:"prepdrill",name:"Prepositions",icon:"🎯",reason:"Collocation practice"},
  {id:"gerinf",name:"Gerund/Infinitive",icon:"⏱️",reason:"Verb patterns"},
  {id:"falsefr",name:"False Friends",icon:"🎭",reason:"FR/EN traps"},
  {id:"csess",name:"Flashcard Review",icon:"🃏",reason:"Vocabulary SRS"},
  {id:"p6",name:"Part 6",icon:"📄",reason:"Text completion"},
  {id:"p7",name:"Part 7 Reading",icon:"📖",reason:"Reading comprehension"},
  {id:"traps",name:"TOEIC Traps",icon:"🪤",reason:"Exam awareness"},
  {id:"stratquiz",name:"Strategy Quiz",icon:"🧠",reason:"Exam strategy"},
  {id:"timesim",name:"Exam Simulation",icon:"🏁",reason:"Time management"},
  {id:"pvdojo",name:"Phrasal Verb Dojo",icon:"🥋",reason:"Phrasal verbs"},
  {id:"lisP1",name:"Listening Part 1",icon:"🖼️",reason:"Photo description"},
  {id:"lisP2",name:"Listening Part 2",icon:"🎧",reason:"Q&A listening"},
  {id:"lisP3",name:"Listening Part 3",icon:"💬",reason:"Conversations"},
  {id:"lisP4",name:"Listening Part 4",icon:"public-speaker",reason:"Monologues"},
  {id:"sbuild",name:"Sentence Builder",icon:"🔀",reason:"Sentence structure"},
  {id:"ablitz",name:"Audio Blitz",icon:"⚡",reason:"Listening speed"},
  {id:"clue",name:"Clue Hunter",icon:"🔍",reason:"Grammar clue detection"},
];

// ═══════════════════════════════════════════════════════════════════════
// BATTLE SCAN V2 — CAT-light stratified pools (preview/battle-scan-v2)
// ─────────────────────────────────────────────────────────────────────
// Aligned with Mentor's Grammar deep-dive 4 macros (Verbs / Linking / Forms
// / Reference) and partAccuracies taxonomy (p1-p4, p6, p7) so that scan
// results bootstrap the post-onboarding personalized journey (Mentor radar,
// Today's Focus, NextStepReco) instead of dead-ending on the Battle Report.
//
// Difficulty calibration:
//   easy   = common business EN, single-step decision, 1 trap max
//   medium = TOEIC-typical, 2 plausible distractors, register-aware
//   hard   = inversions, formal register, multi-step inference, advanced cohesion
// ═══════════════════════════════════════════════════════════════════════

export var SCAN_GRAMMAR_MACROS = [
  {id:"verbs",     label:"Verbs",     icon:"crossed-swords", subcats:["Tenses","Gerunds vs Infinitives","Passive Voice","Conditionals","Subject-Verb Agreement"]},
  {id:"linking",   label:"Linking",   icon:"linked-rings",   subcats:["Connectors","Prepositions","Collocations"]},
  {id:"forms",     label:"Forms",     icon:"quill-ink",      subcats:["Word Families","Comparatives","Articles"]},
  {id:"reference", label:"Reference", icon:"family-tree",    subcats:["Relative Pronouns"]}
];

// CAT scoring: hard correct = 1.5x, medium = 1.0x, easy = 0.7x.
// Section accuracy = sum(weights of correct) / sum(weights of asked).
export var SCAN_DIFFICULTY_WEIGHTS = {easy:0.7, medium:1.0, hard:1.5};

// TOEIC baseline interpolation. accuracy 0..1 → 250..880.
// Section weights mirror partAccuracies dimensions (Listening half, Reading half).
export var SCAN_TOEIC_BASELINE = {
  min:250, max:880,
  weights:{listening:0.5, reading:0.20, grammar:0.20, vocab:0.10}
};

export var BATTLE_SCAN_V2 = {
  // ── GRAMMAR — 4 macros, 3 difficulty levels each, 3 items per level ──
  grammar:{
    name:"Blade Precision", subtitle:"Grammar Instinct",
    icon:"crossed-swords", color:"#d4943a",
    desc:"Probe your command of English structure across 4 dimensions: Verbs, Linking, Forms, Reference.",
    targetCount:8,
    pool:{
      verbs:{
        easy:[
          {id:"bs_v_e1",cat:"Tenses",s:"She _____ in this office for three years.",o:["work","works","has worked","working"],c:2,x:"'For three years' → present perfect (action started in past, still true)."},
          {id:"bs_v_e2",cat:"Subject-Verb Agreement",s:"Each of the employees _____ a personal locker.",o:["have","has","having","were having"],c:1,x:"'Each' is singular even with a plural complement → 'has'."},
          {id:"bs_v_e3",cat:"Tenses",s:"We _____ the report yesterday morning.",o:["finish","finished","have finished","were finished"],c:1,x:"'Yesterday' = simple past, not present perfect."}
        ],
        medium:[
          {id:"bs_v_m1",cat:"Passive Voice",s:"The contract _____ by both parties last Friday.",o:["signed","was signed","has signed","signs"],c:1,x:"Past passive: was/were + past participle."},
          {id:"bs_v_m2",cat:"Gerunds vs Infinitives",s:"The team suggested _____ the launch to next quarter.",o:["to postpone","postponing","postpone","postponed"],c:1,x:"'Suggest' takes a gerund (-ing). Other gerund-takers: enjoy, avoid, recommend."},
          {id:"bs_v_m3",cat:"Conditionals",s:"If we _____ the deadline, we will lose the client.",o:["miss","missed","will miss","would miss"],c:0,x:"First conditional: if + present simple → will + base."}
        ],
        hard:[
          {id:"bs_v_h1",cat:"Conditionals",s:"Had we known earlier, we _____ the issue much sooner.",o:["fixed","would fix","would have fixed","will fix"],c:2,x:"Inverted third conditional: 'Had + S + V3' = 'If we had known' → would have + V3."},
          {id:"bs_v_h2",cat:"Passive Voice",s:"The proposal _____ being reviewed by the executive board.",o:["is currently","has currently","will currently","was currently"],c:0,x:"Present continuous passive: is/are + being + past participle."},
          {id:"bs_v_h3",cat:"Subject-Verb Agreement",s:"Neither the manager nor her assistants _____ available this afternoon.",o:["was","were","is","has been"],c:1,x:"'Neither X nor Y' agrees with the closer subject (assistants → were)."}
        ]
      },
      linking:{
        easy:[
          {id:"bs_l_e1",cat:"Connectors",s:"She missed the train, _____ she arrived late.",o:["because","but","so","although"],c:2,x:"Cause first → effect with 'so'. 'Because' would invert the order."},
          {id:"bs_l_e2",cat:"Prepositions",s:"The meeting starts _____ 9 AM _____ Monday morning.",o:["at / on","on / at","in / on","at / at"],c:0,x:"'At' for clock time, 'on' for days of the week."},
          {id:"bs_l_e3",cat:"Collocations",s:"Could you please _____ a decision before Friday?",o:["do","take","make","get"],c:2,x:"'Make a decision' (standard collocation). 'Take a decision' exists but is BrE/formal."}
        ],
        medium:[
          {id:"bs_l_m1",cat:"Connectors",s:"_____ the budget cuts, the project was delivered on time.",o:["Despite","Although","However","Because"],c:0,x:"'Despite' + noun phrase. 'Although' would need a clause: 'Although there were budget cuts'."},
          {id:"bs_l_m2",cat:"Collocations",s:"We need to _____ a survey among our customers.",o:["make","do","conduct","perform"],c:2,x:"'Conduct a survey' = standard business collocation. 'Make/do a survey' is informal."},
          {id:"bs_l_m3",cat:"Prepositions",s:"The team has been working _____ the new product since January.",o:["at","on","in","for"],c:1,x:"'Work on a project / a product' (collocation)."}
        ],
        hard:[
          {id:"bs_l_h1",cat:"Connectors",s:"The launch will proceed _____ the supplier delays.",o:["notwithstanding","whereas","insofar as","unless"],c:0,x:"'Notwithstanding' = despite, formal register, takes a noun phrase."},
          {id:"bs_l_h2",cat:"Connectors",s:"_____ that the report be submitted by 5 PM, no extensions will be granted.",o:["Provided","Whereas","Insofar","Given"],c:0,x:"'Provided that' = on the strict condition that. Subjunctive 'be submitted' confirms register."},
          {id:"bs_l_h3",cat:"Collocations",s:"The CEO _____ a strong stance against the proposed merger.",o:["did","made","took","gave"],c:2,x:"'Take a stance' (collocation). Compare: 'make a statement', 'give a speech'."}
        ]
      },
      forms:{
        easy:[
          {id:"bs_f_e1",cat:"Articles",s:"She is _____ honest and reliable employee.",o:["a","an","the","—"],c:1,x:"'Honest' starts with a vowel sound (silent h) → 'an'."},
          {id:"bs_f_e2",cat:"Comparatives",s:"This new office is _____ than the previous one.",o:["large","larger","largest","more large"],c:1,x:"Short adj → -er form: larger."},
          {id:"bs_f_e3",cat:"Word Families",s:"The _____ of the new policy was unexpected.",o:["announce","announcement","announced","announcing"],c:1,x:"After 'the ___ of' → noun (announcement)."}
        ],
        medium:[
          {id:"bs_f_m1",cat:"Word Families",s:"The team showed great _____ in handling the crisis.",o:["profess","professional","professionally","professionalism"],c:3,x:"After 'great' (adj describing a quality) → abstract noun in -ism."},
          {id:"bs_f_m2",cat:"Comparatives",s:"Sales this quarter were _____ last year's.",o:["as good","good as","as good as","as best"],c:2,x:"Equality structure: as + adj + as."},
          {id:"bs_f_m3",cat:"Word Families",s:"The proposal was rejected for being financially _____.",o:["sustain","sustained","sustainable","sustainability"],c:2,x:"After 'be' + adverb → adjective (sustainable)."}
        ],
        hard:[
          {id:"bs_f_h1",cat:"Word Families",s:"The auditors found several _____ in the quarterly report.",o:["discrepancies","discrepant","discrepantly","discrepate"],c:0,x:"After 'several' (determiner) → countable plural noun."},
          {id:"bs_f_h2",cat:"Comparatives",s:"The _____ we hire, the faster we'll meet the deadline.",o:["sooner","soonest","more soon","as soon"],c:0,x:"'The + comparative, the + comparative' parallel structure."},
          {id:"bs_f_h3",cat:"Articles",s:"_____ unemployment has risen sharply this year.",o:["A","An","The","—"],c:3,x:"Abstract uncountable noun in a general statement → zero article."}
        ]
      },
      reference:{
        easy:[
          {id:"bs_r_e1",cat:"Relative Pronouns",s:"The candidate _____ applied yesterday has strong references.",o:["which","who","whose","where"],c:1,x:"Subject relative pronoun for a person → 'who'."},
          {id:"bs_r_e2",cat:"Relative Pronouns",s:"This is the report _____ I mentioned in our last meeting.",o:["who","whose","that","what"],c:2,x:"Object relative for a thing → 'that' (or 'which')."},
          {id:"bs_r_e3",cat:"Relative Pronouns",s:"The office _____ we work has been completely renovated.",o:["who","which","where","that"],c:2,x:"Place relative → 'where' = 'in which'."}
        ],
        medium:[
          {id:"bs_r_m1",cat:"Relative Pronouns",s:"Our director, _____ presentation impressed everyone, was promoted.",o:["who","whose","which","that"],c:1,x:"Possessive relative for a person → 'whose'."},
          {id:"bs_r_m2",cat:"Relative Pronouns",s:"There are several reasons _____ the merger ultimately failed.",o:["which","why","whose","when"],c:1,x:"Relative for reason → 'why' (= 'for which')."},
          {id:"bs_r_m3",cat:"Relative Pronouns",s:"The clients, most of _____ are based abroad, attended remotely.",o:["who","whose","whom","which"],c:2,x:"Preposition + people → 'whom' (formal: 'most of whom')."}
        ],
        hard:[
          {id:"bs_r_h1",cat:"Relative Pronouns",s:"This is the supplier with _____ we negotiated last quarter.",o:["who","that","whom","whose"],c:2,x:"Preposition + person → 'whom'. 'That' cannot follow a preposition."},
          {id:"bs_r_h2",cat:"Relative Pronouns",s:"The proposal, _____ if approved will reshape operations, is now under review.",o:["that","which","what","whose"],c:1,x:"Non-defining clause (commas) requires 'which', not 'that'."},
          {id:"bs_r_h3",cat:"Relative Pronouns",s:"He cited a study _____ findings directly contradict our internal report.",o:["who","whose","which","that"],c:1,x:"Possessive relative for things → 'whose findings'."}
        ]
      }
    }
  },

  // ── VOCAB — 1 pool, 3 levels, 4 items each ──
  vocab:{
    name:"Arcane Lore", subtitle:"Vocabulary Power",
    icon:"spell-book", color:"#8b5cf6",
    desc:"From core business concepts to executive-level idioms — how deep does your lexicon go?",
    targetCount:6,
    pool:{
      easy:[
        {id:"bs_voc_e1",s:"The company's annual _____ reached $5 million last year.",o:["revenue","salary","budget","cost"],c:0,x:"Revenue = total income from operations. Salary = pay to employees. Budget = planned spending."},
        {id:"bs_voc_e2",s:"All _____ over $10,000 must be reported to compliance.",o:["interactions","transactions","operations","procedures"],c:1,x:"Transactions = financial exchanges (buy/sell)."},
        {id:"bs_voc_e3",s:"The manager asked for _____ from the team after the project.",o:["response","feedback","answer","reaction"],c:1,x:"Feedback = constructive comments on performance / a deliverable."},
        {id:"bs_voc_e4",s:"Please _____ the form and return it by Friday.",o:["fill out","fill on","fill into","fill from"],c:0,x:"'Fill out a form' (phrasal verb, standard business)."}
      ],
      medium:[
        {id:"bs_voc_m1",s:"To reduce costs, several support functions have been _____.",o:["outsourced","sourced out","out-sold","outranked"],c:0,x:"Outsource = delegate work to external providers."},
        {id:"bs_voc_m2",s:"The new system will _____ our entire reporting workflow.",o:["streamline","streamfold","streamcast","streampack"],c:0,x:"Streamline = make a process more efficient."},
        {id:"bs_voc_m3",s:"Each team must define clear _____ to track performance.",o:["KPI","CV","FYI","ETA"],c:0,x:"KPI = Key Performance Indicators. ETA = Estimated Time of Arrival."},
        {id:"bs_voc_m4",s:"We have to meet the _____ by the end of the month.",o:["timeline","schedule","deadline","calendar"],c:2,x:"Deadline = final time limit beyond which something is late."}
      ],
      hard:[
        {id:"bs_voc_h1",s:"Please _____ with the legal team to align on the contract terms.",o:["liaise","liase","liaison","liase up"],c:0,x:"Liaise (verb) = coordinate, communicate (formal business register)."},
        {id:"bs_voc_h2",s:"The board approved a plan to _____ non-core assets.",o:["divest","invest","devalue","disperse"],c:0,x:"Divest = sell off (assets, subsidiaries). Opposite of invest."},
        {id:"bs_voc_h3",s:"We need a _____ plan in case the supplier defaults.",o:["consequence","contingency","contingent","convenient"],c:1,x:"Contingency plan = backup plan for an unexpected situation."},
        {id:"bs_voc_h4",s:"They aim to _____ existing client relationships to enter new markets.",o:["leverage","lever","leveraging","lavage"],c:0,x:"Leverage (verb, business) = use strategically as an advantage."}
      ]
    }
  },

  // ── READING — Hybrid P6 cloze + P7 inference, each in 3 difficulties ──
  reading:{
    name:"Tactical Sight", subtitle:"Reading Comprehension",
    icon:"eye-target", color:"#22c55e",
    desc:"Two formats, both essential to TOEIC Reading: cloze passages (Part 6) and inference (Part 7).",
    targetCount:6,
    pool:{
      p6:{
        easy:{
          id:"bs_p6_e", title:"Office Notice", type:"Notice",
          intro:"To: All staff\nFrom: Facilities team\nRe: Parking arrangements",
          parts:[
            {text:"Starting next Monday, the south parking lot will be closed for "},
            {blank:true,id:"bs_p6_e_q1",o:["repair","repairing","repairs","repaired"],c:2,x:"After 'for' (preposition) → noun. 'Repairs' (plural) is the standard collocation."},
            {text:". Please use the north lot, "},
            {blank:true,id:"bs_p6_e_q2",o:["which","who","where","whose"],c:0,x:"Non-defining relative for a thing → 'which' (after a comma)."},
            {text:" has 80 additional spaces. We "},
            {blank:true,id:"bs_p6_e_q3",o:["apologize","apology","apologetic","apologized"],c:0,x:"Subject pronoun 'we' + verb in present → 'apologize'."},
            {text:" for any inconvenience this may cause."}
          ]
        },
        medium:{
          id:"bs_p6_m", title:"Internal Memo — Office Relocation", type:"Memo",
          intro:"To: Department managers\nFrom: Sarah Chen, VP Operations\nDate: March 15",
          parts:[
            {text:"As previously announced, our headquarters "},
            {blank:true,id:"bs_p6_m_q1",o:["moves","is moving","moved","has moved"],c:1,x:"Future arrangement (planned event with date) → present continuous."},
            {text:" to Greenfield Park on April 22. Each department "},
            {blank:true,id:"bs_p6_m_q2",o:["receives","received","will receive","is receiving"],c:2,x:"Future plan, no specific schedule → 'will receive'."},
            {text:" detailed floor plans by March 25. "},
            {blank:true,id:"bs_p6_m_q3",o:["Despite","However","Therefore","Although"],c:1,x:"Contrast linker between full sentences (with comma) → 'However'."},
            {text:", attendance at the orientation on April 23 is mandatory for all managers."}
          ]
        },
        hard:{
          id:"bs_p6_h", title:"Press Release — Acquisition", type:"Press Release",
          intro:"For Immediate Release — Meridian Holdings",
          parts:[
            {text:"Meridian Holdings today announced an agreement "},
            {blank:true,id:"bs_p6_h_q1",o:["acquiring","to acquire","that acquired","has acquired"],c:1,x:"'Agreement' + infinitive of purpose → 'to acquire'."},
            {text:" Corex Industries, "},
            {blank:true,id:"bs_p6_h_q2",o:["a regional supplier whose","a regional supplier whom","a regional supplier which","whose regional supplier"],c:0,x:"Apposition + possessive relative for things → 'whose'."},
            {text:" components are central to the EV market. "},
            {blank:true,id:"bs_p6_h_q3",o:["Subject to","Subjected to","Subjecting to","Subject for"],c:0,x:"'Subject to' (fixed prepositional phrase) = conditional on."},
            {text:" regulatory approval, the deal is expected to close in Q3."}
          ]
        }
      },
      p7:{
        easy:{
          id:"bs_p7_e", title:"Email — Order Confirmation", type:"Email",
          text:"Hello Mr. Tanaka,\n\nThank you for your order #45821. Your three office chairs will be shipped on April 12 and should arrive within 3 business days. A tracking number will be sent to your email once the package leaves our warehouse. If you need to change the delivery address, please reply to this email before April 11.\n\nBest regards,\nCustomer Service",
          questions:[
            {id:"bs_p7_e_q1",q:"What is the main purpose of this email?",o:["To request a payment","To confirm a shipment","To advertise new products","To apologize for a delay"],c:1,x:"The email confirms order details and the upcoming shipment date."},
            {id:"bs_p7_e_q2",q:"By when must the customer change the delivery address?",o:["April 11","April 12","Within 3 days","Before shipping confirmation"],c:0,x:"'Reply to this email before April 11.'"},
            {id:"bs_p7_e_q3",q:"What will the customer receive later?",o:["A receipt","A tracking number","A discount code","An invoice"],c:1,x:"'A tracking number will be sent to your email once the package leaves our warehouse.'"}
          ]
        },
        medium:{
          id:"bs_p7_m", title:"Article — Local Business Closing", type:"Article",
          text:"Riverside Bakery, a family-owned business that has operated on Main Street for over 40 years, will close its doors at the end of June. Owner Helena Voss said the decision was driven by rising rent and the difficulty of finding skilled bakers. The building will reportedly be converted into office space. Long-time customers have launched a petition to keep the bakery open, but Voss said reversing the decision is unlikely. A farewell event is planned for June 28.",
          questions:[
            {id:"bs_p7_m_q1",q:"Why is the bakery closing?",o:["The owner is retiring","Rising costs and staffing issues","A failed health inspection","A change in customer taste"],c:1,x:"'Rising rent and the difficulty of finding skilled bakers' = costs + staffing."},
            {id:"bs_p7_m_q2",q:"In context, the word 'reversing' most likely means:",o:["accelerating","explaining","undoing","postponing"],c:2,x:"Reversing the decision = changing it back, undoing it."},
            {id:"bs_p7_m_q3",q:"What is implied about the customers' petition?",o:["It will likely succeed","It is unlikely to change the outcome","It has been formally ignored","It led to legal action"],c:1,x:"'Voss said reversing the decision is unlikely' → petition probably won't work."}
          ]
        },
        hard:{
          id:"bs_p7_h", title:"Editorial — Workforce Strategy", type:"Editorial",
          text:"The recent surge in remote work has not only altered where employees do their jobs, but has also exposed long-standing inefficiencies in how managers measure productivity. Companies that cling to outdated metrics — hours logged, emails sent, meetings attended — are finding that these surrogates poorly correlate with actual output. Forward-looking firms are pivoting toward outcome-based evaluation, though the transition is far from frictionless. Middle managers, in particular, often resist the shift, fearing that their role itself becomes harder to justify when face-time gives way to deliverables.",
          questions:[
            {id:"bs_p7_h_q1",q:"What is the author's main argument?",o:["Remote work has reduced overall productivity","Traditional productivity metrics are flawed","Middle managers should be eliminated","Companies should mandate office attendance"],c:1,x:"The article critiques outdated metrics and advocates outcome-based evaluation."},
            {id:"bs_p7_h_q2",q:"In context, 'surrogates' refers to:",o:["Remote workers","The outdated metrics","Forward-looking firms","Project deliverables"],c:1,x:"'These surrogates' refers back to 'hours logged, emails sent, meetings attended' = the metrics standing in for real productivity."},
            {id:"bs_p7_h_q3",q:"Why do middle managers resist the shift?",o:["Their workload would increase","Their authority is questioned","They lack technical skills","They prefer remote work"],c:1,x:"'Their role itself becomes harder to justify' = identity / authority threatened."}
          ]
        }
      }
    }
  },

  // ── LISTENING — references to real items in src/data/listening.js ──
  // The CAT engine fetches the actual question content at runtime by refId.
  // For P3/P4, qIdx selects which sub-question of the conversation/talk to ask.
  listening:{
    name:"Battle Sense", subtitle:"Listening Readiness",
    icon:"public-speaker", color:"#3b82f6",
    desc:"Real TOEIC audio across all four parts. Trains your ear for accents, pace, and recurring patterns.",
    targetCount:6,
    pool:{
      easy:[
        {id:"bs_lis_e1", part:"p1", refId:"p1_01"},
        {id:"bs_lis_e2", part:"p1", refId:"p1_07"},
        {id:"bs_lis_e3", part:"p2", refId:"p2_02"},
        {id:"bs_lis_e4", part:"p2", refId:"p2_05"}
      ],
      medium:[
        {id:"bs_lis_m1", part:"p1", refId:"p1_18"},
        {id:"bs_lis_m2", part:"p2", refId:"p2_15"},
        {id:"bs_lis_m3", part:"p2", refId:"p2_25"},
        {id:"bs_lis_m4", part:"p3", refId:"p3_01", qIdx:0}
      ],
      hard:[
        {id:"bs_lis_h1", part:"p2", refId:"p2_35"},
        {id:"bs_lis_h2", part:"p3", refId:"p3_05", qIdx:1},
        {id:"bs_lis_h3", part:"p3", refId:"p3_10", qIdx:0},
        {id:"bs_lis_h4", part:"p4", refId:"p4_01", qIdx:1},
        {id:"bs_lis_h5", part:"p4", refId:"p4_15", qIdx:2}
      ]
    }
  }
};

// ─── Section order for the V2 scan flow ───
// Easier sections first to build confidence; listening last (highest cognitive load).
export var SCAN_SECTION_ORDER = ["grammar","vocab","reading","listening"];
