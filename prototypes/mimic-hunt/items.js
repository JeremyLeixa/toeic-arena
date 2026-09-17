// Proto « Mimic Hunt » (2026-09-17) — les 12 items pilotes, 4 par palier.
//
// Un Mimic = une option qui RECOPIE des mots de la source pour dire autre chose qu'elle.
// La bonne réponse dit la même chose avec d'autres mots (le pont).
//
// Format :
//   ctx      étiquette du document (email, annonce, conversation…)
//   speaker  locuteur affiché devant la réplique (facultatif)
//   src      le texte source            q  la question (style TOEIC)
//   opts     4 options                  c  index de la bonne réponse
//   bridge   [[dans la source, dans la bonne réponse], …] : ce qui a été reformulé
//   echo     mots gardés tels quels par la bonne réponse (faute de synonyme courant)
//   mimics   {index: [fragment | [dans la source, dans l'option]], …} : ce que le Mimic recopie
//   exp      pourquoi la bonne réponse est juste     trap  ce que les Mimics ont recopié
//
// Fragments : sans casse, en mots entiers. game.jsx vérifie au chargement que chaque fragment
// se trouve bien là où il est annoncé (console.warn sinon).
//
// Équilibre : bonne réponse 3 fois en A, B, C et D ; 2 Mimics, sauf les items 4 et 11 (un seul,
// sinon « 2 Mimics + 1 neutre » devient un patron qu'on joue sans lire) ; l'item 12 garde un mot
// de la source DANS la bonne réponse, pour casser la règle trop simple « mot repris = faux ».

export var TIERS = {
  1: { roman: "I", name: "Synonyms", lead: "Same idea, different word.",
    ex: ["purchase", "buy"],
    tip: "The right answer rarely uses the text's exact words. Look for words that mean the same thing." },
  2: { roman: "II", name: "Reshaped", lead: "Same idea, different sentence shape.",
    ex: ["The report was written by Mr. Ito.", "Mr. Ito wrote the report."],
    tip: "Passive becomes active, a verb becomes a noun, a positive becomes a negative. Read for meaning, not for shape." },
  3: { roman: "III", name: "Big picture", lead: "The answer zooms out.",
    ex: ["a laptop and a printer", "some office equipment"],
    tip: "A specific detail becomes a general category, or the words become the reason behind them." },
};

