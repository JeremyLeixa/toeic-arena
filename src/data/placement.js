// ─── BATTLE SCAN — Diagnostic d'entrée multi-compétences ───

export var BATTLE_SCAN = [
  // ── SECTION 0 : BLADE PRECISION (Grammar Instinct) ──
  {
    id:"grammar", name:"Blade Precision", subtitle:"Grammar Instinct",
    icon:"⚔️", color:"#d4943a",
    desc:"A warrior's blade must be precise. Test your command of English structure.",
    moduleMap:["drill","connsort","wordfam","gerinf","prepdrill"],
    questions:[
      {id:"bs_g1",s:"She _____ at this company since 2019.",o:["works","worked","has worked","is working"],c:2,x:"'Since 2019' → present perfect.",mod:"drill"},
      {id:"bs_g2",s:"_____ the budget cuts, the project was completed on time.",o:["Despite","Although","However","Because"],c:0,x:"'Despite' + noun phrase (no clause needed).",mod:"connsort"},
      {id:"bs_g3",s:"The _____ of the new policy surprised everyone.",o:["announce","announcement","announced","announcing"],c:1,x:"'The _____ of' = noun needed → 'announcement'.",mod:"wordfam"},
      {id:"bs_g4",s:"The team suggested _____ the launch to next quarter.",o:["to postpone","postponing","postpone","postponed"],c:1,x:"'Suggest' takes gerund (-ing form).",mod:"gerinf"},
      {id:"bs_g5",s:"Had we known earlier, we _____ it sooner.",o:["fixed","would fix","would have fixed","will fix"],c:2,x:"Third conditional: Had + past participle → would have + past participle.",mod:"drill"}
    ]
  },
  // ── SECTION 1 : ARCANE LORE (Vocabulary Power) ──
  {
    id:"vocab", name:"Arcane Lore", subtitle:"Vocabulary Power",
    icon:"📚", color:"#8b5cf6",
    desc:"Knowledge is power. How deep is your business vocabulary?",
    moduleMap:["csess"],
    questions:[
      {id:"bs_v1",s:"The company's annual _____ exceeded $2 million last year.",o:["revenue","salary","budget","profit margin"],c:0,x:"'Revenue' = total income from business operations.",mod:"csess"},
      {id:"bs_v2",s:"We need to _____ a survey among our customers to understand their needs.",o:["make","do","conduct","perform"],c:2,x:"'Conduct a survey' = standard business collocation.",mod:"csess"},
      {id:"bs_v3",s:"The _____ drive attracted over 500 applicants.",o:["application","recruitment","employment","staffing"],c:1,x:"'Recruitment drive' = organized effort to hire new people.",mod:"csess"},
      {id:"bs_v4",s:"All _____ over $10,000 must be reported to compliance.",o:["interactions","transactions","operations","procedures"],c:1,x:"'Transactions' = instances of buying/selling.",mod:"csess"},
      {id:"bs_v5",s:"The manager asked for _____ from the team before making a decision.",o:["response","feedback","answer","reaction"],c:1,x:"'Feedback' = constructive comments/opinions on performance or a plan.",mod:"csess"}
    ]
  },
  // ── SECTION 2 : TACTICAL SIGHT (Reading Comprehension) ──
  {
    id:"reading", name:"Tactical Sight", subtitle:"Reading Comprehension",
    icon:"🔍", color:"#22c55e",
    desc:"A keen eye sees through any deception. Decode written English.",
    moduleMap:["p7","p6"],
    passage:{
      title:"Internal Memo",
      text:"TO: All department managers\nFROM: Sarah Chen, VP of Operations\nDATE: March 15\nRE: Office relocation update\n\nAs previously announced, our headquarters will be moving to the Greenfield Business Park on April 22. The new facility offers 40% more floor space, a modern cafeteria, and improved parking. Each department will receive detailed floor plans by March 25.\n\nPlease note that the IT team will begin transferring equipment on April 18. Employees should back up all files to the cloud drive before April 15. Personal items left in old offices after April 21 will be discarded.\n\nA welcome orientation at the new building is scheduled for April 23 at 9 AM. Attendance is mandatory for all managers.\n\nThank you for your cooperation during this transition."
    },
    questions:[
      {id:"bs_r1",s:"What is the main purpose of this memo?",o:["To announce a hiring freeze","To inform about an office move","To introduce a new VP","To request budget approval"],c:1,x:"The memo details the upcoming office relocation to Greenfield Business Park.",mod:"p7"},
      {id:"bs_r2",s:"By what date should employees back up their files?",o:["March 15","March 25","April 15","April 22"],c:2,x:"'Employees should back up all files to the cloud drive before April 15.'",mod:"p7"},
      {id:"bs_r3",s:"What will happen to items left in the old offices after April 21?",o:["They will be moved automatically","They will be stored","They will be thrown away","They will be returned"],c:2,x:"'Personal items left in old offices after April 21 will be discarded.'",mod:"p7"},
      {id:"bs_r4",s:"The orientation at the new building is _____ for all managers.",o:["optional","voluntary","recommended","mandatory"],c:3,x:"'Attendance is mandatory for all managers.' Part 6 style: vocabulary in context.",mod:"p6"},
      {id:"bs_r5",s:"What benefit of the new facility is NOT mentioned?",o:["More floor space","Better parking","A fitness center","A modern cafeteria"],c:2,x:"The memo mentions floor space, cafeteria, and parking — but not a fitness center.",mod:"p7"}
    ]
  },
  // ── SECTION 3 : BATTLE SENSE (Listening Readiness) ──
  {
    id:"listening", name:"Battle Sense", subtitle:"Listening Readiness",
    icon:"👂", color:"#3b82f6",
    desc:"In battle, you must understand what you hear — instantly. How sharp is your ear?",
    moduleMap:["lisP2","lisP1"],
    note:"These questions test your ability to identify correct spoken responses — a core TOEIC Listening skill.",
    questions:[
      {id:"bs_l1",s:"\"Where is the meeting room?\"",prompt:"Choose the best response:",o:["Yes, I'll attend the meeting.","It's on the third floor.","The meeting starts at two.","I don't like meetings."],c:1,x:"The question asks about location → the answer gives a location.",mod:"lisP2"},
      {id:"bs_l2",s:"\"Would you like me to send the report now or after lunch?\"",prompt:"Choose the best response:",o:["Yes, I would.","The report looks great.","After lunch is fine.","I sent it yesterday."],c:2,x:"A choice question (A or B?) → the answer picks one option.",mod:"lisP2"},
      {id:"bs_l3",s:"\"Who's in charge of the marketing campaign?\"",prompt:"Choose the best response:",o:["It starts next Monday.","Ms. Park is leading it.","Marketing is important.","The campaign went well."],c:1,x:"'Who' question → the answer identifies a person.",mod:"lisP2"},
      {id:"bs_l4",s:"\"Haven't the quarterly results been released yet?\"",prompt:"Choose the best response:",o:["Yes, they have very good results.","No, they'll be out on Friday.","The quarter ends in March.","I don't work in finance."],c:1,x:"Negative question ('Haven't they...?') → answer addresses the timing/status.",mod:"lisP2"},
      {id:"bs_l5",s:"\"How often does the shuttle run to the airport?\"",prompt:"Choose the best response:",o:["It's about 30 minutes away.","Every 45 minutes.","I prefer taking a taxi.","The airport is very busy."],c:1,x:"'How often' → the answer gives a frequency.",mod:"lisP2"}
    ]
  }
];

