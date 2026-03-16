import { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════
   TOEIC ARENA — MVP v2.0
   Mobile-first TOEIC training platform
   ═══════════════════════════════════════════ */

var LEAGUES = [
  { id: "bronze", name: "Bronze", icon: "🥉", color: "#cd7f32", min: 0 },
  { id: "silver", name: "Silver", icon: "🥈", color: "#c0c0c0", min: 200 },
  { id: "gold", name: "Gold", icon: "🥇", color: "#ffd700", min: 500 },
  { id: "platinum", name: "Platinum", icon: "💎", color: "#00d4ff", min: 1000 },
  { id: "diamond", name: "Diamond", icon: "👑", color: "#ff6bff", min: 2000 },
];
var COMPETITORS = [
  {n:"Léa M.",a:"🦊"},{n:"Hugo D.",a:"🐺"},{n:"Chloé R.",a:"🦁"},{n:"Théo B.",a:"🐯"},
  {n:"Emma L.",a:"🦅"},{n:"Lucas P.",a:"🐻"},{n:"Manon F.",a:"🦋"},{n:"Nathan V.",a:"🐲"},
  {n:"Jade K.",a:"🦄"},{n:"Enzo S.",a:"🐬"},{n:"Camille T.",a:"🌸"},{n:"Raphaël G.",a:"⚡"},
];
var ACHIEVEMENTS = [
  {id:"first_blood",name:"First Blood",desc:"Complete your first exercise",icon:"⚔️",check:function(s){return s.stats.totalSessions>=1;}},
  {id:"streak_3",name:"On Fire",desc:"3-day streak",icon:"🔥",check:function(s){return s.streak>=3;}},
  {id:"streak_7",name:"Unstoppable",desc:"7-day streak",icon:"💥",check:function(s){return s.streak>=7;}},
  {id:"streak_30",name:"Legendary",desc:"30-day streak",icon:"🏆",check:function(s){return s.streak>=30;}},
  {id:"vocab_50",name:"Word Collector",desc:"Review 50 flashcards",icon:"📚",check:function(s){return (s.stats.flashcardsReviewed||0)>=50;}},
  {id:"perfect_daily",name:"Flawless Victory",desc:"Perfect daily challenge",icon:"✨",check:function(s){return (s.stats.perfectDailies||0)>=1;}},
  {id:"level_5",name:"Rising Star",desc:"Reach level 5",icon:"⭐",check:function(s){return getLevel(s.xp).level>=5;}},
  {id:"level_10",name:"Arena Champion",desc:"Reach level 10",icon:"👑",check:function(s){return getLevel(s.xp).level>=10;}},
];

var VOCAB = [
  { id:"finance",name:"Finance & Banking",icon:"💰",col:"#22c55e",cards:[
    {id:"f1",w:"revenue",d:"Income generated from business operations",e:"The company's annual revenue exceeded $2 million."},
    {id:"f2",w:"expenditure",d:"Money spent on something; an expense",e:"Capital expenditures were higher than expected."},
    {id:"f3",w:"quarterly",d:"Happening every three months",e:"The quarterly report shows a 15% increase in profits."},
    {id:"f4",w:"dividend",d:"A payment made to shareholders from profits",e:"Shareholders will receive a dividend of $0.50 per share."},
    {id:"f5",w:"invoice",d:"A document requesting payment for goods/services",e:"Please send the invoice to our accounting department."},
    {id:"f6",w:"audit",d:"An official examination of financial records",e:"The annual audit revealed no irregularities."},
    {id:"f7",w:"liability",d:"A financial obligation or debt",e:"The company reduced its liabilities by 20% this year."},
    {id:"f8",w:"asset",d:"Something of value owned by a company",e:"Real estate is the firm's most valuable asset."},
  ]},
  { id:"marketing",name:"Marketing & Sales",icon:"📢",col:"#f59e0b",cards:[
    {id:"m1",w:"campaign",d:"A planned series of marketing activities",e:"The advertising campaign boosted sales by 30%."},
    {id:"m2",w:"target audience",d:"The intended group of consumers",e:"Our target audience is millennials aged 25-35."},
    {id:"m3",w:"brand awareness",d:"How well consumers recognize a brand",e:"Social media increased our brand awareness significantly."},
    {id:"m4",w:"endorsement",d:"Public approval or support, often by a celebrity",e:"The athlete's endorsement helped launch the product."},
    {id:"m5",w:"demographic",d:"A particular sector of the population",e:"We need to analyze the demographics of our customer base."},
    {id:"m6",w:"survey",d:"A study of opinions or experiences of a group",e:"The customer survey revealed areas for improvement."},
    {id:"m7",w:"launch",d:"To introduce a new product or service",e:"We plan to launch the new product line in March."},
    {id:"m8",w:"promotion",d:"Activities to increase awareness or sales",e:"The store is running a special promotion this week."},
  ]},
  { id:"hr",name:"Human Resources",icon:"👥",col:"#8b5cf6",cards:[
    {id:"h1",w:"recruitment",d:"The process of finding and hiring employees",e:"The recruitment drive attracted over 500 applicants."},
    {id:"h2",w:"applicant",d:"A person who applies for a job",e:"Each applicant must submit a cover letter and resume."},
    {id:"h3",w:"benefits",d:"Non-salary compensation (health insurance, etc.)",e:"The company offers excellent health and retirement benefits."},
    {id:"h4",w:"compensation",d:"Total payment and benefits for work",e:"The compensation package includes a competitive salary."},
    {id:"h5",w:"performance review",d:"A formal evaluation of an employee's work",e:"Performance reviews are conducted twice a year."},
    {id:"h6",w:"resignation",d:"The act of voluntarily leaving a job",e:"She submitted her resignation effective next month."},
    {id:"h7",w:"onboarding",d:"The process of integrating a new employee",e:"The onboarding program lasts two weeks."},
    {id:"h8",w:"tenure",d:"The length of time holding a position",e:"During his tenure as CEO, profits tripled."},
  ]},
  { id:"manufacturing",name:"Manufacturing",icon:"🏭",col:"#ef4444",cards:[
    {id:"mf1",w:"assembly line",d:"A series of workstations for building products",e:"The assembly line produces 500 units per day."},
    {id:"mf2",w:"inventory",d:"Stock of goods held by a business",e:"We need to check our inventory before placing a new order."},
    {id:"mf3",w:"quality control",d:"Processes to ensure product standards",e:"Quality control detected a defect in the batch."},
    {id:"mf4",w:"warehouse",d:"A large building for storing goods",e:"The goods are stored in our main warehouse."},
    {id:"mf5",w:"shipment",d:"A quantity of goods sent together",e:"The shipment will arrive by Friday."},
    {id:"mf6",w:"supplier",d:"A company that provides goods to another",e:"We switched to a more reliable supplier."},
    {id:"mf7",w:"output",d:"The amount of goods produced",e:"Factory output increased by 12% this quarter."},
  ]},
  { id:"travel",name:"Travel & Transport",icon:"✈️",col:"#06b6d4",cards:[
    {id:"t1",w:"itinerary",d:"A planned route or schedule for a trip",e:"Please review the travel itinerary before departure."},
    {id:"t2",w:"accommodation",d:"A place to stay (hotel, etc.)",e:"The organizers arranged accommodation for all speakers."},
    {id:"t3",w:"boarding pass",d:"A document allowing entry onto a plane",e:"Please have your boarding pass ready at the gate."},
    {id:"t4",w:"reservation",d:"An arrangement to have something held for you",e:"I'd like to make a reservation for two."},
    {id:"t5",w:"layover",d:"A stop between connecting flights",e:"We have a three-hour layover in Dubai."},
    {id:"t6",w:"customs",d:"The government department controlling imports",e:"You must declare all goods at customs."},
    {id:"t7",w:"terminal",d:"A building at an airport for passengers",e:"International flights depart from Terminal 2."},
  ]},
  { id:"office",name:"Office & Admin",icon:"🏢",col:"#64748b",cards:[
    {id:"o1",w:"memorandum",d:"A written message in business (memo)",e:"The manager sent a memorandum about the policy change."},
    {id:"o2",w:"agenda",d:"A list of items to discuss at a meeting",e:"The first item on the agenda is the budget review."},
    {id:"o3",w:"deadline",d:"The latest time something must be completed",e:"The deadline for submissions is next Friday."},
    {id:"o4",w:"conference",d:"A large meeting or event for discussion",e:"Over 300 people attended the annual conference."},
    {id:"o5",w:"attachment",d:"A file sent with an email",e:"Please find the report as an attachment."},
    {id:"o6",w:"correspondence",d:"Letters or emails exchanged",e:"All correspondence should be directed to the main office."},
    {id:"o7",w:"stationery",d:"Office supplies like paper, pens, envelopes",e:"We need to order more stationery for the department."},
    {id:"o8",w:"minutes",d:"The official record of a meeting",e:"Who is taking the minutes today?"},
  ]},
  { id:"phrasal",name:"Phrasal Verbs",icon:"🔗",col:"#e11d48",cards:[
    {id:"pv1",w:"carry out",d:"To perform or complete a task (exécuter)",e:"We will carry out the inspection next week."},
    {id:"pv2",w:"set up",d:"To establish or create something (mettre en place)",e:"They set up a new branch in Tokyo."},
    {id:"pv3",w:"turn down",d:"To refuse or reject (refuser)",e:"She turned down the job offer."},
    {id:"pv4",w:"take over",d:"To gain control of something (reprendre, racheter)",e:"The firm took over its competitor."},
    {id:"pv5",w:"bring up",d:"To raise a topic in discussion (soulever un sujet)",e:"He brought up the budget issue at the meeting."},
    {id:"pv6",w:"put off",d:"To postpone or delay (reporter)",e:"The launch was put off until March."},
    {id:"pv7",w:"call off",d:"To cancel something (annuler)",e:"They called off the merger."},
    {id:"pv8",w:"come up with",d:"To think of an idea or plan (trouver, inventer)",e:"She came up with a great marketing idea."},
    {id:"pv9",w:"deal with",d:"To handle or manage a situation (gérer)",e:"HR will deal with the complaint."},
    {id:"pv10",w:"look into",d:"To investigate or examine (examiner, enquêter)",e:"We are looking into the issue."},
    {id:"pv11",w:"run out of",d:"To have no more of something (être à court de)",e:"We've run out of printer paper."},
    {id:"pv12",w:"go over",d:"To review or examine (passer en revue)",e:"Let's go over the contract one more time."},
    {id:"pv13",w:"fill in",d:"To complete a form or document (remplir)",e:"Please fill in the application form."},
    {id:"pv14",w:"hand in",d:"To submit something (remettre, soumettre)",e:"All reports must be handed in by Friday."},
    {id:"pv15",w:"point out",d:"To draw attention to something (signaler)",e:"She pointed out a flaw in the proposal."},
    {id:"pv16",w:"figure out",d:"To understand or solve (comprendre, résoudre)",e:"We need to figure out why sales dropped."},
    {id:"pv17",w:"cut back on",d:"To reduce spending or usage (réduire)",e:"The company cut back on travel expenses."},
    {id:"pv18",w:"lay off",d:"To dismiss employees (licencier)",e:"The factory laid off 200 workers."},
    {id:"pv19",w:"take on",d:"To hire or accept responsibility (embaucher)",e:"We're taking on new staff this quarter."},
    {id:"pv20",w:"draw up",d:"To prepare a document (rédiger)",e:"The lawyer drew up the contract."},
    {id:"pv21",w:"follow up on",d:"To take further action about (donner suite à)",e:"I'll follow up on your request tomorrow."},
    {id:"pv22",w:"pick up",d:"To collect or improve (récupérer / reprendre)",e:"Sales picked up in Q4."},
    {id:"pv23",w:"drop off",d:"To deliver or decrease (déposer / diminuer)",e:"Attendance dropped off after lunch."},
    {id:"pv24",w:"sign up for",d:"To register for something (s'inscrire)",e:"Please sign up for the workshop online."},
    {id:"pv25",w:"work out",d:"To solve, calculate or succeed (résoudre / fonctionner)",e:"The deal didn't work out as planned."},
  ]},
  { id:"tech",name:"Technology & IT",icon:"💻",col:"#3b82f6",cards:[
    {id:"te1",w:"software update",d:"A new version of a program that fixes bugs or adds features",e:"Please install the latest software update before Monday."},
    {id:"te2",w:"troubleshoot",d:"To identify and solve problems in a system",e:"The IT team is troubleshooting the network issue."},
    {id:"te3",w:"bandwidth",d:"The capacity of a network to transfer data",e:"Video calls require more bandwidth than emails."},
    {id:"te4",w:"server",d:"A computer that provides data to other computers on a network",e:"The company's server crashed during peak hours."},
    {id:"te5",w:"database",d:"An organized collection of digital information",e:"Customer records are stored in a secure database."},
    {id:"te6",w:"upgrade",d:"To improve to a newer or better version",e:"We plan to upgrade all workstations next quarter."},
    {id:"te7",w:"compatible",d:"Able to work together without conflict",e:"Make sure the software is compatible with your operating system."},
    {id:"te8",w:"malfunction",d:"A failure to work correctly",e:"A malfunction in the system caused the delay."},
  ]},
  { id:"realestate",name:"Real Estate & Facilities",icon:"🏠",col:"#d97706",cards:[
    {id:"re1",w:"lease",d:"A contract to rent property for a period of time",e:"The lease expires at the end of the year."},
    {id:"re2",w:"tenant",d:"A person who rents and occupies property",e:"The tenant reported a problem with the heating."},
    {id:"re3",w:"landlord",d:"The owner of a property that is rented out",e:"The landlord agreed to lower the monthly rent."},
    {id:"re4",w:"renovation",d:"The process of improving or updating a building",e:"The office renovation will take approximately six weeks."},
    {id:"re5",w:"blueprint",d:"A detailed technical drawing or plan",e:"The architect presented the blueprint for the new wing."},
    {id:"re6",w:"utilities",d:"Basic services such as electricity, water, and gas",e:"Utilities are included in the monthly rent."},
    {id:"re7",w:"vacancy",d:"An unoccupied position or space",e:"There is a vacancy on the third floor of the building."},
    {id:"re8",w:"square footage",d:"The area of a space measured in square feet",e:"The new office offers 3,000 square feet of space."},
  ]},
  { id:"dining",name:"Dining & Hospitality",icon:"🍽️",col:"#ec4899",cards:[
    {id:"di1",w:"reservation",d:"An arrangement to have a table or room held for you",e:"I'd like to make a reservation for six at 7 PM."},
    {id:"di2",w:"catering",d:"Providing food and drink for an event",e:"The catering company will handle the corporate lunch."},
    {id:"di3",w:"banquet",d:"A large formal meal for many people",e:"The annual awards banquet is scheduled for December."},
    {id:"di4",w:"appetiser",d:"A small dish served before the main course",e:"The appetisers were served while guests mingled."},
    {id:"di5",w:"complimentary",d:"Given free of charge",e:"The hotel offers complimentary breakfast for all guests."},
    {id:"di6",w:"gratuity",d:"A tip given to service staff",e:"A 15% gratuity is included in the bill."},
    {id:"di7",w:"check out",d:"To leave a hotel and pay the bill",e:"Guests must check out before noon."},
    {id:"di8",w:"venue",d:"The place where an event is held",e:"We are still looking for a suitable venue for the conference."},
  ]},
  { id:"health",name:"Health & Safety",icon:"🏥",col:"#14b8a6",cards:[
    {id:"hl1",w:"prescription",d:"A doctor's written order for medicine",e:"You need a prescription to buy this medication."},
    {id:"hl2",w:"symptoms",d:"Physical signs of an illness",e:"Common symptoms include fever and headache."},
    {id:"hl3",w:"appointment",d:"A scheduled meeting with a professional",e:"She has a doctor's appointment at 3 PM."},
    {id:"hl4",w:"clinic",d:"A place where people receive medical treatment",e:"The company clinic offers free check-ups for employees."},
    {id:"hl5",w:"hazard",d:"A danger or risk to safety",e:"All potential hazards must be clearly marked."},
    {id:"hl6",w:"regulations",d:"Official rules or laws",e:"Safety regulations require all workers to wear helmets."},
    {id:"hl7",w:"protective equipment",d:"Gear worn to prevent injury (PPE)",e:"Employees must wear protective equipment in the factory."},
    {id:"hl8",w:"emergency",d:"A serious and unexpected situation requiring action",e:"In case of emergency, use the nearest exit."},
  ]},
  { id:"preps",name:"Preposition Collocations",icon:"🔑",col:"#0ea5e9",cards:[
    {id:"pp1",w:"responsible FOR",d:"Having the duty to deal with something",e:"She is responsible for the marketing budget."},
    {id:"pp2",w:"eligible FOR",d:"Meeting the requirements to receive something",e:"All full-time employees are eligible for the bonus."},
    {id:"pp3",w:"apply FOR",d:"To formally request a position or opportunity",e:"She applied for the management position."},
    {id:"pp4",w:"account FOR",d:"To represent a proportion of something",e:"Online sales account for 40% of total revenue."},
    {id:"pp5",w:"interested IN",d:"Wanting to know more about something",e:"We are interested in your proposal."},
    {id:"pp6",w:"result IN",d:"To cause a particular outcome",e:"The merger resulted in significant cost savings."},
    {id:"pp7",w:"participate IN",d:"To take part in an activity",e:"Employees are encouraged to participate in the workshop."},
    {id:"pp8",w:"invested IN",d:"Having put money or effort into something",e:"The company invested in new technology."},
    {id:"pp9",w:"comply WITH",d:"To act in accordance with rules or requests",e:"All employees must comply with safety regulations."},
    {id:"pp10",w:"familiar WITH",d:"Having knowledge or experience of something",e:"Are you familiar with this software?"},
    {id:"pp11",w:"associated WITH",d:"Connected or linked to something",e:"The risks associated with the project are minimal."},
    {id:"pp12",w:"depend ON",d:"To be determined or influenced by something",e:"The outcome depends on several factors."},
    {id:"pp13",w:"consist OF",d:"To be made up of particular parts",e:"The team consists of five members."},
    {id:"pp14",w:"in charge OF",d:"Having responsibility or control over",e:"Mr. Park is in charge of the Tokyo office."},
    {id:"pp15",w:"capable OF",d:"Having the ability to do something",e:"The machine is capable of producing 1,000 units per hour."},
    {id:"pp16",w:"due TO",d:"Caused by or because of",e:"The delay was due to bad weather."},
    {id:"pp17",w:"in addition TO",d:"As well as; besides",e:"In addition to English, she speaks French."},
    {id:"pp18",w:"prior TO",d:"Before a particular time or event",e:"Prior to the meeting, please review the agenda."},
    {id:"pp19",w:"subject TO",d:"Dependent on or conditional upon",e:"All orders are subject to availability."},
    {id:"pp20",w:"according TO",d:"As stated or reported by",e:"According to the report, profits increased by 20%."},
  ]},
];

var QUESTIONS = [
  {id:"g1",s:"The company's annual report _____ last week.",o:["published","was published","publishing","has publishing"],c:1,x:"Passive voice: The report was published (by someone).",cat:"Passive Voice"},
  {id:"g2",s:"Ms. Tanaka is _____ for managing the Tokyo office.",o:["responsible","responsibility","responsibly","respond"],c:0,x:"'Responsible' (adj) collocates with 'for'.",cat:"Word Families"},
  {id:"g3",s:"All employees must submit their timesheets _____ Friday.",o:["by","until","since","from"],c:0,x:"'By Friday' = no later than Friday (deadline).",cat:"Prepositions"},
  {id:"g4",s:"The new software is _____ more efficient than the previous version.",o:["considering","considerable","considerably","consideration"],c:2,x:"'Considerably' (adverb) modifies 'more efficient'.",cat:"Word Families"},
  {id:"g5",s:"_____ the heavy rain, the outdoor event proceeded as planned.",o:["Despite","Although","Because","However"],c:0,x:"'Despite' + noun phrase. 'Although' needs a clause.",cat:"Connectors"},
  {id:"g6",s:"The marketing team _____ on a new campaign since January.",o:["works","worked","has been working","is working"],c:2,x:"'Since January' = present perfect continuous.",cat:"Tenses"},
  {id:"g7",s:"Please ensure that all documents are filed _____.",o:["proper","properly","properness","more proper"],c:1,x:"'Properly' (adverb) modifies the verb 'are filed'.",cat:"Word Families"},
  {id:"g8",s:"Mr. Chen will attend the conference _____ he can finalize the partnership.",o:["so that","despite","unless","even though"],c:0,x:"'So that' expresses purpose.",cat:"Connectors"},
  {id:"g9",s:"The warranty _____ if the product is misused.",o:["voids","voided","will be voided","voiding"],c:2,x:"First conditional: will + be + past participle (passive).",cat:"Conditionals"},
  {id:"g10",s:"Each department head must submit a _____ budget proposal.",o:["detail","detailed","detailing","details"],c:1,x:"'Detailed' (adjective) modifies the noun 'budget proposal'.",cat:"Word Families"},
  {id:"g11",s:"The CEO, _____ with the board members, announced the merger.",o:["along","as well","together","both"],c:0,x:"'Along with' is the correct collocation.",cat:"Prepositions"},
  {id:"g12",s:"Applicants _____ meet all requirements will be contacted.",o:["who","which","whose","whom"],c:0,x:"'Who' = relative pronoun for people as subject.",cat:"Relative Pronouns"},
  {id:"g13",s:"The project was completed ahead of _____.",o:["schedule","scheduling","scheduled","schedules"],c:0,x:"'Ahead of schedule' = fixed expression.",cat:"Collocations"},
  {id:"g14",s:"_____ reviewing the contract, the lawyer found errors.",o:["While","During","For","Since"],c:0,x:"'While' + verb-ing for simultaneous actions.",cat:"Connectors"},
  {id:"g15",s:"The sales figures were _____ higher than projected.",o:["significance","significant","significantly","signify"],c:2,x:"'Significantly' (adverb) modifies 'higher'.",cat:"Word Families"},
  {id:"g16",s:"We need to hire someone _____ experience in data analysis.",o:["with","of","for","by"],c:0,x:"'Someone with experience' = possession of a quality.",cat:"Prepositions"},
  {id:"g17",s:"The factory _____ 10,000 units by the end of this month.",o:["produces","will have produced","produced","producing"],c:1,x:"'By the end of...' = future perfect.",cat:"Tenses"},
  {id:"g18",s:"_____ you have any questions, please contact us.",o:["Should","Would","Could","Might"],c:0,x:"'Should you have' = formal inversion of 'If you should have'.",cat:"Conditionals"},
  {id:"g19",s:"The report highlights the _____ of investing in renewable energy.",o:["important","importantly","importance","import"],c:2,x:"'Importance' (noun) follows 'the'.",cat:"Word Families"},
  {id:"g20",s:"Employees are encouraged to participate _____ the program.",o:["in","at","on","to"],c:0,x:"'Participate in' = correct collocation.",cat:"Prepositions"},
  {id:"g21",s:"The merger will _____ result in significant cost savings.",o:["like","likely","likeliness","alike"],c:1,x:"'Likely' (adverb) modifies the verb 'result'.",cat:"Word Families"},
  {id:"g22",s:"_____ the deadline has passed, no applications will be accepted.",o:["Although","Since","Despite","However"],c:1,x:"'Since' = because (causal connector) + clause.",cat:"Connectors"},
  {id:"g23",s:"The training session is _____ for all new employees.",o:["mandate","mandated","mandatory","mandating"],c:2,x:"'Mandatory' (adjective) after 'is'.",cat:"Word Families"},
  {id:"g24",s:"She has worked here _____ she graduated from university.",o:["for","since","during","while"],c:1,x:"'Since' + point in time. 'For' + duration.",cat:"Prepositions"},
  {id:"g25",s:"The list of candidates _____ been updated.",o:["have","has","are","is"],c:1,x:"Subject = 'list' (singular), not 'candidates'. The list HAS been updated.",cat:"Subject-Verb Agreement"},
  {id:"g26",s:"Each of the employees _____ required to attend the training.",o:["are","is","were","have"],c:1,x:"'Each' is always singular. Each of the employees IS required.",cat:"Subject-Verb Agreement"},
  {id:"g27",s:"Neither the manager nor the staff _____ available for comment.",o:["was","is","were","has"],c:2,x:"With 'neither...nor', the verb agrees with the CLOSEST subject ('staff' = plural).",cat:"Subject-Verb Agreement"},
  {id:"g28",s:"The number of complaints _____ decreased significantly.",o:["have","has","are","were"],c:1,x:"'The number of' = singular subject. HAS decreased. (vs 'A number of' = plural.)",cat:"Subject-Verb Agreement"},
  {id:"g29",s:"This model is _____ than the previous one.",o:["more efficient","most efficient","as efficient","efficiently"],c:0,x:"Comparative: more + adjective + THAN. 'Most' = superlative.",cat:"Comparatives"},
  {id:"g30",s:"This is the _____ product in our entire range.",o:["best-selling","better-selling","more selling","good-selling"],c:0,x:"Superlative: 'the' + best (irregular superlative of 'good').",cat:"Comparatives"},
  {id:"g31",s:"The sooner we start, the _____ we will finish.",o:["sooner","soonest","more soon","soon"],c:0,x:"Double comparative: 'The + comparative, the + comparative'. The sooner, the sooner.",cat:"Comparatives"},
  {id:"g32",s:"Our new office is _____ spacious as the old one.",o:["so","as","more","most"],c:1,x:"Equality comparison: as + adjective + AS. 'As spacious as'.",cat:"Comparatives"},
  {id:"g33",s:"The manager suggested _____ the meeting to next week.",o:["to postpone","postponing","postpone","postponed"],c:1,x:"'Suggest' takes a gerund (-ing). Suggest + postponing.",cat:"Gerunds vs Infinitives"},
  {id:"g34",s:"The team agreed _____ the deadline by two days.",o:["extending","to extend","extend","extended"],c:1,x:"'Agree' takes an infinitive (to). Agreed to extend.",cat:"Gerunds vs Infinitives"},
  {id:"g35",s:"We should consider _____ a consultant for this project.",o:["to hire","hiring","hire","hired"],c:1,x:"'Consider' always takes a gerund (-ing). Consider hiring.",cat:"Gerunds vs Infinitives"},
  {id:"g36",s:"He stopped _____ when the meeting began.",o:["to talk","talking","talk","talked"],c:1,x:"'Stop + -ing' = cease the action. He stopped talking (= he was talking, then stopped).",cat:"Gerunds vs Infinitives"},
  // ─── WORD FAMILIES (+10) ───
  {id:"g37",s:"The _____ of the new policy will take effect on January 1st.",o:["implement","implementation","implemented","implementing"],c:1,x:"'The' + _____ + 'of' = noun needed. 'Implementation' is the noun form.",cat:"Word Families"},
  {id:"g38",s:"All staff members are expected to dress _____.",o:["profession","professional","professionally","professionalism"],c:2,x:"Adverb modifies the verb 'dress'. 'Professionally' = how they dress.",cat:"Word Families"},
  {id:"g39",s:"Customer satisfaction has improved _____ since the new policy.",o:["drama","dramatic","dramatically","dramatize"],c:2,x:"Adverb 'dramatically' modifies the verb 'has improved'.",cat:"Word Families"},
  {id:"g40",s:"The board made a _____ to expand into Asian markets.",o:["decide","decision","decisive","decisively"],c:1,x:"'A' + _____ = noun needed. 'A decision'.",cat:"Word Families"},
  {id:"g41",s:"The product was _____ designed to meet safety standards.",o:["specific","specifically","specification","specify"],c:1,x:"Adverb 'specifically' modifies the past participle 'designed'.",cat:"Word Families"},
  {id:"g42",s:"We need a more _____ approach to project management.",o:["effect","effective","effectively","effectiveness"],c:1,x:"'A more _____' + noun = adjective. 'A more effective approach'.",cat:"Word Families"},
  {id:"g43",s:"Her _____ to the team has been outstanding.",o:["contribute","contribution","contributive","contributed"],c:1,x:"'Her' + _____ = possessive + noun. 'Her contribution'.",cat:"Word Families"},
  {id:"g44",s:"The CEO spoke _____ about the company's future plans.",o:["enthusiasm","enthusiastic","enthusiastically","enthuse"],c:2,x:"Adverb modifies the verb 'spoke'. 'Spoke enthusiastically'.",cat:"Word Families"},
  {id:"g45",s:"It is _____ that all employees complete the training by March.",o:["essentials","essential","essentially","essence"],c:1,x:"'It is _____' = adjective after 'is'. 'It is essential'.",cat:"Word Families"},
  {id:"g46",s:"The _____ rate for new hires has decreased this year.",o:["retain","retention","retentive","retaining"],c:1,x:"'The _____ rate' = noun modifying another noun. 'The retention rate'.",cat:"Word Families"},
  // ─── TENSES (+10) ───
  {id:"g47",s:"The company _____ its new headquarters last September.",o:["opens","opened","has opened","is opening"],c:1,x:"'Last September' = specific past time marker = past simple.",cat:"Tenses"},
  {id:"g48",s:"By the time the CEO arrived, the meeting _____.",o:["already started","has already started","had already started","already starts"],c:2,x:"Past perfect for action completed BEFORE another past action.",cat:"Tenses"},
  {id:"g49",s:"The IT department _____ the servers every weekend.",o:["updates","is updating","has updated","updated"],c:0,x:"'Every weekend' = habitual action = present simple.",cat:"Tenses"},
  {id:"g50",s:"We _____ for a new supplier since our current contract expired.",o:["look","looked","have been looking","are looking"],c:2,x:"'Since' = present perfect continuous for ongoing action from past.",cat:"Tenses"},
  {id:"g51",s:"Ms. Rodriguez _____ the Singapore office next Tuesday.",o:["visits","will visit","has visited","visited"],c:1,x:"'Next Tuesday' = future time marker. 'Will visit'.",cat:"Tenses"},
  {id:"g52",s:"The marketing team _____ the campaign materials right now.",o:["prepares","prepared","is preparing","has prepared"],c:2,x:"'Right now' = action in progress = present continuous.",cat:"Tenses"},
  {id:"g53",s:"Sales _____ by 15% compared to last year.",o:["increase","increased","have increased","are increasing"],c:2,x:"'Compared to last year' = result visible now = present perfect.",cat:"Tenses"},
  {id:"g54",s:"Before joining this firm, Mr. Tanaka _____ at Sony for ten years.",o:["works","worked","has worked","had worked"],c:3,x:"Past perfect: action BEFORE another past event (joining this firm).",cat:"Tenses"},
  {id:"g55",s:"The new regulation _____ into effect on April 1st.",o:["goes","went","has gone","is going"],c:0,x:"Scheduled future event = present simple. Timetables use present simple.",cat:"Tenses"},
  {id:"g56",s:"Our research team _____ on this project for over two years now.",o:["works","worked","has been working","had been working"],c:2,x:"'For over two years now' = present perfect continuous (ongoing).",cat:"Tenses"},
  // ─── PREPOSITIONS (+6) ───
  {id:"g57",s:"The conference will be held _____ March 15th.",o:["in","on","at","by"],c:1,x:"'On' + specific date. 'In' + month/year. 'At' + time.",cat:"Prepositions"},
  {id:"g58",s:"The new policy applies _____ all departments without exception.",o:["for","at","to","with"],c:2,x:"'Apply to' = affect or be relevant to.",cat:"Prepositions"},
  {id:"g59",s:"The manager insisted _____ reviewing the contract personally.",o:["in","on","for","to"],c:1,x:"'Insist on' + -ing = correct collocation.",cat:"Prepositions"},
  {id:"g60",s:"The delay was caused _____ a shortage of raw materials.",o:["for","from","by","with"],c:2,x:"'Caused by' = passive construction. Agent introduced by 'by'.",cat:"Prepositions"},
  {id:"g61",s:"The report was submitted well _____ advance of the deadline.",o:["on","at","in","by"],c:2,x:"'In advance of' = before. Fixed expression.",cat:"Prepositions"},
  {id:"g62",s:"Please refrain _____ using mobile phones during the presentation.",o:["of","to","from","for"],c:2,x:"'Refrain from' + -ing = correct collocation.",cat:"Prepositions"},
  // ─── CONNECTORS (+5) ───
  {id:"g63",s:"The product is affordable; _____, it is also eco-friendly.",o:["furthermore","despite","although","because"],c:0,x:"'Furthermore' adds information. Used after semicolon or full stop.",cat:"Connectors"},
  {id:"g64",s:"_____ of the high demand, the company increased production.",o:["Because","Despite","Although","However"],c:0,x:"'Because of' + noun phrase. 'Because' + clause.",cat:"Connectors"},
  {id:"g65",s:"The budget was reduced; _____, the project was completed on time.",o:["therefore","nevertheless","because","although"],c:1,x:"'Nevertheless' = despite that (contrast). The budget was cut BUT they still finished.",cat:"Connectors"},
  {id:"g66",s:"_____ sales in Europe declined, revenue in Asia grew by 20%.",o:["Whereas","Despite","However","Furthermore"],c:0,x:"'Whereas' + clause introduces a contrast between two facts.",cat:"Connectors"},
  {id:"g67",s:"Costs have risen sharply. _____, we need to adjust the budget.",o:["Although","Despite","Consequently","Furthermore"],c:2,x:"'Consequently' = as a result (cause and effect). Used in new sentence.",cat:"Connectors"},
  // ─── PASSIVE VOICE (+7) ───
  {id:"g68",s:"All visitors must _____ at the front desk before entering.",o:["register","be registered","registering","registered"],c:1,x:"'Must be registered' = passive with modal. Visitors are registered BY someone.",cat:"Passive Voice"},
  {id:"g69",s:"The award ceremony _____ at the Grand Hotel last Friday.",o:["held","was held","has held","is holding"],c:1,x:"Passive: 'The ceremony was held' (by organizers). Past time = 'last Friday'.",cat:"Passive Voice"},
  {id:"g70",s:"New employees _____ a company laptop on their first day.",o:["give","are given","giving","gave"],c:1,x:"Passive: employees RECEIVE the laptop. 'Are given' = present passive.",cat:"Passive Voice"},
  {id:"g71",s:"The contract _____ by both parties before the deadline.",o:["signed","was signing","had been signed","has signing"],c:2,x:"Past perfect passive: 'had been signed' = completed before the deadline.",cat:"Passive Voice"},
  {id:"g72",s:"Applications _____ until the position is filled.",o:["accept","are being accepted","accepting","have accepting"],c:1,x:"Present continuous passive: 'are being accepted' = ongoing process.",cat:"Passive Voice"},
  {id:"g73",s:"The damaged goods should _____ to the manufacturer.",o:["return","be returned","returning","returned"],c:1,x:"'Should be returned' = passive with modal 'should'.",cat:"Passive Voice"},
  {id:"g74",s:"It _____ that the merger will be completed by June.",o:["expects","is expected","expecting","has expecting"],c:1,x:"'It is expected that...' = impersonal passive construction.",cat:"Passive Voice"},
  // ─── SUBJECT-VERB AGREEMENT (+4) ───
  {id:"g75",s:"A number of employees _____ requested additional training.",o:["has","have","is","was"],c:1,x:"'A number of' = plural meaning ('many'). HAVE requested. (vs 'The number of' = singular.)",cat:"Subject-Verb Agreement"},
  {id:"g76",s:"Every manager and supervisor _____ expected to attend.",o:["are","is","were","have"],c:1,x:"'Every' + singular = singular verb. 'Every manager IS expected'.",cat:"Subject-Verb Agreement"},
  {id:"g77",s:"The equipment in all three laboratories _____ been upgraded.",o:["have","has","are","were"],c:1,x:"Subject = 'equipment' (singular uncountable). Ignore 'in all three laboratories'.",cat:"Subject-Verb Agreement"},
  {id:"g78",s:"Either the manager or the employees _____ going to lead the project.",o:["is","was","are","has"],c:2,x:"'Either...or' = verb agrees with NEAREST subject. 'Employees' = plural = ARE.",cat:"Subject-Verb Agreement"},
  // ─── COLLOCATIONS (+7) ───
  {id:"g79",s:"The company plans to _____ a survey among its customers.",o:["conduct","make","do","perform"],c:0,x:"'Conduct a survey' = standard business collocation.",cat:"Collocations"},
  {id:"g80",s:"We need to _____ a decision before the end of the week.",o:["do","take","make","give"],c:2,x:"'Make a decision' = fixed collocation. Not 'do' or 'take' a decision.",cat:"Collocations"},
  {id:"g81",s:"The company _____ great importance to customer satisfaction.",o:["places","puts","attaches","All are correct"],c:3,x:"'Attach/place/put importance to' are all valid collocations.",cat:"Collocations"},
  {id:"g82",s:"We look forward to _____ from you soon.",o:["hear","hearing","heard","hears"],c:1,x:"'Look forward to' + -ing. 'To' here is a preposition, not infinitive marker.",cat:"Collocations"},
  {id:"g83",s:"The company has _____ measures to reduce costs.",o:["taken","made","done","given"],c:0,x:"'Take measures' = fixed collocation meaning to act on something.",cat:"Collocations"},
  {id:"g84",s:"Our team will _____ every effort to meet the deadline.",o:["do","make","take","give"],c:1,x:"'Make an effort' / 'make every effort' = fixed collocation.",cat:"Collocations"},
  {id:"g85",s:"The presentation _____ a strong impression on the investors.",o:["did","gave","made","took"],c:2,x:"'Make an impression' = standard collocation.",cat:"Collocations"},
  // ─── RELATIVE PRONOUNS (+5) ───
  {id:"g86",s:"The report, _____ was submitted last week, contains several errors.",o:["that","which","who","whom"],c:1,x:"'Which' for things in non-defining clauses (with commas). NOT 'that'.",cat:"Relative Pronouns"},
  {id:"g87",s:"The candidate _____ resume impressed us most will be interviewed.",o:["who","whose","which","whom"],c:1,x:"'Whose' = possession. The candidate's resume = whose resume.",cat:"Relative Pronouns"},
  {id:"g88",s:"The hotel _____ we stayed was near the conference center.",o:["which","where","that","whose"],c:1,x:"'Where' = relative adverb for places. 'The hotel where we stayed'.",cat:"Relative Pronouns"},
  {id:"g89",s:"The client _____ the proposal was sent has not yet responded.",o:["who","to whom","which","whose"],c:1,x:"'To whom' = formal. The proposal was sent TO the client.",cat:"Relative Pronouns"},
  {id:"g90",s:"That is the reason _____ the meeting was postponed.",o:["which","why","where","when"],c:1,x:"'Why' = relative adverb for reasons. 'The reason why'.",cat:"Relative Pronouns"},
  // ─── CONDITIONALS (+4) ───
  {id:"g91",s:"If the shipment _____ on time, we will meet the deadline.",o:["arrives","arrived","will arrive","would arrive"],c:0,x:"First conditional: If + present simple, will + verb. Real possibility.",cat:"Conditionals"},
  {id:"g92",s:"If we had invested earlier, we _____ higher profits now.",o:["will have","would have","would have had","had had"],c:1,x:"Mixed conditional: past condition + present result. 'Would have' (now).",cat:"Conditionals"},
  {id:"g93",s:"_____ the client cancel, we will need to find a replacement.",o:["Should","Would","Could","Had"],c:0,x:"'Should the client cancel' = formal inversion of 'If the client should cancel'.",cat:"Conditionals"},
  {id:"g94",s:"If the report _____ ready, we could have presented it yesterday.",o:["was","had been","were","has been"],c:1,x:"Third conditional: If + past perfect, would/could + have + past participle.",cat:"Conditionals"},
  // ─── COMPARATIVES (+2) ───
  {id:"g95",s:"The new system is _____ less expensive than the previous one.",o:["consider","considerable","considerably","consideration"],c:2,x:"'Considerably' (adverb) modifies 'less expensive' (comparative).",cat:"Comparatives"},
  {id:"g96",s:"This quarter's results are the _____ in the company's history.",o:["good","better","best","most good"],c:2,x:"Superlative: 'the' + best (irregular: good → better → best).",cat:"Comparatives"},
  // ─── GERUNDS VS INFINITIVES (+2) ───
  {id:"g97",s:"The company cannot afford _____ any more employees.",o:["losing","to lose","lose","lost"],c:1,x:"'Afford' takes infinitive (to). Cannot afford to lose.",cat:"Gerunds vs Infinitives"},
  {id:"g98",s:"Do you mind _____ the door? It's quite noisy outside.",o:["to close","closing","close","closed"],c:1,x:"'Mind' always takes gerund (-ing). Do you mind closing...?",cat:"Gerunds vs Infinitives"},
  // ─── ARTICLES / QUANTIFIERS (+2) ───
  {id:"g99",s:"_____ information in this report is confidential.",o:["A","An","The","Some"],c:2,x:"'The' = specific information (in THIS report). Definite article for specific reference.",cat:"Articles"},
  {id:"g100",s:"_____ employees who wish to participate should register by Friday.",o:["All","Every","Each","The whole"],c:0,x:"'All employees' (plural). 'Every/Each' + singular noun. 'All' fits with plural 'employees'.",cat:"Articles"},
];

// ─── WORD FAMILIES DATA ───
var WORD_FAMILIES = [
  {v:"succeed",n:"success",adj:"successful",adv:"successfully"},
  {v:"employ",n:"employment",adj:"employable",adv:null},
  {v:"decide",n:"decision",adj:"decisive",adv:"decisively"},
  {v:"compete",n:"competition",adj:"competitive",adv:"competitively"},
  {v:"create",n:"creation",adj:"creative",adv:"creatively"},
  {v:"respond",n:"response",adj:"responsible",adv:"responsibly"},
  {v:"produce",n:"production",adj:"productive",adv:"productively"},
  {v:"manage",n:"management",adj:"managerial",adv:null},
  {v:"differ",n:"difference",adj:"different",adv:"differently"},
  {v:"analyse",n:"analysis",adj:"analytical",adv:"analytically"},
  {v:"apply",n:"application",adj:"applicable",adv:null},
  {v:"depend",n:"dependence",adj:"dependent",adv:"dependently"},
  {v:"consider",n:"consideration",adj:"considerable",adv:"considerably"},
  {v:"inform",n:"information",adj:"informative",adv:"informatively"},
  {v:"require",n:"requirement",adj:"required",adv:null},
  {v:"attend",n:"attendance",adj:"attentive",adv:"attentively"},
  {v:"profit",n:"profit",adj:"profitable",adv:"profitably"},
  {v:"develop",n:"development",adj:"developmental",adv:null},
  {v:"distribute",n:"distribution",adj:"distributable",adv:null},
  {v:"finance",n:"finance",adj:"financial",adv:"financially"},
];

// ─── CONNECTORS DATA ───
var CONNECTORS = [
  {word:"Although",rule:"clause",ex:"Although sales dropped, profits increased.",tip:"Although + subject + verb (clause)."},
  {word:"Even though",rule:"clause",ex:"Even though it rained, the event was a success.",tip:"Even though + subject + verb (clause)."},
  {word:"Despite",rule:"noun",ex:"Despite the delay, we met the deadline.",tip:"Despite + noun or -ing (no subject + verb)."},
  {word:"In spite of",rule:"noun",ex:"In spite of the bad weather, they went ahead.",tip:"In spite of + noun or -ing (same as despite)."},
  {word:"However",rule:"sentence",ex:"The budget was tight. However, we managed.",tip:"However = new sentence or after semicolon."},
  {word:"Nevertheless",rule:"sentence",ex:"Results were poor. Nevertheless, the team stayed motivated.",tip:"Nevertheless = new sentence. Formal register."},
  {word:"Therefore",rule:"sentence",ex:"Demand rose; therefore, prices increased.",tip:"Therefore = new sentence or after semicolon (consequence)."},
  {word:"Consequently",rule:"sentence",ex:"The factory closed. Consequently, 200 jobs were lost.",tip:"Consequently = new sentence (result/consequence)."},
  {word:"Because",rule:"clause",ex:"Because the shipment was late, we lost the client.",tip:"Because + subject + verb (clause, gives the reason)."},
  {word:"Since",rule:"clause",ex:"Since costs have risen, we must adjust our budget.",tip:"Since + clause (causal, like 'because')."},
  {word:"Due to",rule:"noun",ex:"Due to heavy traffic, the delivery was delayed.",tip:"Due to + noun phrase (not a full clause)."},
  {word:"In addition to",rule:"noun",ex:"In addition to his salary, he receives a bonus.",tip:"In addition to + noun or -ing."},
  {word:"Furthermore",rule:"sentence",ex:"The product is affordable. Furthermore, it is eco-friendly.",tip:"Furthermore = new sentence (adds information)."},
  {word:"As a result",rule:"sentence",ex:"Sales dropped. As a result, layoffs were announced.",tip:"As a result = new sentence (consequence)."},
  {word:"Whereas",rule:"clause",ex:"Whereas sales rose in Q1, they fell in Q2.",tip:"Whereas + clause (contrast between two facts)."},
  {word:"While",rule:"clause",ex:"While the report is accurate, it lacks detail.",tip:"While + clause (contrast or simultaneous action)."},
];

// ─── PREPOSITION COLLOCATIONS DATA ───
var PREP_COLLOCATIONS = [
  {base:"responsible",prep:"for",type:"adj",ex:"She is responsible for the marketing budget."},
  {base:"interested",prep:"in",type:"adj",ex:"We are interested in your proposal."},
  {base:"comply",prep:"with",type:"verb",ex:"All employees must comply with safety regulations."},
  {base:"depend",prep:"on",type:"verb",ex:"The outcome depends on several factors."},
  {base:"result",prep:"in",type:"verb",ex:"The merger resulted in significant cost savings."},
  {base:"consist",prep:"of",type:"verb",ex:"The team consists of five members."},
  {base:"in charge",prep:"of",type:"expr",ex:"Mr. Park is in charge of the Tokyo office."},
  {base:"in addition",prep:"to",type:"expr",ex:"In addition to English, she speaks French."},
  {base:"due",prep:"to",type:"adj",ex:"The delay was due to bad weather."},
  {base:"eligible",prep:"for",type:"adj",ex:"All full-time employees are eligible for the bonus."},
  {base:"familiar",prep:"with",type:"adj",ex:"Are you familiar with this software?"},
  {base:"capable",prep:"of",type:"adj",ex:"The machine is capable of producing 1,000 units per hour."},
  {base:"participate",prep:"in",type:"verb",ex:"Employees are encouraged to participate in the workshop."},
  {base:"apply",prep:"for",type:"verb",ex:"She applied for the management position."},
  {base:"account",prep:"for",type:"verb",ex:"Online sales account for 40% of total revenue."},
  {base:"invested",prep:"in",type:"adj",ex:"The company invested in new technology."},
  {base:"prior",prep:"to",type:"adj",ex:"Prior to the meeting, please review the agenda."},
  {base:"subject",prep:"to",type:"adj",ex:"All orders are subject to availability."},
  {base:"associated",prep:"with",type:"adj",ex:"The risks associated with the project are minimal."},
  {base:"according",prep:"to",type:"expr",ex:"According to the report, profits increased by 20%."},
];

// ─── GERUND / INFINITIVE DATA ───
var GERUND_INF = [
  {verb:"enjoy",takes:"ing",ex:"I enjoy working with international clients."},
  {verb:"consider",takes:"ing",ex:"We are considering hiring a new consultant."},
  {verb:"avoid",takes:"ing",ex:"You should avoid making assumptions."},
  {verb:"suggest",takes:"ing",ex:"She suggested postponing the meeting."},
  {verb:"recommend",takes:"ing",ex:"The manager recommended reviewing the contract."},
  {verb:"finish",takes:"ing",ex:"Have you finished writing the report?"},
  {verb:"mind",takes:"ing",ex:"Do you mind closing the door?"},
  {verb:"postpone",takes:"ing",ex:"They postponed launching the product."},
  {verb:"risk",takes:"ing",ex:"We risk losing the client if we delay."},
  {verb:"deny",takes:"ing",ex:"He denied receiving the email."},
  {verb:"agree",takes:"to",ex:"The board agreed to increase the budget."},
  {verb:"decide",takes:"to",ex:"She decided to accept the offer."},
  {verb:"plan",takes:"to",ex:"We plan to expand into Asia next year."},
  {verb:"hope",takes:"to",ex:"I hope to hear from you soon."},
  {verb:"expect",takes:"to",ex:"We expect to complete the project by June."},
  {verb:"want",takes:"to",ex:"The client wants to renegotiate the terms."},
  {verb:"need",takes:"to",ex:"You need to submit the form by Friday."},
  {verb:"offer",takes:"to",ex:"He offered to help with the presentation."},
  {verb:"refuse",takes:"to",ex:"The supplier refused to lower the price."},
  {verb:"promise",takes:"to",ex:"They promised to deliver on time."},
];

// ─── TOEIC TRAPS DATA ───
var TOEIC_TRAPS = [
  {id:1,name:"Similar-sounding words",part:"Listening",trap:"The audio says 'copy' but answer B says 'coffee'. Your brain hears what it expects.",
    scenario:"You hear: 'Could you make a copy of this report?'\nWhich did the speaker request?",
    options:["A cup of coffee","A copy of the report","A cover for the report","A receipt for the copy"],correct:1,
    tip:"Focus on the exact sounds. Don't let your brain auto-complete with familiar words."},
  {id:2,name:"Repeated words = wrong answer",part:"Listening",trap:"In Part 2, if a word from the question appears in an answer, it's usually a distractor.",
    scenario:"Question: 'When is the MEETING scheduled?'\nWhich response is the trap?",
    options:["It's at 3 PM tomorrow.","The MEETING room is on floor 2.","I'll check the calendar.","Let me ask Sarah."],correct:1,
    tip:"In Part 2, the answer that repeats a keyword from the question is almost always WRONG."},
  {id:3,name:"Word form confusion",part:"Reading",trap:"The answer choices look alike (employ / employment / employer / employable). You must identify the part of speech needed.",
    scenario:"'The company announced the _____ of 50 new staff members.'\nWhat part of speech is needed?",
    options:["A verb (employ)","A noun (employment)","An adjective (employable)","An adverb (employably)"],correct:1,
    tip:"Look at what comes BEFORE and AFTER the blank. Article + _____ + of = NOUN needed."},
  {id:4,name:"Ignoring time markers",part:"Reading",trap:"Tense questions depend entirely on time words. Missing 'since 2020' or 'yesterday' = wrong tense selected.",
    scenario:"'The company _____ its headquarters since 2018.'\nWhat tense is needed?",
    options:["Past simple (relocated)","Present simple (relocates)","Present perfect (has relocated)","Future (will relocate)"],correct:2,
    tip:"Circle every time marker you see: since, for, ago, last, next, already, yet, by. They determine the tense."},
  {id:5,name:"Reading too much in Part 7",part:"Reading",trap:"You don't need to understand every word. Trying to read everything = running out of time.",
    scenario:"What is the best approach for Part 7?",
    options:["Read the entire text carefully first","Read questions first, then scan for keywords","Translate difficult words in your head","Read the text twice to make sure"],correct:1,
    tip:"Questions FIRST, then scan. You're looking for specific information, not full comprehension."},
  {id:6,name:"Panic on double/triple passages",part:"Reading",trap:"They look intimidating but follow the same logic. Questions are in order — answers are in the text in order too.",
    scenario:"How should you handle a triple-passage question set?",
    options:["Skip it entirely","Read all 3 texts completely first","Skim headers and first sentences, then use questions to guide reading","Only read the longest text"],correct:2,
    tip:"Skim structure first (who wrote what, what type of text). Then let the questions guide where you look."},
  {id:7,name:"Not pre-reading Part 3/4 questions",part:"Listening",trap:"The #1 mistake. You have 8 seconds between audio clips — use them to read the next set of questions.",
    scenario:"The directions for Part 3 are playing. What should you do?",
    options:["Listen carefully to the directions","Start reading Part 3 questions immediately","Review your Part 2 answers","Relax and wait"],correct:1,
    tip:"You already know the directions. Use EVERY second of silence to read upcoming questions."},
  {id:8,name:"Spending too long on one question",part:"Both",trap:"30 sec in Part 5, 1 min in Part 7. If you're stuck, your best guess now beats a perfect answer later.",
    scenario:"You've spent 45 seconds on a Part 5 question and still aren't sure. What do you do?",
    options:["Keep thinking — you'll figure it out","Eliminate what you can, guess, and move on","Skip it entirely and come back later","Ask yourself what sounds right in French"],correct:1,
    tip:"30 seconds MAX per Part 5 question. Eliminate impossible answers, pick your best guess, MOVE ON."},
  {id:9,name:"Leaving blanks empty",part:"Both",trap:"There is NO penalty for guessing on the TOEIC. An empty answer = 0% chance. A random guess = 25% chance.",
    scenario:"You have 2 minutes left and 8 questions unanswered in Part 7. What do you do?",
    options:["Leave them blank — at least your other answers are honest","Fill in B or C for all remaining questions","Quickly try to read and answer each one","Panic"],correct:1,
    tip:"ALWAYS fill in something. With 4 options, random guessing gives you 25%. Blank = 0%."},
  {id:10,name:"Neglecting connector vocabulary",part:"Reading",trap:"However, therefore, despite, although, in addition to... These are the glue of Parts 5 and 6.",
    scenario:"'_____ the project was delayed, the team delivered excellent results.'\nWhich connector fits?",
    options:["Therefore","Although","Furthermore","Because of"],correct:1,
    tip:"Learn the syntax rule for each connector. Although + clause. Despite + noun. However = new sentence."},
];

// ─── STRATEGY CARDS DATA (54 strategies) ───
var STRATEGIES = [
  {part:"Part 1",title:"Photographs",qs:6,icon:"📷",section:"Listening",
    points:"Easy 6 points — don't lose them!",
    tips:[
      {t:"Scan before you listen",d:"During instructions, identify WHO is in the photo, WHERE they are, and WHAT they're doing. Formulate a simple sentence mentally."},
      {t:"Focus on verbs first",d:"The correct answer almost always describes an ACTION or STATE. 'The woman is presenting' beats 'There is a woman'."},
      {t:"Watch prepositions of position",d:"'Next to', 'in front of', 'behind', 'across from' — distractors often use the wrong spatial relationship."},
      {t:"Similar sounds = trap",d:"'Typing' vs 'tying', 'writing' vs 'riding', 'copy' vs 'coffee', 'walking' vs 'working'. If two options sound alike, one is the trap."},
      {t:"Passive voice matters",d:"'The table is being set' (in progress) vs 'The table has been set' (done). Check the photo: is the action ongoing or finished?"},
      {t:"Wrong objects = eliminate",d:"If an answer mentions something NOT visible in the photo, it's wrong. Simple but effective."},
      {t:"Count the people",d:"Photo shows ONE person? Any answer with 'they' or 'people' is automatically wrong."},
  ]},
  {part:"Part 2",title:"Question-Response",qs:25,icon:"💬",section:"Listening",
    points:"High-value: 25 quick points. Train your ear!",
    tips:[
      {t:"First word is everything",d:"WHO → person. WHEN → time. WHERE → place. WHY → reason. HOW → manner/quantity. If the answer doesn't match the question type, eliminate."},
      {t:"Repeated words = TRAP",d:"If the question contains 'meeting' and an answer also has 'meeting', it's almost always a distractor. The TOEIC loves this trick."},
      {t:"Indirect answers win",d:"'Would you like coffee?' → 'I just had some, thanks.' Not Yes/No, but it's correct. Direct Yes/No answers are often traps."},
      {t:"Tag questions: focus on the statement",d:"'The report is ready, isn't it?' → answer is about whether the report is ready or not. Ignore the tag."},
      {t:"Don't overthink negative questions",d:"'Didn't you send the email?' → 'Yes, I sent it yesterday.' Treat it like a normal question."},
      {t:"Suggestions have specific patterns",d:"'Why don't we...' / 'How about...' / 'Shall I...' → answer is acceptance or polite refusal, not a factual response."},
      {t:"'Or' questions: no Yes/No",d:"'Tea or coffee?' → 'Tea, please.' NOT 'Yes.' Choice questions need a choice, not confirmation."},
      {t:"Tense must match",d:"Past question → past answer. Future question → future answer. A tense mismatch = probable trap."},
  ]},
  {part:"Part 3",title:"Conversations",qs:39,icon:"🗣️",section:"Listening",
    points:"39 points — conversations between 2-3 speakers.",
    tips:[
      {t:"PRE-READ questions before audio",d:"The #1 strategy. You have ~8 seconds between sets — read the NEXT 3 questions, don't review previous answers."},
      {t:"Predict the info type",d:"'What does the man suggest?' → listen for a suggestion. 'Where are the speakers?' → listen for location clues."},
      {t:"Answers come in order",d:"Q1 answer = beginning of conversation. Q2 = middle. Q3 = end. Don't search backwards."},
      {t:"Transition words = answer signals",d:"'Actually...', 'However...', 'Unfortunately...', 'By the way...' — these often introduce the answer to a question."},
      {t:"'Imply' = read between the lines",d:"'I'm not sure that's in the budget' = probably no. The answer isn't stated directly."},
      {t:"Graphic questions: scan first",d:"'Look at the graphic' → identify what it shows (schedule, prices, floor plan) BEFORE the audio plays."},
      {t:"'What will X do next?' = last line",d:"Always in the final sentence. 'I'll check with the manager' → He will talk to the manager."},
      {t:"3-speaker convos: track who says what",d:"The TOEIC tests if you can attribute info to the right speaker. Mentally note: Man 1 = ..., Woman = ..., Man 2 = ..."},
  ]},
  {part:"Part 4",title:"Talks",qs:30,icon:"🎙️",section:"Listening",
    points:"30 points — monologues: voicemails, announcements, speeches.",
    tips:[
      {t:"Identify the talk type in 5 seconds",d:"Voicemail? Meeting? Announcement? Advertisement? Tour guide? This frames all your expectations."},
      {t:"Same pre-reading as Part 3",d:"Read all 3 questions BEFORE the audio. Even more critical here — only one voice, info passes fast."},
      {t:"Speaker/Purpose = first 2 sentences",d:"'Hello everyone, welcome to the annual shareholders' meeting' = speaker is executive, purpose is meeting."},
      {t:"'What are listeners asked to do?' = END",d:"Instructions to the audience come last. 'Please submit your forms by Friday.'"},
      {t:"Note numbers, dates, times mentally",d:"'The event starts at 3, not 2 as originally planned.' Correct = 3, trap = 2. The TOEIC loves changed details."},
      {t:"Paraphrases, not exact words",d:"'What is mentioned about...?' The correct answer REPHRASES the info. The exact words from the audio are usually in the wrong answer."},
  ]},
  {part:"Part 5",title:"Incomplete Sentences",qs:30,icon:"📝",section:"Reading",
    points:"30 points — 10 min max. Fast pattern recognition.",
    tips:[
      {t:"Look at OPTIONS first, not the sentence",d:"4 words from same family → Word Form. 4 different words → Vocabulary. 4 grammar words → Grammar. This determines your approach."},
      {t:"Word Form: check before AND after blank",d:"Article + ___ + noun → adjective. Article + ___ + of → noun. Verb + ___ → adverb. ___ + noun → adjective."},
      {t:"30 seconds MAX per question",d:"If you don't know after 30 seconds, eliminate what you can and guess. Time saved here = points earned in Part 7."},
      {t:"'Sounds right' for collocations",d:"'Make a decision' sounds correct, 'do a decision' doesn't. Trust your ear for fixed expressions."},
      {t:"Circle time markers mentally",d:"Since, for, ago, last, next, already, yet, by, every, currently, right now — they dictate the tense."},
      {t:"Connector grammar check",d:"Blank + noun → preposition (despite, due to). Blank + clause → conjunction (although, because). New sentence → adverb (however, therefore)."},
  ]},
  {part:"Part 6",title:"Text Completion",qs:16,icon:"📄",section:"Reading",
    points:"16 points — bridge between grammar and reading.",
    tips:[
      {t:"Read the ENTIRE text first",d:"Unlike Part 5, context is crucial. Spend 60 seconds reading the full text, THEN answer the 4 questions."},
      {t:"Identify text type and tone",d:"Formal email → 'We would like to inform you'. Casual memo → 'Just a heads-up'. Tone eliminates options."},
      {t:"Sentence insertion: read around the blank",d:"One Q per text asks for a full sentence. The inserted sentence must create a natural transition with what's before AND after."},
      {t:"Connectors: same rules as Part 5",d:"However/Therefore/In addition/Meanwhile — but now the full text context helps you choose."},
      {t:"Verb tense: stay consistent",d:"If the text is in past tense (report), blanks will be past. Announcement about future → blanks in future."},
      {t:"Check pronoun referents",d:"For sentence insertion: does 'this' or 'it' in the inserted sentence have a clear antecedent in the previous sentence?"},
  ]},
  {part:"Part 7",title:"Reading Comprehension",qs:54,icon:"📖",section:"Reading",
    points:"54 points — the biggest section. Time > perfect understanding.",
    tips:[
      {t:"Questions FIRST, then scan",d:"Read questions before the text. You're searching for specific info, not reading a novel."},
      {t:"Scan for keywords or synonyms",d:"'When will the event take place?' → scan for a date. The text won't always use the same words as the question."},
      {t:"'Purpose of this message?' = line 1-2",d:"Always answered in the opening sentences. Don't read further for this question type."},
      {t:"Vocab-in-context: substitute each option",d:"'The company saw a dramatic increase' — try each answer choice in place of the word. Pick the one that keeps the same meaning."},
      {t:"NOT/TRUE: eliminate one by one",d:"'Which is NOT mentioned?' → check each option against the text. The last one standing is correct. Slow but reliable."},
      {t:"Double/Triple: cross-reference",d:"'From both documents...' → the answer combines info from text 1 AND text 2. They test your ability to connect."},
      {t:"'Best fit' sentence: test all positions",d:"Read the paragraph with the sentence at each position. Only one creates a logical flow."},
      {t:"Time management is ruthless",d:"Stuck on a hard text? Answer the easy Qs (purpose, detail), guess the inference Qs. 3/5 beats 0/5."},
      {t:"Singles first, triples last",d:"Single passages = fastest points/minute ratio. Triples take longer for the same number of points."},
  ]},
  {part:"General",title:"Cross-Part Tips",qs:0,icon:"⚔️",section:"Both",
    points:"These apply to EVERY section of the TOEIC.",
    tips:[
      {t:"Never leave a blank",d:"No penalty for wrong answers. Random guess = 25% chance. Blank = 0%. Always fill something in."},
      {t:"When guessing, pick B or C",d:"Statistically, TOEIC answers are slightly more often B or C. Small edge, but better than nothing."},
      {t:"Trust your first instinct",d:"Don't change answers unless you're 100% sure. Studies show first instinct is right more often than changes."},
      {t:"Mark and come back (Reading only)",d:"In Listening, the audio moves on. In Reading, you can flag a hard question and return to it later."},
  ]},
];

// ─── STRATEGY QUIZ DATA ───
var STRAT_QUIZ = [
  {id:"sq1",scenario:"The directions for Part 3 are playing. What should you do?",
    options:["Listen carefully to the directions","Read the first 3 questions of Part 3 now","Review your Part 2 answers","Relax and wait"],
    correct:1,part:"Part 3",explain:"You already know the instructions. Use every second of silence to pre-read upcoming questions. This is the #1 Listening strategy."},
  {id:"sq2",scenario:"In Part 2, you hear: 'When is the DEADLINE for the report?' Answer B contains the word 'DEADLINE'. What should you think?",
    options:["B is probably correct — it matches the question","B is probably a TRAP — repeated words are distractors","B could go either way","Skip this question"],
    correct:1,part:"Part 2",explain:"In Part 2, when a word from the question is repeated in an answer, it's almost always a distractor. The correct answer usually uses different words."},
  {id:"sq3",scenario:"Part 5: The 4 answer options are: successfully / success / successful / succeed. What type of question is this?",
    options:["Vocabulary question","Grammar question","Word Form question","Collocation question"],
    correct:2,part:"Part 5",explain:"When all 4 options come from the same word family, it's a Word Form question. Your job: figure out what part of speech the blank needs."},
  {id:"sq4",scenario:"You've spent 50 seconds on a Part 5 question and still aren't sure. What do you do?",
    options:["Keep thinking — you'll figure it out","Eliminate what you can, guess B or C, move on","Leave it blank and come back later","Read the sentence one more time carefully"],
    correct:1,part:"Part 5",explain:"30 seconds MAX per Part 5 question. After that, eliminate impossible answers, pick your best guess, and MOVE ON. Time saved here = points earned in Part 7."},
  {id:"sq5",scenario:"Part 7: You have 2 minutes left and 6 questions unanswered. What do you do?",
    options:["Leave them blank — better than random guessing","Fill in B or C for all remaining questions","Quickly try to read and answer each one","Focus on getting one more right and leave the rest"],
    correct:1,part:"Part 7",explain:"ALWAYS fill in something. No penalty for guessing. Random B/C = 25% chance per question. That's potentially 1-2 free points. Blank = guaranteed 0."},
  {id:"sq6",scenario:"Part 1: The photo shows ONE woman at a desk. You hear an answer that says 'They are working on a project.' What do you do?",
    options:["Consider it — maybe others are off-screen","Eliminate it — 'they' doesn't match one person","Keep it as a possibility","Choose it — 'working' matches the photo"],
    correct:1,part:"Part 1",explain:"If the photo shows ONE person, any answer using 'they' or 'people' is automatically wrong. Count the people in the photo during prep time."},
  {id:"sq7",scenario:"Part 6: You see 4 blanks in an email text. What's your first move?",
    options:["Fill in blank #1 immediately","Read only the sentence with blank #1","Read the ENTIRE email first, then answer","Look at the answer options for blank #1 first"],
    correct:2,part:"Part 6",explain:"Part 6 is NOT Part 5. Context from the whole text is essential. Spend 60 seconds reading everything, then fill in the blanks."},
  {id:"sq8",scenario:"Part 2: 'Would you like to join us for lunch?' Which answer style is most likely correct?",
    options:["'Yes, I would.'","'No, thank you.'","'I already ate, but thanks for asking.'","'The lunch menu looks good.'"],
    correct:2,part:"Part 2",explain:"Indirect answers are often correct on TOEIC Part 2. 'I already ate' is a polite, indirect decline — more natural than a flat Yes/No."},
  {id:"sq9",scenario:"Part 3: The third question asks 'What will the woman probably do next?' Where in the conversation should you focus?",
    options:["The very beginning","The middle section","The last line of the conversation","It could be anywhere"],
    correct:2,part:"Part 3",explain:"'What will X do next?' is ALWAYS answered in the final sentence or two of the conversation. 'I'll call the supplier' = She will contact the supplier."},
  {id:"sq10",scenario:"Part 5: You see '_____ the heavy rain, the event continued.' Options: Despite / Although / However / Because. How do you decide?",
    options:["Pick the one that 'sounds right'","Check what follows the blank: noun or clause?","They all mean the same thing","Choose the longest word"],
    correct:1,part:"Part 5",explain:"'The heavy rain' is a noun phrase (no subject+verb). DESPITE + noun. ALTHOUGH + clause. HOWEVER = new sentence. The grammar structure decides."},
  {id:"sq11",scenario:"Part 4: A voicemail begins: 'Hi, this is Karen from Accounting.' What should you already be thinking?",
    options:["Who is Karen?","This is an internal business call about finances","I need to remember the name Karen","The answer to Q1 is probably 'Karen'"],
    correct:1,part:"Part 4",explain:"The first 5 seconds tell you the talk type and context. 'Karen from Accounting' = internal call, business context, probably about budgets or expenses."},
  {id:"sq12",scenario:"Part 7: Question asks 'What is the purpose of this email?' You've read the whole text. Where is the answer?",
    options:["In the subject line or first 2 sentences","In the middle paragraph","In the closing line","Spread across the entire email"],
    correct:0,part:"Part 7",explain:"Purpose questions are ALWAYS answered in the opening. 'I am writing to inform you...' / 'This is to confirm...' — don't waste time reading further for this Q type."},
  {id:"sq13",scenario:"Part 7: A 'NOT' question: 'Which is NOT mentioned in the article?' with 4 options. Best approach?",
    options:["Read the article and pick what you don't remember seeing","Check each option against the text, one by one","Pick the option that seems least likely","Guess and move on — NOT questions are too slow"],
    correct:1,part:"Part 7",explain:"Check each option against the text systematically. Cross off options as you find them mentioned. The last one standing is your answer. Slow but reliable."},
  {id:"sq14",scenario:"Part 5: The blank comes after 'the' and before 'of'. What part of speech do you need?",
    options:["A verb","An adjective","A noun","An adverb"],
    correct:2,part:"Part 5",explain:"Article (the) + _____ + preposition (of) = NOUN. 'The importance of...' / 'The implementation of...' This pattern is tested constantly."},
  {id:"sq15",scenario:"You're in the Listening section. You missed question 45 completely — the audio moved on. What do you do?",
    options:["Try to remember what you heard and think about it","Guess an answer for 45 and immediately focus on Q46","Leave 45 blank and focus on 46","Ask for the audio to be replayed"],
    correct:1,part:"General",explain:"In Listening, the audio doesn't wait. Mark a quick guess for the missed question and IMMEDIATELY focus on the next one. Dwelling on a missed Q costs you the next one too."},
  {id:"sq16",scenario:"Part 3: You hear 'Look at the graphic' in the question. What should you do?",
    options:["Ignore the graphic and focus on the audio","Match what you hear in the audio to the information in the graphic","Read the graphic after the audio ends","Only look at the graphic for the last question"],
    correct:1,part:"Part 3",explain:"Scan the graphic BEFORE the audio plays (during pre-reading). Then listen for the specific detail that connects the audio to one item in the graphic."},
];

// ─── PART 6 DATA ───
var PART6_TEXTS = [
  { id:"p6t1", type:"Email", from:"HR Department", to:"All Staff", subject:"Annual Performance Reviews",
    parts:[
      {text:"Dear colleagues,\n\nWe are writing to inform you that the annual performance review process will begin on March 1st. All employees "},
      {blank:true,options:["who","which","whose","whom"],correct:0,x:"'Who' = relative pronoun for people as subject of the clause."},
      {text:" have completed at least six months of service are required to participate.\n\nYour direct supervisor will schedule a one-on-one meeting with you during the month of March. Please "},
      {blank:true,options:["prepare","preparation","prepared","preparatory"],correct:0,x:"'Please' + base verb (imperative). 'Please prepare'."},
      {text:" a brief summary of your key accomplishments from the past year. "},
      {blank:true,options:["In addition","However","Despite","Although"],correct:0,x:"'In addition' adds information. The next sentence adds another requirement."},
      {text:", you should identify two or three professional development goals for the coming year.\n\nIf you have any questions about the process, please contact the HR department. "},
      {blank:true,options:[
        "We look forward to a productive review season.",
        "The cafeteria will be closed for renovation.",
        "New parking regulations will take effect in April.",
        "The company was founded in 1987."
      ],correct:0,x:"Sentence insertion: must logically conclude an email about performance reviews."},
    ]},
  { id:"p6t2", type:"Memo", from:"Operations Manager", to:"Warehouse Staff", subject:"Updated Safety Procedures",
    parts:[
      {text:"To all warehouse personnel,\n\nEffective immediately, several changes to our safety procedures will be "},
      {blank:true,options:["implemented","implementing","implementation","implement"],correct:0,x:"Future passive: 'will be implemented'. Past participle needed after 'be'."},
      {text:". These updates are the result of the recent safety audit conducted last month.\n\nFirst, all employees must wear protective eyewear in Zones B and C at all times. Second, forklift operators are "},
      {blank:true,options:["required","requiring","requirement","require"],correct:0,x:"Passive: 'operators are required' (adjective/past participle after 'are')."},
      {text:" to complete a refresher course by March 15th. "},
      {blank:true,options:["Furthermore","Nevertheless","Although","Because"],correct:0,x:"'Furthermore' adds another requirement. The text lists additional safety measures."},
      {text:", emergency exit routes have been updated, and new signs will be installed this week.\n\n"},
      {blank:true,options:[
        "Compliance with these procedures is mandatory for all staff.",
        "The annual holiday party will be held on December 20th.",
        "We recommend trying the new restaurant across the street.",
        "Applications for the internship program are now open."
      ],correct:0,x:"Sentence insertion: must conclude a memo about mandatory safety procedures."},
    ]},
  { id:"p6t3", type:"Notice", from:"Building Management", to:"Tenants", subject:"Elevator Maintenance",
    parts:[
      {text:"Dear building tenants,\n\nPlease be advised that the elevators in Tower A will undergo scheduled maintenance from April 5th to April 8th. _____ this period, only the service elevator will be operational.\n\nWe "},
      {blank:true,options:["During","While","Since","For"],correct:0,x:"'During' + noun phrase (this period). 'While' would need a clause."},
      {text:""},
      {blank:true,options:["sincerely","sincere","sincerity","sincerer"],correct:0,x:"'We sincerely apologize' — adverb modifies the verb 'apologize'."},
      {text:" apologize for any inconvenience this may cause. Tenants on floors 15 and above are "},
      {blank:true,options:["encouraged","encouraging","encouragement","encourage"],correct:0,x:"Passive: 'are encouraged' to use the stairs or plan accordingly."},
      {text:" to allow extra time for their commute during the maintenance window.\n\n"},
      {blank:true,options:[
        "We appreciate your patience and understanding.",
        "The building was constructed in 2015.",
        "Several new restaurants have opened in the area.",
        "The company's stock price rose by 3% yesterday."
      ],correct:0,x:"Sentence insertion: polite closing for a building notice about inconvenience."},
    ]},
  { id:"p6t4", type:"Email", from:"Marketing Director", to:"Sales Team", subject:"Q3 Campaign Launch",
    parts:[
      {text:"Hello team,\n\nI am pleased to announce that our Q3 marketing campaign will officially launch on July 1st. After months of "},
      {blank:true,options:["carefully","careful","care","caring"],correct:1,x:"'Months of ___ planning' — adjective needed before noun 'planning'. 'Careful planning'."},
      {text:" planning, we are confident that this campaign will significantly boost brand awareness in the European market.\n\nEach regional manager is responsible "},
      {blank:true,options:["for","of","to","with"],correct:0,x:"'Responsible for' = fixed collocation with 'for'."},
      {text:" coordinating local promotional events. "},
      {blank:true,options:["Therefore","Despite","However","In spite of"],correct:0,x:"'Therefore' = consequence. Because managers are responsible, they need to submit plans."},
      {text:", please submit your event proposals to me by June 15th.\n\n"},
      {blank:true,options:[
        "Let's make Q3 our best quarter yet!",
        "The office will be closed on national holidays.",
        "Please remember to update your email signatures.",
        "Parking spaces are assigned on a first-come basis."
      ],correct:0,x:"Sentence insertion: motivational closing for a campaign launch email."},
    ]},
  { id:"p6t5", type:"Letter", from:"Customer Service", to:"Mr. Harrison", subject:"Regarding Your Recent Order",
    parts:[
      {text:"Dear Mr. Harrison,\n\nThank you for contacting us regarding your recent order (#45892). We have "},
      {blank:true,options:["looked into","looked up","looked over","looked after"],correct:0,x:"'Looked into' = investigated. They investigated the issue he raised."},
      {text:" the matter and would like to offer our sincere apologies for the inconvenience.\n\nUnfortunately, the item you ordered is currently out of stock. "},
      {blank:true,options:["However","Although","Despite","Because"],correct:0,x:"'However' introduces a contrast/solution. The item is unavailable BUT we offer alternatives."},
      {text:", we would be happy to offer you a full refund or a replacement with a "},
      {blank:true,options:["comparable","comparably","comparison","compare"],correct:0,x:"Adjective before noun: 'a comparable product'. 'Comparable' = adjective."},
      {text:" product at no additional cost.\n\n"},
      {blank:true,options:[
        "Please let us know which option you prefer, and we will process it immediately.",
        "Our company was established in 1995 by two college friends.",
        "We are currently hiring for several positions in our London office.",
        "The weather forecast predicts rain for the rest of the week."
      ],correct:0,x:"Sentence insertion: must ask the customer to choose and promise action."},
    ]},
  { id:"p6t6", type:"Memo", from:"IT Department", to:"All Departments", subject:"System Migration",
    parts:[
      {text:"Attention all staff,\n\nThe IT department will be migrating our email servers to a new platform this weekend. The migration is scheduled to "},
      {blank:true,options:["take","bring","make","hold"],correct:0,x:"'Take place' = happen/occur. Fixed collocation."},
      {text:" place between Saturday 8:00 AM and Sunday 6:00 PM. During this time, email services will be "},
      {blank:true,options:["temporarily","temporary","temporal","temp"],correct:0,x:"Adverb modifies adjective/state: 'temporarily unavailable'. Adverb needed."},
      {text:" unavailable.\n\nWe strongly recommend that all employees save any important emails "},
      {blank:true,options:["prior to","despite","although","while"],correct:0,x:"'Prior to' + noun = before. 'Prior to the migration' = before the migration happens."},
      {text:" the migration. "},
      {blank:true,options:[
        "We will send a confirmation email once the migration is complete.",
        "The company picnic has been moved to September.",
        "New business cards can be ordered through the online portal.",
        "The CEO will be traveling to Asia next month."
      ],correct:0,x:"Sentence insertion: logical follow-up promising communication after IT maintenance."},
    ]},
  { id:"p6t7", type:"Email", from:"Training Coordinator", to:"New Hires", subject:"Welcome to Pinnacle Corp",
    parts:[
      {text:"Dear new team members,\n\nWelcome to Pinnacle Corporation! We are delighted to have you join us. Your first week will "},
      {blank:true,options:["consist","consist of","consisting","consisted"],correct:1,x:"'Consist of' = be made up of. Fixed verb + preposition."},
      {text:" orientation sessions, department introductions, and IT setup.\n\nPlease arrive at the main reception by 8:30 AM on Monday. A member of HR will be there to "},
      {blank:true,options:["greet","greeting","greeted","greets"],correct:0,x:"'To greet' — infinitive after 'to'. Purpose construction."},
      {text:" you and escort you to the training room. "},
      {blank:true,options:["Meanwhile","Nevertheless","For example","In addition"],correct:3,x:"'In addition' adds more information. The next sentence adds another requirement."},
      {text:", please bring a valid photo ID and your signed employment contract.\n\n"},
      {blank:true,options:[
        "We look forward to working with you!",
        "The parking garage is being repainted this week.",
        "Last quarter's revenue exceeded expectations.",
        "The cafeteria menu changes daily."
      ],correct:0,x:"Sentence insertion: warm closing for a welcome email."},
    ]},
  { id:"p6t8", type:"Notice", from:"Facilities Management", to:"All Staff", subject:"Office Relocation",
    parts:[
      {text:"Please be informed that the Marketing and Sales departments will be _____ to the fourth floor of Building B, effective March 1.\n\nThe move is "},
      {blank:true,options:["relocating","relocated","relocation","relocate"],correct:1,x:"Passive: departments will be 'relocated'. Past participle after 'will be'."},
      {text:""},
      {blank:true,options:["necessary","necessarily","necessity","necessitate"],correct:0,x:"'The move is necessary' — adjective after 'is'."},
      {text:" to accommodate the expansion of the R&D team on the second floor. "},
      {blank:true,options:["As a result","Although","Despite","While"],correct:0,x:"'As a result' = consequence. Because of the expansion, the move happens."},
      {text:", some temporary disruption is expected during the transition.\n\n"},
      {blank:true,options:[
        "Packing supplies will be distributed to affected departments next week.",
        "The company picnic is planned for June.",
        "New printers have been ordered for the copy room.",
        "Employee birthdays are celebrated on the last Friday of each month."
      ],correct:0,x:"Sentence insertion: practical next step related to the office move."},
    ]},
  { id:"p6t9", type:"Email", from:"James Morton, CFO", to:"Department Heads", subject:"Budget Freeze",
    parts:[
      {text:"Dear colleagues,\n\nDue to _____ market conditions, the executive committee has decided to implement a temporary budget freeze across all departments.\n\n"},
      {blank:true,options:["uncertainty","uncertain","uncertainly","uncertainties"],correct:1,x:"'Due to uncertain market conditions' — adjective modifying 'market conditions'."},
      {text:"This means that all non-essential expenditures must be "},
      {blank:true,options:["approved","approving","approval","approve"],correct:0,x:"Passive: expenditures must be 'approved'. Past participle after modal passive."},
      {text:" by the CFO's office before processing. Essential operating costs, including salaries and contractual obligations, will not be "},
      {blank:true,options:["affected","affecting","effect","affection"],correct:0,x:"Passive: 'will not be affected'. Past participle."},
      {text:". "},
      {blank:true,options:[
        "I understand this may cause some inconvenience, and I appreciate your cooperation.",
        "Our new logo was designed by an external agency.",
        "The holiday schedule has been posted in the break room.",
        "Please welcome our new intern, Sarah."
      ],correct:0,x:"Sentence insertion: empathetic closing acknowledging the difficulty of budget cuts."},
    ]},
  { id:"p6t10", type:"Letter", from:"Event Planning Co.", to:"Ms. Nakamura", subject:"Corporate Event Confirmation",
    parts:[
      {text:"Dear Ms. Nakamura,\n\nThank you for choosing GrandView Events for your upcoming corporate retreat. This letter "},
      {blank:true,options:["confirms","confirming","confirmation","confirmed"],correct:0,x:"Present simple: 'This letter confirms' = formal statement of fact."},
      {text:" your reservation for September 12-14 at the Lakeside Conference Center.\n\nAs discussed, the package includes accommodation for 45 guests, three meeting rooms, and full catering. "},
      {blank:true,options:["However","Therefore","In addition","Despite"],correct:0,x:"'However' introduces a contrast or caveat. Next sentence has a condition."},
      {text:", please note that the outdoor terrace is subject to "},
      {blank:true,options:["available","availability","avail","availably"],correct:1,x:"'Subject to availability' — noun after 'to'. Fixed expression."},
      {text:" and weather conditions.\n\n"},
      {blank:true,options:[
        "Please find the detailed invoice attached for your review.",
        "We recently renovated our swimming pool.",
        "Our restaurant received a five-star rating last year.",
        "The nearest airport is approximately 20 km away."
      ],correct:0,x:"Sentence insertion: business-like next step for a booking confirmation."},
    ]},
  { id:"p6t11", type:"Memo", from:"Quality Assurance", to:"Production Team", subject:"Product Recall",
    parts:[
      {text:"A quality issue has been identified in Batch #4872 of the ProMax 500 series. _____ an internal investigation, it was determined that a faulty component from a third-party supplier caused the defect.\n\n"},
      {blank:true,options:["Following","Followed","Follow","Follows"],correct:0,x:"'Following' = after/as a result of. Preposition + noun phrase."},
      {text:"All units from this batch must be "},
      {blank:true,options:["withdrawal","withdrawing","withdrawn","withdrew"],correct:2,x:"Passive: 'must be withdrawn'. Past participle of 'withdraw'."},
      {text:" from sale immediately. The supplier has been notified and has agreed to cover all "},
      {blank:true,options:["associated","associating","association","associate"],correct:0,x:"'Associated costs' — adjective modifying 'costs'. Past participle as adjective."},
      {text:" costs.\n\n"},
      {blank:true,options:[
        "Please begin the recall process today and report progress by Friday.",
        "The company holiday party was a great success.",
        "New vending machines have been installed in the break room.",
        "Our CEO will be featured in next month's business magazine."
      ],correct:0,x:"Sentence insertion: action-oriented closing for an urgent recall memo."},
    ]},
  { id:"p6t12", type:"Email", from:"Customer Relations", to:"Valued Customers", subject:"Service Update",
    parts:[
      {text:"Dear valued customers,\n\nWe are writing to inform you of an important update to our service terms, "},
      {blank:true,options:["effective","effectively","effectiveness","effect"],correct:0,x:"'Effective June 1' — adjective meaning 'coming into force'."},
      {text:" June 1, 2026.\n\nTo enhance your experience, we will be introducing a new tiered pricing model. Customers who "},
      {blank:true,options:["currently","current","currency","occurring"],correct:0,x:"'Customers who currently subscribe' — adverb modifying the verb 'subscribe'."},
      {text:" subscribe to our Premium plan will be automatically upgraded to Premium Plus at no additional charge. "},
      {blank:true,options:["Nevertheless","Furthermore","Because","Although"],correct:0,x:"'Nevertheless' = despite that. Next sentence introduces a less positive point after the good news."},
      {text:", Basic plan subscribers will see a modest rate adjustment of $2.99 per month.\n\n"},
      {blank:true,options:[
        "For a full comparison of the new plans, please visit our website.",
        "Our office is located at 123 Commerce Street.",
        "We are proud to sponsor the local football team.",
        "The company was named 'Best Employer' in 2024."
      ],correct:0,x:"Sentence insertion: directs customers to find more details about the change."},
    ]},
];

// ─── PART 7 DATA ───
var PART7_PASSAGES = [
  { id:"p7p1", type:"Email",
    text:"From: Sarah Chen, HR Director\nTo: All Department Heads\nSubject: New Hiring Procedures\nDate: March 3\n\nAs part of our ongoing effort to streamline operations, the Human Resources department is introducing a new digital hiring platform, effective April 1. All job postings, candidate evaluations, and interview scheduling will now be managed through this system.\n\nDepartment heads are required to attend a 90-minute training session during the week of March 20-24. Please sign up for your preferred time slot using the link below. If you are unable to attend any of the scheduled sessions, please contact me directly to arrange an alternative.\n\nThe new platform will replace the current paper-based process entirely. As a result, any pending hiring requests submitted before April 1 should be completed using the existing forms. Requests submitted after that date must use the new system.\n\nPlease note that the IT department will provide technical support during the transition period. A user guide will be distributed to all department heads by March 15.",
    questions:[
      {q:"What is the main purpose of this email?",options:["To announce a retirement","To introduce a new hiring system","To request budget approval","To advertise job openings"],correct:1,x:"The email announces a new digital hiring platform replacing the paper-based process."},
      {q:"When will the new system become mandatory?",options:["March 3","March 15","March 20","April 1"],correct:3,x:"'Effective April 1' and 'Requests submitted after that date must use the new system.'"},
      {q:"What are department heads required to do?",options:["Hire new staff immediately","Attend a training session","Write a user guide","Contact the IT department"],correct:1,x:"'Department heads are required to attend a 90-minute training session.'"},
      {q:"What will happen to hiring requests submitted before April 1?",options:["They will be rejected","They must use the new system","They should be completed using existing forms","They will be handled by HR directly"],correct:2,x:"'Pending hiring requests submitted before April 1 should be completed using the existing forms.'"},
    ]},
  { id:"p7p2", type:"Advertisement",
    text:"GRAND OPENING — RIVERSIDE BUSINESS CENTER\n\nRiverside Business Center is proud to announce the opening of its newest location at 450 Harbor Drive. Our state-of-the-art facility offers flexible office spaces ranging from private offices to open-plan work areas, with lease terms from 6 months to 5 years.\n\nAmenities include:\n- High-speed fiber internet (included in all plans)\n- 24/7 building access with security\n- On-site parking (50 spaces available)\n- Conference rooms (bookable by the hour)\n- Ground-floor café and restaurant\n\nTo celebrate our grand opening, we are offering 20% off the first three months' rent for any lease signed before May 31. Contact our leasing office at (555) 890-1234 or visit www.riversidebusiness.com to schedule a tour.\n\nRiverside Business Center — Where business meets convenience.",
    questions:[
      {q:"What is being advertised?",options:["A restaurant opening","Office space for lease","A new parking facility","A conference planning service"],correct:1,x:"The ad promotes flexible office spaces at a new business center location."},
      {q:"What is included in all plans?",options:["Parking","Conference rooms","High-speed internet","Restaurant meals"],correct:2,x:"'High-speed fiber internet (included in all plans).'"},
      {q:"What special offer is mentioned?",options:["Free parking for a year","20% off the first three months","A free conference room","Complimentary meals for staff"],correct:1,x:"'20% off the first three months' rent for any lease signed before May 31.'"},
    ]},
  { id:"p7p3", type:"Article",
    text:"TECH INDUSTRY REPORT: REMOTE WORK TRENDS IN 2025\n\nA recent survey conducted by the Global Workforce Institute found that 68% of technology companies now offer some form of remote or hybrid work arrangement, up from 42% in 2020. The study, which surveyed over 3,000 companies across 25 countries, highlights a significant shift in workplace culture.\n\nThe report identifies several key factors driving this trend. First, companies that offer remote options report 23% lower employee turnover. Second, office space costs have been reduced by an average of 30% for companies that have adopted hybrid models. Third, employee satisfaction scores are notably higher in organizations with flexible arrangements.\n\nHowever, the report also notes challenges. Communication difficulties were cited by 45% of managers as a major concern, and 31% reported that maintaining company culture remotely was more difficult than expected.\n\n'The data clearly shows that flexibility is no longer a perk — it's an expectation,' said Dr. Maria Santos, the study's lead researcher. 'Companies that fail to adapt risk losing top talent to competitors who offer these options.'",
    questions:[
      {q:"What did the survey find about remote work?",options:["It has decreased since 2020","68% of tech companies now offer it","All companies have adopted it","It is only popular in one country"],correct:1,x:"'68% of technology companies now offer some form of remote or hybrid work arrangement.'"},
      {q:"What is one benefit of remote work mentioned in the report?",options:["Higher office costs","Increased employee turnover","23% lower employee turnover","More communication problems"],correct:2,x:"'Companies that offer remote options report 23% lower employee turnover.'"},
      {q:"What challenge is mentioned?",options:["Higher costs","Lack of technology","Communication difficulties","Government regulations"],correct:2,x:"'Communication difficulties were cited by 45% of managers as a major concern.'"},
      {q:"What does Dr. Santos suggest?",options:["Companies should end remote work","Flexibility is now an expectation, not a perk","All employees should work from the office","Remote work is only temporary"],correct:1,x:"Dr. Santos says 'flexibility is no longer a perk — it's an expectation.'"},
    ]},
  { id:"p7p4", type:"Notice",
    text:"NOTICE TO ALL EMPLOYEES — PARKVIEW INDUSTRIES\n\nAnnual Company Picnic\n\nThe annual company picnic will be held on Saturday, June 14, from 11:00 AM to 4:00 PM at Greenfield Park (Shelter Area B). All employees and their families are welcome to attend.\n\nThis year's event will feature a barbecue lunch, team-building activities, and a raffle with prizes including gift cards and electronics. Vegetarian and gluten-free meal options will be available upon request.\n\nTo help us plan for food and seating, please RSVP by June 7 using the form posted in the break room or by emailing events@parkview.com. Indicate the number of guests you plan to bring.\n\nFree parking is available at the park. For those who prefer not to drive, a shuttle bus will depart from the main office at 10:30 AM and return at 4:30 PM.\n\nWe hope to see everyone there!",
    questions:[
      {q:"What is the purpose of this notice?",options:["To announce a policy change","To invite employees to a company event","To advertise a new product","To inform about office construction"],correct:1,x:"The notice invites employees to the annual company picnic."},
      {q:"What should employees do by June 7?",options:["Submit a project report","Buy raffle tickets","RSVP for the picnic","Reserve a parking space"],correct:2,x:"'Please RSVP by June 7 using the form posted in the break room.'"},
      {q:"What transportation option is offered?",options:["Taxi vouchers","A shuttle bus from the office","Rental cars","Train tickets"],correct:1,x:"'A shuttle bus will depart from the main office at 10:30 AM.'"},
    ]},
  { id:"p7p5", type:"Letter",
    text:"Anderson & Blake Consulting\n15 Queen Street, London EC4R 1BE\n\nMarch 8, 2025\n\nMr. James Ward\nDirector of Operations\nNorthgate Manufacturing Ltd.\n42 Industrial Avenue\nManchester M1 4BT\n\nDear Mr. Ward,\n\nThank you for meeting with us last week to discuss your company's supply chain challenges. Following our conversation, I have prepared a preliminary proposal outlining how Anderson & Blake can help Northgate Manufacturing improve efficiency and reduce costs.\n\nOur analysis suggests that by restructuring your supplier network and implementing our inventory management system, Northgate could achieve cost savings of approximately 15-20% within the first year. The full implementation would take approximately four months.\n\nI have attached the detailed proposal for your review. If you would like to proceed, I suggest we schedule a follow-up meeting with your operations team to discuss the implementation timeline.\n\nPlease feel free to contact me at j.anderson@ablake.com or (020) 7946-0123 if you have any questions.\n\nSincerely,\nJulia Anderson\nSenior Partner",
    questions:[
      {q:"Why is Ms. Anderson writing to Mr. Ward?",options:["To apply for a job","To complain about a product","To follow up on a meeting with a proposal","To invite him to a conference"],correct:2,x:"'Following our conversation, I have prepared a preliminary proposal.'"},
      {q:"What potential benefit is mentioned?",options:["A 50% increase in staff","15-20% cost savings in the first year","Free consulting services","A new office location"],correct:1,x:"'Northgate could achieve cost savings of approximately 15-20% within the first year.'"},
      {q:"How long would full implementation take?",options:["One month","Four months","One year","Two years"],correct:1,x:"'The full implementation would take approximately four months.'"},
      {q:"What does Ms. Anderson suggest as a next step?",options:["Signing a contract immediately","Reducing the workforce","Scheduling a meeting with the operations team","Visiting the London office"],correct:2,x:"'I suggest we schedule a follow-up meeting with your operations team.'"},
    ]},
  { id:"p7p6", type:"Memo",
    text:"MEMO\n\nTo: Marketing Department\nFrom: David Park, VP of Marketing\nDate: February 12\nRe: Budget Allocation for Q2\n\nFollowing last week's budget review meeting, I want to clarify the Q2 budget allocations for our department. The total marketing budget for Q2 is $450,000, distributed as follows:\n\nDigital advertising: $180,000 (40%)\nContent creation: $90,000 (20%)\nEvents and sponsorships: $85,000 (19%)\nMarket research: $55,000 (12%)\nMiscellaneous: $40,000 (9%)\n\nPlease note that the digital advertising budget represents a 25% increase from Q1, reflecting our strategic decision to expand our online presence. Conversely, the events budget has been reduced by 10% due to the cancellation of the Tokyo trade show.\n\nAll spending requests over $5,000 must be approved by me in advance. Please submit your Q2 project plans by February 28 so we can ensure alignment with these allocations.",
    questions:[
      {q:"What is the total marketing budget for Q2?",options:["$180,000","$90,000","$450,000","$5,000"],correct:2,x:"'The total marketing budget for Q2 is $450,000.'"},
      {q:"Which area received the largest budget increase from Q1?",options:["Content creation","Events and sponsorships","Digital advertising","Market research"],correct:2,x:"'The digital advertising budget represents a 25% increase from Q1.'"},
      {q:"Why was the events budget reduced?",options:["Low attendance at previous events","The Tokyo trade show was cancelled","Budget cuts across all departments","A new competitor entered the market"],correct:1,x:"'The events budget has been reduced by 10% due to the cancellation of the Tokyo trade show.'"},
    ]},
  { id:"p7p7", type:"Instructions",
    text:"SETTING UP YOUR NEW VOICEPRINT SECURITY SYSTEM\n\nThank you for purchasing the VoiceLock Pro security system. Please follow these steps to complete the setup:\n\nStep 1: Download the VoiceLock app from your device's app store and create an account using your email address.\n\nStep 2: Connect the VoiceLock device to your home Wi-Fi network. The device will flash blue when successfully connected.\n\nStep 3: Open the app and tap 'Register Voice.' You will be asked to repeat three phrases. Speak clearly and at your normal volume. The registration process takes approximately two minutes.\n\nStep 4: Once your voiceprint is registered, test the system by saying 'VoiceLock, open' near the device. The light should turn green, indicating successful recognition.\n\nIMPORTANT: If the device flashes red during setup, it means the Wi-Fi connection has been lost. Restart the device and repeat Step 2. For additional help, visit support.voicelock.com or call our helpline at 1-800-555-0199 (available Monday-Friday, 9 AM-6 PM EST).",
    questions:[
      {q:"What must be done before registering a voiceprint?",options:["Call the helpline","Connect to Wi-Fi","Visit the website","Purchase a second device"],correct:1,x:"Step 2 (Wi-Fi connection) must be done before Step 3 (voice registration)."},
      {q:"What does a blue flashing light indicate?",options:["An error has occurred","The battery is low","The Wi-Fi connection was successful","Voice recognition is complete"],correct:2,x:"'The device will flash blue when successfully connected.'"},
      {q:"What should a user do if the device flashes red?",options:["Register their voice again","Return the product","Restart the device and reconnect to Wi-Fi","Download a different app"],correct:2,x:"'If the device flashes red... Restart the device and repeat Step 2.'"},
    ]},
  { id:"p7p8", type:"Email",
    text:"From: Lisa Chang, Conference Coordinator\nTo: All Speakers\nSubject: Global Innovation Summit — Final Details\nDate: April 2\n\nDear speakers,\n\nThank you for agreeing to present at the Global Innovation Summit on April 18-19 at the Metropolitan Convention Center. Below are some important details for your reference.\n\nSchedule: All presentation slots are 30 minutes, followed by a 10-minute Q&A session. Please arrive at your assigned room at least 15 minutes before your scheduled time. A full program is attached.\n\nEquipment: Each room is equipped with a projector, screen, microphone, and laptop. If you prefer to use your own laptop, please bring the appropriate adapter. Our AV team will be available for technical support.\n\nAccommodation: Rooms have been reserved at the Grand Metropolitan Hotel (5-minute walk from the venue). Your confirmation details were sent in a separate email on March 28.\n\nDinner: A speakers' dinner will be held on April 18 at 7:30 PM at Chez Laurent (ground floor of the hotel). Please let me know by April 10 if you have any dietary requirements.\n\nI look forward to seeing you at the Summit!\n\nBest regards,\nLisa Chang",
    questions:[
      {q:"How long is each presentation slot including Q&A?",options:["15 minutes","30 minutes","40 minutes","60 minutes"],correct:2,x:"30-minute presentation + 10-minute Q&A = 40 minutes total."},
      {q:"What should speakers do if they want to use their own laptop?",options:["Contact the AV team in advance","Bring an appropriate adapter","Email Lisa Chang","Arrive one hour early"],correct:1,x:"'If you prefer to use your own laptop, please bring the appropriate adapter.'"},
      {q:"Where is the speakers' dinner?",options:["At the convention center","At a nearby park","At the Grand Metropolitan Hotel","At a restaurant called Chez Laurent"],correct:3,x:"'A speakers' dinner will be held at Chez Laurent (ground floor of the hotel).'"},
      {q:"What is the deadline for dietary requirements?",options:["April 2","April 10","April 18","March 28"],correct:1,x:"'Please let me know by April 10 if you have any dietary requirements.'"},
    ]},
  { id:"p7p9", type:"Advertisement",
    text:"ACCELERATE YOUR CAREER WITH BRIGHTPATH PROFESSIONAL DEVELOPMENT\n\nAre you looking to stand out in today's competitive job market? BrightPath offers industry-recognized certification programs in project management, data analytics, digital marketing, and business leadership.\n\nOur courses are designed for working professionals:\n- 100% online with flexible scheduling\n- Programs range from 8 to 16 weeks\n- Live instructor-led sessions every Saturday\n- Career coaching and resume support included\n\nSpring enrollment is now open. Classes begin on April 7. Early bird pricing: Save 15% when you register before March 20.\n\nVisit www.brightpath.edu or call (555) 234-5678 to speak with an enrollment advisor.\n\nBrightPath — Your path to professional growth.",
    questions:[
      {q:"Who is the target audience for BrightPath?",options:["University students","Retired professionals","Working professionals","High school students"],correct:2,x:"'Our courses are designed for working professionals.'"},
      {q:"How are the courses delivered?",options:["In person only","100% online","A mix of online and in-person","Through recorded videos only"],correct:1,x:"'100% online with flexible scheduling' and 'Live instructor-led sessions every Saturday.'"},
      {q:"What must someone do to get the 15% discount?",options:["Complete a course first","Register before March 20","Refer a friend","Enroll in two programs"],correct:1,x:"'Save 15% when you register before March 20.'"},
    ]},
  { id:"p7p10", type:"Article",
    text:"LOCAL BUSINESS NEWS\n\nGreenfield Electronics, a manufacturer of consumer electronics based in Portland, announced yesterday that it will close its downtown factory and move all production to its facility in Austin, Texas. The move, which will affect approximately 340 employees, is expected to be completed by the end of the year.\n\nCompany spokesperson Diana Wells stated that the decision was driven by lower operating costs in Texas and better access to the company's main distribution partners. 'This was not an easy decision,' Ms. Wells said, 'but it is necessary for the long-term health of the company.'\n\nEmployees at the Portland facility will be offered either relocation packages or severance pay. The company has also partnered with a local employment agency to help affected workers find new positions.\n\nThe Portland factory, which has been in operation since 1998, will be converted into a mixed-use commercial and residential development, according to city planning documents.",
    questions:[
      {q:"Why is Greenfield Electronics moving its production?",options:["To expand its product line","Because of lower costs and better distribution access","Due to environmental regulations","To be closer to customers"],correct:1,x:"'Lower operating costs in Texas and better access to distribution partners.'"},
      {q:"How many employees will be affected?",options:["About 100","About 200","About 340","About 500"],correct:2,x:"'The move will affect approximately 340 employees.'"},
      {q:"What options are being offered to Portland employees?",options:["Only severance pay","Only relocation","Relocation packages or severance pay","Early retirement"],correct:2,x:"'Employees will be offered either relocation packages or severance pay.'"},
      {q:"What will happen to the Portland factory building?",options:["It will be demolished","It will become offices and housing","It will be sold to a competitor","It will remain empty"],correct:1,x:"'Converted into a mixed-use commercial and residential development.'"},
    ]},
  { id:"p7p11", type:"Notice",
    text:"WESTFIELD COMMUNITY CENTER — SCHEDULE CHANGE\n\nEffective February 1, the following changes will apply to facility operating hours:\n\nMonday-Friday: 6:00 AM - 10:00 PM (previously 7:00 AM - 9:00 PM)\nSaturday: 7:00 AM - 8:00 PM (no change)\nSunday: 8:00 AM - 6:00 PM (previously 9:00 AM - 5:00 PM)\n\nThese extended hours are in response to member feedback requesting earlier morning and later evening access. The swimming pool and fitness center will follow the new building hours. However, the indoor tennis courts will maintain their current schedule (8:00 AM - 8:00 PM daily) due to maintenance requirements.\n\nMembers with questions about the new schedule should contact the front desk at (555) 678-9012 or email info@westfieldcc.com.\n\nWe thank you for your continued membership and look forward to serving you better!",
    questions:[
      {q:"What prompted the schedule change?",options:["Budget concerns","Staff availability","Member feedback","A government regulation"],correct:2,x:"'These extended hours are in response to member feedback.'"},
      {q:"What is the new Sunday closing time?",options:["5:00 PM","6:00 PM","8:00 PM","10:00 PM"],correct:1,x:"'Sunday: 8:00 AM - 6:00 PM (previously 9:00 AM - 5:00 PM).'"},
      {q:"Which facility will NOT follow the new extended hours?",options:["The swimming pool","The fitness center","The indoor tennis courts","The front desk"],correct:2,x:"'The indoor tennis courts will maintain their current schedule.'"},
    ]},
  { id:"p7p12", type:"Double Passage",
    text:"--- DOCUMENT 1: Email ---\nFrom: Robert Kline, Purchasing Manager\nTo: All Department Heads\nDate: May 5\nSubject: New Office Supply Vendor\n\nDear colleagues,\n\nAfter a thorough evaluation process, we have selected OfficePro Direct as our new office supply vendor, replacing SupplyMax effective June 1. OfficePro offers a 22% cost reduction on most items compared to our current contract, along with next-day delivery for orders placed before 2:00 PM.\n\nTo place orders, use the new online portal at orders.officepro.com. Your login credentials will be emailed to you by May 20. Please note that the minimum order value is $25.\n\nAll existing SupplyMax orders placed before June 1 will still be fulfilled. After that date, the SupplyMax account will be deactivated.\n\nQuestions? Contact me at r.kline@company.com.\n\n--- DOCUMENT 2: Product Catalog Excerpt ---\nOfficePro Direct — Most Popular Items\n\nCopy paper (case of 10 reams): $42.99\nBallpoint pens (box of 12): $8.50\nSticky notes (pack of 6): $5.99\nPrinter ink cartridges (black): $24.99\nPrinter ink cartridges (color): $32.99\nFile folders (box of 50): $12.99\nWhiteboard markers (set of 4): $6.49\n\nFree shipping on orders over $75. Orders under $75 incur a $5.95 delivery fee.\nNext-day delivery for orders placed before 2:00 PM (Mon-Fri).",
    questions:[
      {q:"Why was OfficePro Direct selected?",options:["They are a local company","They offer lower costs and fast delivery","They were recommended by employees","They are the only supplier available"],correct:1,x:"'22% cost reduction' and 'next-day delivery' are the two reasons cited."},
      {q:"What is the minimum order amount?",options:["$5.95","$22","$25","$75"],correct:2,x:"'The minimum order value is $25.'"},
      {q:"An employee orders 1 case of copy paper and 1 box of pens. What will they pay for delivery?",options:["Free shipping","$5.95","$25","Next-day is not available"],correct:1,x:"$42.99 + $8.50 = $51.49 — under $75, so $5.95 delivery fee applies."},
      {q:"What will happen to orders placed with SupplyMax before June 1?",options:["They will be cancelled","They will be transferred to OfficePro","They will still be fulfilled","They will be refunded"],correct:2,x:"'All existing SupplyMax orders placed before June 1 will still be fulfilled.'"},
    ]},
  { id:"p7p13", type:"Double Passage",
    text:"--- DOCUMENT 1: Job Posting ---\nPOSITION: Regional Sales Manager — Northeast\nCompany: Atlas Medical Supplies\nLocation: Boston, MA\nSalary: $85,000 - $105,000 + performance bonus\n\nAtlas Medical Supplies is seeking an experienced Regional Sales Manager to lead our Northeast team. The ideal candidate will have:\n- Minimum 5 years of B2B sales experience, preferably in healthcare\n- Proven track record of exceeding sales targets\n- Bachelor's degree in business, marketing, or related field\n- Willingness to travel up to 40% of the time\n\nWe offer comprehensive benefits including health insurance, 401(k) matching, and 20 days paid vacation. Apply by May 15 at careers.atlasmed.com.\n\n--- DOCUMENT 2: Email ---\nFrom: Patricia Gomez\nTo: careers@atlasmed.com\nDate: May 2\nSubject: Application — Regional Sales Manager\n\nDear Hiring Team,\n\nI am writing to express my interest in the Regional Sales Manager position. I have seven years of experience in B2B sales within the pharmaceutical industry, including three years managing a team of 12 sales representatives in the Mid-Atlantic region.\n\nIn my current role at MedLine Corp, I consistently exceeded quarterly targets by an average of 18%. I hold a Bachelor's degree in Marketing from Boston University and an MBA from Northeastern University.\n\nI am available to start within four weeks of receiving an offer and am comfortable with the travel requirements. I have attached my resume and references for your review.\n\nBest regards,\nPatricia Gomez",
    questions:[
      {q:"What is the minimum experience required for the position?",options:["3 years","5 years","7 years","10 years"],correct:1,x:"The posting requires 'minimum 5 years of B2B sales experience.'"},
      {q:"Does Patricia Gomez meet the educational requirements?",options:["No, she lacks a degree","Yes, she has a Bachelor's","Yes, and she exceeds them with an MBA","The posting doesn't mention education"],correct:2,x:"The posting requires a Bachelor's. Patricia has a Bachelor's AND an MBA — she exceeds the requirement."},
      {q:"By how much did Patricia typically exceed her sales targets?",options:["12%","15%","18%","22%"],correct:2,x:"'I consistently exceeded quarterly targets by an average of 18%.'"},
      {q:"Based on both documents, which requirement might be a concern for Patricia?",options:["Her education level","Her years of experience","Her industry is pharmaceutical, not healthcare broadly","Her willingness to travel"],correct:2,x:"The posting prefers 'healthcare' experience. Patricia's experience is specifically in 'pharmaceutical' — related but not identical."},
    ]},
  { id:"p7p14", type:"Instructions",
    text:"GLOBETROTTER REWARDS — MEMBERSHIP GUIDE\n\nThank you for joining the GlobeTrotter Rewards program! Here is everything you need to know:\n\nEARNING POINTS\n- Flights: 1 point per $1 spent on ticket price (excluding taxes and fees)\n- Hotels: 2 points per $1 spent on room rate at partner hotels\n- Car rentals: 1 point per $1 spent at partner agencies\n- Dining: 3 points per $1 spent at airport partner restaurants\n\nMEMBERSHIP TIERS\n- Silver (0-24,999 points): Basic benefits, no priority boarding\n- Gold (25,000-74,999 points): Priority check-in, 1 free checked bag\n- Platinum (75,000+ points): Lounge access, free upgrades when available, 2 free checked bags\n\nREDEEMING POINTS\n- Domestic flights: from 10,000 points\n- International flights: from 25,000 points\n- Hotel nights: from 8,000 points\n- Points expire after 24 months of account inactivity\n\nFor questions, visit help.globetrotter.com or call 1-800-555-0147.",
    questions:[
      {q:"Which spending category earns the most points per dollar?",options:["Flights","Hotels","Car rentals","Airport dining"],correct:3,x:"Dining earns 3 points per $1 — the highest rate listed."},
      {q:"What benefit does Gold membership provide that Silver does not?",options:["Lounge access","Free upgrades","Priority check-in and 1 free checked bag","3 points per dollar on dining"],correct:2,x:"Gold: 'Priority check-in, 1 free checked bag.' Silver has 'no priority boarding.'"},
      {q:"A member has not used their account for 2 years. What happens?",options:["Their tier is downgraded","Their points expire","Their account is deleted","Nothing — points never expire"],correct:1,x:"'Points expire after 24 months of account inactivity.'"},
    ]},
];

// ─── FALSE FRIENDS DATA ───
var FALSE_FRIENDS = [
  {en:"actually",ex:"The project is actually ahead of schedule.",
    opts:["Currently, at this moment","In fact, really","Occasionally, sometimes","Actively, with energy"],correct:1,
    trap:"The French 'actuellement' means 'currently'. 'Actually' means 'in fact' or 'really'.",realFr:"en fait, vraiment"},
  {en:"eventually",ex:"The issue was eventually resolved by the IT team.",
    opts:["Possibly, maybe","Obviously, clearly","In the end, finally","Frequently, often"],correct:2,
    trap:"The French 'éventuellement' means 'possibly'. 'Eventually' means 'in the end, finally'.",realFr:"finalement"},
  {en:"resume",ex:"The meeting will resume after the lunch break.",
    opts:["To summarize briefly","To start again after a pause","To send a CV","To assume once more"],correct:1,
    trap:"The French 'résumer' means 'to summarize'. 'Resume' means 'to start again after a pause'.",realFr:"reprendre"},
  {en:"attend",ex:"All managers must attend the training session.",
    opts:["To wait for","To be present at","To pay attention to","To expect"],correct:1,
    trap:"The French 'attendre' means 'to wait for'. 'Attend' means 'to be present at'.",realFr:"assister à"},
  {en:"delay",ex:"The flight was delayed by two hours.",
    opts:["A deadline, time limit","A relay, handover","A postponement, lateness","A detour, diversion"],correct:2,
    trap:"The French 'délai' means 'deadline/time limit'. 'Delay' means 'a postponement or lateness'.",realFr:"retard"},
  {en:"sensible",ex:"It would be sensible to review the contract first.",
    opts:["Sensitive, emotional","Reasonable, practical","Noticeable, perceptible","Sympathetic, caring"],correct:1,
    trap:"The French 'sensible' means 'sensitive'. English 'sensible' means 'reasonable, practical'.",realFr:"raisonnable, sensé"},
  {en:"library",ex:"The company library has a wide selection of business books.",
    opts:["A bookshop where you buy books","A place to borrow books","A collection of free samples","A printing facility"],correct:1,
    trap:"The French 'librairie' means 'bookshop'. 'Library' is where you borrow books.",realFr:"bibliothèque"},
  {en:"comprehensive",ex:"The report provides a comprehensive overview of the market.",
    opts:["Understanding, sympathetic","Easy to understand","Thorough, covering everything","Compressed, summarized"],correct:2,
    trap:"The French 'compréhensif' means 'understanding/sympathetic'. 'Comprehensive' means 'thorough, complete'.",realFr:"complet, exhaustif"},
  {en:"demand",ex:"The union demanded a 5% pay increase.",
    opts:["To ask politely","To wonder about","To request information","To insist strongly, to require"],correct:3,
    trap:"The French 'demander' means 'to ask'. 'Demand' is much stronger: 'to insist, to require'.",realFr:"exiger"},
  {en:"achieve",ex:"We achieved record sales this quarter.",
    opts:["To finish, to complete","To succeed in reaching a goal","To purchase, to acquire","To deliver, to ship"],correct:1,
    trap:"The French 'achever' means 'to finish/complete'. 'Achieve' means 'to succeed in reaching a goal'.",realFr:"accomplir, atteindre"},
  {en:"supply",ex:"The supplier cannot supply enough raw materials.",
    opts:["To add extra, to supplement","To replace, to substitute","To provide, to furnish","To request, to order"],correct:2,
    trap:"The French 'suppléer/supplémentaire' relates to 'extra/additional'. 'Supply' means 'to provide'.",realFr:"fournir, approvisionner"},
  {en:"figure",ex:"Sales figures for Q3 are very encouraging.",
    opts:["A face, a person's appearance","A figurine, a small statue","A number, statistic, or diagram","A shape, a silhouette"],correct:2,
    trap:"In French, 'figure' primarily means 'face'. In English business context, 'figure' = number/statistic.",realFr:"chiffre, schéma"},
  {en:"engaged",ex:"The line was engaged when I tried to call.",
    opts:["Politically committed","Busy, in use (phone)","Hired, recruited","Interested, enthusiastic"],correct:1,
    trap:"The French 'engagé' means 'committed (politically)'. English 'engaged' often means 'busy' (phone) or 'betrothed'.",realFr:"occupé (téléphone)"},
  {en:"introduce",ex:"Let me introduce our new marketing director.",
    opts:["To insert something into","To bring a product to market","To present someone new","To begin a process"],correct:2,
    trap:"The French 'introduire' means 'to insert'. English 'introduce' means 'to present someone/something new'.",realFr:"présenter"},
  {en:"location",ex:"The new office location is near the train station.",
    opts:["A rental, a lease","A place, position, or site","A reservation, a booking","An allocation, a distribution"],correct:1,
    trap:"The French 'location' means 'rental'. English 'location' means 'a place or position'.",realFr:"emplacement, lieu"},
  {en:"notice",ex:"Did you notice the error in the report?",
    opts:["To read instructions carefully","To take note of officially","To become aware of, to observe","To announce, to declare"],correct:2,
    trap:"The French 'notice' means 'instruction manual'. English 'notice' means 'to become aware of' or 'a written announcement'.",realFr:"remarquer"},
  {en:"issue",ex:"We need to address this issue before the launch.",
    opts:["An exit, a way out","A result, an outcome","A release, a publication only","A problem, topic, or edition"],correct:3,
    trap:"The French 'issue' means 'exit/outcome'. English 'issue' primarily means 'a problem or topic'.",realFr:"problème, sujet"},
  {en:"conference",ex:"Over 500 people attended the annual conference.",
    opts:["A university lecture","A large formal meeting or event","A phone call between colleagues","A presentation by one speaker"],correct:1,
    trap:"The French 'conférence' often means 'lecture'. English 'conference' = large formal meeting/event.",realFr:"congrès, conférence (réunion)"},
  {en:"agenda",ex:"The first item on the agenda is the budget review.",
    opts:["A personal diary or planner","A schedule for the whole day","A list of topics for a meeting","A calendar of upcoming events"],correct:2,
    trap:"The French 'agenda' means 'diary/planner'. English 'agenda' = list of items to discuss at a meeting.",realFr:"ordre du jour"},
  {en:"coin",ex:"The company tried to coin a new marketing term.",
    opts:["A corner, an angle","To wedge something in place","To invent a new word or phrase","A small metal piece of money"],correct:2,
    trap:"The French 'coin' means 'corner'. English 'coin' as a verb means 'to invent a new word/phrase'. As a noun it's a piece of money.",realFr:"inventer (un terme)"},
];
// ─── PART 2: QUESTION-RESPONSE ───
var LISTENING_P2 = [
  {id:"l2a",q:"When is the budget meeting scheduled?",
    opts:["It's on Thursday at 2 PM.","Yes, I like the schedule.","The budget was approved."],
    c:0,x:"'When' asks for a time. Only A gives a time (Thursday at 2 PM)."},
  {id:"l2b",q:"Who's responsible for the marketing campaign?",
    opts:["It was very successful.","Ms. Rivera is leading it.","We launched it last month."],
    c:1,x:"'Who' asks for a person. Only B names someone (Ms. Rivera)."},
  {id:"l2c",q:"Where did you put the quarterly report?",
    opts:["It's due next Friday.","About 30 pages long.","On your desk, next to the laptop."],
    c:2,x:"'Where' asks for a place. Only C gives a location (on your desk)."},
  {id:"l2d",q:"Why was the delivery delayed?",
    opts:["It arrived this morning.","Because of a supplier issue.","Three boxes were missing."],
    c:1,x:"'Why' asks for a reason. Only B gives a cause (because of a supplier issue)."},
  {id:"l2e",q:"How many copies do we need for the presentation?",
    opts:["The presentation went well.","About twenty-five should be enough.","It starts at 10 AM."],
    c:1,x:"'How many' asks for a quantity. Only B gives a number (twenty-five)."},
  {id:"l2f",q:"Would you like to join us for lunch?",
    opts:["The restaurant is nearby.","I already ate, but thanks.","Lunch is at noon."],
    c:1,x:"This is an invitation. B is an indirect but natural decline. A and C are factual but don't answer the invitation."},
  {id:"l2g",q:"Hasn't the new software been installed yet?",
    opts:["Yes, it's a new version.","The IT team is working on it now.","I prefer the old software."],
    c:1,x:"Negative question about status. B addresses the current situation. A repeats 'new' (trap). C is an opinion, not an answer."},
  {id:"l2h",q:"Do you want the report in PDF or printed?",
    opts:["Yes, the report is ready.","PDF would be easier to share.","I wrote it yesterday."],
    c:1,x:"'Or' question = choose one. B makes a choice (PDF). A says 'Yes' (trap for or-questions). C is unrelated."},
  {id:"l2i",q:"The conference room is on the third floor, isn't it?",
    opts:["Actually, it was moved to the second floor.","The conference starts at 3.","Yes, I have the room key."],
    c:0,x:"Tag question asking for confirmation. A corrects the information. B uses 'third/3' (number trap). C doesn't address the location."},
  {id:"l2j",q:"How should I send the contract to the client?",
    opts:["The client signed it already.","Email would be the fastest option.","It's a three-year contract."],
    c:1,x:"'How' asks for a method. B suggests a method (email). A and C give facts about the contract but not how to send it."},
  {id:"l2k",q:"Could you review this proposal before Friday?",
    opts:["The proposal was rejected.","Sure, I'll look at it tomorrow.","Friday is a holiday."],
    c:1,x:"This is a request. B accepts and gives a timeline. A talks about a past proposal. C mentions Friday but doesn't answer the request."},
  {id:"l2l",q:"What time does the train to Manchester leave?",
    opts:["The platform number is 7.","Manchester is about two hours away.","The next one departs at 4:15."],
    c:2,x:"'What time' asks for a specific time. Only C gives a departure time (4:15)."},
  {id:"l2m",q:"Who should I contact about the office renovation?",
    opts:["The renovation will take three weeks.","Try the facilities manager, Mr. Chen.","The office looks much better now."],
    c:1,x:"'Who' asks for a person. B names someone (Mr. Chen). A and C discuss the renovation but don't name a contact."},
  {id:"l2n",q:"Why don't we postpone the meeting until next week?",
    opts:["That works better for everyone.","The meeting room is available.","We postponed it already."],
    c:0,x:"'Why don't we' is a suggestion. A accepts the suggestion. B and C don't respond to the proposal."},
  {id:"l2o",q:"Have you finished reviewing the applications?",
    opts:["There were over 50 applicants.","I still have a few more to go through.","The application deadline was Monday."],
    c:1,x:"Yes/No question about task completion. B gives a status update. A and C mention applications but don't answer about progress."},
];

// ─── PART 1: PHOTOGRAPHS ───
var LISTENING_P1 = [
  {id:"l1a",scene:"A woman in business attire is standing at a podium, speaking into a microphone. Several rows of seated people face her. A large screen behind her shows a bar chart.",
    opts:["The woman is giving a presentation.","The woman is sitting in the audience.","The screen is being turned off.","The people are leaving the room."],
    c:0,x:"The woman is at the podium speaking — she's giving a presentation. B contradicts (she's standing, not sitting). C and D are not supported."},
  {id:"l1b",scene:"Two men in hard hats are looking at a large blueprint spread across a table at a construction site. Building materials are stacked behind them.",
    opts:["The men are eating lunch at a table.","Construction materials are being delivered.","Two workers are reviewing building plans.","The men are wearing business suits."],
    c:2,x:"They're looking at a blueprint (building plans) at a construction site. A is wrong (not eating). B is wrong (materials are stacked, not being delivered). D is wrong (hard hats, not suits)."},
  {id:"l1c",scene:"A hotel receptionist is handing a key card to a guest across the front desk. The guest has a suitcase beside him. A sign on the wall reads 'Check-in'.",
    opts:["The guest is checking out of the hotel.","A key card is being given to a guest.","The receptionist is carrying luggage.","The sign says 'Exit'."],
    c:1,x:"The receptionist is handing a key card to the guest. A is wrong (sign says Check-in, not check-out). C is wrong (guest has the suitcase). D contradicts the sign."},
  {id:"l1d",scene:"Several people are seated around a large conference table. Laptops are open in front of most of them. One person at the head of the table is pointing at a whiteboard.",
    opts:["A meeting is taking place in a conference room.","The office is empty.","Everyone is standing near the whiteboard.","The laptops are closed and put away."],
    c:0,x:"People around a table with laptops, one pointing at whiteboard = a meeting. B, C, and D all contradict what's described."},
  {id:"l1e",scene:"A woman is reaching for a book on a high shelf in a library. She is using a small step ladder. Rows of bookshelves extend behind her.",
    opts:["The woman is putting books on the shelf.","Books are scattered on the floor.","A woman is reaching for a book on a shelf.","The library is closed."],
    c:2,x:"She's reaching FOR a book (getting it), not putting one back. C correctly describes the action. A reverses the action. B and D are not supported."},
  {id:"l1f",scene:"A waiter is placing plates of food on a table where three diners are seated. The restaurant appears busy with other occupied tables in the background.",
    opts:["The restaurant is completely empty.","Food is being served to customers.","The diners are cooking their own meals.","The waiter is cleaning the tables."],
    c:1,x:"The waiter is placing food = food is being served. A contradicts (busy restaurant). C is illogical. D is wrong (placing food, not cleaning)."},
  {id:"l1g",scene:"A man in a suit is shaking hands with another man across a desk. There are documents and pens on the desk between them. A framed certificate hangs on the wall.",
    opts:["The men are arguing about a contract.","Two men are shaking hands in an office.","The desk is completely clear.","One of the men is writing on the documents."],
    c:1,x:"Two men shaking hands across a desk = B. A (arguing) is not supported. C contradicts (documents on desk). D is wrong (shaking hands, not writing)."},
  {id:"l1h",scene:"Cars are lined up in heavy traffic on a city street. A traffic light shows red. Pedestrians are waiting on the sidewalk to cross.",
    opts:["Traffic is flowing smoothly on the highway.","The traffic light is green.","Vehicles are stopped at a red light.","Pedestrians are crossing the street."],
    c:2,x:"Red light + cars lined up = vehicles are stopped. A contradicts (heavy traffic, not smooth). B contradicts (red, not green). D is wrong (waiting, not crossing)."},
];
// ─── HELPERS ───
function today(){return new Date().toISOString().split("T")[0];}

// ─── TTS ENGINE (swap to ElevenLabs when migrated) ───
var _voices=null;
function getEnVoice(){
  if(_voices)return _voices;
  var all=window.speechSynthesis?window.speechSynthesis.getVoices():[];
  // Prefer: US English > UK English > any English
  var pref=["en-US","en-GB","en-AU","en"];
  for(var p=0;p<pref.length;p++){
    for(var i=0;i<all.length;i++){
      if(all[i].lang&&all[i].lang.indexOf(pref[p])===0){_voices=all[i];return _voices;}
    }
  }
  return all[0]||null;
}
var _audioCache={};
async function speak(text,rate){
  var key=text.toLowerCase().trim();
  // Check cache first
  if(_audioCache[key]){
    var a=_audioCache[key].cloneNode();
    a.playbackRate=rate||0.9;
    a.play().catch(function(){});
    return;
  }
  // Try ElevenLabs API
  var isLocal=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1';
  if(!isLocal)try{
    var res=await fetch('/api/tts',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:text,voice:'us_female'})
    });
    if(res.ok){
      var blob=await res.blob();
      var url=URL.createObjectURL(blob);
      var audio=new Audio(url);
      audio.playbackRate=rate||0.9;
      _audioCache[key]=audio;
      audio.play().catch(function(){});
      return;
    }
  }catch(e){}
  // Fallback to browser TTS if ElevenLabs fails
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  var v=getEnVoice();if(v)u.voice=v;u.lang="en-US";
  window.speechSynthesis.speak(u);
}
function speakAndWait(text,rate){
  return new Promise(function(resolve){
    var isLocal=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1';
    if(!isLocal&&_audioCache[text.toLowerCase().trim()]){
      var a=_audioCache[text.toLowerCase().trim()].cloneNode();
      a.playbackRate=rate||0.9;
      a.onended=resolve;
      a.onerror=resolve;
      a.play().catch(resolve);
      return;
    }
    if(!isLocal){
      fetch('/api/tts',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({text:text,voice:'us_female'})
      }).then(function(res){
        if(res.ok)return res.blob();
        throw new Error('tts failed');
      }).then(function(blob){
        var url=URL.createObjectURL(blob);
        var audio=new Audio(url);
        audio.playbackRate=rate||0.9;
        _audioCache[text.toLowerCase().trim()]=audio;
        audio.onended=resolve;
        audio.onerror=resolve;
        audio.play().catch(resolve);
      }).catch(function(){
        speakBrowserTTS(text,rate,resolve);
      });
      return;
    }
    speakBrowserTTS(text,rate,resolve);
  });
}
function speakBrowserTTS(text,rate,cb){
  if(!window.speechSynthesis){cb();return;}
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.rate=rate||0.9;u.pitch=1;u.volume=1;
  var v=getEnVoice();if(v)u.voice=v;u.lang="en-US";
  u.onend=cb;u.onerror=cb;
  window.speechSynthesis.speak(u);
}
// Preload voices (some browsers need this)
if(window.speechSynthesis){window.speechSynthesis.onvoiceschanged=function(){_voices=null;getEnVoice();};}

