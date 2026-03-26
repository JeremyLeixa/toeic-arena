// ─── CLUE HUNTER DATA — 50 sentences ───
// chips: {w: display text, c: true=real clue / false=decoy}
// opts: 4 answer options, ans: correct index (0-3)
// exp: grammar explanation, clue: clue analysis, ref: gramRef sheet id

export var CLUE_HUNTER = [

  // ═══════════════════════════════
  // PRESENT PERFECT (10)
  // ═══════════════════════════════
  {
    id:"ch01",
    sentence:"She ___ at this company since 2019, and her results have always been strong.",
    chips:[{w:"since",c:true},{w:"2019",c:true},{w:"have been",c:false},{w:"company",c:false}],
    opts:["works","worked","has worked","is working"],ans:2,
    cat:"Present Perfect",
    exp:"'Since 2019' signals an ongoing state from the past to now → present perfect: has worked.",
    clue:"'since' is your key — it always triggers present perfect. '2019' confirms the start point. 'have been' in the second clause is a bonus signal, but 'since' alone is enough.",
    ref:"tenses"
  },
  {
    id:"ch02",
    sentence:"The team ___ on this project for six months without any interruption.",
    chips:[{w:"for six months",c:true},{w:"without",c:false},{w:"project",c:false},{w:"any interruption",c:false}],
    opts:["works","worked","has been working","will work"],ans:2,
    cat:"Present Perfect Continuous",
    exp:"'For six months' = duration still ongoing → present perfect continuous: has been working.",
    clue:"'for' + a duration (no past time marker) = action still in progress = present perfect. No 'ago', no 'last week' — the situation isn't finished.",
    ref:"tenses"
  },
  {
    id:"ch03",
    sentence:"Has the finance team already ___ the quarterly report for submission?",
    chips:[{w:"Has",c:true},{w:"already",c:true},{w:"finance team",c:false},{w:"submission",c:false}],
    opts:["prepare","prepared","preparing","to prepare"],ans:1,
    cat:"Present Perfect",
    exp:"'Has... already' = present perfect question → past participle: prepared.",
    clue:"'Has' at the start = present perfect question. 'already' confirms it. The blank = past participle form.",
    ref:"tenses"
  },
  {
    id:"ch04",
    sentence:"I haven't received the signed contract yet, so I can't proceed with the payment.",
    chips:[{w:"haven't",c:true},{w:"yet",c:true},{w:"signed contract",c:false},{w:"can't",c:false}],
    opts:["receive","received","receiving","to receive"],ans:1,
    cat:"Present Perfect",
    exp:"'haven't... yet' = negative present perfect → past participle: received.",
    clue:"'haven't' + 'yet' = the classic negative present perfect pair. They always travel together. 'can't' refers to the consequence, not the tense.",
    ref:"tenses"
  },
  {
    id:"ch05",
    sentence:"The director has just ___ from Tokyo and will brief the team this afternoon.",
    chips:[{w:"has",c:true},{w:"just",c:true},{w:"will brief",c:false},{w:"Tokyo",c:false}],
    opts:["return","returned","returning","returns"],ans:1,
    cat:"Present Perfect",
    exp:"'Has just' = very recent completed action → present perfect, past participle: returned.",
    clue:"'has' + 'just' = very recent event = present perfect. 'will brief' is a separate future action — don't let it pull you toward a future form.",
    ref:"tenses"
  },
  {
    id:"ch06",
    sentence:"This is the most thorough audit report I have ever ___ in my career.",
    chips:[{w:"have",c:true},{w:"ever",c:true},{w:"most thorough",c:true},{w:"career",c:false}],
    opts:["see","seen","saw","have seen"],ans:1,
    cat:"Present Perfect",
    exp:"'Have ever' + superlative = present perfect → past participle: seen.",
    clue:"Three signals: 'have' (auxiliary), 'ever' (adverb of experience), 'most thorough' (superlative always goes with present perfect). Any one is enough — three is a jackpot.",
    ref:"tenses"
  },
  {
    id:"ch07",
    sentence:"She has never ___ a single deadline in her five years with the group.",
    chips:[{w:"has",c:true},{w:"never",c:true},{w:"five years",c:false},{w:"single",c:false}],
    opts:["miss","missed","missing","been missed"],ans:1,
    cat:"Present Perfect",
    exp:"'Has never' = negative present perfect → past participle: missed.",
    clue:"'has' + 'never' = negative present perfect. Watch out: 'five years' without 'for' is not a time marker here — it's just context. Don't confuse it with 'for five years'.",
    ref:"tenses"
  },
  {
    id:"ch08",
    sentence:"We have recently ___ our pricing strategy to stay competitive in the market.",
    chips:[{w:"have",c:true},{w:"recently",c:true},{w:"pricing strategy",c:false},{w:"competitive",c:false}],
    opts:["revise","revised","revising","been revised"],ans:1,
    cat:"Present Perfect",
    exp:"'Have recently' = present perfect → past participle: revised.",
    clue:"'have' + 'recently' = present perfect. 'Recently' doesn't anchor the action to a specific past moment — it stays vague and close to now, which is why it fits present perfect.",
    ref:"tenses"
  },
  {
    id:"ch09",
    sentence:"Since the new policy ___, several departments have reported improved efficiency.",
    chips:[{w:"Since",c:true},{w:"have reported",c:true},{w:"new policy",c:false},{w:"efficiency",c:false}],
    opts:["implements","implemented","was implemented","has been implemented"],ans:2,
    cat:"Present Perfect / Passive",
    exp:"'Since' clause = specific past start point → past simple passive: was implemented.",
    clue:"Careful! 'have reported' in the main clause is present perfect — but the blank is inside the 'since' clause, which marks when things started → simple past passive: was implemented.",
    ref:"tenses"
  },
  {
    id:"ch10",
    sentence:"How long ___ you been working in the financial sector?",
    chips:[{w:"How long",c:true},{w:"been working",c:true},{w:"financial sector",c:false}],
    opts:["did","do","have","had"],ans:2,
    cat:"Present Perfect Continuous",
    exp:"'How long' + ongoing activity = present perfect continuous question: How long have you been working.",
    clue:"'How long' = present perfect question. 'been working' is already there — it confirms the structure: How long + have/has + subject + been + -ing.",
    ref:"tenses"
  },

  // ═══════════════════════════════
  // SIMPLE PAST (8)
  // ═══════════════════════════════
  {
    id:"ch11",
    sentence:"The CEO ___ the revised strategy to shareholders at yesterday's annual meeting.",
    chips:[{w:"yesterday's",c:true},{w:"annual meeting",c:false},{w:"shareholders",c:false},{w:"revised",c:false}],
    opts:["presents","presented","has presented","was presenting"],ans:1,
    cat:"Simple Past",
    exp:"'Yesterday's meeting' = finished past event → simple past: presented.",
    clue:"'yesterday' (or 'yesterday's') = simple past, no exceptions. It marks a specific, fully finished moment.",
    ref:"tenses"
  },
  {
    id:"ch12",
    sentence:"Our logistics partner ___ the contract last month due to supply chain issues.",
    chips:[{w:"last month",c:true},{w:"logistics partner",c:false},{w:"supply chain",c:false},{w:"due to",c:false}],
    opts:["terminates","terminated","has terminated","is terminating"],ans:1,
    cat:"Simple Past",
    exp:"'Last month' = specific finished time period → simple past: terminated.",
    clue:"'last [month/week/year/Tuesday]' = specific finished past moment = simple past. Always.",
    ref:"tenses"
  },
  {
    id:"ch13",
    sentence:"The IT team ___ the entire infrastructure two weeks ago and found several vulnerabilities.",
    chips:[{w:"two weeks ago",c:true},{w:"found",c:true},{w:"IT team",c:false},{w:"infrastructure",c:false}],
    opts:["audits","audited","has audited","had audited"],ans:1,
    cat:"Simple Past",
    exp:"'Two weeks ago' + 'found' (already simple past) → simple past: audited.",
    clue:"'ago' = simple past, always. Plus 'found' in the same clause confirms the tense. Double signal pointing at the same answer.",
    ref:"tenses"
  },
  {
    id:"ch14",
    sentence:"In 2018, the company ___ its first international office in Singapore.",
    chips:[{w:"In 2018",c:true},{w:"first",c:false},{w:"Singapore",c:false},{w:"international",c:false}],
    opts:["opens","opened","has opened","had opened"],ans:1,
    cat:"Simple Past",
    exp:"'In 2018' = specific completed year in the past → simple past: opened.",
    clue:"A specific past year (2015, 2018, 2001…) = simple past, not present perfect. The year is over — the action is fully done.",
    ref:"tenses"
  },
  {
    id:"ch15",
    sentence:"When the delegation ___, the team had already started the presentation.",
    chips:[{w:"When",c:true},{w:"had already started",c:true},{w:"delegation",c:false},{w:"presentation",c:false}],
    opts:["arrives","arrived","had arrived","has arrived"],ans:1,
    cat:"Simple Past",
    exp:"'When' + past perfect in the main clause → the 'when' clause uses simple past: arrived.",
    clue:"'had already started' = past perfect → the 'when' event is simple past (it happened second, or interrupted). Classic sequence: they had prepared (before) → the delegation arrived (then).",
    ref:"tenses"
  },
  {
    id:"ch16",
    sentence:"The regional manager ___ all branch offices across Asia during her five-year tenure.",
    chips:[{w:"during her tenure",c:true},{w:"five-year",c:false},{w:"regional manager",c:false},{w:"Asia",c:false}],
    opts:["visits","visited","has visited","was visiting"],ans:1,
    cat:"Simple Past",
    exp:"'During her tenure' = a completed past period → simple past: visited.",
    clue:"'during [someone's] tenure' = a finished chapter = simple past. Her tenure is over, so everything within it is firmly in the past.",
    ref:"tenses"
  },
  {
    id:"ch17",
    sentence:"We ___ the acquisition proposal the other day but couldn't reach a final agreement.",
    chips:[{w:"the other day",c:true},{w:"couldn't",c:true},{w:"final agreement",c:false},{w:"acquisition",c:false}],
    opts:["discuss","discussed","have discussed","are discussing"],ans:1,
    cat:"Simple Past",
    exp:"'The other day' + 'couldn't' → simple past: discussed.",
    clue:"'the other day' = informal for 'a few days ago' = specific past moment = simple past. 'couldn't' (past modal) also anchors the whole sentence in the past.",
    ref:"tenses"
  },
  {
    id:"ch18",
    sentence:"She ___ the firm back in 2005, when the industry was still growing rapidly.",
    chips:[{w:"back in 2005",c:true},{w:"was growing",c:true},{w:"still",c:false},{w:"industry",c:false}],
    opts:["joins","joined","has joined","was joining"],ans:1,
    cat:"Simple Past",
    exp:"'Back in 2005' + 'was growing' (past) → simple past: joined.",
    clue:"'back in [year]' = specific finished moment. 'was growing' in the second clause confirms everything sits in simple past.",
    ref:"tenses"
  },

  // ═══════════════════════════════
  // FUTURE PERFECT (4)
  // ═══════════════════════════════
  {
    id:"ch19",
    sentence:"By next Friday, the audit committee ___ all the Q3 financial records.",
    chips:[{w:"By next Friday",c:true},{w:"audit committee",c:false},{w:"Q3",c:false},{w:"financial records",c:false}],
    opts:["reviews","reviewed","will have reviewed","is reviewing"],ans:2,
    cat:"Future Perfect",
    exp:"'By next Friday' = future deadline → future perfect: will have reviewed.",
    clue:"'By [future time]' = THE signal for future perfect. It means the action will be completed before that specific future point.",
    ref:"tenses"
  },
  {
    id:"ch20",
    sentence:"By the time you read this report, the situation ___ considerably.",
    chips:[{w:"By the time",c:true},{w:"read",c:true},{w:"situation",c:false},{w:"considerably",c:false}],
    opts:["changes","changed","will have changed","is changing"],ans:2,
    cat:"Future Perfect",
    exp:"'By the time you [present tense]' → future perfect in the main clause.",
    clue:"'By the time' + present tense clause = future perfect. The present after 'by the time' is a future signal in disguise — it looks like present but means future.",
    ref:"tenses"
  },
  {
    id:"ch21",
    sentence:"She ___ 25 years with the group before she retires next spring.",
    chips:[{w:"before she retires",c:true},{w:"next spring",c:true},{w:"25 years",c:true},{w:"group",c:false}],
    opts:["serves","served","will have served","has served"],ans:2,
    cat:"Future Perfect",
    exp:"'Before she retires next spring' + a specific duration → future perfect: will have served.",
    clue:"Three signals at once: 'before' (action completed prior to a point), 'next spring' (future), '25 years' (duration to be completed). Any one works — three is a gift.",
    ref:"tenses"
  },
  {
    id:"ch22",
    sentence:"The construction firm ___ the new headquarters well before the end of Q4.",
    chips:[{w:"before the end of Q4",c:true},{w:"construction firm",c:false},{w:"new headquarters",c:false},{w:"well",c:false}],
    opts:["completes","completed","will have completed","has completed"],ans:2,
    cat:"Future Perfect",
    exp:"'Before the end of Q4' = future deadline → future perfect: will have completed.",
    clue:"'before [future period]' = action must be finished before that point = future perfect. 'well before' just means comfortably before — doesn't change the tense.",
    ref:"tenses"
  },

  // ═══════════════════════════════
  // GERUND vs INFINITIVE (10)
  // ═══════════════════════════════
  {
    id:"ch23",
    sentence:"The board suggested ___ the product launch until the regulatory approval is confirmed.",
    chips:[{w:"suggested",c:true},{w:"board",c:false},{w:"regulatory approval",c:false},{w:"launch",c:false}],
    opts:["to delay","delay","delayed","delaying"],ans:3,
    cat:"Gerund after 'suggest'",
    exp:"'Suggest' always takes gerund (-ing): suggested delaying.",
    clue:"'suggest' = gerund verb, no exceptions. Family: suggest / recommend / consider / avoid / mind / enjoy / keep → always -ing.",
    ref:"gerunds"
  },
  {
    id:"ch24",
    sentence:"To remain competitive, companies must avoid ___ too heavily on a single supplier.",
    chips:[{w:"avoid",c:true},{w:"must",c:false},{w:"competitive",c:false},{w:"companies",c:false}],
    opts:["to rely","rely","relied","relying"],ans:3,
    cat:"Gerund after 'avoid'",
    exp:"'Avoid' always takes gerund: avoid relying.",
    clue:"'avoid' = always -ing. 'must' is a modal that affects 'avoid', not the pattern after it. Rule stays: avoid + -ing.",
    ref:"gerunds"
  },
  {
    id:"ch25",
    sentence:"After long negotiations, the two parties decided ___ the merger agreement.",
    chips:[{w:"decided",c:true},{w:"long negotiations",c:false},{w:"parties",c:false},{w:"merger",c:false}],
    opts:["signing","sign","signed","to sign"],ans:3,
    cat:"Infinitive after 'decide'",
    exp:"'Decide' takes infinitive: decided to sign.",
    clue:"'decide' = infinitive verb (to + base form). Family: decide / plan / agree / refuse / manage / afford / hope → always to + base form.",
    ref:"gerunds"
  },
  {
    id:"ch26",
    sentence:"The new platform will help the accounting team ___ reports 40% faster.",
    chips:[{w:"help",c:true},{w:"will",c:false},{w:"40% faster",c:false},{w:"accounting team",c:false}],
    opts:["generating","generated","to generate","generate"],ans:3,
    cat:"Bare Infinitive after 'help'",
    exp:"'Help' + object + bare infinitive (no 'to'): help the team generate.",
    clue:"'help + object' = bare infinitive. 'to generate' is also accepted in British English, but 'generate' (bare infinitive) is the TOEIC-safe choice.",
    ref:"gerunds"
  },
  {
    id:"ch27",
    sentence:"We look forward to ___ you at our international trade conference next month.",
    chips:[{w:"look forward to",c:true},{w:"international",c:false},{w:"conference",c:false},{w:"next month",c:false}],
    opts:["see","saw","seen","seeing"],ans:3,
    cat:"Gerund after 'look forward to'",
    exp:"'Look forward to' + gerund: look forward to seeing.",
    clue:"'to' in 'look forward to' is a PREPOSITION, not an infinitive marker. Preposition + verb = -ing form. This is one of the most common TOEIC traps.",
    ref:"gerunds"
  },
  {
    id:"ch28",
    sentence:"The marketing team is considering ___ the campaign to include digital channels.",
    chips:[{w:"considering",c:true},{w:"marketing team",c:false},{w:"campaign",c:false},{w:"digital channels",c:false}],
    opts:["expand","to expand","expanded","expanding"],ans:3,
    cat:"Gerund after 'consider'",
    exp:"'Consider' takes gerund: considering expanding.",
    clue:"'consider' = gerund verb. Same family as suggest / recommend / avoid / mind.",
    ref:"gerunds"
  },
  {
    id:"ch29",
    sentence:"Management refused ___ the workers' request for a four-day work week.",
    chips:[{w:"refused",c:true},{w:"Management",c:false},{w:"workers",c:false},{w:"four-day",c:false}],
    opts:["considering","considered","consider","to consider"],ans:3,
    cat:"Infinitive after 'refuse'",
    exp:"'Refuse' takes infinitive: refused to consider.",
    clue:"'refuse' = infinitive verb (to + base form). Same family as decide / agree / plan / manage / afford.",
    ref:"gerunds"
  },
  {
    id:"ch30",
    sentence:"At that stage, the startup could not afford ___ experienced staff at market rates.",
    chips:[{w:"afford",c:true},{w:"could not",c:false},{w:"experienced staff",c:false},{w:"startup",c:false}],
    opts:["hiring","hired","hire","to hire"],ans:3,
    cat:"Infinitive after 'afford'",
    exp:"'Afford' takes infinitive: afford to hire.",
    clue:"'afford' = infinitive verb. 'could not' modifies the modal chain but doesn't change the 'afford' rule: could not afford to hire.",
    ref:"gerunds"
  },
  {
    id:"ch31",
    sentence:"The board postponed ___ a final decision until more data was available.",
    chips:[{w:"postponed",c:true},{w:"final decision",c:false},{w:"data",c:false},{w:"available",c:false}],
    opts:["make","to make","made","making"],ans:3,
    cat:"Gerund after 'postpone'",
    exp:"'Postpone' takes gerund: postponed making.",
    clue:"'postpone' = gerund. Same family as delay / avoid / consider / suggest. When in doubt: if the verb means 'stopping or putting off an action', it usually takes -ing.",
    ref:"gerunds"
  },
  {
    id:"ch32",
    sentence:"Despite the difficulties, the team managed ___ the project on time and within budget.",
    chips:[{w:"managed",c:true},{w:"Despite",c:false},{w:"on time",c:false},{w:"within budget",c:false}],
    opts:["completing","completed","complete","to complete"],ans:3,
    cat:"Infinitive after 'manage'",
    exp:"'Manage' takes infinitive: managed to complete.",
    clue:"'manage' = infinitive verb. 'Despite' introduces the contrast — don't let it distract you. The blank depends entirely on 'managed'.",
    ref:"gerunds"
  },

  // ═══════════════════════════════
  // CONNECTORS (8)
  // ═══════════════════════════════
  {
    id:"ch33",
    sentence:"___ the significant budget cuts, the project was completed on schedule.",
    chips:[{w:"budget cuts",c:true},{w:"project",c:false},{w:"on schedule",c:false},{w:"completed",c:false}],
    opts:["Although","Despite","Because","Since"],ans:1,
    cat:"Connector: Despite + noun",
    exp:"'Budget cuts' = noun phrase (no verb) → 'Despite', not 'Although'.",
    clue:"What follows the blank? 'the significant budget cuts' = noun phrase with no verb. Rule: Despite/In spite of + NOUN. Although/Even though + CLAUSE (subject + verb).",
    ref:"connectors"
  },
  {
    id:"ch34",
    sentence:"___ the company raised its prices significantly, customers remained loyal.",
    chips:[{w:"raised",c:true},{w:"company",c:false},{w:"customers",c:false},{w:"loyal",c:false}],
    opts:["Despite","Because of","Although","In spite of"],ans:2,
    cat:"Connector: Although + clause",
    exp:"'The company raised its prices' = full clause (subject + verb) → 'Although'.",
    clue:"'the company raised its prices' has a subject ('the company') + verb ('raised') = full clause. Rule: Although + clause. 'Despite/In spite of' would need just a noun.",
    ref:"connectors"
  },
  {
    id:"ch35",
    sentence:"Sales dropped sharply ___ the unexpected rise in raw material costs.",
    chips:[{w:"unexpected rise",c:true},{w:"Sales dropped",c:false},{w:"sharply",c:false},{w:"raw material",c:false}],
    opts:["although","despite","because of","even though"],ans:2,
    cat:"Connector: Because of + noun",
    exp:"'The rise in costs' = noun phrase → 'because of' (cause + noun).",
    clue:"'the unexpected rise in raw material costs' = noun phrase (no verb). 'because of' + noun = cause. 'although/even though' would need a full clause with a verb.",
    ref:"connectors"
  },
  {
    id:"ch36",
    sentence:"The new label regulations require clear product information ___ consumers can make informed choices.",
    chips:[{w:"can make",c:true},{w:"require",c:false},{w:"consumers",c:true},{w:"product information",c:false}],
    opts:["despite","because","so that","although"],ans:2,
    cat:"Connector: So that + purpose",
    exp:"Purpose clause (subject + modal) → 'so that': so that consumers can make.",
    clue:"'consumers can make informed choices' = purpose clause with a modal ('can'). 'so that' expresses purpose. When you see [subject + modal] after the blank, think 'so that'.",
    ref:"connectors"
  },
  {
    id:"ch37",
    sentence:"___ the challenging weather conditions, the outdoor summit proceeded without incident.",
    chips:[{w:"weather conditions",c:true},{w:"outdoor summit",c:false},{w:"proceeded",c:false},{w:"incident",c:false}],
    opts:["Because of","Despite","Although","So that"],ans:1,
    cat:"Connector: Despite + noun",
    exp:"'Weather conditions' = noun phrase + adversative meaning → 'Despite'.",
    clue:"'weather conditions' = noun phrase. The meaning is adversative (conditions were bad, yet the event went ahead) → 'Despite'. 'Because of' would mean the conditions CAUSED the event.",
    ref:"connectors"
  },
  {
    id:"ch38",
    sentence:"The proposal will be rejected ___ it is revised to meet the committee's requirements.",
    chips:[{w:"revised",c:true},{w:"committee's requirements",c:false},{w:"rejected",c:false},{w:"proposal",c:false}],
    opts:["although","provided that","unless","so that"],ans:2,
    cat:"Connector: Unless",
    exp:"'Unless' = 'if not' → the proposal is rejected if it is NOT revised.",
    clue:"'revised to meet requirements' = the condition that would save the proposal. 'unless' = 'if not'. Read it as: 'it will be rejected IF it is not revised'.",
    ref:"connectors"
  },
  {
    id:"ch39",
    sentence:"The expansion plan will proceed ___ all key stakeholders give their formal approval.",
    chips:[{w:"give their formal approval",c:true},{w:"expansion plan",c:false},{w:"proceed",c:false},{w:"key stakeholders",c:false}],
    opts:["unless","although","provided that","despite"],ans:2,
    cat:"Connector: Provided that",
    exp:"'Provided that' = 'on condition that' → a positive required condition.",
    clue:"'all stakeholders give their formal approval' = a required positive condition. 'Provided that' = conditional ('only if'). Different from 'unless' which is a negative condition ('if not').",
    ref:"connectors"
  },
  {
    id:"ch40",
    sentence:"___ she lacks formal qualifications, her ten years of field experience make her an ideal candidate.",
    chips:[{w:"lacks formal qualifications",c:true},{w:"ten years",c:false},{w:"field experience",c:false},{w:"ideal candidate",c:false}],
    opts:["Despite","Because of","Although","In spite of"],ans:2,
    cat:"Connector: Although + clause",
    exp:"'She lacks formal qualifications' = full clause (subject + verb) → 'Although'.",
    clue:"'she lacks formal qualifications' = subject + verb = clause. 'Although' + clause, contrast meaning. 'Despite/In spite of' would need just a noun phrase.",
    ref:"connectors"
  },

  // ═══════════════════════════════
  // ARTICLES (5)
  // ═══════════════════════════════
  {
    id:"ch41",
    sentence:"We are looking for ___ experienced project coordinator to join the operations team.",
    chips:[{w:"experienced",c:true},{w:"project coordinator",c:false},{w:"operations team",c:false},{w:"looking for",c:false}],
    opts:["a","an","the","—"],ans:1,
    cat:"Article: a vs an",
    exp:"'Experienced' starts with a vowel sound /ɪ/ → 'an'.",
    clue:"'experienced' starts with a vowel SOUND (/ɪ/) → 'an', not 'a'. Always check the sound of the first letter, not the spelling.",
    ref:"grammar"
  },
  {
    id:"ch42",
    sentence:"___ information contained in this report must not be shared with external parties.",
    chips:[{w:"information",c:true},{w:"in this report",c:true},{w:"external parties",c:false},{w:"shared",c:false}],
    opts:["A","An","The","Some"],ans:2,
    cat:"Article: The + specific reference",
    exp:"'In this report' makes the information specific → definite article: The.",
    clue:"'in this report' = the information is specific, not information in general. Specificity marker → 'the'. If it said 'information is power', no article. But 'the information IN THIS REPORT' is defined.",
    ref:"grammar"
  },
  {
    id:"ch43",
    sentence:"She was appointed as ___ Chief Operating Officer of the group last quarter.",
    chips:[{w:"as",c:true},{w:"Chief Operating Officer",c:true},{w:"appointed",c:false},{w:"last quarter",c:false}],
    opts:["a","an","the","—"],ans:3,
    cat:"Article: Job title after 'as'",
    exp:"Job title after 'as' (appointed/elected/named) → no article.",
    clue:"'as' + a unique role title = no article. Pattern: 'appointed/elected/named/serves as [job title]' drops the article. Don't confuse with 'She is a manager' (common noun, not a title).",
    ref:"grammar"
  },
  {
    id:"ch44",
    sentence:"___ most effective way to resolve this conflict is direct communication.",
    chips:[{w:"most effective",c:true},{w:"resolve",c:false},{w:"conflict",c:false},{w:"communication",c:false}],
    opts:["A","An","The","—"],ans:2,
    cat:"Article: The + superlative",
    exp:"Superlative 'most effective' always requires 'the': the most effective way.",
    clue:"'most effective' = superlative = 'the' is mandatory. No exceptions. Superlative + no 'the' = wrong in English.",
    ref:"grammar"
  },
  {
    id:"ch45",
    sentence:"The merger was ___ major milestone in the company's international expansion strategy.",
    chips:[{w:"major milestone",c:true},{w:"merger",c:false},{w:"international",c:false},{w:"expansion strategy",c:false}],
    opts:["a","an","the","—"],ans:0,
    cat:"Article: a vs an",
    exp:"'Major' starts with a consonant sound /m/ → 'a'.",
    clue:"'major milestone' — 'major' starts with a consonant sound /m/ → 'a'. Also: first mention of this milestone, so indefinite article ('a') not definite ('the').",
    ref:"grammar"
  },

  // ═══════════════════════════════
  // WORD FAMILIES (5)
  // ═══════════════════════════════
  {
    id:"ch46",
    sentence:"The ___ of the new production line is expected to create over 200 jobs.",
    chips:[{w:"The",c:true},{w:"of the new",c:true},{w:"create",c:false},{w:"jobs",c:false}],
    opts:["install","installation","installed","installing"],ans:1,
    cat:"Word Family: Noun slot",
    exp:"'The ___ of' = noun position → installation.",
    clue:"'The' + blank + 'of' = noun slot. The article 'The' and the preposition 'of' together signal that a noun is needed here: installation (not the verb 'install').",
    ref:"grammar"
  },
  {
    id:"ch47",
    sentence:"The board praised the engineering team for their ___ approach to solving the problem.",
    chips:[{w:"their",c:true},{w:"approach",c:true},{w:"praised",c:false},{w:"board",c:false}],
    opts:["innovate","innovation","innovative","innovatively"],ans:2,
    cat:"Word Family: Adjective slot",
    exp:"'Their ___ approach' = adjective before noun → innovative.",
    clue:"'their' + blank + 'approach' (noun) = adjective position. The blank modifies the noun 'approach' → adjective needed: innovative (not the noun 'innovation', not the adverb 'innovatively').",
    ref:"grammar"
  },
  {
    id:"ch48",
    sentence:"Please handle this confidential matter with the utmost ___.",
    chips:[{w:"utmost",c:true},{w:"with the",c:true},{w:"matter",c:false},{w:"confidential",c:false}],
    opts:["discreet","discretion","discreetly","discrete"],ans:1,
    cat:"Word Family: Noun after 'the'",
    exp:"'With the utmost ___' = noun after 'the' → discretion.",
    clue:"'with the utmost' = 'the' + superlative modifier = expects a noun: discretion. 'discreetly' is an adverb and can't follow 'the'. Note: 'discrete' (separate) is a false friend for 'discreet'.",
    ref:"grammar"
  },
  {
    id:"ch49",
    sentence:"The ___ merger between the two telecom giants was approved by the regulator.",
    chips:[{w:"The",c:true},{w:"merger",c:true},{w:"approved",c:false},{w:"regulator",c:false}],
    opts:["propose","proposed","proposal","proposing"],ans:1,
    cat:"Word Family: Adjective (past participle)",
    exp:"'The ___ merger' = adjective before noun → proposed.",
    clue:"'The' + blank + 'merger' (noun) = adjective position. 'Proposed' works as a past-participle adjective: the proposed merger = the merger that has been proposed.",
    ref:"grammar"
  },
  {
    id:"ch50",
    sentence:"The sharp ___ in productivity was directly linked to the new shift system.",
    chips:[{w:"The sharp",c:true},{w:"was",c:false},{w:"productivity",c:false},{w:"shift system",c:false}],
    opts:["declining","declined","decline","declines"],ans:2,
    cat:"Word Family: Noun slot",
    exp:"'The sharp ___' = noun after article + adjective → decline.",
    clue:"'The sharp' = article + adjective → noun follows. 'declining' is a gerund/adjective but 'the sharp declining' doesn't work. The noun form is: decline.",
    ref:"grammar"
  },
  // ─── CLUE HUNTER — 30 NEW ITEMS (ch51–ch80) ───
// Paste these entries inside the CLUE_HUNTER array, after ch50.

  // ═══════════════════════════════
  // PREPOSITIONS & COLLOCATIONS (8)
  // ═══════════════════════════════
  {
    id:"ch51",
    sentence:"The regional manager is responsible ___ overseeing all distribution centres in the area.",
    chips:[{w:"responsible",c:true},{w:"overseeing",c:false},{w:"distribution centres",c:false},{w:"regional manager",c:false}],
    opts:["of","about","for","with"],ans:2,
    cat:"Preposition: Collocation",
    exp:"'Responsible for' is a fixed collocation — the only correct preposition.",
    clue:"'responsible' always locks onto 'for'. This is a collocation — it doesn't follow logic, it's just fixed. Other common traps: 'responsible of' (French calque), 'responsible about' (sounds natural but is wrong).",
    ref:"grammar"
  },
  {
    id:"ch52",
    sentence:"Our new sales strategy is based ___ detailed market research conducted last quarter.",
    chips:[{w:"based",c:true},{w:"new sales strategy",c:false},{w:"market research",c:false},{w:"conducted",c:false}],
    opts:["in","on","at","from"],ans:1,
    cat:"Preposition: Collocation",
    exp:"'Based on' is a fixed collocation — 'on' is the only correct preposition.",
    clue:"'based on' = fixed pair. Very common in business English. 'Based in' means a location ('based in Paris'). Don't confuse the two — the meaning changes completely.",
    ref:"grammar"
  },
  {
    id:"ch53",
    sentence:"She has been working ___ this account for three years and knows every detail.",
    chips:[{w:"working",c:true},{w:"three years",c:false},{w:"every detail",c:false},{w:"has been",c:false}],
    opts:["with","at","on","about"],ans:2,
    cat:"Preposition: Collocation",
    exp:"'Work on' (a project/account/task) = fixed collocation.",
    clue:"'work on something' = to be responsible for it or developing it. 'work with someone' = collaboration with a person. The object here is 'this account' (a task), not a person → 'on'.",
    ref:"grammar"
  },
  {
    id:"ch54",
    sentence:"The consultant specialises ___ corporate restructuring and post-merger integration.",
    chips:[{w:"specialises",c:true},{w:"corporate restructuring",c:false},{w:"consultant",c:false},{w:"integration",c:false}],
    opts:["at","in","on","about"],ans:1,
    cat:"Preposition: Collocation",
    exp:"'Specialise in' is the fixed collocation in British English (also 'specialize in').",
    clue:"'specialise in' = fixed. Common error: 'specialise on' (doesn't exist). Compare: 'an expert in', 'focus on', 'concentrate on' — each verb has its own locked preposition.",
    ref:"grammar"
  },
  {
    id:"ch55",
    sentence:"The project was completed ___ schedule, which impressed the entire board of directors.",
    chips:[{w:"completed",c:false},{w:"schedule",c:true},{w:"ahead of",c:true},{w:"impressed",c:false}],
    opts:["in","on","ahead of","beyond"],ans:2,
    cat:"Preposition: Schedule expressions",
    exp:"'Ahead of schedule' = finished earlier than planned. 'On schedule' = on time. The context ('impressed the board') implies it was early, not just on time.",
    clue:"Three key schedule expressions: 'on schedule' (on time), 'ahead of schedule' (early — positive), 'behind schedule' (late — problem). Context here is positive surprise → 'ahead of'.",
    ref:"grammar"
  },
  {
    id:"ch56",
    sentence:"Please ensure that all invoices are submitted ___ compliance with our new billing policy.",
    chips:[{w:"compliance",c:true},{w:"invoices",c:false},{w:"submitted",c:false},{w:"billing policy",c:false}],
    opts:["in","on","by","for"],ans:0,
    cat:"Preposition: Fixed phrase",
    exp:"'In compliance with' = in conformity with (a rule/policy). Fixed three-word phrase.",
    clue:"'in compliance with' = fixed phrase meaning 'following the rules of'. Other similar phrases: 'in accordance with', 'in line with'. They all use 'in' — memorise the trio.",
    ref:"grammar"
  },
  {
    id:"ch57",
    sentence:"The training programme aims to provide employees ___ the skills needed for digital transformation.",
    chips:[{w:"provide",c:true},{w:"employees",c:false},{w:"training programme",c:false},{w:"skills",c:false}],
    opts:["for","to","with","about"],ans:2,
    cat:"Preposition: Collocation",
    exp:"'Provide someone with something' = the correct structure.",
    clue:"'provide' has two patterns: 'provide something for someone' OR 'provide someone with something'. Here 'employees' follows directly → we're in the 'provide [person] with' pattern → 'with'.",
    ref:"grammar"
  },
  {
    id:"ch58",
    sentence:"The board's decision was met ___ strong opposition from the shareholders' association.",
    chips:[{w:"met",c:true},{w:"strong opposition",c:false},{w:"board's decision",c:false},{w:"shareholders",c:false}],
    opts:["by","with","from","against"],ans:1,
    cat:"Preposition: Fixed phrase",
    exp:"'Met with [reaction]' = to receive a certain response. Fixed collocation.",
    clue:"'met with' = received (a reaction). 'The proposal was met with applause / resistance / scepticism.' Don't confuse with 'met by someone' (a person greeting you) or 'met from' (doesn't exist).",
    ref:"grammar"
  },

  // ═══════════════════════════════
  // RELATIVE PRONOUNS (6)
  // ═══════════════════════════════
  {
    id:"ch59",
    sentence:"The candidate ___ application impressed the panel was offered the position immediately.",
    chips:[{w:"candidate",c:true},{w:"application",c:true},{w:"impressed the panel",c:false},{w:"offered the position",c:false}],
    opts:["who","which","whose","whom"],ans:2,
    cat:"Relative Pronoun: Whose",
    exp:"'Candidate' is a person, and the blank introduces a possessive relative clause (application = belonging to the candidate) → 'whose'.",
    clue:"'candidate' = person + 'application' comes right after the blank = possession. 'whose' = the possessive relative pronoun. Quick test: replace with 'his/her application' — if it works, you need 'whose'.",
    ref:"grammar"
  },
  {
    id:"ch60",
    sentence:"The software ___ was installed last week has already reduced processing time by 40%.",
    chips:[{w:"software",c:true},{w:"installed last week",c:true},{w:"reduced",c:false},{w:"processing time",c:false}],
    opts:["who","which","whose","whom"],ans:1,
    cat:"Relative Pronoun: Which",
    exp:"'Software' is a thing, not a person → 'which' (or 'that').",
    clue:"Person → 'who/whom/whose'. Thing → 'which/that'. 'Software' = a thing → 'which'. Also: 'that' would work here too, but 'which' is preferred in formal written English (TOEIC context).",
    ref:"grammar"
  },
  {
    id:"ch61",
    sentence:"The manager to ___ I reported for five years has just been promoted to VP.",
    chips:[{w:"to",c:true},{w:"reported",c:true},{w:"manager",c:false},{w:"promoted",c:false}],
    opts:["who","which","whose","whom"],ans:3,
    cat:"Relative Pronoun: Whom (after preposition)",
    exp:"After a preposition ('to'), use 'whom' — not 'who'. 'Manager' is a person.",
    clue:"Preposition + relative pronoun referring to a person = 'whom', always. 'to who' is wrong in formal English. Pattern: 'the person to whom I spoke', 'the director with whom we met'. The preposition pulls 'whom' out.",
    ref:"grammar"
  },
  {
    id:"ch62",
    sentence:"The conference, ___ was held in Singapore, attracted over 3,000 industry professionals.",
    chips:[{w:"conference",c:true},{w:"was held",c:false},{w:"Singapore",c:false},{w:"attracted",c:false}],
    opts:["that","which","who","where"],ans:1,
    cat:"Relative Pronoun: Which (non-restrictive)",
    exp:"Non-restrictive clause (between commas) = 'which', never 'that'.",
    clue:"The commas are the key signal. A clause between commas = non-restrictive = extra info, not identification. Non-restrictive clauses NEVER use 'that' — only 'which' for things. This is a rule, not a style preference.",
    ref:"grammar"
  },
  {
    id:"ch63",
    sentence:"The office ___ the finance team works is being renovated starting next month.",
    chips:[{w:"office",c:true},{w:"finance team works",c:true},{w:"renovated",c:false},{w:"starting next month",c:false}],
    opts:["which","that","where","whose"],ans:2,
    cat:"Relative Pronoun: Where",
    exp:"'Office' is a place and the clause describes what happens there → 'where'.",
    clue:"'office' = a place. The clause describes an activity happening in that place → 'where'. You could also say 'the office in which the team works' — 'where' is the elegant shortcut for 'in which' with places.",
    ref:"grammar"
  },
  {
    id:"ch64",
    sentence:"The employee ___ received the highest performance rating will be promoted next quarter.",
    chips:[{w:"employee",c:true},{w:"highest performance rating",c:false},{w:"received",c:true},{w:"promoted",c:false}],
    opts:["whom","whose","which","who"],ans:3,
    cat:"Relative Pronoun: Who (subject)",
    exp:"'Employee' is a person and the blank is the subject of 'received' → 'who'.",
    clue:"'who' vs 'whom': if the relative pronoun IS the subject of the clause (it does the action), use 'who'. If it's the object (something happens TO it), use 'whom'. Here: '___received' = subject position → 'who'.",
    ref:"grammar"
  },

  // ═══════════════════════════════
  // PASSIVE VOICE (6)
  // ═══════════════════════════════
  {
    id:"ch65",
    sentence:"All shipments ___ carefully before they leave the warehouse to ensure quality standards.",
    chips:[{w:"All shipments",c:true},{w:"before they leave",c:false},{w:"quality standards",c:false},{w:"carefully",c:false}],
    opts:["inspect","are inspected","inspected","have inspected"],ans:1,
    cat:"Passive Voice: Present simple",
    exp:"'All shipments' is the subject receiving the action (they are inspected, not doing the inspecting) → present simple passive: are inspected.",
    clue:"'All shipments' can't inspect anything — they ARE inspected. Subject receives action = passive. Present simple passive = am/is/are + past participle. 'Carefully' is just an adverb, not a tense signal.",
    ref:"grammar"
  },
  {
    id:"ch66",
    sentence:"The new product line ___ at the annual trade fair next spring.",
    chips:[{w:"new product line",c:true},{w:"annual trade fair",c:false},{w:"next spring",c:true},{w:"launched",c:false}],
    opts:["will launch","is launching","will be launched","has been launched"],ans:2,
    cat:"Passive Voice: Future",
    exp:"'Next spring' = future. 'Product line' receives the action (it gets launched by someone) → future passive: will be launched.",
    clue:"'next spring' = future → eliminate present forms. 'Product line' doesn't launch itself → passive. Future passive = will + be + past participle. 'will launch' is active — it means the product line launches something else.",
    ref:"grammar"
  },
  {
    id:"ch67",
    sentence:"The annual report ___ by the external auditors before the board meeting yesterday.",
    chips:[{w:"annual report",c:true},{w:"before the board meeting",c:false},{w:"yesterday",c:true},{w:"external auditors",c:true}],
    opts:["reviewed","was reviewed","has been reviewed","is reviewed"],ans:1,
    cat:"Passive Voice: Past simple",
    exp:"'Yesterday' = specific past moment → past simple. 'Annual report' receives the action → passive: was reviewed.",
    clue:"Three signals: 'annual report' (receives action), 'by the external auditors' ('by' phrase = almost always passive), 'yesterday' (past simple, not present perfect). Past simple passive = was/were + past participle.",
    ref:"grammar"
  },
  {
    id:"ch68",
    sentence:"Employees ___ to submit their expense reports within 30 days of the trip.",
    chips:[{w:"Employees",c:true},{w:"submit",c:false},{w:"within 30 days",c:false},{w:"required",c:true}],
    opts:["require","are required","have required","requiring"],ans:1,
    cat:"Passive Voice: Modal-like passive",
    exp:"'Employees' don't require themselves — the company requires them → passive: are required.",
    clue:"'Employees' = the ones being required, not the ones requiring. This is a very common TOEIC pattern: 'be required to', 'be expected to', 'be encouraged to', 'be asked to' — all passive + infinitive structures.",
    ref:"grammar"
  },
  {
    id:"ch69",
    sentence:"By the time the client arrived, the presentation ___ entirely by the junior team.",
    chips:[{w:"By the time",c:true},{w:"client arrived",c:true},{w:"entirely",c:false},{w:"junior team",c:false}],
    opts:["prepared","was prepared","had been prepared","has been prepared"],ans:2,
    cat:"Passive Voice: Past perfect",
    exp:"'By the time... arrived' = action completed before another past action → past perfect. 'Presentation' receives the action → past perfect passive: had been prepared.",
    clue:"'By the time' + past action = past perfect for the earlier event. Add passive because the presentation was prepared BY someone → past perfect passive = had been + past participle. Don't confuse with 'was prepared' (past simple passive — also possible but changes meaning slightly here).",
    ref:"grammar"
  },
  {
    id:"ch70",
    sentence:"The merger ___ subject to regulatory approval before it can be finalised.",
    chips:[{w:"merger",c:true},{w:"subject to",c:true},{w:"regulatory approval",c:false},{w:"finalised",c:false}],
    opts:["is","is being","was","will be"],ans:0,
    cat:"Passive Voice: State passive",
    exp:"'Is subject to' = a current state, not an action in progress → present simple: is.",
    clue:"'subject to' here is not an action — it's a condition or state. 'Is subject to' = it currently depends on. State passives (be subject to, be known for, be located in) use simple forms, not progressive. 'Is being subject to' = wrong.",
    ref:"grammar"
  },

  // ═══════════════════════════════
  // INFINITIVE vs GERUND (5)
  // ═══════════════════════════════
  {
    id:"ch71",
    sentence:"The HR director suggested ___ a flexible working policy to improve staff retention.",
    chips:[{w:"suggested",c:true},{w:"flexible working",c:false},{w:"improve",c:false},{w:"staff retention",c:false}],
    opts:["to introduce","introduce","introducing","to introducing"],ans:2,
    cat:"Infinitive vs Gerund: suggest",
    exp:"'Suggest' is always followed by a gerund (-ing) or a 'that' clause — never a bare infinitive or 'to + verb'.",
    clue:"'suggest' = gerund-only verb. Pattern: 'suggest doing', never 'suggest to do'. Same family: 'recommend doing', 'avoid doing', 'consider doing', 'mind doing'. These verbs hate infinitives.",
    ref:"grammar"
  },
  {
    id:"ch72",
    sentence:"We have decided ___ our product range in response to customer feedback.",
    chips:[{w:"decided",c:true},{w:"product range",c:false},{w:"customer feedback",c:false},{w:"response",c:false}],
    opts:["expanding","expand","to expand","to expanding"],ans:2,
    cat:"Infinitive vs Gerund: decide",
    exp:"'Decide' is always followed by an infinitive: decide to do.",
    clue:"'decide' = infinitive-only verb. Pattern: 'decide to do'. Same family: 'agree to', 'refuse to', 'manage to', 'plan to', 'hope to', 'expect to'. These verbs love infinitives. Don't mix up 'decide to expand' with 'consider expanding'.",
    ref:"grammar"
  },
  {
    id:"ch73",
    sentence:"The technician stopped ___ the manual before attempting to repair the machine.",
    chips:[{w:"stopped",c:true},{w:"before",c:true},{w:"attempting",c:false},{w:"repair",c:false}],
    opts:["reading","to read","read","to reading"],ans:1,
    cat:"Infinitive vs Gerund: stop + meaning",
    exp:"'Stop to do' = stopped in order to do something (purpose). 'Stop doing' = ceased the action. Context: the technician paused what they were doing in order to read → 'stop to read'.",
    clue:"'stop' changes meaning entirely: 'stopped reading' = was reading, then quit. 'stopped to read' = paused (something else) in order to read. The 'before attempting to repair' confirms they stopped mid-task to consult the manual first → purpose → infinitive.",
    ref:"grammar"
  },
  {
    id:"ch74",
    sentence:"I remember ___ this supplier at the trade fair three years ago — they had an impressive stand.",
    chips:[{w:"remember",c:true},{w:"three years ago",c:true},{w:"trade fair",c:false},{w:"impressive stand",c:false}],
    opts:["to meet","meeting","meet","to meeting"],ans:1,
    cat:"Infinitive vs Gerund: remember + meaning",
    exp:"'Remember doing' = recall a past event. 'Remember to do' = don't forget a future task. 'Three years ago' signals a past memory → gerund: meeting.",
    clue:"'remember' has two meanings: 'remember doing' = looking back at a past event (I recall meeting them). 'remember to do' = a reminder for a future task (remember to send the report). 'three years ago' = clearly a past memory → gerund.",
    ref:"grammar"
  },
  {
    id:"ch75",
    sentence:"The finance team needs ___ the quarterly projections before the investor call on Friday.",
    chips:[{w:"needs",c:true},{w:"quarterly projections",c:false},{w:"investor call",c:false},{w:"Friday",c:true}],
    opts:["updating","to update","update","being updated"],ans:1,
    cat:"Infinitive vs Gerund: need",
    exp:"'Need' with a person subject = infinitive: need to do. ('Need' + gerund = passive meaning: 'the report needs updating' = needs to be updated.)",
    clue:"'The finance team needs to update' = active, the team does it. Compare: 'the projections need updating' = passive meaning (they need to be updated by someone). Subject here is a person/team → active meaning → infinitive. Friday is just context, not a tense trigger.",
    ref:"grammar"
  },

  // ═══════════════════════════════
  // CONDITIONALS (5)
  // ═══════════════════════════════
  {
    id:"ch76",
    sentence:"If the delivery ___ by Friday, we will have to source the components from a different supplier.",
    chips:[{w:"If",c:true},{w:"will have to",c:true},{w:"delivery",c:false},{w:"different supplier",c:false}],
    opts:["doesn't arrive","won't arrive","didn't arrive","hadn't arrived"],ans:0,
    cat:"Conditional: Type 1",
    exp:"Type 1 conditional: if + present simple → future. 'Will have to' in the main clause confirms it's Type 1 → 'doesn't arrive'.",
    clue:"Golden rule: in a Type 1 conditional, the 'if' clause NEVER uses 'will'. 'If it will arrive' = wrong. 'Will have to' in the main clause = Type 1 = if + present simple in the condition. Eliminate 'won't arrive' — no future in the if-clause.",
    ref:"grammar"
  },
  {
    id:"ch77",
    sentence:"If the company ___ more in R&D, it would be in a stronger competitive position today.",
    chips:[{w:"If",c:true},{w:"would be",c:true},{w:"competitive position",c:false},{w:"today",c:true}],
    opts:["invests","invested","had invested","would invest"],ans:1,
    cat:"Conditional: Type 2",
    exp:"Type 2 conditional: if + past simple → would + infinitive. 'Today' + 'would be' confirms it's an unreal present situation → 'invested'.",
    clue:"'Would be... today' = Type 2 = hypothetical present. If + past simple (not past perfect) → would + base verb. 'today' is the key — it's about now, not the past. Type 3 would need 'had invested' + 'would have been'. The tense mismatch is a classic TOEIC trap.",
    ref:"grammar"
  },
  {
    id:"ch78",
    sentence:"If the board ___ the proposal last spring, the project would have launched on schedule.",
    chips:[{w:"If",c:true},{w:"last spring",c:true},{w:"would have launched",c:true},{w:"board",c:false}],
    opts:["approves","approved","had approved","would approve"],ans:2,
    cat:"Conditional: Type 3",
    exp:"Type 3 conditional: if + past perfect → would have + past participle. 'Last spring' + 'would have launched' confirm it's a past unreal situation → 'had approved'.",
    clue:"Three signals: 'last spring' (past), 'would have launched' (Type 3 result), and the sense of regret (it didn't happen). Type 3 = if + had + past participle. 'Approved' alone (Type 2) contradicts the past time marker 'last spring'.",
    ref:"grammar"
  },
  {
    id:"ch79",
    sentence:"Should you ___ any issues with the installation, please contact our technical support team.",
    chips:[{w:"Should",c:true},{w:"any issues",c:false},{w:"installation",c:false},{w:"contact",c:true}],
    opts:["encounter","encountered","have encountered","encountering"],ans:0,
    cat:"Conditional: Inverted (formal)",
    exp:"'Should + subject + base verb' = formal inversion of 'If you encounter...'. Inverted conditionals always use the base form.",
    clue:"'Should you...' = inverted conditional = formal version of 'If you should encounter'. The structure is: Should + subject + BASE VERB (no 'to', no -ing, no past form). Very common in formal business writing and TOEIC texts.",
    ref:"grammar"
  },
  {
    id:"ch80",
    sentence:"___ the talks fail, both parties have agreed to submit the dispute to international arbitration.",
    chips:[{w:"the talks fail",c:true},{w:"both parties",c:false},{w:"agreed",c:true},{w:"international arbitration",c:false}],
    opts:["If","Should","Unless","Provided that"],ans:1,
    cat:"Conditional: Should (formal inversion)",
    exp:"'Should the talks fail' = formal inverted conditional for a possible but uncertain future scenario. 'Should' at the start + subject + base verb = the structure.",
    clue:"'Should' at the start of a sentence (before the subject) = inverted conditional. Same meaning as 'If the talks should fail' but more formal. This structure is very common in legal and business texts — exactly what appears in TOEIC Part 7. 'Unless' would mean 'if they don't fail', which reverses the meaning.",
    ref:"grammar"
  },
];
