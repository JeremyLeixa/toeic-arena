// ═══════════════════════════════════════════════════════════
// MODAL COUNCIL — content for the 2 sub-modules
//
// MODAL_MATCH_BOARDS  → tap-to-pair (5 situations ↔ 5 modal responses)
//                       3 boards drawn per session = 15 scored items.
// MODAL_SORT_ITEMS    → 4-bucket classification
//                       (obligation / advice / possibility / deduction).
//                       15 items drawn per session.
//
// Buckets glossary :
//   • obligation : must, have to, need to, mustn't, don't have to
//   • advice     : should, ought to, had better
//   • possibility: can, could, may, might (option, opportunity, permission)
//   • deduction  : must (certain), can't (impossible), might (likely),
//                  could/may (possible) — present and past forms
// ═══════════════════════════════════════════════════════════

export var MODAL_MATCH_BOARDS = [
  {
    id: "mb_01",
    theme: "Office decisions",
    pairs: [
      { situation: "Your colleague asked for help with the printer.", modal: "I can help you in five minutes." },
      { situation: "The deadline is in two hours and you haven't started.", modal: "I must finish this report immediately." },
      { situation: "The office heater is broken and your hands are freezing.", modal: "We should call maintenance about it." },
      { situation: "Your boss hasn't replied to your email from yesterday.", modal: "She might be in a meeting all day." },
      { situation: "You're not sure if you're allowed to leave early today.", modal: "May I leave at four, please?" }
    ]
  },
  {
    id: "mb_02",
    theme: "Health & doctor's office",
    pairs: [
      { situation: "The patient has had a high fever for three days.", modal: "He must see a doctor today." },
      { situation: "You feel exhausted after every workout this week.", modal: "You should rest more between sessions." },
      { situation: "The pharmacist hasn't approved the prescription yet.", modal: "I can't pick up the medication without it." },
      { situation: "The doctor said your blood pressure is borderline high.", modal: "You'd better cut down on salt." },
      { situation: "You're hesitating between two over-the-counter remedies.", modal: "Either could work for a mild headache." }
    ]
  },
  {
    id: "mb_03",
    theme: "Travel planning",
    pairs: [
      { situation: "Check-in closes in 45 minutes and you're stuck in traffic.", modal: "We might miss the flight." },
      { situation: "The hotel asked if you wanted breakfast included.", modal: "I'd rather have it included." },
      { situation: "The visa application website is down again.", modal: "I'll have to try again tomorrow." },
      { situation: "Your friend has never been to Tokyo before.", modal: "She must visit Shibuya at night." },
      { situation: "You realize you forgot to charge your power bank.", modal: "I should have done it last night." }
    ]
  },
  {
    id: "mb_04",
    theme: "Job interview",
    pairs: [
      { situation: "The candidate is sweating and her voice is shaking.", modal: "She must be very nervous." },
      { situation: "You don't know the answer to a technical question.", modal: "You could admit it and offer to follow up." },
      { situation: "The interviewer is taking notes constantly.", modal: "He may be writing down your strong points." },
      { situation: "HR said you'll hear back within a week.", modal: "They should call you by Friday." },
      { situation: "You're not sure which language to greet them in.", modal: "You'd better start in English to be safe." }
    ]
  },
  {
    id: "mb_05",
    theme: "Studying for exams",
    pairs: [
      { situation: "The exam is in 48 hours and you've barely opened the book.", modal: "I really must start tonight." },
      { situation: "Your study group meets every Thursday at the library.", modal: "I might join them this week." },
      { situation: "The professor said calculators won't be allowed.", modal: "We can't bring them into the room." },
      { situation: "You haven't slept more than five hours all week.", modal: "You should get a full night's sleep before the test." },
      { situation: "Your classmate is offering you their old notes.", modal: "That would help me a lot, thanks!" }
    ]
  },
  {
    id: "mb_06",
    theme: "Restaurant scenarios",
    pairs: [
      { situation: "The waiter brought the wrong dish to your table.", modal: "We should let him know politely." },
      { situation: "Your colleague is allergic to peanuts and the menu is unclear.", modal: "She must avoid anything with traces of nuts." },
      { situation: "The bill seems unusually high.", modal: "There might be a mistake on the receipt." },
      { situation: "The chef asked how you wanted the steak cooked.", modal: "I would prefer it medium-rare." },
      { situation: "The restaurant is fully booked tonight.", modal: "We could try the place next door." }
    ]
  },
  {
    id: "mb_07",
    theme: "Workplace etiquette",
    pairs: [
      { situation: "A colleague is wearing strong perfume that bothers you.", modal: "You shouldn't say it directly — find a polite way." },
      { situation: "You walk in on a private conversation between two managers.", modal: "I'd better leave the room immediately." },
      { situation: "Your phone keeps ringing during a team meeting.", modal: "I must put it on silent next time." },
      { situation: "A new intern is using the wrong office equipment.", modal: "Someone could show them how it works." },
      { situation: "The break-room sink is full of dirty dishes again.", modal: "People ought to clean up after themselves." }
    ]
  },
  {
    id: "mb_08",
    theme: "Public transportation",
    pairs: [
      { situation: "The metro line is closed for maintenance this weekend.", modal: "We'll have to take the bus instead." },
      { situation: "An elderly passenger is standing on a crowded bus.", modal: "You should offer them your seat." },
      { situation: "Someone leaves a wallet on the seat as they exit.", modal: "I must call after them right now." },
      { situation: "The conductor is checking everyone's ticket.", modal: "I might have left mine at home." },
      { situation: "The next train is delayed by 30 minutes.", modal: "We could grab a coffee while we wait." }
    ]
  },
  {
    id: "mb_09",
    theme: "Hotel stay",
    pairs: [
      { situation: "The Wi-Fi keeps disconnecting in your room.", modal: "You should report it to the front desk." },
      { situation: "You'd like an extra pillow tonight.", modal: "May I have one brought up, please?" },
      { situation: "The breakfast buffet ends in five minutes.", modal: "We must hurry if we want to eat." },
      { situation: "Check-out time is officially 11 a.m.", modal: "Guests have to leave the room by then." },
      { situation: "The room next door is loud after midnight.", modal: "I might call the receptionist about the noise." }
    ]
  },
  {
    id: "mb_10",
    theme: "Friendly suggestions",
    pairs: [
      { situation: "Your friend just got promoted at work.", modal: "We could throw her a small celebration." },
      { situation: "Your cousin's flight lands at midnight tomorrow.", modal: "Someone should pick him up at the airport." },
      { situation: "Your neighbor's car broke down in the rain.", modal: "You ought to offer them a ride home." },
      { situation: "Your sister is hesitating to apply for a master's.", modal: "She might regret not trying." },
      { situation: "Your best friend forgot their cake at the bakery.", modal: "I can swing by and grab it for you." }
    ]
  },
  {
    id: "mb_11",
    theme: "Customer service",
    pairs: [
      { situation: "A customer is returning a damaged product without a receipt.", modal: "We may make an exception this time." },
      { situation: "Store policy doesn't normally allow refunds after 30 days.", modal: "Customers can't return items after one month." },
      { situation: "You can hear the manager arguing on the phone.", modal: "He must be dealing with a difficult complaint." },
      { situation: "The card machine isn't reading the customer's chip.", modal: "Could you try inserting it instead of tapping?" },
      { situation: "A customer has been waiting more than 20 minutes.", modal: "I should apologize for the wait immediately." }
    ]
  },
  {
    id: "mb_12",
    theme: "Meetings",
    pairs: [
      { situation: "The agenda is empty and people are checking their phones.", modal: "Someone should propose an agenda quickly." },
      { situation: "Your manager just contradicted what she said last week.", modal: "She might have changed her mind." },
      { situation: "The video conference keeps freezing.", modal: "We must reschedule if it doesn't improve." },
      { situation: "A junior team member has been silent the whole hour.", modal: "You could ask her opinion to include her." },
      { situation: "The meeting was meant to last 30 minutes — it's been an hour.", modal: "We really ought to wrap this up." }
    ]
  },
  {
    id: "mb_13",
    theme: "Phone etiquette",
    pairs: [
      { situation: "You receive a sales call during dinner.", modal: "You can politely ask them to call back later." },
      { situation: "The caller is speaking too fast to follow.", modal: "Could you repeat that more slowly, please?" },
      { situation: "The phone signal in this area is terrible.", modal: "We might lose the connection any second." },
      { situation: "A client left an angry voicemail this morning.", modal: "I'd better call him back before he calls again." },
      { situation: "You missed three calls from your boss while at the gym.", modal: "I should have brought my phone with me." }
    ]
  },
  {
    id: "mb_14",
    theme: "Sports & fitness",
    pairs: [
      { situation: "Your knee hurts every time you run lately.", modal: "You should see a physiotherapist." },
      { situation: "The marathon is in three months.", modal: "We must train at least four times a week." },
      { situation: "The gym closes at 10 p.m. tonight.", modal: "We'll have to leave by 9:30." },
      { situation: "The trainer suggested a new diet plan.", modal: "I might give it a try for a month." },
      { situation: "You skipped the warm-up before lifting heavy weights.", modal: "You could have hurt yourself badly." }
    ]
  },
  {
    id: "mb_15",
    theme: "Career planning",
    pairs: [
      { situation: "Your contract ends in 60 days with no renewal in sight.", modal: "I should start sending out applications now." },
      { situation: "A recruiter from a competitor reached out on LinkedIn.", modal: "I might at least listen to what she has to offer." },
      { situation: "Your boss offered to fund a coaching program.", modal: "You ought to take the offer seriously." },
      { situation: "You haven't updated your CV in three years.", modal: "I really must update it this weekend." },
      { situation: "You're considering moving abroad for a new opportunity.", modal: "It could change your whole career path." }
    ]
  }
];