// ─── AUDIO BUTTON COMPONENT ───
function SpeakBtn(p){
  var[playing,sP]=useState(false);
  function go(){
    sP(true);
    speak(p.text,p.rate||0.9);
    setTimeout(function(){sP(false);},Math.max(1000,p.text.length*80));
  }
  return(<button onClick={function(e){e.stopPropagation();go();}}
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:p.size||36,height:p.size||36,borderRadius:"50%",
      background:playing?"rgba(0,212,255,.2)":"rgba(255,255,255,.06)",border:"1px solid "+(playing?"var(--cyan)":"var(--bdr)"),
      cursor:"pointer",transition:"all .2s",flexShrink:0}}>
    <span style={{fontSize:p.size?p.size*0.5:18,lineHeight:1}}>{playing?"🔊":"🔈"}</span>
  </button>);
}
function weekId(){var n=new Date(),s=new Date(n.getFullYear(),0,1);return n.getFullYear()+"-W"+Math.floor((n-s)/(7*864e5));}
function shuffle(a){var b=a.slice();for(var i=b.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=b[i];b[i]=b[j];b[j]=t;}return b;}
function srand(s){var x=Math.sin(s)*10000;return x-Math.floor(x);}
function getLevel(xp){var lv=1,need=150,rem=xp;while(rem>=need){rem-=need;lv++;need=150+(lv-1)*30;}return{level:lv,cur:rem,next:need};}
function getLeague(wxp){var l=LEAGUES[0];for(var i=0;i<LEAGUES.length;i++)if(wxp>=LEAGUES[i].min)l=LEAGUES[i];return l;}
function dailyQs(date){var seed=0;for(var i=0;i<date.length;i++)seed+=date.charCodeAt(i);var a=QUESTIONS.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(srand(seed+i)*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a.slice(0,5);}
function compScores(wk){var seed=0;for(var i=0;i<wk.length;i++)seed+=wk.charCodeAt(i);return COMPETITORS.map(function(c,idx){return{name:c.n,avatar:c.a,xp:Math.floor(srand(seed+idx*137)*600+50+srand(seed+idx*53+Math.floor(Date.now()/864e5))*100)};});}
function srsUp(st,r){var e=st.ease||2.5,iv=st.interval||0;if(r===1){iv=1;e=Math.max(1.3,e-0.2);}else if(r===2){iv=Math.max(1,Math.ceil(iv*1.2));e=Math.max(1.3,e-0.15);}else if(r===3){iv=iv===0?1:Math.ceil(iv*e);}else{iv=iv===0?3:Math.ceil(iv*e*1.3);e+=0.15;}var nx=new Date();nx.setDate(nx.getDate()+iv);return{ease:e,interval:iv,nextReview:nx.toISOString().split("T")[0],correct:(st.correct||0)+(r>=3?1:0),total:(st.total||0)+1};}
function dueCards(states,cards){var t=today(),due=[],nw=[];for(var i=0;i<cards.length;i++){var s=states[cards[i].id];if(!s)nw.push(cards[i]);else if(s.nextReview<=t)due.push(cards[i]);}return due.concat(nw.slice(0,Math.max(0,10-due.length))).slice(0,15);}

var SK="toeic-arena-v2";
import { supabase } from './supabase.js'

async function load() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (!data) return null;
  // Reconstitue l'objet userData à partir des colonnes
  return {
    name: data.name,
    xp: data.xp,
    weeklyXp: data.weekly_xp,
    weekId: data.week_id,
    streak: data.streak,
    lastActive: data.last_active,
    cardStates: data.card_states,
    daily: data.daily_challenge,
    stats: data.stats,
    moduleScores: data.module_scores,
    mission: data.mission,
  };
}

