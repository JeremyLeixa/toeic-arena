// Mimic Hunt — LOT 4 « parlé » en projet (2026-09-19) : 24 items dont la source SE DIT (conversation,
// messagerie, annonce, météo, flash éco, visite), mh61 à mh84. Même format que src/data/mimicHunt.js.
// PAS dans le jeu tant que Jérémy ne l'a pas relu :
//   relecture  → /prototypes/mimic-hunt/review.html (serveur Vite du dépôt, port 5608), section « Lot 4 »
//   contrôle   → node tests/check_mimic_items.cjs prototypes/mimic-hunt/drafts/lot4.js
//
// But : le mode écoute (proto listen.html) ne tire que des sources parlées. La banque en compte 21
// (6 / 5 / 10 par palier) ; avec ce lot, 45 (15 / 15 / 15), le seuil du coffre de maîtrise. Les items
// servent aussi en lecture (banque de 84).
//
// Rédaction : bonne réponse 6 fois en A, B, C et D ; 2 Mimics par item ; mh72 garde « flight » dans la
// bonne réponse (le Mimic le reprend aussi : même mot, sens différent) ; aucune étiquette ne donne la
// réponse (« Talk » et non « Tour » quand on demande qui parle) ; `voice` quand une messagerie se présente
// (« Hi, it's Maria… ») : le script audio choisit la voix du bon genre.
export var LOT = [
  // ─── Palier I · Synonyms ───
  {
    id: "mh61", tier: 1, ctx: "Conversation", speaker: "Woman",
    src: "Can we reschedule our meeting? Something urgent just came up.",
    q: "What does the woman want to do?",
    opts: ["Hold an urgent meeting right away", "Change the date of their appointment", "Explain what came up at the meeting", "Cancel her business trip"],
    c: 1,
    bridge: [["reschedule", "Change the date"], ["meeting", "appointment"]],
    mimics: { 0: ["urgent", "meeting"], 2: ["came up", "meeting"] },
    exp: "To reschedule is to change the date or time of something already planned. The meeting becomes an 'appointment'.",
    trap: "'Hold an urgent meeting right away' grabs 'urgent' and 'meeting', but the urgent thing is what stops her from meeting. 'Explain what came up at the meeting' reuses 'came up' and 'meeting', but the meeting hasn't happened yet."
  },
  {
    id: "mh62", tier: 1, ctx: "Voicemail",
    src: "This is a reminder that your car is due for its annual inspection next week.",
    q: "Why is the speaker calling?",
    opts: ["To sell the listener a new car", "To confirm an inspection that took place last week", "To offer a discount on repairs", "To say a yearly check is coming up"],
    c: 3,
    bridge: [["annual", "yearly"], ["inspection", "check"], ["next week", "coming up"]],
    mimics: { 0: ["car"], 1: ["inspection", "week"] },
    exp: "Annual means yearly, and an inspection is a check. 'Due next week' means coming up.",
    trap: "'To sell the listener a new car' copies 'car' but invents a sale. 'To confirm an inspection that took place last week' keeps 'inspection' and 'week', but the inspection is next week, not last week."
  },
  {
    id: "mh63", tier: 1, ctx: "Store announcement",
    src: "Shoppers, all winter coats are now half price at the back of the store.",
    q: "What is being announced?",
    opts: ["Jackets are on sale for 50% off", "The store will close in half an hour", "Coats have moved to the back of the store", "Free delivery on large purchases"],
    c: 0,
    bridge: [["coats", "Jackets"], ["half price", "50% off"]],
    mimics: { 1: ["store", "half"], 2: ["coats", "back of the store"] },
    exp: "Coats are jackets, and half price is 50% off. The back of the store is only where to find them.",
    trap: "'The store will close in half an hour' recycles 'store' and 'half'. 'Coats have moved to the back of the store' copies 'coats' and 'back of the store', but nothing has moved: the announcement is about the price."
  },
  {
    id: "mh64", tier: 1, ctx: "Conversation", speaker: "Man",
    src: "The elevator is out of order, so we'll have to take the stairs.",
    q: "What problem does the man mention?",
    opts: ["The stairs are closed", "The order has not arrived", "The lift isn't working", "The building is too crowded"],
    c: 2,
    bridge: [["elevator", "lift"], ["out of order", "isn't working"]],
    mimics: { 0: ["stairs"], 1: ["order"] },
    exp: "An elevator is a lift (British English), and out of order means it isn't working.",
    trap: "'The order has not arrived' takes 'order' from 'out of order', a completely different meaning. 'The stairs are closed' copies 'stairs', but the stairs are the solution, not the problem."
  },
  {
    id: "mh65", tier: 1, ctx: "Weather report",
    src: "Heavy rain is expected this afternoon, so remember to bring an umbrella.",
    q: "What is the forecast?",
    opts: ["An umbrella sale this afternoon", "A lot of rain later today", "Light rain this morning", "Strong winds tonight"],
    c: 1,
    bridge: [["Heavy rain", "A lot of rain"], ["this afternoon", "later today"]],
    mimics: { 0: ["umbrella", "this afternoon"], 2: ["rain"] },
    exp: "Heavy rain means a lot of rain, and this afternoon is later today.",
    trap: "'An umbrella sale this afternoon' copies 'umbrella' and 'this afternoon' and turns advice into an advert. 'Light rain this morning' keeps 'rain' but gets both the amount and the time wrong."
  },
  {
    id: "mh66", tier: 1, ctx: "Conversation", speaker: "Woman",
    src: "I'm sorry, Mr. Lee is in a meeting. Can I take a message?",
    q: "What does the woman offer to do?",
    opts: ["Pass on a note", "Take the caller to the meeting", "Apologize to Mr. Lee", "Schedule a new appointment"],
    c: 0,
    bridge: [["take a message", "Pass on a note"]],
    mimics: { 1: ["take", "meeting"], 2: ["Mr. Lee"] },
    exp: "Taking a message means writing it down and passing it on to someone who isn't available.",
    trap: "'Take the caller to the meeting' reuses 'take' and 'meeting', but Mr. Lee is the one in the meeting. 'Apologize to Mr. Lee' copies his name: she apologizes to the caller, not to him."
  },
  {
    id: "mh67", tier: 1, ctx: "Announcement",
    src: "The main entrance will be closed on Monday for repairs. Please use the side door.",
    q: "What are visitors asked to do on Monday?",
    opts: ["Help repair the main entrance", "Close the door behind them", "Come back on Tuesday", "Go in through another door"],
    c: 3,
    bridge: [["use", "Go in through"], ["side door", "another door"]],
    mimics: { 0: [["repairs", "repair"], "main entrance"], 1: [["closed", "Close"], "door"] },
    exp: "Using the side door means going in through another door, because the main one is closed for repairs.",
    trap: "'Help repair the main entrance' copies 'main entrance' and 'repair': visitors aren't doing the repairs. 'Close the door behind them' recycles 'closed' and 'door' into an instruction nobody gave."
  },
  {
    id: "mh68", tier: 1, ctx: "Voicemail", voice: "f",
    src: "Hi, it's Maria from the dentist's office. We need to change the time of your appointment on Friday.",
    q: "Why is the speaker calling?",
    opts: ["To book a new patient for Friday", "To say the office is changing its address", "To move a scheduled visit", "To ask for a payment"],
    c: 2,
    bridge: [["change the time", "move"], ["appointment", "scheduled visit"]],
    mimics: { 0: ["Friday"], 1: [["change", "changing"], "office"] },
    exp: "Changing the time of an appointment means moving a scheduled visit.",
    trap: "'To book a new patient for Friday' keeps 'Friday' but invents a new patient. 'To say the office is changing its address' reuses 'change' and 'office': the time changes, not the address."
  },
  {
    id: "mh69", tier: 1, ctx: "Conversation", speaker: "Man",
    src: "The workshop was so popular that all the seats were taken within an hour.",
    q: "What does the man say about the workshop?",
    opts: ["It was fully booked quickly", "It lasted an hour", "Someone took the seats away", "It was cancelled at the last minute"],
    c: 0,
    bridge: [["all the seats were taken", "fully booked"], ["within an hour", "quickly"]],
    mimics: { 1: ["hour"], 2: [["taken", "took"], "seats"] },
    exp: "When all the seats are taken, the event is fully booked; within an hour means quickly.",
    trap: "'It lasted an hour' copies 'hour', but the hour is how fast it filled up, not how long it lasted. 'Someone took the seats away' turns 'seats were taken' into removing chairs."
  },

  // ─── Palier II · Reshaped ───
  {
    id: "mh70", tier: 2, ctx: "Conversation", speaker: "Woman",
    src: "Unless the budget is approved by Friday, we won't be able to hire anyone.",
    q: "What does the woman say?",
    opts: ["The budget was approved on Friday", "Someone will be hired on Friday", "The team needs more training", "Hiring depends on a decision about money"],
    c: 3,
    bridge: [["Unless", "depends on"], ["budget is approved", "a decision about money"]],
    mimics: { 0: ["budget", "approved", "Friday"], 1: [["hire", "hired"], "Friday"] },
    exp: "'Unless the budget is approved, we won't hire' means hiring depends on the budget decision. The 'unless' clause becomes 'depends on'.",
    trap: "'The budget was approved on Friday' copies 'budget', 'approved' and 'Friday' but turns a condition into a fact. 'Someone will be hired on Friday' reuses 'hire' and 'Friday': nobody can be hired until the budget is approved."
  },
  {
    id: "mh71", tier: 2, ctx: "Announcement",
    src: "Photography is not permitted inside the gallery, but visitors may take pictures in the garden.",
    q: "What does the announcement say?",
    opts: ["The gallery sells pictures of the garden", "Cameras can only be used outside", "Visitors are not permitted in the garden", "The museum closes early today"],
    c: 1,
    bridge: [["may take pictures", "Cameras can only be used"], ["in the garden", "outside"]],
    mimics: { 0: ["gallery", "pictures", "garden"], 2: ["not permitted", "visitors", "garden"] },
    exp: "Not allowed inside, allowed in the garden: cameras can only be used outside. The 'not... but' sentence becomes 'only'.",
    trap: "'Visitors are not permitted in the garden' keeps 'not permitted', 'visitors' and 'garden', but the ban is inside, not in the garden. 'The gallery sells pictures of the garden' mixes 'gallery', 'pictures' and 'garden' into a shop that doesn't exist."
  },
  {
    id: "mh72", tier: 2, ctx: "Voicemail", voice: "m",
    src: "Hi, this is Paul from Reed Travel. Your flight has been canceled, but we've booked you on the next one at no extra cost.",
    q: "What does the speaker say?",
    opts: ["The listener must pay extra for the next flight", "The listener canceled the booking", "The listener has a new flight for free", "The airport is closed because of the weather"],
    c: 2,
    bridge: [["booked you on the next one", "has a new flight"], ["at no extra cost", "for free"]],
    echo: ["flight"],
    mimics: { 0: ["extra", "next", "flight"], 1: ["canceled", ["booked", "booking"]] },
    exp: "'We've booked you on the next one at no extra cost' becomes 'has a new flight for free': the sentence now starts from the listener, and 'no extra cost' becomes 'free'. 'Flight' stays: there's no everyday synonym.",
    trap: "'The listener must pay extra for the next flight' copies 'extra', 'next' and 'flight' but reverses 'no extra cost'. 'The listener canceled the booking' reuses 'canceled' and 'booked': the airline canceled, not the listener."
  },
  {
    id: "mh73", tier: 2, ctx: "Conversation", speaker: "Man",
    src: "It's the first time our team has missed a deadline.",
    q: "What does the man imply?",
    opts: ["The team usually finishes on time", "The team will miss the next deadline", "This is the team's first project", "The manager is new to the company"],
    c: 0,
    bridge: [["first time", "usually"], ["missed a deadline", "finishes on time"]],
    mimics: { 1: ["team", ["missed", "miss"], "deadline"], 2: ["first", "team"] },
    exp: "If this is the first missed deadline, the team normally finishes on time. The sentence is turned around: a first failure means a usual success.",
    trap: "'The team will miss the next deadline' copies 'team', 'miss' and 'deadline' and makes a prediction nobody made. 'This is the team's first project' moves 'first' onto the project."
  },
  {
    id: "mh74", tier: 2, ctx: "Store announcement",
    src: "Customers who spend more than fifty dollars will receive a free gift at the checkout.",
    q: "What is being offered?",
    opts: ["A fifty-dollar gift card", "Free parking for customers", "A discount on electronics", "A present with larger purchases"],
    c: 3,
    bridge: [["free gift", "present"], ["spend more than fifty dollars", "larger purchases"]],
    mimics: { 0: [["fifty dollars", "fifty-dollar"], "gift"], 1: ["free", "customers"] },
    exp: "Spending more than fifty dollars becomes 'larger purchases', and the free gift is a present. The condition shrinks into a phrase: 'with larger purchases'.",
    trap: "'A fifty-dollar gift card' copies 'fifty dollars' and 'gift', but fifty dollars is what you spend, not what you get. 'Free parking for customers' reuses 'free' and 'customers' for an offer that isn't mentioned."
  },
  {
    id: "mh75", tier: 2, ctx: "Conversation", speaker: "Woman",
    src: "The printer was repaired by a technician this morning, so it's working again.",
    q: "What does the woman say about the printer?",
    opts: ["A technician will repair it this morning", "Someone fixed it earlier today", "It is working slowly again", "It was sold to another office"],
    c: 1,
    bridge: [["was repaired by a technician", "Someone fixed it"], ["this morning", "earlier today"]],
    mimics: { 0: ["technician", ["repaired", "repair"], "this morning"], 2: ["working", "again"] },
    exp: "'The printer was repaired by a technician' becomes 'someone fixed it': passive to active, and this morning is earlier today.",
    trap: "'A technician will repair it this morning' keeps 'technician', 'repair' and 'this morning' but moves the repair into the future. 'It is working slowly again' reuses 'working' and 'again' and adds a problem that isn't there."
  },
  {
    id: "mh76", tier: 2, ctx: "Business news",
    src: "Sales at Norland Foods rose sharply last quarter, thanks to its new line of frozen meals.",
    q: "What does the report say about Norland Foods?",
    opts: ["It plans to sell its frozen meals next quarter", "Its sales fell last quarter", "A new product helped it grow", "It moved its headquarters abroad"],
    c: 2,
    bridge: [["thanks to", "helped"], ["new line of frozen meals", "new product"], ["rose sharply", "grow"]],
    mimics: { 0: ["frozen meals", "quarter"], 1: ["sales", "last quarter"] },
    exp: "'Sales rose thanks to its new line' becomes 'a new product helped it grow': the cause moves to the front of the sentence.",
    trap: "'Its sales fell last quarter' copies 'sales' and 'last quarter' but reverses 'rose'. 'It plans to sell its frozen meals next quarter' reuses 'frozen meals' and 'quarter', but the meals are already on sale."
  },
  {
    id: "mh77", tier: 2, ctx: "Conversation", speaker: "Man",
    src: "I wasn't told about the change in schedule until I arrived at the station.",
    q: "What is the man complaining about?",
    opts: ["He learned of a timetable update too late", "He arrived at the wrong station", "He was told to change trains", "His ticket was too expensive"],
    c: 0,
    bridge: [["wasn't told", "learned"], ["change in schedule", "timetable update"], ["until I arrived", "too late"]],
    mimics: { 1: ["arrived", "station"], 2: ["told", "change"] },
    exp: "Not being told until he arrived means he learned about the new timetable too late. A negative with 'until' becomes 'too late'.",
    trap: "'He arrived at the wrong station' copies 'arrived' and 'station', but he got to the right place. 'He was told to change trains' reuses 'told' and 'change': the change was to the schedule, and nobody told him anything."
  },
  {
    id: "mh78", tier: 2, ctx: "Voicemail",
    src: "The package you ordered can't be delivered until the missing payment is received.",
    q: "What is the problem?",
    opts: ["The package was delivered to the wrong address", "The listener paid twice", "The item is out of stock", "The delivery is on hold until the listener pays"],
    c: 3,
    bridge: [["can't be delivered", "delivery is on hold"], ["the missing payment is received", "the listener pays"]],
    mimics: { 0: ["package", "delivered"], 1: [["payment", "paid"]] },
    exp: "'Can't be delivered until the payment is received' becomes 'on hold until the listener pays': the negative turns into 'on hold', and the passive 'is received' into 'pays'.",
    trap: "'The package was delivered to the wrong address' copies 'package' and 'delivered', but nothing has been delivered yet. 'The listener paid twice' turns the missing payment into a double one."
  },
  {
    id: "mh79", tier: 2, ctx: "Conversation", speaker: "Woman",
    src: "Nobody on the team has ever used this software before.",
    q: "What does the woman say about the software?",
    opts: ["The team uses it every day", "It is new to all her colleagues", "Someone on the team designed it", "It is too expensive to buy"],
    c: 1,
    bridge: [["Nobody on the team has ever used", "new to all her colleagues"]],
    mimics: { 0: ["team", ["used", "uses"]], 2: ["on the team"] },
    exp: "If nobody has ever used it, it is new to everyone: a negative ('nobody... ever') becomes a positive ('new to all').",
    trap: "'The team uses it every day' copies 'team' and 'used' and says the opposite. 'Someone on the team designed it' keeps 'on the team' and invents an author."
  },

  // ─── Palier III · Big picture ───
  {
    id: "mh80", tier: 3, ctx: "Announcement",
    src: "Please keep your seatbelts fastened, as we're expecting some turbulence over the mountains.",
    q: "Where is the announcement most likely being made?",
    opts: ["On a mountain train", "At a ski resort", "On an airplane", "In a car with the seatbelts fastened"],
    c: 2,
    bridge: [["seatbelts fastened", "airplane"], ["turbulence", "airplane"]],
    mimics: { 0: [["mountains", "mountain"]], 3: ["seatbelts", "fastened"] },
    exp: "Seatbelts plus turbulence: the details add up to a plane. The answer is the place, not any word you heard.",
    trap: "'In a car with the seatbelts fastened' copies 'seatbelts' and 'fastened', but cars don't meet turbulence. 'On a mountain train' borrows 'mountain' from 'over the mountains', which is what the plane is flying over."
  },
  {
    id: "mh81", tier: 3, ctx: "Conversation", speaker: "Man",
    src: "I've called the plumber twice, and the kitchen sink is still leaking.",
    q: "How does the man most likely feel?",
    opts: ["Frustrated by a repair that hasn't happened", "Pleased with the new kitchen", "Ready to call the plumber for the first time", "Worried about his water bill"],
    c: 0,
    bridge: [["called the plumber twice", "Frustrated"], ["still leaking", "repair that hasn't happened"]],
    mimics: { 1: ["kitchen"], 2: [["called", "call"], "plumber"] },
    exp: "Two calls and the sink still leaking: he is frustrated because the repair hasn't been done. The answer names the feeling behind the facts.",
    trap: "'Ready to call the plumber for the first time' copies 'call' and 'plumber', but he has already called twice. 'Pleased with the new kitchen' keeps 'kitchen' and reverses the mood."
  },
  {
    id: "mh82", tier: 3, ctx: "Voicemail",
    src: "I'm calling about the sales position you advertised. I have five years of experience in retail, and I'd love to come in for an interview.",
    q: "Who most likely is the speaker?",
    opts: ["A delivery driver with a question", "A customer calling about a sale", "A recruiter with five open positions", "A job applicant"],
    c: 3,
    bridge: [["calling about the sales position", "job applicant"], ["come in for an interview", "job applicant"]],
    mimics: { 1: ["calling", ["sales", "sale"]], 2: ["five", ["position", "positions"]] },
    exp: "Asking about a position, listing experience, wanting an interview: the speaker is applying for the job. The answer names the role behind the details.",
    trap: "'A customer calling about a sale' copies 'calling' and turns 'sales' into a discount. 'A recruiter with five open positions' keeps 'five' and 'position', but the five are years of experience, and the speaker wants the job, not to fill it."
  },
  {
    id: "mh83", tier: 3, ctx: "Conversation", speaker: "Woman",
    src: "Let's order some sandwiches for the training session, since it runs through lunchtime.",
    q: "What does the woman suggest?",
    opts: ["Ending the training session before lunchtime", "Running a session about healthy eating", "Providing food for the participants", "Booking a larger room"],
    c: 2,
    bridge: [["order some sandwiches", "Providing food"], ["for the training session", "for the participants"]],
    mimics: { 0: ["training session", "lunchtime"], 1: [["runs", "Running"], "session"] },
    exp: "Ordering sandwiches for a session that runs through lunch means providing food for the people attending. The answer says the purpose, not the menu.",
    trap: "'Ending the training session before lunchtime' copies 'training session' and 'lunchtime', but the session goes on through lunch. 'Running a session about healthy eating' turns 'runs' and 'session' into a different event."
  },
  {
    id: "mh84", tier: 3, ctx: "Talk",
    src: "On your left is the city's oldest bridge, built in 1820. We'll stop here for fifteen minutes so you can take photos.",
    q: "Who is most likely speaking?",
    opts: ["A bridge engineer", "A tour guide", "A photographer", "A taxi driver"],
    c: 1,
    bridge: [["On your left", "tour guide"], ["take photos", "tour guide"]],
    mimics: { 0: ["bridge"], 2: [["photos", "photographer"]] },
    exp: "'On your left', a famous landmark and a stop for photos: this is a tour guide talking to a group.",
    trap: "'A bridge engineer' copies 'bridge', but the speaker describes the bridge, not how to build it. 'A photographer' grows out of 'photos': the listeners take the photos."
  }
];