export var MODAL_SORT_ITEMS = [
  // ─── OBLIGATION (13) ───
  {id:"ms_01",s:"Employees must wear safety goggles in the lab.",bucket:"obligation",modal:"must",x:"« Must » exprime une obligation stricte issue d'une règle (sécurité du laboratoire)."},
  {id:"ms_02",s:"You have to submit your tax return by April 15th.",bucket:"obligation",modal:"have to",x:"« Have to » = obligation externe (la loi t'oblige). Plus neutre que « must »."},
  {id:"ms_03",s:"Visitors mustn't enter the warehouse without a badge.",bucket:"obligation",modal:"mustn't",x:"« Mustn't » = interdiction stricte. Attention : ne pas confondre avec « don't have to » (absence d'obligation)."},
  {id:"ms_04",s:"I need to renew my passport before next month.",bucket:"obligation",modal:"need to",x:"« Need to » = obligation/nécessité, équivalent doux à « have to »."},
  {id:"ms_05",s:"We'll have to work overtime this week.",bucket:"obligation",modal:"will have to",x:"« Will have to » = obligation future imposée par les circonstances."},
  {id:"ms_06",s:"The manager must approve all expense reports.",bucket:"obligation",modal:"must",x:"« Must » exprime ici une règle interne à l'entreprise."},
  {id:"ms_07",s:"Children must wear a seatbelt at all times.",bucket:"obligation",modal:"must",x:"Règle de sécurité = obligation absolue (« must »)."},
  {id:"ms_08",s:"I have to call my dentist before noon.",bucket:"obligation",modal:"have to",x:"« Have to » = obligation personnelle dictée par les circonstances (rendez-vous fixé)."},
  {id:"ms_09",s:"Passengers must keep their seatbelts fastened during turbulence.",bucket:"obligation",modal:"must",x:"Consigne de sécurité aérienne = « must » obligatoire."},
  {id:"ms_10",s:"You don't have to attend the meeting if you're sick.",bucket:"obligation",modal:"don't have to",x:"« Don't have to » = ABSENCE d'obligation (tu peux venir, tu n'es pas obligé). Ce N'EST PAS une interdiction."},
  {id:"ms_11",s:"Drivers must yield to pedestrians at crosswalks.",bucket:"obligation",modal:"must",x:"Règle du code de la route → « must »."},
  {id:"ms_12",s:"All staff need to complete the compliance training by Friday.",bucket:"obligation",modal:"need to",x:"« Need to » = obligation professionnelle avec deadline."},
  {id:"ms_13",s:"She has to renew her work permit every two years.",bucket:"obligation",modal:"has to",x:"« Has to » = obligation administrative récurrente (3e personne du singulier)."},

  // ─── ADVICE (13) ───
  {id:"ms_14",s:"You should drink more water during the summer.",bucket:"advice",modal:"should",x:"« Should » = conseil neutre, recommandation générale."},
  {id:"ms_15",s:"He ought to apologize for being late again.",bucket:"advice",modal:"ought to",x:"« Ought to » = synonyme légèrement plus formel de « should »."},
  {id:"ms_16",s:"You'd better start saving for retirement now.",bucket:"advice",modal:"had better",x:"« Had better » = conseil FORT (sous-entend une conséquence négative si on ne le suit pas)."},
  {id:"ms_17",s:"We should book the tickets in advance.",bucket:"advice",modal:"should",x:"Recommandation pratique = « should »."},
  {id:"ms_18",s:"You really ought to see a specialist about that pain.",bucket:"advice",modal:"ought to",x:"« Really ought to » insiste sur l'urgence du conseil."},
  {id:"ms_19",s:"Maybe you shouldn't drive after taking that medicine.",bucket:"advice",modal:"shouldn't",x:"« Shouldn't » = conseil négatif (déconseiller une action)."},
  {id:"ms_20",s:"She had better check the contract before signing.",bucket:"advice",modal:"had better",x:"« Had better » insiste sur le risque de ne pas vérifier."},
  {id:"ms_21",s:"We should leave earlier to avoid traffic.",bucket:"advice",modal:"should",x:"Suggestion logique fondée sur l'expérience = « should »."},
  {id:"ms_22",s:"You ought to thank her for the recommendation.",bucket:"advice",modal:"ought to",x:"« Ought to » porte une nuance morale (devoir social)."},
  {id:"ms_23",s:"You shouldn't ignore the warning signs.",bucket:"advice",modal:"shouldn't",x:"« Shouldn't » = mise en garde, conseil négatif."},
  {id:"ms_24",s:"He should consider getting a second opinion.",bucket:"advice",modal:"should",x:"Suggestion neutre = « should »."},
  {id:"ms_25",s:"I think you'd better apologize first.",bucket:"advice",modal:"had better",x:"« Had better » + « I think » = conseil pressant mais courtois."},
  {id:"ms_26",s:"We should review the proposal one more time.",bucket:"advice",modal:"should",x:"Recommandation prudente = « should »."},

  // ─── POSSIBILITY (12) ───
  {id:"ms_27",s:"It might rain this afternoon, so bring an umbrella.",bucket:"possibility",modal:"might",x:"« Might » = possibilité moyenne (~40-50 %). Idéal pour la météo incertaine."},
  {id:"ms_28",s:"She may join us for dinner if she finishes early.",bucket:"possibility",modal:"may",x:"« May » = possibilité ouverte, légèrement plus formel que « might »."},
  {id:"ms_29",s:"We could take the scenic route if you prefer.",bucket:"possibility",modal:"could",x:"« Could » = option proposée, possibilité concrète parmi plusieurs."},
  {id:"ms_30",s:"There could be a delay because of the storm.",bucket:"possibility",modal:"could",x:"« Could » = éventualité plausible liée à un facteur externe."},
  {id:"ms_31",s:"I might call you later tonight.",bucket:"possibility",modal:"might",x:"« Might » = intention floue, pas encore décidée."},
  {id:"ms_32",s:"He may not remember our appointment.",bucket:"possibility",modal:"may not",x:"« May not » = possibilité négative ouverte."},
  {id:"ms_33",s:"The package could arrive any day now.",bucket:"possibility",modal:"could",x:"« Could » exprime une éventualité future imminente."},
  {id:"ms_34",s:"You may leave the room if you've finished the test.",bucket:"possibility",modal:"may",x:"« May » = permission formelle accordée (variante de la possibilité)."},
  {id:"ms_35",s:"We might need an extra chair for the guest.",bucket:"possibility",modal:"might",x:"« Might » = besoin éventuel à anticiper."},
  {id:"ms_36",s:"It could be useful to bring a backup laptop.",bucket:"possibility",modal:"could",x:"« Could » + adjectif = suggestion d'opportunité."},
  {id:"ms_37",s:"She might prefer the window seat.",bucket:"possibility",modal:"might",x:"« Might » = hypothèse sur une préférence non confirmée."},
  {id:"ms_38",s:"It may take a few hours to install the software.",bucket:"possibility",modal:"may",x:"« May » + durée = estimation prudente."},

  // ─── DEDUCTION (12) ───
  {id:"ms_39",s:"He must be exhausted after that long flight.",bucket:"deduction",modal:"must be",x:"« Must be » = déduction logique au présent (forte certitude positive)."},
  {id:"ms_40",s:"She can't be the manager — she looks too young.",bucket:"deduction",modal:"can't be",x:"« Can't be » = déduction négative (impossibilité logique au présent)."},
  {id:"ms_41",s:"They must have left already; the lights are off.",bucket:"deduction",modal:"must have left",x:"« Must have V3 » = déduction au passé (forte certitude positive)."},
  {id:"ms_42",s:"He can't have done it on purpose.",bucket:"deduction",modal:"can't have done",x:"« Can't have V3 » = déduction négative au passé (impossibilité)."},
  {id:"ms_43",s:"She must be at the gym; her bag is gone.",bucket:"deduction",modal:"must be",x:"Indice visible (sac absent) → déduction logique présente."},
  {id:"ms_44",s:"The package must have been delivered yesterday.",bucket:"deduction",modal:"must have been delivered",x:"« Must have been + V3 » = déduction passive au passé."},
  {id:"ms_45",s:"He might have forgotten the meeting.",bucket:"deduction",modal:"might have forgotten",x:"« Might have V3 » = déduction faible au passé (hypothèse)."},
  {id:"ms_46",s:"It must have rained during the night — the streets are wet.",bucket:"deduction",modal:"must have rained",x:"Preuve présente → cause déduite au passé (« must have V3 »)."},
  {id:"ms_47",s:"She can't be older than 25.",bucket:"deduction",modal:"can't be",x:"Déduction négative présente fondée sur l'observation."},
  {id:"ms_48",s:"They must be very wealthy to afford that house.",bucket:"deduction",modal:"must be",x:"Inférence logique à partir d'un indice (le prix de la maison)."},
  {id:"ms_49",s:"He could have missed his train.",bucket:"deduction",modal:"could have missed",x:"« Could have V3 » = déduction modérée au passé (possibilité plausible)."},
  {id:"ms_50",s:"That can't be true — I just spoke with him.",bucket:"deduction",modal:"can't be",x:"« Can't be » = rejet logique d'une affirmation (impossibilité immédiate)."}
];