async function save(d) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('students').upsert({
    id: user.id,
    name: d.name,
    xp: d.xp,
    weekly_xp: d.weeklyXp,
    week_id: d.weekId,
    streak: d.streak,
    last_active: d.lastActive,
    card_states: d.cardStates,
    daily_challenge: d.daily,
    stats: d.stats,
    module_scores: d.moduleScores,
    mission: d.mission,
  });
}
function fresh(name){return{name:name,xp:0,streak:0,lastActive:null,weeklyXp:0,weekId:weekId(),cardStates:{},daily:{date:null,done:false,score:0,xpE:0},stats:{totalQ:0,correct:0,sessions:0,cardsRev:0,perfects:0,drills:0},moduleScores:{},mission:{date:null,actId:null,done:false}};}

// ─── MODULE SCORE TRACKING ───
function recordModule(u,modId,sc,tot){
  if(!u.moduleScores)u.moduleScores={};
  var prev=u.moduleScores[modId]||{correct:0,total:0,sessions:0,lastDate:null};
  u.moduleScores[modId]={correct:prev.correct+sc,total:prev.total+tot,sessions:prev.sessions+1,lastDate:today()};
  return u;
}
function checkMission(u,modId){
  if(!u.mission)return u;
  if(u.mission.date===today()&&u.mission.actId===modId&&!u.mission.done){
    u.mission.done=true;
    u.xp+=15;u.weeklyXp+=15; // Mission bonus
  }
  return u;
}
function getModuleAccuracy(u,modId){
  if(!u.moduleScores||!u.moduleScores[modId])return null;
  var m=u.moduleScores[modId];
  if(m.total===0)return null;
  return Math.round(m.correct/m.total*100);
}

