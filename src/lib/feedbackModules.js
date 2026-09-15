// Extrait de src/App.jsx le 2026-09-15 (refactor split-app, REFACTOR_PLAN.md). Code déplacé tel quel.

// ─── FEEDBACK FORM: catalog of modules grouped by category ───
// Used by the in-app feedback form (Profile → Send feedback) and by the
// TeacherDash Feedback tab. Each entry has a stable `id` (stored in DB,
// matches existing module keys when relevant) and a human-readable `label`.
export var FEEDBACK_MODULES = [
  {group:"Listening",items:[
    {id:"daily",label:"Daily Challenge"},
    {id:"lis_p1",label:"Listening — Part 1 (Photos)"},
    {id:"lis_p2",label:"Listening — Part 2 (Q&A)"},
    {id:"lis_p3",label:"Listening — Part 3 (Conversations)"},
    {id:"lis_p4",label:"Listening — Part 4 (Talks)"},
    {id:"ablitz",label:"Audio Blitz"}
  ]},
  {group:"Reading",items:[
    {id:"drill",label:"Reading Drill (Part 5)"},
    {id:"p6",label:"Part 6 (Text Completion)"},
    {id:"p7",label:"Part 7 (Reading Comprehension)"},
    {id:"clue",label:"Clue Hunter"}
  ]},
  {group:"Grammar",items:[
    {id:"gauntlet_irregular",label:"Grammar Gauntlet — Irregular Crypt"},
    {id:"gauntlet_tense",label:"Grammar Gauntlet — Chronomancer"},
    {id:"gauntlet_passive",label:"Grammar Gauntlet — Passive Forge"},
    {id:"gauntlet_relative",label:"Grammar Gauntlet — Relative Weaver"},
    {id:"modals_match",label:"Modal Council — The Oracle"},
    {id:"modals_sort",label:"Modal Council — The Verdict"},
    {id:"wordfam",label:"Word Families"},
    {id:"connsort",label:"Connectors Sorting"},
    {id:"prepdrill",label:"Preposition Collocations"},
    {id:"gerinf",label:"Gerund vs Infinitive"},
    {id:"pvdojo",label:"Phrasal Verb Dojo"},
    {id:"falsefr",label:"False Friends"},
    {id:"traps",label:"Traps Quiz"}
  ]},
  {group:"Vocabulary",items:[
    {id:"csess",label:"Flashcard Review"},
    {id:"tavern",label:"Word Tavern"},
    {id:"sbuild",label:"Sentence Builder"}
  ]},
  {group:"Games",items:[
    {id:"duel",label:"Vocabulary Arena (Duel)"},
    {id:"wfall",label:"Word Fall"},
    {id:"matchE",label:"Speed Match"}
  ]},
  {group:"Mocks",items:[
    {id:"mock1",label:"Mock Test 1"},
    {id:"mock2",label:"Mock Test 2"},
    {id:"mock3",label:"Mock Test 3"},
    {id:"boss",label:"Boss Test (The Final Arena)"},
    {id:"endless",label:"Endless Arena"}
  ]},
  {group:"Profile / Account",items:[
    {id:"profile",label:"Profile"},
    {id:"onboarding",label:"Onboarding"},
    {id:"push",label:"Push notifications"},
    {id:"auth",label:"Login / Signup / Password"},
    {id:"league",label:"League / Rankings"},
    {id:"chest",label:"Chests / Rewards"}
  ]},
  {group:"Other",items:[
    {id:"general",label:"General app issue (UI / Performance)"},
    {id:"other",label:"Other"}
  ]}
];
export function findModuleLabel(id){for(var i=0;i<FEEDBACK_MODULES.length;i++){var g=FEEDBACK_MODULES[i].items;for(var j=0;j<g.length;j++){if(g[j].id===id)return g[j].label;}}return id;}