// ── Section stat names for the radar ──
export var SCAN_STATS = [
  {id:"grammar", label:"Grammar", arena:"Blade Precision", icon:"⚔️", color:"#d4943a", angle:270},
  {id:"vocab",   label:"Vocabulary", arena:"Arcane Lore", icon:"📚", color:"#8b5cf6", angle:0},
  {id:"reading", label:"Reading", arena:"Tactical Sight", icon:"🔍", color:"#22c55e", angle:90},
  {id:"listening",label:"Listening", arena:"Battle Sense", icon:"👂", color:"#3b82f6", angle:180}
];

// ── First mission mapping (weakest axis → recommended module) ──
export var FIRST_MISSIONS = [
  {stat:"grammar",  modules:["drill","connsort"],  label:"Part 5 Drill",       icon:"📝", msg:"Your grammar foundations need sharpening. Start with Part 5 drills to build precision."},
  {stat:"vocab",    modules:["csess"],              label:"Flashcard Review",   icon:"🃏", msg:"Your vocabulary needs reinforcement. Start a flashcard session to expand your word arsenal."},
  {stat:"reading",  modules:["p7","p6"],            label:"Part 7 Reading",     icon:"📖", msg:"Reading comprehension is your weak spot. Tackle a Part 7 passage to sharpen your eye."},
  {stat:"listening",modules:["lisP1","lisP2"],      label:"Listening Part 1–2", icon:"🎧", msg:"Your listening skills need the most work. Dive into Listening exercises to train your ear."}
];

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
  {id:"lisP4",name:"Listening Part 4",icon:"📢",reason:"Monologues"},
  {id:"sbuild",name:"Sentence Builder",icon:"🔀",reason:"Sentence structure"},
  {id:"ablitz",name:"Audio Blitz",icon:"⚡",reason:"Listening speed"},
  {id:"clue",name:"Clue Hunter",icon:"🔍",reason:"Grammar clue detection"},
];