// ─── RECOMMENDATION ENGINE ───
var MISSION_THRESHOLD=10; // min sessions before recommending
var MISSION_MODULES=[
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
];

function getDailyMission(u){
  if(!u.moduleScores)return null;
  if((u.stats.sessions||0)<MISSION_THRESHOLD)return{status:"calibrating",remaining:MISSION_THRESHOLD-(u.stats.sessions||0)};

  // Already have a mission for today?
  if(u.mission&&u.mission.date===today())return{status:u.mission.done?"completed":"active",actId:u.mission.actId,mod:MISSION_MODULES.find(function(m){return m.id===u.mission.actId;}),done:u.mission.done};

  // Generate new mission: find weakest module
  var candidates=[];
  for(var i=0;i<MISSION_MODULES.length;i++){
    var m=MISSION_MODULES[i];
    var ms=u.moduleScores[m.id];
    if(!ms){
      // Never tried — high priority
      candidates.push({mod:m,priority:0,reason:"You haven't tried this yet!"});
    } else {
      var acc=ms.total>0?ms.correct/ms.total:0;
      var daysSince=ms.lastDate?Math.floor((new Date()-new Date(ms.lastDate))/(864e5)):999;
      // Score: lower accuracy + more days since last = higher priority
      var score=((1-acc)*70)+(Math.min(daysSince,14)*2);
      var reasonText=acc<0.5?"Accuracy is low — let's improve!":acc<0.7?"Room for improvement here.":daysSince>5?"It's been a while — keep it fresh!":"Maintain your level.";
      candidates.push({mod:m,priority:score,reason:reasonText});
    }
  }
  // Sort by priority descending, pick top
  candidates.sort(function(a,b){return b.priority-a.priority;});
  // Add some variety: pick from top 3 using day seed
  var seed=0;var d=today();for(var j=0;j<d.length;j++)seed+=d.charCodeAt(j);
  var pick=candidates[seed%Math.min(3,candidates.length)];
  return{status:"new",actId:pick.mod.id,mod:pick.mod,reason:pick.reason};
}

