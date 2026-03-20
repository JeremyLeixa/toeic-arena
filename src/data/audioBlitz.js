// ─── AUDIO BLITZ DATA (30 items) ───
// Short business utterances — listen once, answer fast
// audio: path to MP3 (to be generated via ElevenLabs)
// text: transcript (hidden during game, shown in feedback)
// q: comprehension question
// opts: 4 answer choices
// c: correct index

export var AUDIO_BLITZ = [
  // ── Announcements / Instructions ──
  {id:"ab_01",text:"The meeting has been moved from Conference Room A to Room 312 on the third floor.",
    q:"Where is the meeting now?",opts:["Conference Room A","Room 312","The third-floor lobby","Room 213"],c:1,
    audio:"/audio/blitz/ab_01.mp3"},
  {id:"ab_02",text:"Please note that the parking garage will be closed for maintenance this weekend.",
    q:"What will happen this weekend?",opts:["The office will close","The parking garage will be maintained","New parking spots will open","Weekend shifts are cancelled"],c:1,
    audio:"/audio/blitz/ab_02.mp3"},
  {id:"ab_03",text:"All expense reports for the month of October must be submitted by Friday at 5 PM.",
    q:"What is the deadline?",opts:["Monday morning","Thursday at noon","Friday at 5 PM","The end of October"],c:2,
    audio:"/audio/blitz/ab_03.mp3"},
  {id:"ab_04",text:"Due to the weather forecast, tomorrow's outdoor team-building event has been postponed until further notice.",
    q:"Why was the event postponed?",opts:["Budget cuts","Low attendance","Weather conditions","A scheduling conflict"],c:2,
    audio:"/audio/blitz/ab_04.mp3"},
  {id:"ab_05",text:"The new employee orientation will take place in the main auditorium at nine thirty.",
    q:"What time is the orientation?",opts:["9:00","9:13","9:30","9:15"],c:2,
    audio:"/audio/blitz/ab_05.mp3"},

  // ── Phone / Voicemail ──
  {id:"ab_06",text:"Hi, this is Karen from accounting. I'm calling about the invoice you sent last Tuesday. Could you call me back?",
    q:"Why is Karen calling?",opts:["To schedule a meeting","About an invoice","To confirm a delivery","To discuss a promotion"],c:1,
    audio:"/audio/blitz/ab_06.mp3"},
  {id:"ab_07",text:"I'm afraid Mr. Tanaka is not available at the moment. Would you like to leave a message?",
    q:"What is the listener told?",opts:["Mr. Tanaka is busy","The call was disconnected","Mr. Tanaka will call back in 5 minutes","The meeting is cancelled"],c:0,
    audio:"/audio/blitz/ab_07.mp3"},
  {id:"ab_08",text:"Good morning. I'm calling to confirm your reservation for twelve guests on Saturday evening at seven.",
    q:"How many guests are expected?",opts:["7","2","12","20"],c:2,
    audio:"/audio/blitz/ab_08.mp3"},

  // ── Short dialogues ──
  {id:"ab_09",text:"Could you send me the updated price list? I need it before the client meeting at two.",
    q:"What does the speaker need?",opts:["A meeting agenda","The updated price list","A client's phone number","A travel itinerary"],c:1,
    audio:"/audio/blitz/ab_09.mp3"},
  {id:"ab_10",text:"The shipment was supposed to arrive yesterday, but it's been delayed by two days.",
    q:"When will the shipment arrive?",opts:["Yesterday","Today","Tomorrow","In two days from yesterday"],c:3,
    audio:"/audio/blitz/ab_10.mp3"},
  {id:"ab_11",text:"I've reviewed the proposal and I think we should increase the marketing budget by fifteen percent.",
    q:"What does the speaker suggest?",opts:["Cutting the budget","A 50% increase","A 15% budget increase","Hiring more staff"],c:2,
    audio:"/audio/blitz/ab_11.mp3"},
  {id:"ab_12",text:"The printer on the second floor is out of order again. Please use the one near reception instead.",
    q:"What should employees do?",opts:["Fix the printer","Wait for IT","Use the printer near reception","Send documents by email"],c:2,
    audio:"/audio/blitz/ab_12.mp3"},

  // ── Numbers & Details (listening traps) ──
  {id:"ab_13",text:"We sold fourteen hundred units last month, which is a twenty percent increase from August.",
    q:"How many units were sold?",opts:["400","1,400","2,000","1,200"],c:1,
    audio:"/audio/blitz/ab_13.mp3"},
  {id:"ab_14",text:"The flight to Singapore departs at ten fifteen, not ten fifty as originally scheduled.",
    q:"What is the correct departure time?",opts:["10:50","10:15","10:05","10:55"],c:1,
    audio:"/audio/blitz/ab_14.mp3"},
  {id:"ab_15",text:"The total cost of the project came to forty-seven thousand, three hundred and twenty dollars.",
    q:"What was the total cost?",opts:["$47,320","$43,720","$47,230","$74,320"],c:0,
    audio:"/audio/blitz/ab_15.mp3"},
  {id:"ab_16",text:"Our new office is located at 280 Park Avenue, between Third and Lexington.",
    q:"What is the address?",opts:["208 Park Avenue","280 Park Avenue","228 Park Avenue","820 Park Avenue"],c:1,
    audio:"/audio/blitz/ab_16.mp3"},

  // ── Inference / Tone ──
  {id:"ab_17",text:"I appreciate the effort, but I think we need to go in a completely different direction with this design.",
    q:"What does the speaker mean?",opts:["The design is approved","The design needs minor changes","The design should be redone","The team did a poor job"],c:2,
    audio:"/audio/blitz/ab_17.mp3"},
  {id:"ab_18",text:"If we don't hear back from the supplier by Thursday, we should start looking at alternatives.",
    q:"What will happen if the supplier doesn't respond?",opts:["They'll wait another week","They'll file a complaint","They'll look for other suppliers","They'll cancel the project"],c:2,
    audio:"/audio/blitz/ab_18.mp3"},
  {id:"ab_19",text:"The quarterly results were better than expected, especially in the Asia-Pacific region.",
    q:"How were the results?",opts:["Disappointing","As expected","Below target","Better than expected"],c:3,
    audio:"/audio/blitz/ab_19.mp3"},
  {id:"ab_20",text:"I'm not sure we can meet the original deadline, but we could deliver a preliminary version by next Wednesday.",
    q:"What is the speaker proposing?",opts:["Missing the deadline entirely","Delivering early","A partial delivery by Wednesday","Hiring more people"],c:2,
    audio:"/audio/blitz/ab_20.mp3"},

  // ── Similar-sounding traps ──
  {id:"ab_21",text:"Please make thirty copies of the report and leave them on my desk.",
    q:"How many copies?",opts:["13","30","3","33"],c:1,
    audio:"/audio/blitz/ab_21.mp3"},
  {id:"ab_22",text:"The manager is currently working on the annual budget, not the audit.",
    q:"What is the manager working on?",opts:["The audit","The annual report","The annual budget","A new project"],c:2,
    audio:"/audio/blitz/ab_22.mp3"},
  {id:"ab_23",text:"We need to hire a technician, not a teacher, for the IT department.",
    q:"Who needs to be hired?",opts:["A teacher","A technician","A translator","A trainer"],c:1,
    audio:"/audio/blitz/ab_23.mp3"},
  {id:"ab_24",text:"The client wants to buy the property, not rent it.",
    q:"What does the client want to do?",opts:["Rent the property","Sell the property","Buy the property","Visit the property"],c:2,
    audio:"/audio/blitz/ab_24.mp3"},

  // ── Workplace situations ──
  {id:"ab_25",text:"Attention please. The fire drill will begin in approximately five minutes. Please proceed to the nearest exit.",
    q:"What should people do?",opts:["Return to their desks","Go to the nearest exit","Call the fire department","Stay where they are"],c:1,
    audio:"/audio/blitz/ab_25.mp3"},
  {id:"ab_26",text:"The cafeteria will be offering a new menu starting next Monday, with more vegetarian options.",
    q:"What is changing?",opts:["The cafeteria hours","The cafeteria location","The menu","The prices"],c:2,
    audio:"/audio/blitz/ab_26.mp3"},
  {id:"ab_27",text:"Your hotel reservation has been confirmed for three nights, checking in on the fourteenth.",
    q:"When is check-in?",opts:["The 4th","The 13th","The 14th","The 3rd"],c:2,
    audio:"/audio/blitz/ab_27.mp3"},
  {id:"ab_28",text:"The warranty on this product covers repairs for up to two years from the date of purchase.",
    q:"How long does the warranty last?",opts:["1 year","6 months","2 years","3 years"],c:2,
    audio:"/audio/blitz/ab_28.mp3"},
  {id:"ab_29",text:"I'd recommend taking the express train rather than driving. It's much faster during rush hour.",
    q:"What does the speaker recommend?",opts:["Driving to work","Taking a taxi","Taking the express train","Working from home"],c:2,
    audio:"/audio/blitz/ab_29.mp3"},
  {id:"ab_30",text:"The contract states that payment is due within thirty days of receiving the invoice.",
    q:"When is payment due?",opts:["Immediately","Within 13 days","Within 30 days","Within 3 months"],c:2,
    audio:"/audio/blitz/ab_30.mp3"},
];