export var ITEMS = [
  // ═══ TIER I · SYNONYMS ═══
  {
    id: "mh01", tier: 1, ctx: "Internal memo",
    src: "The quarterly budget review has been pushed back to next Thursday.",
    q: "What is mentioned about the budget review?",
    opts: ["The budget will be cut next quarter.", "It was pushed to another department.", "It has been postponed.", "It has been cancelled."],
    c: 2,
    bridge: [["pushed back", "postponed"]],
    mimics: { 0: ["budget", ["quarterly", "quarter"], "next"], 1: ["pushed"] },
    exp: "Pushed back means postponed: moved to a later date. The review still has a date (next Thursday), so it isn't cancelled.",
    trap: "A recycles 'budget', 'quarter' and 'next'. B recycles 'pushed'. Same words, but neither says what the memo says.",
  },
  {
    id: "mh02", tier: 1, ctx: "Email from Accounting",
    src: "Employees who travel for work will be reimbursed for meals within two weeks of submitting their receipts.",
    q: "According to the email, what will the company do?",
    opts: ["Refund staff for the cost of food", "Let employees travel for two weeks", "Ask employees to submit a travel request", "Book hotels for all business trips"],
    c: 0,
    bridge: [["reimbursed", "Refund"], ["Employees", "staff"], ["meals", "food"]],
    mimics: { 1: ["employees", "travel", "two weeks"], 2: ["employees", "travel", ["submitting", "submit"]] },
    exp: "Reimbursed = refunded, employees = staff, meals = food. Three swaps, one idea.",
    trap: "B and C reuse 'employees', 'travel', 'two weeks' and 'submit', then build an idea the email never mentions.",
  },
  {
    id: "mh03", tier: 1, ctx: "Announcement",
    src: "Due to low demand, the evening shuttle service to the airport has been discontinued.",
    q: "What is being announced?",
    opts: ["Demand for evening flights is low.", "The shuttle will leave the airport earlier.", "Parking fees have gone up.", "A transportation option is no longer offered."],
    c: 3,
    bridge: [["shuttle service", "transportation option"], ["discontinued", "no longer offered"]],
    mimics: { 0: ["demand", "evening", "low"], 1: ["shuttle", "airport"] },
    exp: "Discontinued = no longer offered, and a shuttle service is a transportation option.",
    trap: "A mixes 'low', 'demand' and 'evening' into a claim about flights. B keeps 'shuttle' and 'airport' but invents a new schedule.",
  },
  {
    id: "mh04", tier: 1, ctx: "Job posting",
    src: "Applicants must have at least three years of experience in a similar role.",
    q: "What is required for the position?",
    opts: ["Three years of study in a similar field", "Previous work in a comparable job", "Strong management skills", "A degree in business administration"],
    c: 1,
    bridge: [["experience", "Previous work"], ["similar role", "comparable job"]],
    mimics: { 0: ["three years of", "similar"] },
    exp: "Experience = previous work, and a similar role = a comparable job.",
    trap: "A keeps 'three years of' and 'similar' but swaps work experience for study. That's exactly how a Mimic works.",
  },

  // ═══ TIER II · RESHAPED ═══
  {
    id: "mh05", tier: 2, ctx: "Customer service email",
    src: "We're currently short-staffed in the warehouse, so orders may take longer to ship.",
    q: "What problem does the company mention?",
    opts: ["Its warehouse is currently too small.", "It does not have enough employees.", "Orders were shipped to the wrong address.", "Its prices have recently increased."],
    c: 1,
    bridge: [["short-staffed", "does not have enough employees"]],
    mimics: { 0: ["warehouse", "currently"], 2: ["orders", ["ship", "shipped"]] },
    exp: "Short-staffed = not enough staff. One adjective becomes a whole negative sentence.",
    trap: "A copies 'warehouse' and 'currently' (and 'short' pushes you toward 'small'). C copies 'orders' and 'ship', but the problem is delay, not wrong addresses.",
  },
  {
    id: "mh06", tier: 2, ctx: "IT notice",
    src: "The new software cannot be installed until the IT department has approved it.",
    q: "What is indicated about the new software?",
    opts: ["The IT department has already installed it.", "It cannot be approved yet.", "It will be free of charge.", "It must be authorized before installation."],
    c: 3,
    bridge: [["cannot be installed until", "before installation"], ["approved", "authorized"]],
    mimics: { 0: ["IT department", "installed"], 1: ["cannot", "approved"] },
    exp: "Approved = authorized, and 'cannot be installed until…' becomes 'before installation': the verb turns into a noun.",
    trap: "A says it's already installed. B says it can't be approved. Both reuse the notice's words to say something it doesn't.",
  },
  {
    id: "mh07", tier: 2, ctx: "Email from a sales manager",
    src: "Our client was so impressed by the presentation that she signed the contract on the spot.",
    q: "What does the manager report?",
    opts: ["An agreement was reached right away.", "The client gave a presentation about the contract.", "The contract was signed at a later meeting.", "A price reduction was requested."],
    c: 0,
    bridge: [["signed the contract", "An agreement was reached"], ["on the spot", "right away"]],
    mimics: { 1: ["client", "presentation", "contract"], 2: ["contract", "signed"] },
    exp: "She signed the contract = an agreement was reached (active becomes passive). On the spot = right away.",
    trap: "B and C reuse 'client', 'presentation', 'contract' and 'signed'. But the client didn't present anything, and the signing wasn't later.",
  },
  {
    id: "mh08", tier: 2, ctx: "Conversation", speaker: "Woman",
    src: "I'd be happy to cover your shift on Saturday if you can take mine next week.",
    q: "What does the woman offer to do?",
    opts: ["Take over a project next week", "Cover the cost of a Saturday event", "Fill in for her coworker on the weekend", "Train a new employee"],
    c: 2,
    bridge: [["cover your shift", "Fill in for her coworker"], ["on Saturday", "on the weekend"]],
    mimics: { 0: ["take", "next week"], 1: ["cover", "Saturday"] },
    exp: "To cover someone's shift = to fill in for them (work in their place). Saturday becomes 'the weekend'.",
    trap: "'Cover' has two meanings: here it means replace, not pay for. And no project is mentioned: 'take' and 'next week' are just recycled.",
  },

  // ═══ TIER III · BIG PICTURE ═══
  {
    id: "mh09", tier: 3, ctx: "Conversation", speaker: "Man",
    src: "Let me grab us a couple of lattes before the client gets here.",
    q: "What will the man most likely do next?",
    opts: ["Grab a couple of documents", "Wait for the client to get here", "Book a meeting room", "Buy some beverages"],
    c: 3,
    bridge: [["grab", "Buy"], ["a couple of lattes", "some beverages"]],
    mimics: { 0: ["grab", "a couple of"], 1: ["client", ["gets here", "get here"]] },
    exp: "Grab = buy (informal), and lattes are a kind of beverage. The answer zooms out from a specific drink to the general category.",
    trap: "A keeps 'grab a couple of' but changes the object. B keeps 'client' and 'gets here': that happens later, it's not what he'll do next.",
  },
  {
    id: "mh10", tier: 3, ctx: "Voicemail",
    src: "Hi, it's Dana from Harlow Printing. The brochures you ordered are ready, but the color on the cover looks different from your sample, so please call me before we deliver them.",
    q: "Why is the speaker calling?",
    opts: ["To report a possible problem with an order", "To confirm that the brochures were delivered", "To request a new color sample", "To schedule a meeting"],
    c: 0,
    bridge: [["looks different from your sample", "a possible problem"], ["brochures you ordered", "an order"]],
    mimics: { 1: ["brochures", ["deliver", "delivered"]], 2: ["color", "sample"] },
    exp: "A color that 'looks different' is a possible problem, and 'the brochures you ordered' is simply an order. Purpose questions want the big picture.",
    trap: "B reuses 'brochures' and 'deliver', but nothing has been delivered yet. C reuses 'color' and 'sample', but Dana asks for a call, not a sample.",
  },
  {
    id: "mh11", tier: 3, ctx: "Notice",
    src: "Starting March 1, visitors to the Fenwick Building must sign in at the front desk and wear a badge at all times.",
    q: "What is the purpose of the notice?",
    opts: ["To announce new opening hours", "To invite visitors to a signing ceremony", "To describe a new security procedure", "To advertise office space for rent"],
    c: 2,
    bridge: [["Starting March 1", "new"], ["sign in at the front desk and wear a badge", "security procedure"]],
    mimics: { 1: ["visitors", ["sign", "signing"]] },
    exp: "Signing in and wearing a badge are security steps, and 'starting March 1' tells you they're new. The answer names the category, not the details.",
    trap: "B picks up 'visitors' and 'sign', but 'sign in' means register at a desk. Nobody is holding a signing ceremony.",
  },
  {
    id: "mh12", tier: 3, ctx: "Email from a supplier",
    src: "I've attached a corrected invoice. The one we sent on June 3 charged you twice for delivery.",
    q: "Why was the email sent?",
    opts: ["To confirm a delivery date", "To provide an updated invoice", "To request payment by June 3", "To announce a new shipping policy"],
    c: 1,
    bridge: [["attached", "provide"], ["corrected", "updated"]],
    echo: ["invoice"],
    mimics: { 0: ["delivery"], 2: ["June 3"] },
    exp: "Attached = provided, corrected = updated. And yes, 'invoice' is in the email AND in the right answer: some words have no everyday synonym.",
    trap: "A Mimic isn't just any repeated word. It's a repeated word that says something the text doesn't. C copies 'June 3', but that's when the wrong invoice was sent, not a payment deadline.",
  },
];