// ─── PLACEMENT TEST ───
var PLACEMENT_TEST = [
  {id:"pt1",s:"She _____ at this company since 2019.",o:["works","worked","has worked","is working"],c:2,x:"'Since 2019' = present perfect.",diff:1,cat:"Tenses"},
  {id:"pt2",s:"The report must be _____ by Friday.",o:["submit","submitted","submitting","submits"],c:1,x:"Passive with modal: must be + past participle.",diff:1,cat:"Passive Voice"},
  {id:"pt3",s:"All employees are responsible _____ their own equipment.",o:["of","for","to","with"],c:1,x:"'Responsible for' = fixed collocation.",diff:1,cat:"Prepositions"},
  {id:"pt4",s:"The _____ of the new policy surprised everyone.",o:["announce","announcement","announced","announcing"],c:1,x:"'The _____ of' = noun needed. 'Announcement'.",diff:2,cat:"Word Families"},
  {id:"pt5",s:"_____ the budget cuts, the project was completed on time.",o:["Despite","Although","However","Because"],c:0,x:"'Despite' + noun phrase (no clause).",diff:2,cat:"Connectors"},
  {id:"pt6",s:"The company plans to _____ a survey among its customers.",o:["conduct","make","do","perform"],c:0,x:"'Conduct a survey' = standard business collocation.",diff:2,cat:"Collocations"},
  {id:"pt7",s:"Neither the CEO nor the directors _____ available for comment.",o:["was","is","were","has"],c:2,x:"'Neither...nor' = verb agrees with nearest subject (directors = plural).",diff:3,cat:"Subject-Verb Agreement"},
  {id:"pt8",s:"The team suggested _____ the launch to next quarter.",o:["to postpone","postponing","postpone","postponed"],c:1,x:"'Suggest' takes gerund (-ing).",diff:3,cat:"Gerunds vs Infinitives"},
  {id:"pt9",s:"This model is _____ than the previous one.",o:["more efficient","most efficient","as efficient","efficiently"],c:0,x:"Comparative: more + adjective + THAN.",diff:3,cat:"Comparatives"},
  {id:"pt10",s:"Had we known about the issue earlier, we _____ it sooner.",o:["fixed","would fix","would have fixed","will fix"],c:2,x:"Third conditional: Had + past participle, would have + past participle.",diff:3,cat:"Conditionals"},
  {id:"pt11",s:"The client _____ the proposal was sent has not responded.",o:["who","to whom","which","whose"],c:1,x:"'To whom' = formal. The proposal was sent TO the client.",diff:4,cat:"Relative Pronouns"},
  {id:"pt12",s:"The factory _____ 10,000 units by the end of this month.",o:["produces","will have produced","produced","producing"],c:1,x:"'By the end of' = future perfect: will have produced.",diff:4,cat:"Tenses"},
  {id:"pt13",s:"_____ information in this report is confidential.",o:["A","An","The","Some"],c:2,x:"'The' = specific information (in THIS report). Definite article.",diff:4,cat:"Articles"},
  {id:"pt14",s:"The new regulation _____ into effect on April 1st.",o:["goes","went","has gone","is going"],c:0,x:"Scheduled future event = present simple.",diff:5,cat:"Tenses"},
  {id:"pt15",s:"It _____ that the merger will be completed by June.",o:["expects","is expected","expecting","has expecting"],c:1,x:"'It is expected that...' = impersonal passive construction.",diff:5,cat:"Passive Voice"},
];
var PLACEMENT_LEVELS=[
  {min:0,max:4,label:"Beginner",startXp:0,league:"bronze",msg:"The Arena awaits — let's build your skills from the ground up!"},
  {min:5,max:8,label:"Intermediate",startXp:100,league:"bronze",msg:"Solid base! Time to sharpen your weak spots and climb the ranks."},
  {min:9,max:12,label:"Upper Intermediate",startXp:250,league:"silver",msg:"Strong foundation! Focus on advanced grammar and test strategies."},
  {min:13,max:15,label:"Advanced",startXp:500,league:"gold",msg:"Impressive! You're ready for exam simulation and fine-tuning."},
];

// ─── TEACHER DASHBOARD CONFIG ───
var TEACHER_CODE="idrac2026";

// ─── CSS ───
var CSS=`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--bg:#080b16;--bg2:#131833;--bg3:#1a2045;--bdr:rgba(100,130,255,0.08);--cyan:#00d4ff;--orange:#ff8c42;--gold:#ffd700;--green:#00e676;--red:#ff4757;--purple:#a855f7;--t1:#eef2ff;--t2:#7b86a8;--t3:#4a5478}
body{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--t1)}
@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
@keyframes flame{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(1.1) rotate(2deg)}50%{transform:scale(1.05) rotate(-1deg)}75%{transform:scale(1.12) rotate(1deg)}}
@keyframes xpPop{0%{transform:translateY(0) scale(.5);opacity:0}30%{transform:translateY(-10px) scale(1.2);opacity:1}100%{transform:translateY(-40px) scale(1);opacity:0}}
@keyframes flip{0%{transform:rotateY(90deg);opacity:0}100%{transform:rotateY(0);opacity:1}}
@keyframes countUp{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;overflow-x:hidden}
.enter{animation:fadeIn .3s ease-out}
.crd{background:var(--bg2);border:1px solid var(--bdr);border-radius:16px;padding:20px}
.glo{box-shadow:0 0 30px rgba(0,212,255,.06)}
.btn1{background:linear-gradient(135deg,#00d4ff,#0088cc);color:#fff;border:none;border-radius:12px;padding:14px 28px;font-family:'Outfit',sans-serif;font-weight:700;font-size:16px;cursor:pointer;width:100%;transition:all .2s}
.btn1:active{transform:scale(.97)}
.btn2{background:var(--bg2);border:1px solid var(--bdr);color:var(--t1);border-radius:12px;padding:12px 24px;font-family:'Outfit',sans-serif;font-weight:600;font-size:14px;cursor:pointer}
.fl{animation:flame 1.5s ease-in-out infinite;display:inline-block}
.sk{animation:shake .4s ease-in-out}
.out{font-family:'Outfit',sans-serif}`;

// ─── SMALL COMPONENTS ───
function Bar(p){var pct=p.max>0?Math.min(100,p.value/p.max*100):0;return(<div style={{width:"100%",height:p.h||8,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden"}}><div style={{width:pct+"%",height:"100%",background:p.color||"linear-gradient(90deg,#00d4ff,#0088ff)",borderRadius:99,transition:"width .8s cubic-bezier(.4,0,.2,1)"}}/></div>);}

function XpToast(p){if(!p.v)return null;
  var info=typeof p.v==="object"?p.v:{total:p.v,base:p.v,bonuses:[]};
  return(<div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:200,animation:"xpPop 2s ease-out forwards",pointerEvents:"none",textAlign:"center"}}>
    <div style={{background:"linear-gradient(135deg,#ffd700,#ff8c42)",color:"#000",padding:"8px 20px",borderRadius:99,fontWeight:800,fontSize:18,boxShadow:"0 4px 20px rgba(255,215,0,.4)"}} className="out">+{info.total} XP</div>
    {info.bonuses&&info.bonuses.length>0&&<div style={{marginTop:6,display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>
      {info.bonuses.map(function(b,i){return (<div key={i} style={{background:"rgba(0,0,0,.7)",padding:"3px 12px",borderRadius:99,fontSize:11,fontWeight:600,color:b.color||"var(--gold)"}} className="out">{b.label}</div>);})}
    </div>}
  </div>);}

function Tabs(p){var tabs=[{id:"home",l:"Home",i:"⚡"},{id:"train",l:"Train",i:"🎯"},{id:"cards",l:"Cards",i:"🃏"},{id:"league",l:"League",i:"🏆"},{id:"profile",l:"Profile",i:"👤"}];
return(<div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"linear-gradient(180deg,rgba(8,11,22,0) 0%,rgba(8,11,22,.95) 20%,#080b16 100%)",padding:"8px 12px 12px",zIndex:100,display:"flex",justifyContent:"space-around"}}>
{tabs.map(function(t){var a=p.cur===t.id;return(<button key={t.id} onClick={function(){p.go(t.id);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"6px 12px",borderRadius:12,color:a?"var(--cyan)":"var(--t3)",transform:a?"scale(1.05)":"scale(1)",transition:"all .2s"}}>
<span style={{fontSize:22,lineHeight:1}}>{t.i}</span><span style={{fontSize:10,fontWeight:a?700:500,letterSpacing:.5}} className="out">{t.l}</span>{a&&<div style={{width:4,height:4,borderRadius:"50%",background:"var(--cyan)",marginTop:1}}/>}</button>);})}</div>);}

// ─── ONBOARDING ───
function Onboard(p){
  var[step,sSt]=useState("name"); // name, test, results, teacher
  var[name,sN]=useState("");
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");
  var[teacherCode,sTC]=useState("");

  function startTest(){sSt("test");}
  function doAns(i){sS(i);if(i===PLACEMENT_TEST[ci].c)sSc(sc+1);sP("fb");}
  function nxt(){if(ci<PLACEMENT_TEST.length-1){sC(ci+1);sS(-1);sP("q");}else sSt("results");}

  var lvl=PLACEMENT_LEVELS.find(function(l){return sc>=l.min&&sc<=l.max;})||PLACEMENT_LEVELS[0];

  // ─ Name entry ─
  if(step==="name")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .8s ease-out"}}>
        <div style={{fontSize:64,marginBottom:16}}>⚔️</div>
        <h1 className="out" style={{fontWeight:900,fontSize:36,background:"linear-gradient(135deg,#00d4ff,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>TOEIC ARENA</h1>
        <p style={{color:"var(--t2)",fontSize:15,marginBottom:40,lineHeight:1.5}}>Train smarter. Climb the ranks.<br/>Conquer the TOEIC.</p>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Your arena name</label>
          <input type="text" value={name} onChange={function(e){sN(e.target.value);}} placeholder="Enter your name..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){if(name.trim())startTest();}}
          style={{opacity:name.trim()?1:.4,pointerEvents:name.trim()?"auto":"none",fontSize:18,padding:"16px 32px"}}>Next — Take Placement Test</button>
        <button onClick={function(){sSt("teacher");}} style={{marginTop:20,background:"none",border:"none",color:"var(--t3)",fontSize:12,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Teacher access</button>
      </div>
    </div>);

  // ─ Teacher login ─
  if(step==="teacher")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:48,marginBottom:16}}>👨‍🏫</div>
        <h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:20}}>Teacher Dashboard</h2>
        <div style={{marginBottom:20,textAlign:"left"}}>
          <label className="out" style={{fontSize:12,fontWeight:600,color:"var(--t2)",textTransform:"uppercase",letterSpacing:1,marginBottom:8,display:"block"}}>Access code</label>
          <input type="password" value={teacherCode} onChange={function(e){sTC(e.target.value);}} placeholder="Enter teacher code..."
            style={{width:"100%",padding:"14px 18px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,color:"var(--t1)",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none"}}/>
        </div>
        <button className="btn1" onClick={function(){if(teacherCode===TEACHER_CODE)p.goTeacher();}}
          style={{opacity:teacherCode?1:.4,pointerEvents:teacherCode?"auto":"none"}}>Access Dashboard</button>
        {teacherCode&&teacherCode!==TEACHER_CODE&&teacherCode.length>=4&&<p style={{color:"var(--red)",fontSize:12,marginTop:8}}>Invalid code</p>}
        <button onClick={function(){sSt("name");}} style={{marginTop:16,background:"none",border:"none",color:"var(--t3)",fontSize:13,cursor:"pointer"}}>Back to student login</button>
      </div>
    </div>);

  // ─ Results ─
  if(step==="results")return(
    <div className="app" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:32,textAlign:"center"}}>
      <div style={{animation:"fadeIn .5s"}}>
        <div style={{fontSize:56,marginBottom:12,animation:"countUp .6s"}}>{sc>=13?"🏆":sc>=9?"⚔️":sc>=5?"🛡️":"📚"}</div>
        <h2 className="out" style={{fontWeight:900,fontSize:28,marginBottom:4}}>Placement Result</h2>
        <div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",marginBottom:8,animation:"countUp .8s"}}>{sc}/15</div>
        <div style={{display:"inline-block",padding:"6px 16px",borderRadius:99,background:"rgba(0,212,255,.1)",border:"1px solid rgba(0,212,255,.2)",marginBottom:12}}>
          <span className="out" style={{fontWeight:800,fontSize:16,color:"var(--cyan)"}}>{lvl.label}</span>
        </div>
        <p style={{color:"var(--t2)",fontSize:14,lineHeight:1.6,marginBottom:8}}>{lvl.msg}</p>
        <p style={{color:"var(--gold)",fontSize:13,fontWeight:600,marginBottom:32}}>Starting with {lvl.startXp} XP in {lvl.league.charAt(0).toUpperCase()+lvl.league.slice(1)} League</p>
        <button className="btn1" onClick={function(){p.go(name.trim(),sc,lvl);}} style={{fontSize:18,padding:"16px 32px"}}>Enter the Arena</button>
      </div>
    </div>);

  // ─ Placement Test ─
  var q=PLACEMENT_TEST[ci];
  return(
    <div className="app" style={{padding:"20px 16px",minHeight:"100vh"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><p className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)"}}>Placement Test</p>
          <p style={{fontSize:11,color:"var(--t3)"}}>Question {ci+1} of 15</p></div>
        <div style={{display:"flex",alignItems:"center",gap:3}}>
          {PLACEMENT_TEST.map(function(q,i){
            var col=i<ci?"var(--green)":i===ci?"var(--cyan)":"var(--t3)";
            return (<div key={i} style={{width:i===ci?14:6,height:5,borderRadius:3,background:col,transition:"all .3s"}}/>);
          })}
        </div>
      </div>
      <Bar value={ci} max={15} h={4} color="linear-gradient(90deg,#00d4ff,#a855f7)"/>

      <div style={{display:"flex",gap:4,marginTop:12,marginBottom:4}}>
        {[1,2,3,4,5].map(function(d){
          var active=q.diff===d;
          return (<div key={d} style={{width:8,height:8,borderRadius:"50%",background:active?"var(--gold)":"var(--t3)",opacity:active?1:.3}}/>);
        })}
        <span style={{fontSize:10,color:"var(--t3)",marginLeft:4}} className="out">Difficulty {q.diff}/5</span>
      </div>

      <h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:16}}>{q.s}</h2>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {q.o.map(function(opt,i){
          var isCor=i===q.c;var isPick=sel===i;var show=ph==="fb";
          var bg="var(--bg2)";var bd="var(--bdr)";
          if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
          else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
          return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
              {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>

      {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
        <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:14}}>
          <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
        <button className="btn1" onClick={nxt} style={{marginTop:14}}>{ci<14?"Next":"See Results"}</button>
      </div>}
    </div>);
}

// ─── HOME ───
function Home(p){var u=p.u,lv=getLevel(u.xp),lg=getLeague(u.weeklyXp),dd=u.daily.date===today()&&u.daily.done;return(
<div className="enter" style={{padding:"20px 16px 100px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<div><p style={{color:"var(--t2)",fontSize:13,marginBottom:2}}>Welcome back</p><h1 className="out" style={{fontWeight:800,fontSize:24}}>{u.name} ⚔️</h1></div>
<div style={{textAlign:"center"}}><span className="fl" style={{fontSize:28}}>{u.streak>0?"🔥":"❄️"}</span><div className="out" style={{fontSize:13,fontWeight:700,color:u.streak>0?"var(--orange)":"var(--t3)"}}>{u.streak}</div></div></div>

{/* Active bonus indicators */}
{function(){
  var pills=[];var dow=new Date().getDay();
  if(dow===0||dow===6)pills.push({label:"x2 Weekend",col:"#ff6bff",icon:"🎉"});
  if(u.streak>=7)pills.push({label:"x1.5 Streak",col:"#ff8c42",icon:"🔥"});
  else if(u.streak>=3)pills.push({label:"x1.2 Streak",col:"#ff8c42",icon:"🔥"});
  if(u.lastActive!==today())pills.push({label:"+10 Login bonus",col:"#00e676",icon:"🎁"});
  if(pills.length===0)return null;
  return(<div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
    {pills.map(function(p,i){return (<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:99,background:p.col+"15",border:"1px solid "+p.col+"30",fontSize:11,fontWeight:600,color:p.col}} className="out"><span style={{fontSize:12}}>{p.icon}</span>{p.label}</div>);})}
  </div>);
}()}

<div className="crd glo" style={{marginBottom:16}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",gap:10}}>
<div style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#0088cc)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16}} className="out">{lv.level}</div>
<div><div className="out" style={{fontSize:13,fontWeight:700}}>Level {lv.level}</div><div style={{fontSize:11,color:"var(--t2)"}}>{lv.cur} / {lv.next} XP</div></div></div>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",background:"rgba(255,255,255,.04)",borderRadius:99}}>
<span style={{fontSize:16}}>{lg.icon}</span><span className="out" style={{fontSize:12,fontWeight:600,color:lg.color}}>{lg.name}</span></div></div>
<Bar value={lv.cur} max={lv.next} h={6}/></div>

<div className="crd" onClick={function(){if(!dd)p.nav("daily");}} style={{marginBottom:16,cursor:dd?"default":"pointer",background:dd?"var(--bg2)":"linear-gradient(135deg,rgba(0,212,255,.12),rgba(168,85,247,.12))",border:dd?"1px solid var(--bdr)":"1px solid rgba(0,212,255,.2)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><span style={{fontSize:20}}>{dd?"✅":"⚡"}</span><span className="out" style={{fontWeight:700,fontSize:16}}>Daily Challenge</span></div>
{dd?<p style={{color:"var(--green)",fontSize:13,fontWeight:600}}>Completed! +{u.daily.xpE} XP</p>:<p style={{color:"var(--t2)",fontSize:13}}>5 questions · 30s each · Bonus XP</p>}</div>
{!dd&&<div style={{fontSize:24,color:"var(--cyan)"}}>{"→"}</div>}</div></div>

{/* Daily Mission — adaptive recommendation */}
{function(){
  var mission=getDailyMission(u);
  if(!mission)return null;

  if(mission.status==="calibrating"){
    return(<div className="crd" style={{marginBottom:16,padding:14,background:"rgba(255,255,255,.02)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🎯</span>
        <div><div className="out" style={{fontWeight:700,fontSize:14,color:"var(--t3)"}}>Daily Mission</div>
          <div style={{fontSize:12,color:"var(--t3)"}}>Complete {mission.remaining} more sessions to unlock personalized missions</div></div>
      </div>
      <div style={{marginTop:8}}><Bar value={u.stats.sessions||0} max={MISSION_THRESHOLD} h={4} color="var(--t3)"/></div>
    </div>);
  }

  // Initialize mission in userData if new
  if(mission.status==="new"&&u.mission.date!==today()){
    u.mission={date:today(),actId:mission.actId,done:false};
    save(u);
  }

  var m=mission.mod;
  if(!m)return null;
  var isDone=mission.status==="completed"||mission.done;

  return(<div className="crd" onClick={function(){if(!isDone)p.nav(mission.actId);}}
    style={{marginBottom:16,cursor:isDone?"default":"pointer",padding:0,overflow:"hidden",
      background:isDone?"var(--bg2)":"linear-gradient(135deg,rgba(255,215,0,.06),rgba(255,140,66,.06))",
      border:isDone?"1px solid var(--bdr)":"1px solid rgba(255,215,0,.15)"}}>
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{isDone?"✅":m.icon}</span>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span className="out" style={{fontWeight:700,fontSize:14,color:isDone?"var(--green)":"var(--t1)"}}>Daily Mission</span>
              {!isDone&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(255,215,0,.12)",color:"var(--gold)",fontWeight:700}} className="out">+15 XP</span>}
            </div>
            <div style={{fontSize:12,color:isDone?"var(--green)":"var(--t2)",marginTop:2}}>
              {isDone?"Mission complete! +15 XP bonus":m.name+" — "+mission.reason}
            </div>
          </div>
        </div>
        {!isDone&&<span style={{fontSize:18,color:"var(--gold)"}}>{"→"}</span>}
      </div>
    </div>
  </div>);
}()}

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
{[{l:"Total XP",v:u.xp,i:"⭐",c:"var(--gold)"},{l:"This week",v:u.weeklyXp,i:"📈",c:"var(--cyan)"},{l:"Sessions",v:u.stats.sessions,i:"🎯",c:"var(--purple)"}].map(function(s){return(
<div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{s.i}</div><div className="out" style={{fontSize:20,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div></div>);})}</div>

<h2 className="out" style={{fontWeight:700,fontSize:16,marginBottom:12,color:"var(--t2)"}}>Quick Start</h2>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
<div className="crd" style={{cursor:"pointer",padding:16}} onClick={function(){p.nav("csess");}}><div style={{fontSize:28,marginBottom:8}}>🃏</div><div className="out" style={{fontWeight:700,fontSize:14}}>Review Cards</div><div style={{fontSize:11,color:"var(--t2)",marginTop:4}}>SRS flashcards</div></div>
<div className="crd" style={{cursor:"pointer",padding:16}} onClick={function(){p.nav("drill");}}><div style={{fontSize:28,marginBottom:8}}>📝</div><div className="out" style={{fontWeight:700,fontSize:14}}>Grammar Drill</div><div style={{fontSize:11,color:"var(--t2)",marginTop:4}}>Part 5 practice</div></div></div>

{/* Strategy Tip of the Day */}
{function(){
  var allTips=[];STRATEGIES.forEach(function(s){s.tips.forEach(function(t){allTips.push({tip:t,part:s.part,icon:s.icon});});});
  var dayIndex=0;var d=today();for(var i=0;i<d.length;i++)dayIndex+=d.charCodeAt(i);
  var todayTip=allTips[dayIndex%allTips.length];
  return(<div style={{marginTop:20}}>
    <div className="crd" style={{padding:0,overflow:"hidden",border:"1px solid rgba(14,165,233,.12)",background:"linear-gradient(160deg,rgba(14,165,233,.06) 0%,rgba(168,85,247,.04) 100%)"}}>
      <div style={{padding:"16px 18px 14px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{todayTip.icon}</span>
            <span className="out" style={{fontSize:10,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>Tip of the day — {todayTip.part}</span>
          </div>
          <span style={{fontSize:10,color:"var(--t3)"}}>💡</span>
        </div>
        <p className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",lineHeight:1.5,marginBottom:6}}>{todayTip.tip.t}</p>
        <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{todayTip.tip.d}</p>
      </div>
      <button onClick={function(){p.nav("strats");}}
        style={{width:"100%",padding:"10px 18px",background:"rgba(14,165,233,.06)",borderTop:"1px solid rgba(14,165,233,.08)",border:"none",borderTop:"1px solid rgba(14,165,233,.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <span style={{fontSize:12,color:"var(--cyan)",fontWeight:600}} className="out">All 54 strategies</span>
        <span style={{fontSize:12,color:"var(--cyan)"}}>{"→"}</span>
      </button>
    </div>
  </div>);
}()}

</div>);}

// ─── DAILY CHALLENGE ───
function Daily(p){var qs=useMemo(function(){return dailyQs(today());},[]);var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[tl,sT]=useState(30);var[sk,sSk]=useState(false);var tr=useRef(null);var answered=useRef(false);
useEffect(function(){
  if(ph==="q"&&tl>0){tr.current=setTimeout(function(){sT(tl-1);},1000);return function(){clearTimeout(tr.current);};}
  if(ph==="q"&&tl===0&&!answered.current){answered.current=true;clearTimeout(tr.current);sS(-1);sSk(true);setTimeout(function(){sSk(false);},500);sP("fb");}
});
function doAns(i){answered.current=true;clearTimeout(tr.current);sS(i);if(i===qs[ci].c)sSc(sc+1);else{sSk(true);setTimeout(function(){sSk(false);},500);}sP("fb");}
function nxt(){answered.current=false;if(ci<qs.length-1){sC(ci+1);sS(-1);sT(30);sP("q");}else{sP("done");var xp=30+sc*14+(sc===5?20:0);p.done(sc,xp);}}

if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:20,animation:"pulse 2s infinite"}}>⚡</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Daily Challenge</h1>
<p style={{color:"var(--t2)",marginBottom:8}}>5 grammar questions · 30 seconds each</p><p style={{color:"var(--gold)",fontWeight:600,marginBottom:40,fontSize:14}}>Up to 100 XP + Perfect Bonus!</p>
<button className="btn1" onClick={function(){sP("q");}}>Start Challenge</button><button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

if(ph==="done"){var fx=30+sc*14+(sc===5?20:0);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:64,marginBottom:16,animation:"countUp .6s"}}>{sc===5?"👑":sc>=3?"⚔️":"🛡️"}</div><h1 className="out" style={{fontWeight:900,fontSize:32,marginBottom:8}}>{sc===5?"FLAWLESS!":sc>=4?"Great fight!":sc>=3?"Not bad!":"Keep training!"}</h1>
<div className="out" style={{fontSize:48,fontWeight:900,color:"var(--cyan)",marginBottom:4,animation:"countUp .8s"}}>{sc}/5</div>
<div className="out" style={{fontSize:22,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{fx} XP</div>
{sc===5&&<p style={{color:"var(--gold)",marginBottom:16,fontWeight:600}}>Perfect bonus: +20 XP!</p>}<button className="btn1" onClick={p.back}>Back to Home</button></div>);}

var q=qs[ci],tc=tl>15?"var(--cyan)":tl>5?"var(--orange)":"var(--red)";
return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",fontSize:14,cursor:"pointer"}}>Quit</button>
<div style={{display:"flex",gap:6}}>{[0,1,2,3,4].map(function(i){return (<div key={i} style={{width:i===ci?24:8,height:8,borderRadius:4,background:i<ci?"var(--green)":i===ci?"var(--cyan)":"var(--t3)",transition:"all .3s"}}/>);})}</div>
<div className="out" style={{fontSize:20,fontWeight:800,color:tc,minWidth:32,textAlign:"right"}}>{tl}</div></div>
<div style={{width:"100%",height:3,background:"rgba(255,255,255,.06)",borderRadius:2,marginBottom:32,overflow:"hidden"}}><div style={{width:(tl/30*100)+"%",height:"100%",background:tc,borderRadius:2,transition:"width 1s linear"}}/></div>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
<h2 className="out" style={{fontWeight:700,fontSize:20,lineHeight:1.5,marginBottom:28,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",transition:"all .2s",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s ease-out"}}><div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
<button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next Question":"See Results"}</button></div>}</div>);}

// ─── TRAIN PAGE ───
function Train(p){
  var sections=[
    {title:"Exercises",sub:"TOEIC Parts training",items:[
      {id:"daily",n:"Daily Challenge",d:"5 daily questions, timed",i:"⚡",bg:"linear-gradient(135deg,#00d4ff,#a855f7)"},
	  {id:"lis",n:"Parts 1-2 — Listening",d:"Ear training with audio",i:"🎧",bg:"linear-gradient(135deg,#22c55e,#f59e0b)"},
      {id:"drill",n:"Part 5 — Sentence Completion",d:"10 random questions from 100",i:"📝",bg:"linear-gradient(135deg,#00e676,#00bfa5)"},
      {id:"timesim",n:"Part 5 — Exam Simulation",d:"30 Qs in 10 min, real pace",i:"🏁",bg:"linear-gradient(135deg,#8b5cf6,#6366f1)"},
      {id:"p6",n:"Part 6 — Text Completion",d:"Business texts with blanks",i:"📄",bg:"linear-gradient(135deg,#ec4899,#a855f7)"},
      {id:"p7",n:"Part 7 — Reading",d:"Passages + comprehension Qs",i:"📖",bg:"linear-gradient(135deg,#3b82f6,#06b6d4)"},
    ]},
    {title:"Grammar & Vocabulary",sub:"Build your foundations",items:[
      {id:"csess",n:"Flashcard Review",d:"SRS spaced repetition",i:"🃏",bg:"linear-gradient(135deg,#ff8c42,#ff6b35)"},
      {id:"wordfam",n:"Word Families",d:"Classify: Noun, Verb, Adj, Adv",i:"🧩",bg:"linear-gradient(135deg,#f59e0b,#ef4444)"},
      {id:"connsort",n:"Connectors Sorting",d:"Clause, Noun, or New sentence?",i:"🔀",bg:"linear-gradient(135deg,#a855f7,#ec4899)"},
      {id:"prepdrill",n:"Preposition Collocations",d:"Study + Drill mode",i:"🎯",bg:"linear-gradient(135deg,#06b6d4,#22c55e)"},
      {id:"gerinf",n:"Gerund vs Infinitive",d:"Speed round: -ING or TO?",i:"⏱️",bg:"linear-gradient(135deg,#e11d48,#f59e0b)"},
      {id:"falsefr",n:"False Friends",d:"FR/EN traps: actually ≠ actuellement",i:"🎭",bg:"linear-gradient(135deg,#ec4899,#f59e0b)"},
    ]},
    {title:"Tips & Strategies",sub:"Master the exam itself",items:[
      {id:"strats",n:"Strategy Cards",d:"54 expert tips, all Parts",i:"📋",bg:"linear-gradient(135deg,#0ea5e9,#06b6d4)"},
      {id:"stratquiz",n:"Strategy Quiz",d:"Test your exam IQ",i:"🧠",bg:"linear-gradient(135deg,#a855f7,#6366f1)"},
      {id:"traps",n:"TOEIC Traps Quiz",d:"Spot the 10 classic traps",i:"🪤",bg:"linear-gradient(135deg,#ef4444,#f59e0b)"},
    ]},
  ];
  var animIdx=0;
  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Training Grounds</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Choose your battle</p>

    {sections.map(function(sec,si){
      return (<div key={si} style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:10}}>
          <h2 className="out" style={{fontWeight:800,fontSize:15,color:"var(--t1)"}}>{sec.title}</h2>
          <span style={{fontSize:11,color:"var(--t3)"}}>{sec.sub}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {sec.items.map(function(m){
            var ai=animIdx++;
            return (
              <div key={m.id} className="crd" onClick={function(){if(!m.lock)p.nav(m.id);}}
                style={{display:"flex",alignItems:"center",gap:14,cursor:m.lock?"default":"pointer",opacity:m.lock?.4:1,padding:"14px 16px",animation:"fadeIn .3s ease-out",animationDelay:(ai*.04)+"s",animationFillMode:"both"}}>
                <div style={{width:42,height:42,borderRadius:12,background:m.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{m.i}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:1}}>{m.n}</div>
                  <div style={{fontSize:11,color:"var(--t3)"}}>{m.d}</div>
                </div>
                {m.lock?<span style={{fontSize:16}}>🔒</span>:<span style={{fontSize:16,color:"var(--cyan)"}}>{"→"}</span>}
              </div>);
          })}
        </div>
      </div>);
    })}
  </div>);
}

// ─── CARDS PAGE ───
function Cards(p){var all=[];VOCAB.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});var dc=dueCards(p.u.cardStates,all);var mc=0;Object.keys(p.u.cardStates).forEach(function(k){if(p.u.cardStates[k].interval>=7)mc++;});
return(<div className="enter" style={{padding:"20px 16px 100px"}}><h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>Flashcards</h1><p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Spaced repetition vocabulary</p>
<div className="crd glo" style={{marginBottom:20,padding:16}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
<div><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Mastered</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--green)"}}>{mc}/{all.length}</div></div>
<div style={{textAlign:"center"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Due today</div><div className="out" style={{fontWeight:800,fontSize:22,color:dc.length>0?"var(--orange)":"var(--green)"}}>{dc.length}</div></div>
<div style={{textAlign:"right"}}><div style={{fontSize:11,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Reviews</div><div className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{p.u.stats.cardsRev||0}</div></div></div>
<Bar value={mc} max={all.length} h={6} color="linear-gradient(90deg,#00e676,#00bfa5)"/></div>
{dc.length>0&&<button className="btn1" onClick={function(){p.nav("csess");}} style={{marginBottom:20}}>Review {dc.length} cards</button>}
<h2 className="out" style={{fontWeight:700,fontSize:15,color:"var(--t2)",marginBottom:12}}>Vocabulary Domains</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{VOCAB.map(function(dom){var ms=0;dom.cards.forEach(function(c){var s=p.u.cardStates[c.id];if(s&&s.interval>=7)ms++;});
return(<div key={dom.id} className="crd" onClick={function(){p.nav("cdom",dom.id);}} style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer",padding:"14px 16px"}}>
<div style={{width:42,height:42,borderRadius:12,background:dom.col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{dom.icon}</div>
<div style={{flex:1,minWidth:0}}><div className="out" style={{fontWeight:600,fontSize:14}}>{dom.name}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ms}/{dom.cards.length} mastered</div></div>
<div style={{width:48}}><Bar value={ms} max={dom.cards.length} h={4} color={dom.col}/></div></div>);})}</div></div>);}

// ─── FLASHCARD SESSION ───
function CardSess(p){var all=[];if(p.domId){var dom=VOCAB.find(function(d){return d.id===p.domId;});if(dom)all=dom.cards;}else{VOCAB.forEach(function(d){d.cards.forEach(function(c){all.push(c);});});}
// Domain-specific = show ALL cards (study mode). Global = SRS due only.
var rev=useMemo(function(){return p.domId?shuffle(all):dueCards(p.u.cardStates,all);},[]);var[ci,sC]=useState(0);var[fl,sF]=useState(false);var[done,sD]=useState(false);var[ok,sO]=useState(0);var[tot,sT]=useState(0);
var lastSpoken=useRef(-1);var isDomainMode=!!p.domId;

if(rev.length===0||done){var xp=Math.max(10,tot*3+ok*2);return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16}}>{done?"✨":"🎉"}</div><h2 className="out" style={{fontWeight:800,fontSize:24,marginBottom:8}}>{done?"Session Complete!":"All caught up!"}</h2>
{done&&<div><p style={{color:"var(--t2)",marginBottom:4}}>{ok}/{tot} rated Good or Easy</p><p className="out" style={{color:"var(--gold)",fontWeight:700,fontSize:18}}>+{xp} XP</p></div>}
{!done&&<p style={{color:"var(--t2)",fontSize:13}}>No cards due for review right now. Tap a specific domain to study anyway.</p>}
<button className="btn1" onClick={function(){if(done)p.done(xp,tot);else p.back();}} style={{marginTop:32}}>{done?"Collect XP":"Back"}</button></div>);}

var card=rev[ci];function rate(r){sO(ok+(r>=3?1:0));sT(tot+1);p.rate(card.id,r);if(ci<rev.length-1){sC(ci+1);sF(false);}else sD(true);}

// Auto-pronounce word when new card appears
if(card&&!fl&&lastSpoken.current!==ci){lastSpoken.current=ci;setTimeout(function(){speak(card.w,0.85);},400);}

return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
<div style={{textAlign:"center"}}>
  <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{rev.length}</span>
  {isDomainMode&&<div style={{fontSize:9,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:.5,marginTop:2}} className="out">Study mode</div>}
</div>
<div style={{width:40}}/></div>
<Bar value={ci} max={rev.length} h={4} color="linear-gradient(90deg,#ff8c42,#ffd700)"/>
<div onClick={function(){sF(!fl);}} style={{marginTop:40,cursor:"pointer",minHeight:280}}>
<div className="crd glo" style={{padding:32,textAlign:"center",display:"flex",flexDirection:"column",justifyContent:"center",minHeight:280,animation:fl?"flip .3s ease-out":"none"}}>
{!fl?<div><div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>WHAT DOES THIS MEAN?</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:16}}>
  <div className="out" style={{fontWeight:800,fontSize:32}}>{card.w}</div>
  <SpeakBtn text={card.w} size={36}/></div>
<div style={{fontSize:13,color:"var(--t3)"}}>Tap to reveal</div></div>
:<div><div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:12}}>
  <div className="out" style={{fontWeight:700,fontSize:20,color:"var(--cyan)"}}>{card.w}</div>
  <SpeakBtn text={card.w} size={30}/></div>
<div style={{fontSize:16,lineHeight:1.6,marginBottom:16}}>{card.d}</div>
<div style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",lineHeight:1.5,padding:"12px 16px",background:"rgba(255,255,255,.03)",borderRadius:10,position:"relative"}}>
  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{flex:1}}>"{card.e}"</span>
    <SpeakBtn text={card.e} size={28} rate={0.85}/>
  </div>
</div></div>}</div></div>
{fl&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:24,animation:"fadeIn .3s ease-out"}}>
{[{r:1,l:"Again",c:"var(--red)",b:"rgba(255,71,87,.12)"},{r:2,l:"Hard",c:"var(--orange)",b:"rgba(255,140,66,.12)"},{r:3,l:"Good",c:"var(--green)",b:"rgba(0,230,118,.12)"},{r:4,l:"Easy",c:"var(--cyan)",b:"rgba(0,212,255,.12)"}].map(function(b){
return(<button key={b.r} onClick={function(e){e.stopPropagation();rate(b.r);}} style={{padding:"12px 8px",background:b.b,border:"1px solid "+b.c+"33",borderRadius:12,cursor:"pointer",color:b.c,fontWeight:700,fontSize:13}} className="out">{b.l}</button>);})}</div>}</div>);}

// ─── DRILL SESSION ───
function Drill(p){var qs=useMemo(function(){return shuffle(QUESTIONS).slice(0,10);},[]);var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[sk,sSk]=useState(false);
function doAns(i){sS(i);if(i===qs[ci].c)sSc(sc+1);else{sSk(true);setTimeout(function(){sSk(false);},500);}sP("fb");}
function nxt(){if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{sP("done");p.done(sc,qs.length,20+sc*7);}}

if(ph==="done"){var fx=20+sc*7;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
<div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div><h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Drill Complete</h1>
<div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{qs.length}</div>
<div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{fx} XP</div><button className="btn1" onClick={p.back}>Back to Training</button></div>);}

var q=qs[ci];return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
<button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
<span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
<Bar value={ci} max={qs.length} h={4}/>
<span className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,marginTop:8,display:"block"}}>{q.cat}</span>
<h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
<div style={{display:"flex",flexDirection:"column",gap:10}}>{q.o.map(function(opt,i){var iS=sel===i,iC=i===q.c,sr=ph==="fb",bg="var(--bg2)",bd="var(--bdr)";
if(sr&&iC){bg="rgba(0,230,118,.12)";bd="var(--green)";}else if(sr&&iS&&!iC){bg="rgba(255,71,87,.12)";bd="var(--red)";}
return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={ph==="fb"} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
<div style={{width:28,height:28,borderRadius:"50%",border:"2px solid "+(sr&&iC?"var(--green)":sr&&iS?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,background:sr&&iC?"var(--green)":sr&&iS&&!iC?"var(--red)":"transparent",color:sr&&(iC||iS)?"#fff":"var(--t3)"}}>
{sr&&iC?"✓":sr&&iS?"✗":String.fromCharCode(65+i)}</div><span>{opt}</span></button>);})}</div>
{ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}><div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}><p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.x}</p></div>
<button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next":"See Results"}</button></div>}</div>);}

// ─── WORD FAMILIES CLASSIFIER ───
function WordFam(p){
  var items=useMemo(function(){
    var pool=[];
    WORD_FAMILIES.forEach(function(f){
      if(f.v)pool.push({word:f.v,answer:"Verb",family:f});
      if(f.n)pool.push({word:f.n,answer:"Noun",family:f});
      if(f.adj)pool.push({word:f.adj,answer:"Adjective",family:f});
      if(f.adv)pool.push({word:f.adv,answer:"Adverb",family:f});
    });
    return shuffle(pool).slice(0,15);
  },[]);
  var cats=["Noun","Verb","Adjective","Adverb"];
  var catColors={Noun:"var(--cyan)",Verb:"var(--green)",Adjective:"var(--orange)",Adverb:"var(--purple)"};
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  function doAns(cat){
    sPk(cat);
    if(cat===items[ci].answer)sSc(sc+1);
    else{sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="done"){var xp=15+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=12?"🏆":sc>=8?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Classifier Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=12?"var(--green)":sc>=8?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];var fam=it.family;
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div style={{textAlign:"center",marginTop:32,marginBottom:24}}>
      <div className="out" style={{fontSize:11,color:"var(--orange)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>CLASSIFY THIS WORD</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:8}}>
        <div className="out" style={{fontWeight:800,fontSize:36}}>{it.word}</div>
        <SpeakBtn text={it.word} size={36}/></div>
      <div style={{fontSize:13,color:"var(--t3)"}}>Is it a Noun, Verb, Adjective or Adverb?</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      {cats.map(function(cat){
        var isCor=cat===it.answer;var isPick=pick===cat;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={cat} onClick={function(){if(ph==="q")doAns(cat);}} disabled={show}
          style={{padding:"18px 12px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:700,fontSize:16,color:show&&isCor?"var(--green)":show&&isPick?"var(--red)":catColors[cat]}}>{cat}</div>
        </button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.8}}>
          <strong style={{color:"var(--t1)"}}>Word family:</strong><br/>
          {fam.v&&<span>Verb: <strong style={{color:"var(--green)"}}>{fam.v}</strong> &nbsp;</span>}
          {fam.n&&<span>Noun: <strong style={{color:"var(--cyan)"}}>{fam.n}</strong> &nbsp;</span>}
          {fam.adj&&<span>Adj: <strong style={{color:"var(--orange)"}}>{fam.adj}</strong> &nbsp;</span>}
          {fam.adv&&<span>Adv: <strong style={{color:"var(--purple)"}}>{fam.adv}</strong></span>}
        </p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── CONNECTORS SORTING ───
function ConnSort(p){
  var items=useMemo(function(){return shuffle(CONNECTORS).slice(0,12);},[]);
  var rules=[{id:"clause",label:"+ Clause",desc:"subject + verb",col:"var(--cyan)"},{id:"noun",label:"+ Noun / -ing",desc:"no subject + verb",col:"var(--orange)"},{id:"sentence",label:"New sentence",desc:"after . or ;",col:"var(--purple)"}];
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  function doAns(rule){sPk(rule);if(rule===items[ci].rule)sSc(sc+1);else{sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="done"){var xp=15+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Sorting Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#a855f7,#ec4899)"/>
    <div style={{textAlign:"center",marginTop:32,marginBottom:28}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>THIS CONNECTOR IS FOLLOWED BY...</div>
      <div className="out" style={{fontWeight:800,fontSize:30,marginBottom:4}}>{it.word}</div></div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {rules.map(function(r){
        var isCor=r.id===it.rule;var isPick=pick===r.id;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={r.id} onClick={function(){if(ph==="q")doAns(r.id);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:14,padding:"16px",background:bg,border:"1px solid "+bd,borderRadius:14,cursor:ph==="q"?"pointer":"default",textAlign:"left",transition:"all .2s"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:r.col,flexShrink:0}}/>
          <div><div className="out" style={{fontWeight:700,fontSize:15,color:show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t1)"}}>{r.label}</div>
            <div style={{fontSize:11,color:"var(--t3)"}}>{r.desc}</div></div></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.tip}</p>
        <p style={{fontSize:12,color:"var(--t3)",fontStyle:"italic",marginTop:8}}>"{it.ex}"</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── PREPOSITION COLLOCATIONS ───
function PrepDrill(p){
  var items=useMemo(function(){return shuffle(PREP_COLLOCATIONS).slice(0,12);},[]);
  var allPreps=useMemo(function(){var s={};PREP_COLLOCATIONS.forEach(function(c){s[c.prep]=true;});return Object.keys(s);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("menu");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);

  // Group collocations by preposition for Study Mode
  var groups=useMemo(function(){
    var g={};PREP_COLLOCATIONS.forEach(function(c){if(!g[c.prep])g[c.prep]=[];g[c.prep].push(c);});
    return Object.keys(g).sort().map(function(pr){return{prep:pr,items:g[pr]};});
  },[]);
  var prepLabels={for:"Responsibility, eligibility, purpose",in:"Involvement, interest, results",with:"Compliance, familiarity, association",on:"Dependence, reliance",of:"Composition, charge, capability",to:"Relation, addition, attribution"};

  function doAns(pr){sPk(pr);if(pr===items[ci].prep)sSc(sc+1);else{sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(null);sP("q");}else{sP("done");p.done(sc,items.length,15+sc*5);}}

  if(ph==="menu")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16}}>🎯</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Preposition Collocations</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.5}}>Master the prepositions that go with common business words</p>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginBottom:12}}>Start Drill (12 Qs)</button>
    <button className="btn2" onClick={function(){sP("study");}} style={{width:"100%",marginBottom:12}}>📖 Study Mode</button>
    <button className="btn2" onClick={p.back} style={{width:"100%"}}>Back</button></div>);

  if(ph==="study")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={function(){sP("menu");}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Study Mode</span>
      <div style={{width:40}}/></div>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:20,lineHeight:1.5}}>Collocations grouped by preposition. Tap a group to expand.</p>
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {groups.map(function(g){
        return(<StudyGroup key={g.prep} prep={g.prep} items={g.items} hint={prepLabels[g.prep]||""}/>);
      })}
    </div>
    <button className="btn1" onClick={function(){sP("q");}} style={{marginTop:24}}>Ready! Start Drill</button></div>);

  if(ph==="done"){var xp=15+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Prep Drill Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#06b6d4,#22c55e)"/>
    <div style={{textAlign:"center",marginTop:32,marginBottom:28}}>
      <div className="out" style={{fontSize:11,color:"var(--cyan)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>COMPLETE THE COLLOCATION</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        <div className="out" style={{fontWeight:800,fontSize:30}}>{it.base} <span style={{color:"var(--cyan)"}}>_____</span></div>
        <SpeakBtn text={it.base} size={32}/></div>
      <div style={{fontSize:12,color:"var(--t3)",marginTop:6}}>({it.type==="verb"?"verb":it.type==="adj"?"adjective":"expression"} + preposition)</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(allPreps.length,4)+", 1fr)",gap:8}}>
      {allPreps.map(function(pr){
        var isCor=pr===it.prep;var isPick=pick===pr;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";var col="var(--t1)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";col="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";col="var(--red)";}
        return(<button key={pr} onClick={function(){if(ph==="q")doAns(pr);}} disabled={show}
          style={{padding:"14px 8px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:700,fontSize:16,color:col,textTransform:"uppercase"}}>{pr}</div></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <p style={{fontSize:14,color:"var(--t1)"}}><strong>{it.base} {it.prep}</strong></p>
          <SpeakBtn text={it.base+" "+it.prep} size={26}/></div>
        <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
          <p style={{fontSize:13,color:"var(--t2)",fontStyle:"italic",flex:1}}>"{it.ex}"</p>
          <SpeakBtn text={it.ex} size={24} rate={0.85}/></div></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// Study Mode collapsible group sub-component
function StudyGroup(p){
  var[open,sO]=useState(false);
  var prepColors={for:"#22c55e",in:"#f59e0b",with:"#a855f7",on:"#ef4444",of:"#06b6d4",to:"#ec4899"};
  var col=prepColors[p.prep]||"var(--cyan)";
  return(<div className="crd" style={{padding:0,overflow:"hidden",borderColor:open?col+"44":"var(--bdr)",transition:"all .3s"}}>
    <button onClick={function(){sO(!open);}} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
      <div><div className="out" style={{fontWeight:800,fontSize:20,color:col,textTransform:"uppercase",letterSpacing:1}}>{p.prep}</div>
        <div style={{fontSize:11,color:"var(--t3)",marginTop:2}}>{p.hint}</div></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span className="out" style={{fontSize:12,color:"var(--t3)",fontWeight:600}}>{p.items.length}</span>
        <span style={{fontSize:14,color:"var(--t3)",transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"▼"}</span></div>
    </button>
    {open&&<div style={{padding:"0 18px 16px",animation:"fadeIn .2s"}}>
      {p.items.map(function(it,i){return(
        <div key={i} style={{display:"flex",alignItems:"baseline",gap:8,padding:"8px 0",borderTop:i>0?"1px solid var(--bdr)":"none"}}>
          <span className="out" style={{fontWeight:700,fontSize:14,color:"var(--t1)",minWidth:100}}>{it.base}</span>
          <span style={{fontSize:12,color:"var(--t3)",flex:1}}>{it.ex}</span>
        </div>);})}
    </div>}
  </div>);
}

// ─── GERUND VS INFINITIVE BATTLE ───
function GerInf(p){
  var items=useMemo(function(){return shuffle(GERUND_INF);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("q");var[pick,sPk]=useState(null);var[sk,sSk]=useState(false);
  var[timer,sTm]=useState(10);var tr=useRef(null);var answered=useRef(false);

  useEffect(function(){
    if(ph==="q"&&timer>0){tr.current=setTimeout(function(){sTm(timer-1);},1000);return function(){clearTimeout(tr.current);};}
    if(ph==="q"&&timer===0&&!answered.current){answered.current=true;clearTimeout(tr.current);sPk("timeout");sSk(true);setTimeout(function(){sSk(false);},400);sP("fb");}
  });

  function doAns(choice){
    answered.current=true;clearTimeout(tr.current);sPk(choice);
    if(choice===items[ci].takes)sSc(sc+1);
    else{sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){answered.current=false;if(ci<items.length-1){sC(ci+1);sPk(null);sTm(10);sP("q");}else{sP("done");p.done(sc,items.length,20+sc*4);}}

  if(ph==="done"){var xp=20+sc*4;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=16?"🏆":sc>=10?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Battle Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=16?"var(--green)":sc>=10?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];var tc=timer>5?"var(--cyan)":timer>2?"var(--orange)":"var(--red)";
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <div className="out" style={{fontSize:20,fontWeight:800,color:tc}}>{timer}</div>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#e11d48,#f59e0b)"/>
    <div style={{width:"100%",height:3,background:"rgba(255,255,255,.06)",borderRadius:2,marginTop:8,marginBottom:32,overflow:"hidden"}}><div style={{width:(timer/10*100)+"%",height:"100%",background:tc,borderRadius:2,transition:"width 1s linear"}}/></div>
    <div style={{textAlign:"center",marginBottom:32}}>
      <div className="out" style={{fontSize:11,color:"var(--red)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>SPEED ROUND — -ING OR TO?</div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12}}>
        <div className="out" style={{fontWeight:800,fontSize:36}}>{it.verb}</div>
        <SpeakBtn text={it.verb} size={34}/></div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {[{id:"ing",label:"verb + -ING",col:"var(--orange)",bg:"rgba(255,140,66,.1)"},{id:"to",label:"verb + TO",col:"var(--cyan)",bg:"rgba(0,212,255,.1)"}].map(function(opt){
        var isCor=opt.id===it.takes;var isPick=pick===opt.id;var show=ph==="fb";
        var bg=show&&isCor?"rgba(0,230,118,.15)":show&&isPick&&!isCor?"rgba(255,71,87,.15)":opt.bg;
        var bd=show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":opt.col+"44";
        return(<button key={opt.id} onClick={function(){if(ph==="q")doAns(opt.id);}} disabled={show}
          style={{padding:"24px 16px",background:bg,border:"2px solid "+bd,borderRadius:16,cursor:ph==="q"?"pointer":"default",transition:"all .2s"}}>
          <div className="out" style={{fontWeight:800,fontSize:18,color:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":opt.col}}>{opt.label}</div></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:20,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <p style={{fontSize:14,color:"var(--t1)",marginBottom:4}}><strong>{it.verb} + {it.takes==="ing"?"-ing":"to + verb"}</strong></p>
        <p style={{fontSize:13,color:"var(--t2)",fontStyle:"italic"}}>"{it.ex}"</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── TOEIC TRAPS QUIZ ───
function TrapsQuiz(p){
  var traps=useMemo(function(){return shuffle(TOEIC_TRAPS);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){sPk(i);if(i===traps[ci].correct)sSc(sc+1);else{sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<traps.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,traps.length,25+sc*6);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🪤</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>TOEIC Traps Quiz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>The 10 most common mistakes students make on the TOEIC.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you spot the traps before they catch you?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start Quiz</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*6;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Traps Mastered!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{traps.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var t=traps[ci];
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Trap {ci+1}/{traps.length}</span></div>
    <Bar value={ci} max={traps.length} h={4} color="linear-gradient(90deg,#e11d48,#f59e0b)"/>

    <div style={{marginTop:16,marginBottom:8}}>
      <span className="out" style={{fontSize:11,fontWeight:600,color:"var(--red)",textTransform:"uppercase",letterSpacing:1}}>Trap #{t.id} — {t.part}</span></div>
    <h2 className="out" style={{fontWeight:800,fontSize:20,marginBottom:12,color:"var(--orange)"}}>{t.name}</h2>
    <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:20}}>{t.trap}</p>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(255,140,66,.06)",borderColor:"rgba(255,140,66,.15)"}}>
      <p className="out" style={{fontSize:12,fontWeight:600,color:"var(--orange)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Scenario</p>
      <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.6,whiteSpace:"pre-line"}}>{t.scenario}</p></div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {t.options.map(function(opt,i){
        var isCor=i===t.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",marginBottom:6}}>Pro Tip</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{t.tip}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<traps.length-1?"Next Trap":"See Results"}</button></div>}
  </div>);
}

// ─── STRATEGY CARDS (enriched) ───
function StratCards(p){
  var[open,sO]=useState(null);
  var[filter,sF]=useState("all");
  var filtered=STRATEGIES.filter(function(s){return filter==="all"||s.section===filter||s.section==="Both";});
  var totalTips=0;STRATEGIES.forEach(function(s){totalTips+=s.tips.length;});

  return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Strategy Cards</span>
      <div style={{width:40}}/></div>

    <div className="crd" style={{padding:14,marginBottom:16,textAlign:"center",background:"rgba(0,212,255,.04)",borderColor:"rgba(0,212,255,.12)"}}>
      <span className="out" style={{fontWeight:800,fontSize:22,color:"var(--cyan)"}}>{totalTips}</span>
      <span style={{fontSize:13,color:"var(--t2)",marginLeft:6}}>expert strategies across all TOEIC Parts</span></div>

    <div style={{display:"flex",gap:8,marginBottom:16}}>
      {[{id:"all",l:"All"},{id:"Listening",l:"🎧 Listening"},{id:"Reading",l:"📖 Reading"}].map(function(f){
        var act=filter===f.id;return(
        <button key={f.id} onClick={function(){sF(f.id);sO(null);}}
          style={{flex:1,padding:"8px 4px",borderRadius:10,border:act?"1px solid var(--cyan)":"1px solid var(--bdr)",background:act?"rgba(0,212,255,.1)":"var(--bg2)",cursor:"pointer"}}>
          <span className="out" style={{fontSize:12,fontWeight:act?700:500,color:act?"var(--cyan)":"var(--t3)"}}>{f.l}</span></button>);})}
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {filtered.map(function(s,idx){
        var isOpen=open===idx;
        var tipCount=s.tips.length;
        return(<div key={idx} className="crd" style={{padding:0,overflow:"hidden",borderColor:isOpen?"var(--cyan)44":"var(--bdr)",transition:"all .3s"}}>
          <button onClick={function(){sO(isOpen?null:idx);}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>
            <div style={{fontSize:26,flexShrink:0}}>{s.icon}</div>
            <div style={{flex:1}}>
              <div className="out" style={{fontWeight:700,fontSize:15,color:"var(--t1)"}}>{s.part} {"—"} {s.title}</div>
              <div style={{display:"flex",gap:8,marginTop:3}}>
                {s.qs>0&&<span style={{fontSize:10,color:"var(--t3)",background:"rgba(255,255,255,.04)",padding:"2px 6px",borderRadius:4}}>{s.qs} Qs</span>}
                <span style={{fontSize:10,color:"var(--cyan)",background:"rgba(0,212,255,.06)",padding:"2px 6px",borderRadius:4}}>{tipCount} tips</span>
              </div></div>
            <span style={{fontSize:12,color:"var(--t3)",transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform .2s"}}>{"▼"}</span>
          </button>
          {isOpen&&<div style={{padding:"0 16px 16px",animation:"fadeIn .2s"}}>
            <div style={{padding:"8px 12px",background:"rgba(255,215,0,.05)",borderRadius:10,marginBottom:14}}>
              <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--gold)"}}>{s.points}</p></div>
            {s.tips.map(function(tip,ti){return(
              <div key={ti} style={{padding:"12px 0",borderTop:ti>0?"1px solid var(--bdr)":"none"}}>
                <div style={{display:"flex",gap:8,alignItems:"baseline",marginBottom:4}}>
                  <span className="out" style={{color:"var(--cyan)",fontWeight:800,fontSize:12,flexShrink:0}}>{ti+1}</span>
                  <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--t1)"}}>{tip.t}</span></div>
                <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,paddingLeft:20}}>{tip.d}</p>
              </div>);})}
          </div>}
        </div>);
      })}
    </div>

    <div className="crd" style={{marginTop:16,background:"rgba(255,71,87,.06)",borderColor:"rgba(255,71,87,.12)",padding:16,textAlign:"center"}}>
      <p className="out" style={{fontSize:13,fontWeight:700,color:"var(--red)",marginBottom:4}}>Golden Rule</p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.5}}>If you don't know after 30 seconds on Part 5, GUESS and move on. Time saved = points earned on Part 7.</p>
    </div>
  </div>);
}

// ─── STRATEGY QUIZ ───
function StratQuizPage(p){
  var qs=useMemo(function(){return shuffle(STRAT_QUIZ);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){sPk(i);if(i===qs[ci].correct)sSc(sc+1);else{sSk(true);setTimeout(function(){sSk(false);},400);}sP("fb");}
  function nxt(){if(ci<qs.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,qs.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🧠</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Strategy Quiz</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{qs.length} real TOEIC situations.<br/>Do you know the right strategy?</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Test your exam IQ, not just your English!</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start Quiz</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=13?"🏆":sc>=9?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Quiz Complete!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=13?"var(--green)":sc>=9?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{qs.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:12}}>+{xp} XP</div>
    <p style={{fontSize:13,color:"var(--t2)",marginBottom:32}}>Strategy knowledge is just as important as English skills for the TOEIC!</p>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var q=qs[ci];
  var partColors={"Part 1":"#22c55e","Part 2":"#f59e0b","Part 3":"#06b6d4","Part 4":"#8b5cf6","Part 5":"#ef4444","Part 6":"#ec4899","Part 7":"#3b82f6","General":"#64748b"};
  var pc=partColors[q.part]||"var(--cyan)";

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{qs.length}</span></div>
    <Bar value={ci} max={qs.length} h={4} color="linear-gradient(90deg,#0ea5e9,#a855f7)"/>

    <div style={{marginTop:16,marginBottom:20}}>
      <span className="out" style={{fontSize:10,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,padding:"3px 8px",background:pc+"18",borderRadius:6}}>{q.part}</span></div>

    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(168,85,247,.05)",borderColor:"rgba(168,85,247,.12)"}}>
      <p className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:.5,marginBottom:8}}>Situation</p>
      <p style={{fontSize:15,color:"var(--t1)",lineHeight:1.6}}>{q.scenario}</p></div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {q.options.map(function(opt,i){
        var isCor=i===q.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <p className="out" style={{fontSize:12,fontWeight:700,color:"var(--cyan)",textTransform:"uppercase",marginBottom:6}}>Why this works</p>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{q.explain}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<qs.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

// ─── TIME MANAGEMENT SIMULATOR ───
function TimeSim(p){
  var qs=useMemo(function(){return shuffle(QUESTIONS).slice(0,30);},[]);
  var[ci,sC]=useState(0);var[sel,sS]=useState(-1);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");
  var[elapsed,sEl]=useState(0);var[answers,sAn]=useState([]);var timerRef=useRef(null);
  var TARGET=600; // 10 minutes = 600 seconds
  var perQ=TARGET/30; // 20s per question target

  useEffect(function(){
    if(ph==="q"){timerRef.current=setInterval(function(){sEl(function(e){return e+1;});},1000);return function(){clearInterval(timerRef.current);};}
  },[ph]);

  function doAns(i){sS(i);var correct=i===qs[ci].c;if(correct)sSc(sc+1);sAn(answers.concat([{q:ci,correct:correct,time:elapsed}]));sP("next");}
  function nxt(){if(ci<qs.length-1){sC(ci+1);sS(-1);sP("q");}else{clearInterval(timerRef.current);sP("done");p.done(sc,qs.length,30+sc*5);}}

  function fmtTime(s){var m=Math.floor(s/60);var sec=s%60;return m+":"+(sec<10?"0":"")+sec;}
  var paceStatus=ph==="q"?elapsed/(ci+1):0;
  var ahead=paceStatus<=perQ;

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>⏱️</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 5 Exam Simulation</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>30 questions. 10 minutes. Just like the real TOEIC.</p>
    <div className="crd" style={{padding:16,marginBottom:20,textAlign:"left"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>Target pace: <strong style={{color:"var(--cyan)"}}>{Math.round(perQ)}s per question</strong></p>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>A pace indicator will show if you're on track, ahead, or behind. No feedback during the exam — just like the real thing.</p></div>
    <button className="btn1" onClick={function(){sP("q");}}>Start Exam</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;var totalTime=elapsed;return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:48,marginBottom:12,animation:"countUp .6s"}}>{sc>=25?"🏆":sc>=18?"⚔️":"🛡️"}</div>
      <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Exam Complete</h1>
      <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/30</div>
      <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:8}}>+{xp} XP</div>
      <div style={{fontSize:14,color:"var(--t2)"}}>Total time: <strong style={{color:totalTime<=TARGET?"var(--green)":"var(--red)"}}>{fmtTime(totalTime)}</strong> / {fmtTime(TARGET)}</div>
      <div style={{fontSize:14,color:"var(--t2)",marginTop:4}}>Avg per question: <strong>{(totalTime/30).toFixed(1)}s</strong> (target: {Math.round(perQ)}s)</div>
    </div>
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <p className="out" style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:8}}>Performance Breakdown</p>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <span style={{fontSize:13,color:"var(--t2)"}}>Accuracy</span>
        <span className="out" style={{fontWeight:700,color:"var(--cyan)"}}>{Math.round(sc/30*100)}%</span></div>
      <Bar value={sc} max={30} h={6} color={sc>=25?"var(--green)":sc>=18?"var(--cyan)":"var(--orange)"}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:12,marginBottom:8}}>
        <span style={{fontSize:13,color:"var(--t2)"}}>Time Management</span>
        <span className="out" style={{fontWeight:700,color:totalTime<=TARGET?"var(--green)":"var(--red)"}}>{totalTime<=TARGET?"On target":"Over time"}</span></div>
      <Bar value={Math.min(TARGET,TARGET-(totalTime-TARGET))} max={TARGET} h={6} color={totalTime<=TARGET?"var(--green)":"var(--red)"}/>
    </div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  // Active quiz (no feedback, exam mode)
  var q=qs[ci];var timeColor=elapsed>TARGET?"var(--red)":elapsed>TARGET*0.8?"var(--orange)":"var(--t2)";
  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <button onClick={function(){clearInterval(timerRef.current);p.back();}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <div className="out" style={{fontSize:18,fontWeight:800,color:timeColor}}>{fmtTime(elapsed)}</div>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/30</span></div>
    <Bar value={ci} max={30} h={4}/>

    {/* Pace indicator */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:8,marginBottom:20}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:ahead?"var(--green)":"var(--red)"}}/>
      <span style={{fontSize:11,color:ahead?"var(--green)":"var(--red)",fontWeight:600}} className="out">{ahead?"On pace":"Behind pace"} — {(elapsed/(ci+1)).toFixed(0)}s/q (target: {Math.round(perQ)}s)</span>
    </div>

    {ph==="next"?
      <div style={{textAlign:"center",padding:"40px 0"}}>
        <button className="btn1" onClick={nxt}>{ci<qs.length-1?"Next Question ("+(ci+2)+"/30)":"Finish Exam"}</button></div>
    :<div>
      <span className="out" style={{fontSize:11,fontWeight:600,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1}}>{q.cat}</span>
      <h2 className="out" style={{fontWeight:700,fontSize:19,lineHeight:1.5,marginBottom:24,marginTop:8}}>{q.s}</h2>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {q.o.map(function(opt,i){
          return(<button key={i} onClick={function(){doAns(i);}}
            style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",fontSize:15,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
            <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
              {String.fromCharCode(65+i)}</div>
            <span>{opt}</span></button>);})}
      </div>
    </div>}
  </div>);
}

// ─── PART 6 TEXT COMPLETION ───
function Part6Drill(p){
  var texts=useMemo(function(){return shuffle(PART6_TEXTS).slice(0,6);},[]);
  var[ti,sTi]=useState(0);var[bi,sBi]=useState(0);var[sc,sSc]=useState(0);var[totalB,sTB]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  // Count total blanks
  var totalBlanks=useMemo(function(){var c=0;texts.forEach(function(t){t.parts.forEach(function(p){if(p.blank)c++;});});return c;},[]);

  // Get current text and its blanks
  var curText=texts[ti];
  var blanks=curText?curText.parts.filter(function(p){return p.blank;}):[];
  var curBlank=blanks[bi];

  function doAns(i){
    sPk(i);
    if(i===curBlank.correct)sSc(sc+1);
    else{sSk(true);setTimeout(function(){sSk(false);},400);}
    sTB(totalB+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(bi<blanks.length-1){sBi(bi+1);sP("q");}
    else if(ti<texts.length-1){sTi(ti+1);sBi(0);sP("text");}
    else{sP("done");p.done(sc,totalBlanks,25+sc*5);}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📄</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 6 — Text Completion</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{texts.length} business texts with 4 blanks each.<br/>Read the full text, then complete the blanks.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Context is everything here!</p>
    <button className="btn1" onClick={function(){sP("text");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalBlanks*0.8?"🏆":sc>=totalBlanks*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 6 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalBlanks*0.8?"var(--green)":sc>=totalBlanks*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalBlanks}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  // Build text display with blanks highlighted
  function renderText(){
    var blankIdx=0;
    return curText.parts.map(function(part,i){
      if(part.blank){
        var thisIdx=blankIdx;blankIdx++;
        var isCurrent=thisIdx===bi;
        var answered=thisIdx<bi;
        var label=answered?blanks[thisIdx].options[blanks[thisIdx].correct]:"____("+(thisIdx+1)+")____";
        return <span key={i} style={{padding:"2px 6px",borderRadius:4,fontWeight:700,
          background:isCurrent?"rgba(0,212,255,.2)":answered?"rgba(0,230,118,.1)":"rgba(255,255,255,.06)",
          color:isCurrent?"var(--cyan)":answered?"var(--green)":"var(--t3)",
          border:isCurrent?"1px solid var(--cyan)":"1px solid transparent"}}>{label}</span>;
      }
      return <span key={i}>{part.text}</span>;
    });
  }

  if(ph==="text")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Text {ti+1}/{texts.length}</span></div>
    <div style={{display:"flex",gap:6,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(168,85,247,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}</span>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(255,255,255,.04)",color:"var(--t3)",borderRadius:6}} className="out">From: {curText.from}</span></div>
    <div className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--t1)"}}>Subject: {curText.subject}</div>
    <div className="crd" style={{padding:16,marginBottom:20}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:2,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p style={{fontSize:12,color:"var(--t3)",textAlign:"center",marginBottom:16}}>Read the full text, then tap below to fill in the blanks.</p>
    <button className="btn1" onClick={function(){sP("q");}}>Fill in the blanks</button></div>);

  // Question mode
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Blank {totalB+1}/{totalBlanks}</span></div>
    <Bar value={totalB} max={totalBlanks} h={4} color="linear-gradient(90deg,#ec4899,#a855f7)"/>
    <div style={{marginTop:12,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(168,85,247,.1)",color:"var(--purple)",borderRadius:6,fontWeight:600}} className="out">{curText.type}: {curText.subject}</span></div>
    <div className="crd" style={{padding:14,marginBottom:20,background:"rgba(255,255,255,.02)"}}>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.9,whiteSpace:"pre-line"}}>{renderText()}</p></div>
    <p className="out" style={{fontWeight:700,fontSize:14,marginBottom:12,color:"var(--cyan)"}}>Fill blank ({bi+1}):</p>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {curBlank.options.map(function(opt,i){
        var isCor=i===curBlank.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          {opt}</button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:14}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{curBlank.x}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:14}}>{bi<blanks.length-1?"Next Blank":(ti<texts.length-1?"Next Text":"See Results")}</button></div>}
  </div>);
}

// ─── PART 7 READING COMPREHENSION ───
function Part7Read(p){
  var passages=useMemo(function(){return shuffle(PART7_PASSAGES).slice(0,7);},[]);
  var[pi,sPi]=useState(0);var[qi,sQi]=useState(0);var[sc,sSc]=useState(0);var[totalQ,sTQ]=useState(0);
  var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  var totalQs=useMemo(function(){var c=0;passages.forEach(function(p){c+=p.questions.length;});return c;},[]);
  var curPass=passages[pi];
  var curQ=curPass?curPass.questions[qi]:null;

  function doAns(i){
    sPk(i);
    if(i===curQ.correct)sSc(sc+1);
    else{sSk(true);setTimeout(function(){sSk(false);},400);}
    sTQ(totalQ+1);sP("fb");
  }
  function nxt(){
    sPk(-1);
    if(qi<curPass.questions.length-1){sQi(qi+1);sP("q");}
    else if(pi<passages.length-1){sPi(pi+1);sQi(0);sP("read");}
    else{sP("done");p.done(sc,totalQs,30+sc*5);}
  }

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📖</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 7 — Reading</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>{passages.length} passages with 3-4 questions each.<br/>Read the questions FIRST, then scan for answers!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Strategy: Questions first, then scan!</p>
    <button className="btn1" onClick={function(){sP("read");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=30+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=totalQs*0.8?"🏆":sc>=totalQs*0.5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Reading Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=totalQs*0.8?"var(--green)":sc>=totalQs*0.5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{totalQs}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  // Reading view — show passage
  if(ph==="read")return(<div className="enter" style={{padding:"20px 16px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Passage {pi+1}/{passages.length}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#3b82f6,#06b6d4)"/>
    <div style={{display:"flex",gap:6,marginTop:12,marginBottom:12}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:"#3b82f6",borderRadius:6,fontWeight:600}} className="out">{curPass.type}</span>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(255,255,255,.04)",color:"var(--t3)",borderRadius:6}} className="out">{curPass.questions.length} questions</span></div>
    <div className="crd" style={{padding:16,marginBottom:16}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.8,whiteSpace:"pre-line"}}>{curPass.text}</p></div>
    <button className="btn1" onClick={function(){sP("q");}}>Answer Questions</button></div>);

  // Question mode
  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>Q {totalQ+1}/{totalQs}</span></div>
    <Bar value={totalQ} max={totalQs} h={4} color="linear-gradient(90deg,#3b82f6,#06b6d4)"/>
    <div style={{marginTop:12,marginBottom:6}}>
      <span style={{fontSize:10,padding:"3px 8px",background:"rgba(59,130,246,.1)",color:"#3b82f6",borderRadius:6,fontWeight:600}} className="out">{curPass.type} — Passage {pi+1}</span></div>

    <h2 className="out" style={{fontWeight:700,fontSize:17,lineHeight:1.5,marginBottom:20,marginTop:12}}>{curQ.q}</h2>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {curQ.options.map(function(opt,i){
        var isCor=i===curQ.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>
    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:14}}>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{curQ.x}</p></div>
      <button className="btn1" onClick={nxt} style={{marginTop:14}}>{qi<curPass.questions.length-1?"Next Question":(pi<passages.length-1?"Next Passage":"See Results")}</button></div>}
  </div>);
}

// ─── FALSE FRIENDS ───
function FalseFriends(p){
  var items=useMemo(function(){return shuffle(FALSE_FRIENDS).slice(0,12);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);var[sk,sSk]=useState(false);

  function doAns(i){
    sPk(i);
    if(i===items[ci].correct)sSc(sc+1);
    else{sSk(true);setTimeout(function(){sSk(false);},400);}
    sP("fb");
  }
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);sP("q");}else{sP("done");p.done(sc,items.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🎭</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>False Friends</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>These English words LOOK like French words but mean something completely different!</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Can you avoid the francophone traps?</p>
    <button className="btn1" onClick={function(){sP("q");}}>Start</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=10?"🏆":sc>=7?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>False Friends Defeated!</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=10?"var(--green)":sc>=7?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back to Training</button></div>);}

  var it=items[ci];

  return(<div className={sk?"sk":""} style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#ec4899,#f59e0b)"/>

    <div style={{marginTop:20,marginBottom:20}}>
      <div className="out" style={{fontSize:11,color:"var(--purple)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:16}}>What does the underlined word mean here?</div>
      <div className="crd" style={{padding:16,background:"rgba(168,85,247,.05)",borderColor:"rgba(168,85,247,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <SpeakBtn text={it.ex} size={28} rate={0.85}/>
          <p style={{fontSize:15,color:"var(--t1)",lineHeight:1.6}}>
            {it.ex.split(new RegExp("("+it.en+")","i")).map(function(part,i){
              if(part.toLowerCase()===it.en.toLowerCase()) return (<span key={i} style={{color:"var(--gold)",fontWeight:800,textDecoration:"underline",textDecorationColor:"var(--gold)",textUnderlineOffset:3}}>{part}</span>);
              return (<span key={i}>{part}</span>);
            })}
          </p>
        </div>
      </div>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.correct;var isPick=pick===i;var show=ph==="fb";
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(show&&isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(show&&isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<button key={i} onClick={function(){if(ph==="q")doAns(i);}} disabled={show}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:bg,border:"1px solid "+bd,borderRadius:12,cursor:ph==="q"?"pointer":"default",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"all .2s"}}>
          <div style={{width:26,height:26,borderRadius:"50%",border:"2px solid "+(show&&isCor?"var(--green)":show&&isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:show&&isCor?"var(--green)":show&&isPick&&!isCor?"var(--red)":"transparent",color:show&&(isCor||isPick)?"#fff":"var(--t3)"}}>
            {show&&isCor?"✓":show&&isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></button>);})}
    </div>

    {ph==="fb"&&<div style={{marginTop:16,animation:"fadeIn .3s"}}>
      <div className="crd" style={{background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:16}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:14}}>🎭</span>
          <span className="out" style={{fontWeight:700,fontSize:13,color:"var(--orange)"}}>False Friend Alert</span></div>
        <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>{it.trap}</p>
        <div style={{borderTop:"1px solid var(--bdr)",paddingTop:8,marginTop:4}}>
          <span style={{fontSize:12,color:"var(--t3)"}}>FR translation: </span>
          <span className="out" style={{fontSize:12,fontWeight:600,color:"var(--cyan)"}}>{it.realFr}</span>
        </div>
      </div>
      <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button></div>}
  </div>);
}

function TeacherDash(p){
  var[students,setStudents]=useState([]);var[loading,setLoad]=useState(true);
  var[detail,setDetail]=useState(null);var[classCode,setClassCode]=useState("idrac2026");

  function loadStudents(){
    supabase.from('students').select('*').eq('class_code',classCode).order('xp',{ascending:false})
      .then(function(res){setStudents(res.data||[]);setLoad(false);})
      .catch(function(){setLoad(false);});
  }
  useEffect(function(){loadStudents();},[classCode]);

  if(loading)return(<div className="app" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><p className="out" style={{color:"var(--t2)"}}>Loading dashboard...</p></div>);

  // Student detail view
  if(detail!==null&&students[detail]){
    var s=students[detail];var acc=s.stats&&s.stats.totalQ>0?Math.round(s.stats.correct/s.stats.totalQ*100):0;
    var modules=s.moduleScores||{};
    return(<div className="app enter" style={{padding:"20px 16px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <button onClick={function(){setDetail(null);}} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Back</button>
        <span className="out" style={{fontWeight:700,fontSize:15}}>Student Detail</span>
        <div style={{width:40}}/></div>

      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:24,fontWeight:900}} className="out">{s.name.charAt(0).toUpperCase()}</div>
        <h2 className="out" style={{fontWeight:800,fontSize:20}}>{s.name}</h2>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:6}}>
          <span style={{fontSize:12,color:"var(--t2)"}}>Level {s.level||"?"}</span>
          <span style={{fontSize:12,color:"var(--gold)"}}>{s.league||"?"}</span>
          <span style={{fontSize:12,color:"var(--orange)"}}>{s.streak||0} streak</span>
        </div>
        <p style={{fontSize:11,color:"var(--t3)",marginTop:4}}>Exported: {s.exported||"unknown"}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--gold)"}}>{s.xp||0}</div><div style={{fontSize:10,color:"var(--t3)"}}>XP</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--cyan)"}}>{acc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Accuracy</div></div>
        <div className="crd" style={{padding:12,textAlign:"center"}}><div className="out" style={{fontSize:18,fontWeight:800,color:"var(--purple)"}}>{s.stats?s.stats.sessions:0}</div><div style={{fontSize:10,color:"var(--t3)"}}>Sessions</div></div>
      </div>

      <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--t2)"}}>Module Breakdown</h3>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {MISSION_MODULES.map(function(m){
          var ms=modules[m.id];
          if(!ms)return(<div key={m.id} className="crd" style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10,opacity:.4}}>
            <span style={{fontSize:16}}>{m.icon}</span><span style={{fontSize:13,color:"var(--t3)"}}>{m.name}</span>
            <span style={{marginLeft:"auto",fontSize:11,color:"var(--t3)"}}>Not started</span></div>);
          var modAcc=ms.total>0?Math.round(ms.correct/ms.total*100):0;
          var col=modAcc>=70?"var(--green)":modAcc>=50?"var(--orange)":"var(--red)";
          return(<div key={m.id} className="crd" style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>{m.icon}</span>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,color:"var(--t1)"}} className="out">{m.name}</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{ms.sessions} sessions · Last: {ms.lastDate||"?"}</div></div>
            <div style={{textAlign:"right"}}><div className="out" style={{fontWeight:800,fontSize:15,color:col}}>{modAcc}%</div>
              <div style={{fontSize:10,color:"var(--t3)"}}>{ms.correct}/{ms.total}</div></div>
          </div>);
        })}
      </div>
    </div>);
  }

  // Main dashboard
  var classAcc=0;var totalSess=0;var activeCnt=0;
  students.forEach(function(s){
    if(s.stats&&s.stats.totalQ>0){classAcc+=s.stats.correct/s.stats.totalQ;activeCnt++;}
    totalSess+=(s.stats?s.stats.sessions:0);
  });
  classAcc=activeCnt>0?Math.round(classAcc/activeCnt*100):0;

  return(<div className="app enter" style={{padding:"20px 16px 40px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Logout</button>
      <span className="out" style={{fontWeight:700,fontSize:15}}>Teacher Dashboard</span>
      <div style={{width:40}}/></div>

    {/* Class overview */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
      <div className="crd" style={{padding:14,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:"var(--cyan)"}}>{students.length}</div><div style={{fontSize:10,color:"var(--t3)"}}>Students</div></div>
      <div className="crd" style={{padding:14,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:classAcc>=60?"var(--green)":"var(--orange)"}}>{classAcc}%</div><div style={{fontSize:10,color:"var(--t3)"}}>Class accuracy</div></div>
      <div className="crd" style={{padding:14,textAlign:"center"}}><div className="out" style={{fontSize:22,fontWeight:800,color:"var(--purple)"}}>{totalSess}</div><div style={{fontSize:10,color:"var(--t3)"}}>Total sessions</div></div>
    </div>

{/* Refresh + class code */}
    <div style={{display:"flex",gap:8,marginBottom:20}}>
      <button className="btn1" onClick={function(){setLoad(true);loadStudents();}} style={{flex:1,fontSize:14}}>🔄 Refresh data</button>
    </div>

    {/* Student list */}
    <h3 className="out" style={{fontWeight:700,fontSize:14,marginBottom:10,color:"var(--t2)"}}>Students ({students.length})</h3>
    {students.length===0&&<div className="crd" style={{padding:20,textAlign:"center"}}>
      <p style={{color:"var(--t3)",fontSize:13}}>No students imported yet. Ask your students to go to Profile and tap "Share progress with teacher", then paste their code above.</p>
    </div>}
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {students.sort(function(a,b){return(b.xp||0)-(a.xp||0);}).map(function(s,i){
        var sAcc=s.stats&&s.stats.totalQ>0?Math.round(s.stats.correct/s.stats.totalQ*100):0;
        var accCol=sAcc>=70?"var(--green)":sAcc>=50?"var(--orange)":"var(--red)";
        return(<div key={i} className="crd" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer"}}
          onClick={function(){setDetail(i);}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,flexShrink:0}} className="out">{s.name.charAt(0).toUpperCase()}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="out" style={{fontWeight:700,fontSize:14}}>{s.name}</div>
            <div style={{display:"flex",gap:8,marginTop:2}}>
              <span style={{fontSize:10,color:"var(--gold)"}}>Lv {s.level||"?"}</span>
              <span style={{fontSize:10,color:"var(--t3)"}}>{s.stats?s.stats.sessions:0} sess</span>
              <span style={{fontSize:10,color:"var(--orange)"}}>{s.streak||0} streak</span>
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div className="out" style={{fontWeight:800,fontSize:16,color:accCol}}>{sAcc}%</div>
            <div style={{fontSize:10,color:"var(--t3)"}}>{s.xp||0} XP</div>
          </div>
          <span style={{fontSize:14,color:"var(--cyan)",marginLeft:4}}>{"→"}</span>
        </div>);
      })}
    </div>

    {students.length>0&&<div style={{textAlign:"center",marginTop:20}}>
      <p style={{fontSize:11,color:"var(--t3)"}}>Data syncs automatically from student devices</p>
    </div>}
  </div>);
}
// ─── LISTENING HUB ───
function ListenHub(p){
  return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>🎧</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Listening Practice</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:32,lineHeight:1.6}}>Train your ear for the TOEIC Listening section</p>
    <div style={{display:"flex",flexDirection:"column",gap:12,textAlign:"left"}}>
      <div className="crd" onClick={function(){p.nav("lisP1");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#22c55e,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>📷</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 1 — Photographs</div><div style={{fontSize:11,color:"var(--t3)"}}>{LISTENING_P1.length} questions</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
      <div className="crd" onClick={function(){p.nav("lisP2");}} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
        <div style={{width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,#f59e0b,#ef4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>💬</div>
        <div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>Part 2 — Question-Response</div><div style={{fontSize:11,color:"var(--t3)"}}>{LISTENING_P2.length} questions</div></div>
        <span style={{fontSize:16,color:"var(--cyan)"}}>{"\u2192"}</span></div>
    </div>
    <button className="btn2" onClick={p.back} style={{marginTop:24,width:"100%"}}>Back</button>
  </div>);
}

// ─── PART 2 LISTENING ───
function ListenP2(p){
  var items=useMemo(function(){return shuffle(LISTENING_P2).slice(0,10);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);

  async function playQuestion(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    await speakAndWait(it.q,0.9);
    await new Promise(function(r){setTimeout(r,500);});
    await speakAndWait("A. "+it.opts[0],0.85);
    await new Promise(function(r){setTimeout(r,400);});
    await speakAndWait("B. "+it.opts[1],0.85);
    await new Promise(function(r){setTimeout(r,400);});
    await speakAndWait("C. "+it.opts[2],0.85);
    await new Promise(function(r){setTimeout(r,300);});
    setPlaying(false);setPlayed(true);
  }

  function doAns(i){sPk(i);if(i===items[ci].c)sSc(sc+1);sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);setPlayed(false);sP("listen");}else{sP("done");p.done(sc,items.length,25+sc*6);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>💬</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 2 — Question-Response</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>You will hear a question followed by 3 responses.<br/>Choose the best response.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully — audio plays once!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=25+sc*6;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=8?"🏆":sc>=5?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Listening Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=8?"var(--green)":sc>=5?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div style={{textAlign:"center",marginTop:40}}>
      <div className="out" style={{fontSize:11,color:"var(--orange)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginBottom:24}}>Part 2 — Question-Response</div>
      {!played?<div>
        <button onClick={playQuestion} disabled={playing}
          style={{width:80,height:80,borderRadius:"50%",border:"none",background:playing?"rgba(255,140,66,.2)":"linear-gradient(135deg,#f59e0b,#ef4444)",
            cursor:playing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",
            animation:playing?"pulse 1.5s infinite":"none"}}>
          <span style={{fontSize:32}}>{playing?"🔊":"▶️"}</span>
        </button>
        <p className="out" style={{color:playing?"var(--orange)":"var(--t2)",fontSize:14,fontWeight:600}}>
          {playing?"Listening...":"Tap to play audio"}</p>
      </div>
      :<div style={{animation:"fadeIn .3s"}}>
        <p className="out" style={{color:"var(--green)",fontSize:14,fontWeight:600,marginBottom:24}}>Audio complete — choose your answer</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,textAlign:"left"}}>
          {it.opts.map(function(opt,i){
            return(<button key={i} onClick={function(){doAns(i);}}
              style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",fontSize:14,color:"var(--t1)",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{width:28,height:28,borderRadius:"50%",border:"2px solid var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,color:"var(--t3)"}}>
                {String.fromCharCode(65+i)}</div>
              <span>{opt}</span></button>);
          })}
        </div>
        <button onClick={function(){setPlayed(false);}} className="btn2" style={{marginTop:12,width:"100%",fontSize:12}}>🔄 Replay audio</button>
      </div>}
    </div>
  </div>);

  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#f59e0b,#ef4444)"/>
    <div className="crd" style={{marginTop:16,padding:14,background:"rgba(168,85,247,.05)",borderColor:"rgba(168,85,247,.12)"}}>
      <p className="out" style={{fontSize:12,fontWeight:600,color:"var(--purple)",marginBottom:6}}>Question</p>
      <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.5}}>{it.q}</p></div>
    <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.c;var isPick=pick===i;
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:bg,border:"1px solid "+bd,borderRadius:12,fontSize:14,color:"var(--t1)"}}>
          <div style={{width:24,height:24,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",color:(isCor||isPick)?"#fff":"var(--t3)"}}>
            {isCor?"✓":isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></div>);
      })}
    </div>
    <div className="crd" style={{marginTop:16,background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:14,animation:"fadeIn .3s"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.x}</p></div>
    <button className="btn1" onClick={nxt} style={{marginTop:16}}>{ci<items.length-1?"Next":"See Results"}</button>
  </div>);
}

// ─── PART 1 LISTENING ───
function ListenP1(p){
  var items=useMemo(function(){return shuffle(LISTENING_P1);},[]);
  var[ci,sC]=useState(0);var[sc,sSc]=useState(0);var[ph,sP]=useState("intro");var[pick,sPk]=useState(-1);
  var[playing,setPlaying]=useState(false);var[played,setPlayed]=useState(false);var[curOpt,setCurOpt]=useState(-1);

  async function playStatements(){
    if(playing)return;
    setPlaying(true);
    var it=items[ci];
    for(var i=0;i<it.opts.length;i++){
      setCurOpt(i);
      await speakAndWait(String.fromCharCode(65+i)+". "+it.opts[i],0.85);
      await new Promise(function(r){setTimeout(r,500);});
    }
    setCurOpt(-1);setPlaying(false);setPlayed(true);
  }

  function doAns(i){sPk(i);if(i===items[ci].c)sSc(sc+1);sP("fb");}
  function nxt(){if(ci<items.length-1){sC(ci+1);sPk(-1);setPlayed(false);setCurOpt(-1);sP("listen");}else{sP("done");p.done(sc,items.length,20+sc*5);}}

  if(ph==="intro")return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:56,marginBottom:16}}>📷</div>
    <h1 className="out" style={{fontWeight:900,fontSize:26,marginBottom:8}}>Part 1 — Photographs</h1>
    <p style={{color:"var(--t2)",fontSize:13,marginBottom:8,lineHeight:1.6}}>Read the scene description, then listen to 4 statements.<br/>Choose the one that best describes the scene.</p>
    <p style={{color:"var(--gold)",fontWeight:600,fontSize:14,marginBottom:32}}>Listen carefully to each statement!</p>
    <button className="btn1" onClick={function(){sP("listen");}}>Start Listening</button>
    <button className="btn2" onClick={p.back} style={{marginTop:12,width:"100%"}}>Back</button></div>);

  if(ph==="done"){var xp=20+sc*5;return(<div className="enter" style={{padding:"20px 16px",minHeight:"100vh",display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
    <div style={{fontSize:48,marginBottom:16,animation:"countUp .6s"}}>{sc>=7?"🏆":sc>=4?"⚔️":"🛡️"}</div>
    <h1 className="out" style={{fontWeight:900,fontSize:28,marginBottom:8}}>Part 1 Complete</h1>
    <div className="out" style={{fontSize:44,fontWeight:900,color:sc>=7?"var(--green)":sc>=4?"var(--cyan)":"var(--orange)",marginBottom:4,animation:"countUp .8s"}}>{sc}/{items.length}</div>
    <div className="out" style={{fontSize:20,fontWeight:800,color:"var(--gold)",marginBottom:32}}>+{xp} XP</div>
    <button className="btn1" onClick={p.back}>Back</button></div>);}

  var it=items[ci];

  if(ph==="listen")return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>
    <div className="out" style={{fontSize:11,color:"var(--green)",textTransform:"uppercase",letterSpacing:1,fontWeight:600,marginTop:16,marginBottom:12}}>Scene Description</div>
    <div className="crd" style={{padding:16,marginBottom:20,background:"rgba(34,197,94,.04)",borderColor:"rgba(34,197,94,.12)"}}>
      <p style={{fontSize:14,color:"var(--t1)",lineHeight:1.7}}>{it.scene}</p></div>
    {!played?<div style={{textAlign:"center"}}>
      <button onClick={playStatements} disabled={playing}
        style={{width:72,height:72,borderRadius:"50%",border:"none",background:playing?"rgba(34,197,94,.2)":"linear-gradient(135deg,#22c55e,#06b6d4)",
          cursor:playing?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",
          animation:playing?"pulse 1.5s infinite":"none"}}>
        <span style={{fontSize:28}}>{playing?"🔊":"▶️"}</span>
      </button>
      {playing&&curOpt>=0&&<p className="out" style={{color:"var(--cyan)",fontSize:14,fontWeight:600}}>Playing statement {String.fromCharCode(65+curOpt)}...</p>}
      {!playing&&<p className="out" style={{color:"var(--t2)",fontSize:13}}>Tap to hear the 4 statements</p>}
    </div>
    :<div style={{animation:"fadeIn .3s"}}>
      <p className="out" style={{color:"var(--green)",fontSize:13,fontWeight:600,textAlign:"center",marginBottom:16}}>Statements complete — which one matches the scene?</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {["A","B","C","D"].map(function(letter,i){
          return(<button key={i} onClick={function(){doAns(i);}}
            style={{padding:"16px 12px",background:"var(--bg2)",border:"1px solid var(--bdr)",borderRadius:12,cursor:"pointer",textAlign:"center"}}>
            <div className="out" style={{fontWeight:800,fontSize:20,color:"var(--cyan)"}}>{letter}</div>
          </button>);
        })}
      </div>
      <button onClick={function(){setPlayed(false);setCurOpt(-1);}} className="btn2" style={{marginTop:12,width:"100%",fontSize:12}}>🔄 Replay statements</button>
    </div>}
  </div>);

  return(<div style={{padding:"20px 16px",minHeight:"100vh"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <button onClick={p.back} style={{background:"none",border:"none",color:"var(--t2)",cursor:"pointer",fontSize:14}}>Quit</button>
      <span className="out" style={{fontSize:13,color:"var(--t2)",fontWeight:600}}>{ci+1}/{items.length}</span></div>
    <Bar value={ci} max={items.length} h={4} color="linear-gradient(90deg,#22c55e,#06b6d4)"/>
    <div className="crd" style={{marginTop:12,padding:12,background:"rgba(34,197,94,.04)",borderColor:"rgba(34,197,94,.1)"}}>
      <p style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{it.scene}</p></div>
    <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:12}}>
      {it.opts.map(function(opt,i){
        var isCor=i===it.c;var isPick=pick===i;
        var bg="var(--bg2)";var bd="var(--bdr)";
        if(isCor){bg="rgba(0,230,118,.12)";bd="var(--green)";}
        else if(isPick&&!isCor){bg="rgba(255,71,87,.12)";bd="var(--red)";}
        return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:bg,border:"1px solid "+bd,borderRadius:10,fontSize:13,color:"var(--t1)"}}>
          <div style={{width:22,height:22,borderRadius:"50%",border:"2px solid "+(isCor?"var(--green)":isPick?"var(--red)":"var(--t3)"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:isCor?"var(--green)":isPick&&!isCor?"var(--red)":"transparent",color:(isCor||isPick)?"#fff":"var(--t3)"}}>
            {isCor?"✓":isPick?"✗":String.fromCharCode(65+i)}</div>
          <span>{opt}</span></div>);
      })}
    </div>
    <div className="crd" style={{marginTop:12,background:"rgba(0,212,255,.06)",borderColor:"rgba(0,212,255,.15)",padding:12,animation:"fadeIn .3s"}}>
      <p style={{fontSize:13,color:"var(--t2)",lineHeight:1.6}}>{it.x}</p></div>
    <button className="btn1" onClick={nxt} style={{marginTop:14}}>{ci<items.length-1?"Next":"See Results"}</button>
  </div>);
}
// ─── LEAGUE ───
function League(p){var u=p.u,lg=getLeague(u.weeklyXp);
var[rivals,setRivals]=useState([]);
useEffect(function(){
  supabase.from('students').select('name,weekly_xp').eq('class_code','idrac2026').order('weekly_xp',{ascending:false}).limit(20)
    .then(function(res){if(res.data)setRivals(res.data);});
},[u.weeklyXp]);
var all=rivals.map(function(r){return{name:r.name===u.name?r.name+" (You)":r.name,avatar:"⚔️",xp:r.weekly_xp||0,me:r.name===u.name};});
if(!all.find(function(a){return a.me;}))all.push({name:u.name+" (You)",avatar:"⚔️",xp:u.weeklyXp,me:true});
all.sort(function(a,b){return b.xp-a.xp;});
var nx=LEAGUES.find(function(l){return l.min>u.weeklyXp;});
return(<div className="enter" style={{padding:"20px 16px 100px"}}><h1 className="out" style={{fontWeight:800,fontSize:24,marginBottom:4}}>League</h1><p style={{color:"var(--t2)",fontSize:13,marginBottom:20}}>Weekly ranking</p>
<div className="crd glo" style={{textAlign:"center",marginBottom:20,padding:24}}>
<div style={{fontSize:48,marginBottom:8,animation:"glow 3s infinite"}}>{lg.icon}</div>
<div className="out" style={{fontWeight:800,fontSize:24,color:lg.color}}>{lg.name} League</div>
<div style={{fontSize:13,color:"var(--t2)",marginTop:4}}>{u.weeklyXp} XP this week</div>
{nx&&<div style={{marginTop:12}}><div style={{fontSize:11,color:"var(--t3)",marginBottom:6}}>{nx.min-u.weeklyXp} XP to {nx.name}</div><Bar value={u.weeklyXp-lg.min} max={nx.min-lg.min} h={4} color={nx.color}/></div>}</div>
<div style={{display:"flex",flexDirection:"column",gap:6}}>{all.map(function(pl,i){var me=pl.me,rk=i+1;return(
<div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:me?"rgba(0,212,255,.08)":"var(--bg2)",border:me?"1px solid rgba(0,212,255,.2)":"1px solid var(--bdr)",borderRadius:12}}>
<div className="out" style={{width:28,textAlign:"center",fontWeight:800,fontSize:14,color:rk<=3?"var(--gold)":"var(--t3)"}}>{rk<=3?(rk===1?"🥇":rk===2?"🥈":"🥉"):rk}</div>
<div style={{fontSize:20,width:28,textAlign:"center"}}>{pl.avatar}</div>
<div style={{flex:1}}><div className="out" style={{fontWeight:me?700:500,fontSize:14,color:me?"var(--cyan)":"var(--t1)"}}>{pl.name}</div></div>
<div className="out" style={{fontWeight:700,fontSize:14,color:me?"var(--cyan)":"var(--t2)"}}>{pl.xp} XP</div></div>);})}</div>
<p style={{textAlign:"center",fontSize:12,color:"var(--t3)",marginTop:20}}>Leaderboard resets weekly</p></div>);}

// ─── PROFILE ───
function Profile(p){var u=p.u,lv=getLevel(u.xp),lg=getLeague(u.weeklyXp),acc=u.stats.totalQ>0?Math.round(u.stats.correct/u.stats.totalQ*100):0;
var uC=Object.assign({},u);var ea=ACHIEVEMENTS.filter(function(a){return a.check(uC);});var la=ACHIEVEMENTS.filter(function(a){return!a.check(uC);});
return(<div className="enter" style={{padding:"20px 16px 100px"}}>
<div style={{textAlign:"center",marginBottom:24}}>
<div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#00d4ff,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:32,fontWeight:900}} className="out">{u.name.charAt(0).toUpperCase()}</div>
<h1 className="out" style={{fontWeight:800,fontSize:22}}>{u.name}</h1>
<div style={{display:"flex",justifyContent:"center",gap:16,marginTop:8,flexWrap:"wrap"}}>
<span style={{fontSize:13,color:"var(--t2)"}}>Level {lv.level}</span><span style={{fontSize:13,color:lg.color}}>{lg.icon} {lg.name}</span><span style={{fontSize:13,color:"var(--orange)"}}>🔥 {u.streak}</span></div></div>

<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
{[{l:"Total XP",v:u.xp,i:"⭐"},{l:"Accuracy",v:acc+"%",i:"🎯"},{l:"Sessions",v:u.stats.sessions,i:"📊"},{l:"Cards Reviewed",v:u.stats.cardsRev||0,i:"🃏"},{l:"Drills Done",v:u.stats.drills||0,i:"📝"},{l:"Perfect Dailies",v:u.stats.perfects||0,i:"✨"}].map(function(s){return(
<div key={s.l} className="crd" style={{padding:14,textAlign:"center"}}><div style={{fontSize:18,marginBottom:4}}>{s.i}</div><div className="out" style={{fontSize:20,fontWeight:800}}>{s.v}</div><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div></div>);})}</div>

<h2 className="out" style={{fontWeight:700,fontSize:16,marginBottom:12}}>Achievements</h2>
<div style={{display:"flex",flexDirection:"column",gap:8}}>
{ea.map(function(a){return(<div key={a.id} className="crd" style={{display:"flex",alignItems:"center",gap:14,padding:14,background:"rgba(255,215,0,.05)",borderColor:"rgba(255,215,0,.15)"}}>
<div style={{fontSize:24}}>{a.icon}</div><div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14,color:"var(--gold)"}}>{a.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{a.desc}</div></div></div>);})}
{la.map(function(a){return(<div key={a.id} className="crd" style={{display:"flex",alignItems:"center",gap:14,padding:14,opacity:.4}}>
<div style={{fontSize:24}}>🔒</div><div style={{flex:1}}><div className="out" style={{fontWeight:700,fontSize:14}}>{a.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{a.desc}</div></div></div>);})}</div>
<div style={{textAlign:"center",marginTop:32}}>
  <button className="btn2" onClick={p.reset} style={{fontSize:12,color:"var(--red)",borderColor:"rgba(255,71,87,.2)",width:"100%"}}>Reset all data</button>
</div></div>);}

// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App(){
  var[u,sU]=useState(null);var[ld,sL]=useState(true);var[tab,sT]=useState("home");var[sp,sSP]=useState(null);var[spA,sSPA]=useState(null);var[xpt,sXpt]=useState(null);var[teacherMode,setTeacher]=useState(false);

useEffect(function(){
    var sub=supabase.auth.onAuthStateChange(function(event,session){
      if(session){
        load().then(function(d){
          if(d){
            var td=today(),yd=new Date();yd.setDate(yd.getDate()-1);var ys=yd.toISOString().split("T")[0];
            if(d.lastActive!==td&&d.lastActive!==ys)d.streak=0;
            var cw=weekId();if(d.weekId!==cw){d.weeklyXp=0;d.weekId=cw;}
            if(!d.moduleScores)d.moduleScores={};
            if(!d.mission)d.mission={date:null,actId:null,done:false};
            sU(d);
          }
          sL(false);
        });
      }else{
        sL(false);
      }
    });
    // Also check immediately in case session is already restored
    supabase.auth.getSession().then(function(res){
      if(!res.data.session)sL(false);
    });
    return function(){sub.data.subscription.unsubscribe();};
  },[]);

  function sv(d){sU(d);save(d);}
  function addXp(baseAmt){
    var c=JSON.parse(JSON.stringify(u));var td=today();var bonuses=[];var isFirstToday=c.lastActive!==td;

    // Update streak
    if(isFirstToday){var yd=new Date();yd.setDate(yd.getDate()-1);c.streak=c.lastActive===yd.toISOString().split("T")[0]?c.streak+1:1;c.lastActive=td;}

    // Calculate multipliers
    var mult=1;var amt=baseAmt;

    // Weekend bonus (Saturday=6, Sunday=0)
    var dow=new Date().getDay();
    if(dow===0||dow===6){mult*=2;bonuses.push({label:"Weekend x2",color:"#ff6bff"});}

    // Streak multiplier
    if(c.streak>=7){mult*=1.5;bonuses.push({label:"Streak x1.5 ("+c.streak+"d)",color:"#ff8c42"});}
    else if(c.streak>=3){mult*=1.2;bonuses.push({label:"Streak x1.2 ("+c.streak+"d)",color:"#ff8c42"});}

    amt=Math.round(baseAmt*mult);

    // Daily login bonus (first activity of the day)
    if(isFirstToday){amt+=10;bonuses.push({label:"+10 daily login",color:"#00e676"});}

    c.xp+=amt;c.weeklyXp+=amt;
    var toastInfo={total:amt,base:baseAmt,bonuses:bonuses};
    sXpt(toastInfo);setTimeout(function(){sXpt(null);},2200);
    return c;
  }
  function nav(pg,arg){sSP(pg);sSPA(arg||null);}
  async function onboard(name, placementScore, lvl) {
  // Créer un compte anonyme
  const { data: authData } = await supabase.auth.signInAnonymously();
  
  // Créer le profil étudiant
  const u = fresh(name);
  if (lvl) { u.xp = lvl.startXp; u.weeklyXp = lvl.startXp; }
  
  // Sauvegarder dans Supabase
  await supabase.from('students').insert({
    id: authData.user.id,
    name: name,
    class_code: 'idrac2026',
    xp: u.xp,
    placement_score: placementScore,
    placement_level: lvl ? lvl.label : null,
    // ... autres champs
  });
  
  sv(u);
}
  function goTeacher(){setTeacher(true);}
  function dailyDone(sc,xp){var c=addXp(xp);c.daily={date:today(),done:true,score:sc,xpE:xp};c.stats.totalQ+=5;c.stats.correct+=sc;c.stats.sessions+=1;if(sc===5)c.stats.perfects=(c.stats.perfects||0)+1;recordModule(c,"daily",sc,5);checkMission(c,"daily");sv(c);}
  function drillDone(sc,tot,xp){var c=addXp(xp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;c.stats.drills=(c.stats.drills||0)+1;recordModule(c,"drill",sc,tot);checkMission(c,"drill");sv(c);}
  function miniDone(sc,tot,xp){var modId=sp||"unknown";var c=addXp(xp);c.stats.totalQ+=tot;c.stats.correct+=sc;c.stats.sessions+=1;recordModule(c,modId,sc,tot);checkMission(c,modId);sv(c);}
  function rateCard(id,r){var c=JSON.parse(JSON.stringify(u));var ex=c.cardStates[id]||{ease:2.5,interval:0,nextReview:today(),correct:0,total:0};c.cardStates[id]=srsUp(ex,r);c.stats.cardsRev=(c.stats.cardsRev||0)+1;sv(c);}
  function cardsDone(xp){var modId=sp==="cdom"?"csess":sp;var c=addXp(xp);c.stats.sessions+=1;recordModule(c,"csess",1,1);checkMission(c,"csess");sv(c);sSP(null);}
  async function reset(){
    var sess=await supabase.auth.getSession();
    if(sess.data.session){
      await supabase.from('students').delete().eq('id',sess.data.session.user.id);
      await supabase.auth.signOut();
    }
    sU(null);sSP(null);sT("home");
  }

  if(ld)return(<div className="app"><style>{CSS}</style><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,animation:"pulse 1.5s infinite"}}>⚔️</div><p className="out" style={{color:"var(--t2)",marginTop:12}}>Loading Arena...</p></div></div></div>);
  if(teacherMode)return(<div><style>{CSS}</style><TeacherDash back={function(){setTeacher(false);}}/></div>);
  if(!u)return(<div><style>{CSS}</style><Onboard go={onboard} goTeacher={goTeacher}/></div>);
  if(sp==="daily")return(<div className="app"><style>{CSS}</style><Daily u={u} done={dailyDone} back={function(){sSP(null);}}/></div>);
  if(sp==="csess"||sp==="cdom")return(<div className="app"><style>{CSS}</style><CardSess u={u} domId={spA} rate={rateCard} done={cardsDone} back={function(){sSP(null);}}/></div>);
  if(sp==="drill")return(<div className="app"><style>{CSS}</style><Drill u={u} done={drillDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="wordfam")return(<div className="app"><style>{CSS}</style><WordFam u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="connsort")return(<div className="app"><style>{CSS}</style><ConnSort u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="prepdrill")return(<div className="app"><style>{CSS}</style><PrepDrill u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="gerinf")return(<div className="app"><style>{CSS}</style><GerInf u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="traps")return(<div className="app"><style>{CSS}</style><TrapsQuiz u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="falsefr")return(<div className="app"><style>{CSS}</style><FalseFriends u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="strats")return(<div className="app"><style>{CSS}</style><StratCards back={function(){sSP(null);}}/></div>);
  if(sp==="stratquiz")return(<div className="app"><style>{CSS}</style><StratQuizPage u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="timesim")return(<div className="app"><style>{CSS}</style><TimeSim u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="p6")return(<div className="app"><style>{CSS}</style><Part6Drill u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="p7")return(<div className="app"><style>{CSS}</style><Part7Read u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="lis")return(<div className="app"><style>{CSS}</style><ListenHub nav={nav} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="lisP2")return(<div className="app"><style>{CSS}</style><ListenP2 u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);
  if(sp==="lisP1")return(<div className="app"><style>{CSS}</style><ListenP1 u={u} done={miniDone} back={function(){sSP(null);sT("train");}}/></div>);

  return(<div className="app"><style>{CSS}</style>{xpt&&<XpToast v={xpt}/>}
    {tab==="home"&&<Home u={u} nav={nav}/>}{tab==="train"&&<Train u={u} nav={nav}/>}{tab==="cards"&&<Cards u={u} nav={nav}/>}{tab==="league"&&<League u={u}/>}{tab==="profile"&&<Profile u={u} reset={reset}/>}
    <Tabs cur={tab} go={function(t){sT(t);sSP(null);}}/></div>);
}