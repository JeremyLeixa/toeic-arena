// Lot Jet Lag du 2026-09-25 — BROUILLON à relire par Jérémy AVANT toute génération audio (crédits ElevenLabs) et
// avant d'entrer au vivier TRAVEL_POOL (lib/officeDay.js). Hors banque : rien ne le joue tant qu'il n'est pas versé
// dans src/data/listening.js et src/data/part7.js. Relecture confortable : jetlag-review.html (même dossier).
//
// Pourquoi : le vivier de Jet Lag est le plus mince des mondes (6 P3, 4 bulletins, 4 perturbations, 6 P7, aucun
// P7 double) ; une journée en tire 4 à 6 tâches, donc il tourne en rond en une semaine.
// Contenu 100 % original. Thèmes : location de voiture, arrivée à l'hôtel, correspondance manquée, bagage égaré,
// météo et retour, changement de billet, dîner client, passeport, bagage en soute à la porte, départ tardif ;
// bulletins neige et brouillard ; travaux sur une ligne, changement de porte ; réservation d'hôtel, prise en charge
// à l'aéroport, salon fermé, FAQ de location, notes de frais, navettes d'un salon, indemnisation d'un retard de train.
//
// Voix : P3 labels W/M/M2/W2 (1er caractère = genre) ; P4 `voice` suit la parité de l'id (impair M, pair W).
// `x` : explication (leçons de fin). Aucune explication ne cite une option par sa lettre (options permutées).
// Étiquettes des bulletins pour TRAVEL_POOL.forecast : p4_103 « Snow overnight », p4_104 « Fog, then sun ».

export var P3_DRAFT = [
  {id:"p3_97",lines:[
    {s:"W",t:"Good afternoon, welcome to Sunway Car Rental. Do you have a reservation?"},
    {s:"M",t:"Yes, under Alvarez. I booked a compact car for three days."},
    {s:"W",t:"I'm afraid all our compact cars are out this afternoon. A flight from Denver landed early. But I can give you a midsize sedan for the same price."},
    {s:"M",t:"That works. I'm driving to a client site about two hours away, so a bigger car won't hurt."},
    {s:"W",t:"Great. Just remember that the tank has to be full when you bring it back, or there's a refueling charge."}],
    qs:[
      {q:"Where most likely are the speakers?",opts:["At a car rental counter","At a hotel reception desk","At a travel agency","At a gas station"],c:0,x:"'Welcome to Sunway Car Rental. Do you have a reservation?'"},
      {q:"Why does the woman say, 'A flight from Denver landed early'?",opts:["To apologize for a long wait","To explain why a type of car is unavailable","To suggest a different airport","To recommend a hotel nearby"],c:1,x:"She has just said the compact cars are all out: the early flight brought in customers who took them."},
      {q:"What does the woman remind the man to do?",opts:["Show his driver's license","Pay a deposit in cash","Return the car with a full tank","Bring the car back before noon"],c:2,x:"'The tank has to be full when you bring it back, or there's a refueling charge.'"}]},
  {id:"p3_98",lines:[
    {s:"W",t:"Welcome to the Harbor View Hotel. How can I help you?"},
    {s:"M",t:"Hi, we're checking in. Two rooms under Okafor Industries. I know it's only eleven o'clock."},
    {s:"W",t:"That's right, check-in is from three, and your rooms are still being cleaned. But you're welcome to leave your luggage with us."},
    {s:"M2",t:"That's perfect. We have a meeting across town at noon anyway. Is there somewhere we can change before we go?"},
    {s:"W",t:"Of course. The fitness center on the ground floor has changing rooms, and guests can use them at any time."}],
    qs:[
      {q:"Why can't the men check in yet?",opts:["Their reservation cannot be found","Their rooms are not ready","They are at the wrong hotel","The front desk is closed"],c:1,x:"'Check-in is from three, and your rooms are still being cleaned.'"},
      {q:"What will the men do at noon?",opts:["Catch a flight","Check out of the hotel","Attend a meeting","Visit a fitness center"],c:2,x:"'We have a meeting across town at noon anyway.'"},
      {q:"What does the woman offer the men?",opts:["A free breakfast","A place to change clothes","A room upgrade","A taxi across town"],c:1,x:"'The fitness center on the ground floor has changing rooms, and guests can use them at any time.'"}]},
  {id:"p3_99",lines:[
    {s:"M",t:"Hi, I just missed my connection to Toronto. My first flight sat on the runway for forty minutes."},
    {s:"W",t:"I'm sorry about that. The next flight to Toronto leaves at six ten, but it's full. I can put you on the eight thirty-five, or on the six ten as a standby passenger."},
    {s:"M",t:"I have a dinner meeting at nine."},
    {s:"W",t:"Then let's try standby first. I'll also book you on the eight thirty-five as a backup. And here's a meal voucher for the food court while you wait."}],
    qs:[
      {q:"What problem does the man have?",opts:["He lost his boarding pass","His luggage was damaged","He missed a connecting flight","His hotel booking was canceled"],c:2,x:"'I just missed my connection to Toronto.'"},
      {q:"What does the man mean when he says, 'I have a dinner meeting at nine'?",opts:["He needs to arrive as early as possible","He wants to cancel his trip","He would like a meal on the plane","He will change the time of his meeting"],c:0,x:"He answers the choice between the two flights: he needs the earlier one, so the agent tries standby first."},
      {q:"What does the woman give the man?",opts:["A seat upgrade","A meal voucher","A hotel room","A refund"],c:1,x:"'Here's a meal voucher for the food court while you wait.'"}]},
  {id:"p3_100",lines:[
    {s:"W",t:"Excuse me, my suitcase didn't come out on the belt. I was on the flight from Madrid."},
    {s:"M",t:"I'm sorry to hear that. Can I see your baggage tag? It looks like your bag was left in Madrid. It'll be on tomorrow morning's flight."},
    {s:"W",t:"Tomorrow? My presentation is at eight tomorrow, and my suit is in that bag."},
    {s:"M",t:"I understand. We'll deliver it to your hotel as soon as it arrives. In the meantime, you can buy what you need tonight, and the airline will reimburse up to one hundred and fifty dollars. Just keep the receipts."}],
    qs:[
      {q:"Where does the conversation most likely take place?",opts:["In a clothing store","In a hotel lobby","At an airport","In a conference room"],c:2,x:"She is at the baggage belt after a flight from Madrid and speaks to an airline agent."},
      {q:"Why is the woman concerned?",opts:["She needs her clothes for a presentation","She has missed her flight home","Her suitcase was damaged","Her hotel is far from the airport"],c:0,x:"'My presentation is at eight tomorrow, and my suit is in that bag.'"},
      {q:"What does the man tell the woman to do?",opts:["Call her hotel","Fill out a complaint form","Come back tomorrow morning","Keep her receipts"],c:3,x:"'The airline will reimburse up to one hundred and fifty dollars. Just keep the receipts.'"}]},
  {id:"p3_101",lines:[
    {s:"M",t:"Did you hear the news? They're expecting heavy snow in Chicago tonight."},
    {s:"W",t:"I saw that. Our train gets in at six, so we should be fine. But the flights back on Friday could be a problem."},
    {s:"M",t:"Maybe we should take the train home as well. It's slower, but it rarely gets canceled."},
    {s:"W",t:"Good idea. I'll call the travel office when we get to the hotel. Meanwhile, let's go over the slides for tomorrow's pitch. The Wi-Fi on this train is actually decent."}],
    qs:[
      {q:"What are the speakers concerned about?",opts:["Missing their train tonight","The weather affecting their return","The cost of their hotel","A late client meeting"],c:1,x:"Heavy snow is expected, and 'the flights back on Friday could be a problem.'"},
      {q:"What does the man suggest?",opts:["Staying an extra night","Renting a car","Taking the train back","Postponing the pitch"],c:2,x:"'Maybe we should take the train home as well. It rarely gets canceled.'"},
      {q:"What will the speakers most likely do next?",opts:["Review a presentation","Call a travel office","Check into a hotel","Buy new tickets online"],c:0,x:"'Meanwhile, let's go over the slides for tomorrow's pitch.' The call to the travel office comes later, at the hotel."}]},
  {id:"p3_102",lines:[
    {s:"M",t:"Hi, this is Kenji Mori. I'm booked to fly back from Singapore on the twelfth, but our client wants to extend the meetings by two days."},
    {s:"W",t:"Let me pull up your booking. The fourteenth has seats available, but your ticket has a change fee of seventy-five dollars, plus the difference in fare."},
    {s:"M",t:"How much would that be altogether?"},
    {s:"W",t:"Around two hundred and ten dollars. Your company account has pre-approval for changes under three hundred, so I can process it right away."},
    {s:"M",t:"Please do. And could you extend my hotel stay as well?"}],
    qs:[
      {q:"Why is the man calling?",opts:["To book a flight for a client","To change his return date","To ask about a refund","To complain about a hotel"],c:1,x:"He is booked to return on the twelfth but the meetings are extended by two days."},
      {q:"What does the woman say about the man's company account?",opts:["It has a monthly travel budget","It offers discounted fares","It needs a manager's signature","It allows some changes without extra approval"],c:3,x:"'Your company account has pre-approval for changes under three hundred, so I can process it right away.'"},
      {q:"What does the man ask the woman to do?",opts:["Extend his hotel booking","Email him a receipt","Find a cheaper flight","Upgrade his seat"],c:0,x:"'Could you extend my hotel stay as well?'"}]},
  {id:"p3_103",lines:[
    {s:"W",t:"For tonight's dinner with the Lindqvist team, I was thinking of the seafood place on the harbor. They have a lovely terrace."},
    {s:"M",t:"The forecast says it'll rain all evening, though."},
    {s:"W2",t:"Then what about the restaurant in our hotel? It got great reviews, and nobody has to go out in the rain."},
    {s:"W",t:"Fair enough. Could you book a table for six at seven thirty?"},
    {s:"W2",t:"Sure. I'll ask for a quiet corner so we can talk business."}],
    qs:[
      {q:"Who will the speakers have dinner with?",opts:["Their manager","Some new employees","People from another company","The hotel staff"],c:2,x:"'Tonight's dinner with the Lindqvist team' — a business dinner with another company."},
      {q:"Why does the man say, 'The forecast says it'll rain all evening'?",opts:["To cancel the dinner","To suggest the terrace is a poor choice","To ask for an umbrella","To explain why he will be late"],c:1,x:"The first woman praised the terrace; the rain makes an outdoor terrace a bad idea, and the second woman proposes an indoor option."},
      {q:"What will the second woman do?",opts:["Make a reservation","Call the Lindqvist team","Check the weather again","Visit the harbor"],c:0,x:"Asked to 'book a table for six at seven thirty', she answers 'Sure.'"}]},
  {id:"p3_104",lines:[
    {s:"W",t:"Tom, it's Laura from the travel team. I'm booking your trip to Brazil, and I noticed your passport expires in April."},
    {s:"M",t:"Is that a problem? The trip is in January."},
    {s:"W",t:"Brazil requires at least six months' validity from the date you enter the country, so yes, it is."},
    {s:"M",t:"I had no idea. How long does a renewal take?"},
    {s:"W",t:"About three weeks with the express service. I'll email you the form now. If you send it off this week, you'll have it well before the trip."}],
    qs:[
      {q:"Why is the woman calling?",opts:["To cancel a trip","To report a problem with a document","To confirm a flight time","To request a travel budget"],c:1,x:"She noticed that his passport expires too soon for the trip."},
      {q:"What does the woman say about Brazil?",opts:["It requires passports to be valid for six months","It does not require a visa","It has changed its entry rules","It is expensive in January"],c:0,x:"'Brazil requires at least six months' validity from the date you enter the country.'"},
      {q:"What will the woman do next?",opts:["Book an express flight","Call the embassy","Send the man a form","Change the travel dates"],c:2,x:"'I'll email you the form now.'"}]},
  {id:"p3_105",lines:[
    {s:"M",t:"Good morning. The overhead bins on this flight are almost full, so we're offering to check carry-on bags at the gate, free of charge."},
    {s:"W",t:"Oh, I have a connecting flight in Frankfurt with only fifty minutes to change planes. Would my bag make it?"},
    {s:"M",t:"It'll be checked all the way through to your final destination, so you won't need to collect it in Frankfurt."},
    {s:"W",t:"In that case, go ahead. But let me take my laptop out first."},
    {s:"M",t:"Of course. Here's your claim tag."}],
    qs:[
      {q:"What is the man offering to do?",opts:["Move the woman to another seat","Check a bag at no cost","Change the woman's connecting flight","Give the woman a laptop case"],c:1,x:"'We're offering to check carry-on bags at the gate, free of charge.'"},
      {q:"What is the woman worried about?",opts:["The weight of her bag","The price of the service","The time she has to change planes","The safety of her laptop"],c:2,x:"'Only fifty minutes to change planes. Would my bag make it?'"},
      {q:"What does the woman mean when she says, 'In that case, go ahead'?",opts:["She will board the plane now","She agrees to the man's offer","She wants to change her flight","She would like to speak to someone else"],c:1,x:"Once she knows the bag goes straight to her final destination, she accepts to have it checked."}]},
  {id:"p3_106",lines:[
    {s:"M",t:"Hi, this is room eight fourteen. My flight isn't until nine tonight. Is a late checkout possible?"},
    {s:"W",t:"Let me check. We can offer you checkout at four at no charge. After that, it's half the nightly rate."},
    {s:"M",t:"Four is fine. Also, I need to print some contracts before a meeting this morning. Is there a printer I can use?"},
    {s:"W",t:"Yes, our business center is next to the lobby. It's open twenty-four hours, and you'll need your room key to get in."}],
    qs:[
      {q:"When does the man's flight leave?",opts:["At four in the afternoon","At nine in the morning","At nine in the evening","At eight in the evening"],c:2,x:"'My flight isn't until nine tonight.'"},
      {q:"What would happen if the man stayed after four o'clock?",opts:["He would pay half the nightly rate","He would lose his room key","He would be moved to another room","He would miss his meeting"],c:0,x:"'After that, it's half the nightly rate.'"},
      {q:"What does the man need to enter the business center?",opts:["An appointment","His passport","A staff member","His room key"],c:3,x:"'You'll need your room key to get in.'"}]},
];

export var P4_DRAFT = [
  {id:"p4_103",type:"Weather report",voice:"M",text:"Good evening, here's your travel forecast. A band of snow will move in from the north after midnight, with up to ten centimeters expected by morning. Road conditions will be difficult during the early commute, so if you're driving to the airport tomorrow, leave at least thirty minutes earlier than usual. The snow should turn to rain by late morning, and temperatures will climb to about four degrees in the afternoon. The weekend looks dry and sunny.",
    qs:[
      {q:"When will the snow begin?",opts:["This evening","After midnight","Late tomorrow morning","On the weekend"],c:1,x:"'A band of snow will move in from the north after midnight.'"},
      {q:"What does the speaker advise people driving to the airport to do?",opts:["Take the train instead","Check their flight online","Leave earlier than usual","Park near the terminal"],c:2,x:"'Leave at least thirty minutes earlier than usual.'"},
      {q:"What will the weather be like on the weekend?",opts:["Dry and sunny","Snowy","Rainy","Windy"],c:0,x:"'The weekend looks dry and sunny.'"}]},
  {id:"p4_104",type:"Weather report",voice:"W",text:"Good morning, and here's the weather. Thick fog has settled over the coast this morning, and visibility near the airport is below two hundred meters. Travelers should check with their airline before leaving home, as some early departures may be held. The fog is expected to lift by around ten o'clock, leaving clear skies and a high of twenty-two degrees. It'll be a beautiful afternoon, so don't forget your sunglasses.",
    qs:[
      {q:"What is causing problems this morning?",opts:["Heavy rain","Strong winds","Thick fog","High temperatures"],c:2,x:"'Thick fog has settled over the coast this morning.'"},
      {q:"What should travelers do before leaving home?",opts:["Check with their airline","Allow extra time for security","Pack warm clothes","Book a taxi"],c:0,x:"'Travelers should check with their airline before leaving home, as some early departures may be held.'"},
      {q:"Why does the speaker say, 'don't forget your sunglasses'?",opts:["To advertise a product","To warn about a health risk","To stress that the afternoon will be sunny","To remind listeners to pack for a trip"],c:2,x:"She has just said the fog will lift, leaving clear skies: a beautiful, sunny afternoon."}]},
  {id:"p4_105",type:"Announcement",voice:"M",text:"Attention passengers traveling to Leeds. Due to engineering work on the line north of York, the eleven twenty service will end at York today. Passengers continuing to Leeds should take the replacement bus, which leaves from the station's east entrance. Please allow an extra forty minutes for your journey. Tickets for this service will also be accepted on the twelve oh five train from platform six. We apologize for any inconvenience.",
    qs:[
      {q:"Why will the eleven twenty service end at York?",opts:["Because of bad weather","Because of engineering work","Because of a staff shortage","Because the train is full"],c:1,x:"'Due to engineering work on the line north of York.'"},
      {q:"Where does the replacement bus leave from?",opts:["Platform six","The main ticket office","The station's east entrance","The bus station in Leeds"],c:2,x:"'The replacement bus, which leaves from the station's east entrance.'"},
      {q:"What is true about tickets for the eleven twenty service?",opts:["They can be used on a later train","They will be refunded automatically","They must be exchanged at the ticket office","They are valid only on the bus"],c:0,x:"'Tickets for this service will also be accepted on the twelve oh five train.'"}]},
  {id:"p4_106",type:"Announcement",voice:"W",text:"This is an announcement for passengers on Skyline Airways flight three eighty-two to Lisbon. Because of the late arrival of the incoming aircraft, this flight will now depart at two forty instead of one fifteen. Please note that boarding will also take place from gate twenty-seven instead of gate twelve. Passengers with connecting flights in Lisbon should speak to our staff at the service desk opposite gate twenty. Thank you for your patience.",
    qs:[
      {q:"What has caused the delay?",opts:["A security check","Bad weather in Lisbon","A mechanical problem","The late arrival of a plane"],c:3,x:"'Because of the late arrival of the incoming aircraft.'"},
      {q:"What else has changed?",opts:["The destination","The boarding gate","The airline","The baggage allowance"],c:1,x:"'Boarding will also take place from gate twenty-seven instead of gate twelve.'"},
      {q:"Who should go to the service desk?",opts:["Passengers with connecting flights","Passengers without a boarding pass","Passengers traveling with children","Passengers who want a refund"],c:0,x:"'Passengers with connecting flights in Lisbon should speak to our staff at the service desk.'"}]},
];

export var P7_DRAFT = [
  {id:"p7p76",type:"Email",text:"From: Guest Services, Marlow Hotel\nTo: Sofia Brandt\nDate: 3 March\nSubject: Your reservation at the Marlow Hotel, Edinburgh\n\nDear Ms. Brandt,\n\nThank you for choosing the Marlow Hotel. We are pleased to confirm your reservation for a superior double room from 18 to 21 March (three nights) at a rate of £145 per night, breakfast included. [1]\n\nCheck-in is available from 3:00 P.M., and check-out is at 11:00 A.M. If you are arriving on an early flight, you are welcome to leave your luggage at the front desk. [2]\n\nPlease note that this booking can be canceled free of charge until 48 hours before your arrival date. Cancellations made after that time will be charged for the first night. [3]\n\nThe Northern Retail Summit will be held on our conference floor, which is connected to the hotel by an indoor walkway. [4] We look forward to welcoming you.\n\nKind regards,\nIain Ross\nGuest Services",
    questions:[
      {q:"What is the purpose of the email?",options:["To advertise a conference","To confirm a hotel booking","To request a payment","To announce a change of rooms"],correct:1,x:"'We are pleased to confirm your reservation for a superior double room.'"},
      {q:"What is included in the room rate?",options:["Airport transfers","Breakfast","Access to the summit","Late check-out"],correct:1,x:"'At a rate of £145 per night, breakfast included.'"},
      {q:"What is the last day on which Ms. Brandt can cancel without being charged?",options:["15 March","16 March","18 March","21 March"],correct:1,x:"Free cancellation 'until 48 hours before your arrival date': she arrives on 18 March, so 16 March."},
      {q:"In which of the positions marked [1], [2], [3], and [4] does the following sentence best belong? 'Guests attending the event therefore do not need to go outside between sessions.'",options:["[1]","[2]","[3]","[4]"],correct:3,keep:true,x:"The sentence follows the indoor walkway between the hotel and the conference floor where the summit is held: that is why guests stay inside."}]},
  {id:"p7p77",type:"Text Message Chain",text:"--- TEXT MESSAGE CHAIN ---\nMegan Hale (6:52 P.M.): Just landed in Denver. Are you still able to pick me up?\nCarlos Ruiz (6:54 P.M.): Yes, but I'm stuck in traffic on the highway. Probably 30 minutes away.\nMegan Hale (6:55 P.M.): No problem. My bag isn't out yet anyway.\nCarlos Ruiz (7:10 P.M.): Traffic is moving again. Where should I meet you?\nMegan Hale (7:12 P.M.): Door 5, arrivals level. I'll be the one with the big blue suitcase.\nCarlos Ruiz (7:13 P.M.): Great. We'll drop your things at the hotel and go straight to dinner with the Parkway team.\nMegan Hale (7:14 P.M.): Sounds good. I'm starving!",
    questions:[
      {q:"Why will Mr. Ruiz be late?",options:["He went to the wrong terminal","He is in heavy traffic","His car broke down","He had a meeting"],correct:1,x:"'I'm stuck in traffic on the highway. Probably 30 minutes away.'"},
      {q:"At 6:55 P.M., what does Ms. Hale mean when she writes, 'No problem'?",options:["She does not mind waiting","She has found a taxi","Her flight was on time","She does not need a ride"],correct:0,x:"She still has to wait for her bag, so a 30-minute delay does not bother her."},
      {q:"Where will Ms. Hale meet Mr. Ruiz?",options:["At the hotel entrance","At the baggage claim","At the departures level","At door 5 on the arrivals level"],correct:3,x:"'Door 5, arrivals level.'"},
      {q:"What will they do after stopping at the hotel?",options:["Have dinner with a business team","Go to the office","Return to the airport","Meet Ms. Hale's manager"],correct:0,x:"'We'll drop your things at the hotel and go straight to dinner with the Parkway team.'"}]},
  {id:"p7p78",type:"Notice",text:"NOTICE TO ALL LOUNGE MEMBERS\nSkyline Lounge, Terminal B\n\nFrom 1 to 30 June, the Skyline Lounge in Terminal B will be closed for renovation. During this period, members may use the temporary lounge located next to Gate B14, which offers seating, complimentary snacks and drinks, and free Wi-Fi. Please note that shower facilities will not be available in the temporary lounge.\n\nMembers traveling from Terminal A may continue to use the Horizon Lounge as usual.\n\nWhen the Skyline Lounge reopens on 1 July, it will feature a larger work area with private phone booths and additional power outlets at every seat.\n\nWe apologize for any inconvenience and thank you for your understanding.",
    questions:[
      {q:"What is the purpose of the notice?",options:["To announce a temporary closure","To advertise a new airline","To introduce a membership fee","To change the Wi-Fi password"],correct:0,x:"'The Skyline Lounge in Terminal B will be closed for renovation' from 1 to 30 June."},
      {q:"What will NOT be available in the temporary lounge?",options:["Snacks","Seating","Showers","Wi-Fi"],correct:2,x:"'Shower facilities will not be available in the temporary lounge.'"},
      {q:"What is indicated about the renovated Skyline Lounge?",options:["It will move to Terminal A","It will offer better facilities for working","It will open earlier in the morning","It will serve hot meals"],correct:1,x:"'A larger work area with private phone booths and additional power outlets at every seat.'"}]},
  {id:"p7p79",type:"Web Page",text:"www.drivewell.com/faq\n\nDRIVEWELL CAR RENTAL: FREQUENTLY ASKED QUESTIONS\n\nWhat do I need to pick up my car?\nYou will need a driver's license held for at least one year, a credit card in the main driver's name, and your booking reference.\n\nCan someone else drive the car?\nYes. Additional drivers can be added at the counter for $12 per day. They must be present at pickup and show their own license.\n\nWhat is your fuel policy?\nAll vehicles are supplied with a full tank and should be returned full. If a car is returned with less fuel, we charge for the missing fuel plus a service fee.\n\nCan I return the car to a different location?\nOne-way rentals are possible between most of our branches. A drop-off fee applies and varies according to distance. Please note that some airport branches operate reduced hours on weekends, so check the opening times of your return location before you travel.",
    questions:[
      {q:"What is required to pick up a car?",options:["A passport","A credit card in the main driver's name","A cash deposit","A letter from an employer"],correct:1,x:"'A credit card in the main driver's name, and your booking reference.'"},
      {q:"What is true about additional drivers?",options:["They must be present when the car is collected","They can be added online only","They drive for free on weekends","They need a license held for five years"],correct:0,x:"'They must be present at pickup and show their own license.'"},
      {q:"In the last answer, the word 'operate' is closest in meaning to",options:["manage","repair","are open","control"],correct:2,x:"Branches that 'operate reduced hours' are open for fewer hours on weekends."},
      {q:"What should customers planning a one-way rental do?",options:["Pay the drop-off fee in advance","Choose an airport branch","Return the car on a weekday","Check when the return branch is open"],correct:3,x:"'Check the opening times of your return location before you travel.'"}]},
  {id:"p7p80",type:"Double Passage",text:"--- DOCUMENT 1: Memo ---\nTo: All Sales Staff\nFrom: Rachel Kim, Finance Director\nDate: 2 September\nRe: Updated travel expense rules\n\nFrom 1 October, the following limits apply to business travel:\n- Hotels: up to $180 per night in major cities and $130 elsewhere.\n- Meals: up to $65 per day. Alcohol is not reimbursable.\n- Taxis: allowed only when no public transport is available or when traveling with a client.\n\nExpense reports must be submitted within 15 days of returning from a trip, with original receipts attached. Reports submitted after that must be approved by a department head.\n\n--- DOCUMENT 2: Email ---\nFrom: Tomas Varga\nTo: Rachel Kim\nDate: 20 October\nSubject: Expense report, Chicago trip\n\nHi Rachel,\n\nI've attached my expense report for my trip to Chicago from 1 to 3 October. I'm sorry it's a little late: I went straight to the Denver trade fair afterwards and only got back this week. Ms. Osei has already signed it.\n\nOne question: on 2 October, I shared a taxi with our client from the hotel to their office. Can this be reimbursed?\n\nBest regards,\nTomas",
    questions:[
      {q:"What is the purpose of the memo?",options:["To announce a sales trip","To explain new rules for travel costs","To introduce a new finance director","To request receipts from a client"],correct:1,x:"'From 1 October, the following limits apply to business travel.'"},
      {q:"What is the most Mr. Varga's company would pay per night for his hotel in Chicago?",options:["$65","$130","$180","$200"],correct:2,x:"Chicago is a major city: 'up to $180 per night in major cities.'"},
      {q:"Why did Mr. Varga's report need a signature from Ms. Osei?",options:["He spent more than the meal limit","He lost some original receipts","He submitted it more than 15 days after his trip","He traveled without permission"],correct:2,x:"He returned on 3 October and wrote on 20 October: more than 15 days, so a department head had to approve the report."},
      {q:"What is suggested about Ms. Osei?",options:["She heads a department","She works in the finance team","She went to the Denver trade fair","She is Mr. Varga's client"],correct:0,x:"Late reports 'must be approved by a department head', and she signed his late report."},
      {q:"What will most likely happen to Mr. Varga's taxi expense?",options:["It will be refused because of the rules","It will be reimbursed because he traveled with a client","It will be paid by the client","It will be split with Ms. Osei"],correct:1,x:"Taxis are allowed 'when traveling with a client', and he shared the taxi with the client."}]},
  {id:"p7p81",type:"Double Passage",text:"--- DOCUMENT 1: Schedule ---\nLAKEVIEW CONVENTION CENTER: SHUTTLE SERVICE\nFree shuttles run between partner hotels and the convention center during the Global Logistics Expo (12 to 14 May).\n\nRoute | Hotels served | Departures from hotels\nBlue | Grand Plaza, Riverside Inn | Every 20 minutes, 7:00 A.M. to 10:00 A.M.\nGreen | Hotel Centro, The Carlton | Every 30 minutes, 7:30 A.M. to 11:00 A.M.\nRed | Airport Hotel | 7:15 A.M. and 8:15 A.M. only\n\nReturn shuttles leave the convention center every 30 minutes from 4:00 P.M. to 7:00 P.M. Exhibitors needing earlier access may request a pass for the 6:30 A.M. service vehicle.\n\n--- DOCUMENT 2: Email ---\nFrom: Ana Petrova\nTo: Expo Help Desk\nDate: 8 May\nSubject: Shuttle question\n\nHello,\n\nI am exhibiting at the expo and staying at The Carlton. Our team needs to be at our stand by 7:00 A.M. on the first day to set it up, so the regular shuttles will not get us there in time. Could you tell me how to apply for early access?\n\nAlso, on 14 May our flight leaves at 6:30 P.M. Is there any way to get to the airport directly from the convention center?\n\nThank you,\nAna Petrova",
    questions:[
      {q:"What is the schedule mainly about?",options:["Free transport during an event","Parking at a convention center","Flights to the expo","Hotel prices in May"],correct:0,x:"'Free shuttles run between partner hotels and the convention center during the Global Logistics Expo.'"},
      {q:"Which shuttle route serves Ms. Petrova's hotel?",options:["Blue","Green","Red","None of the routes"],correct:1,x:"She stays at The Carlton, which the Green route serves."},
      {q:"Why are the regular shuttles unsuitable for Ms. Petrova on 12 May?",options:["They do not stop at her hotel","The first one leaves after she must arrive","They are only for visitors","They are fully booked"],correct:1,x:"The first Green shuttle leaves at 7:30 A.M., but she must be at her stand by 7:00 A.M."},
      {q:"What will Ms. Petrova most likely request?",options:["A pass for the 6:30 A.M. vehicle","A room at the Airport Hotel","A later return shuttle","A refund for her stand"],correct:0,x:"'Exhibitors needing earlier access may request a pass for the 6:30 A.M. service vehicle.'"},
      {q:"What is suggested about Ms. Petrova's question about 14 May?",options:["The schedule does not mention a service to the airport","The last return shuttle leaves too early","Her flight has been changed","The expo ends on 13 May"],correct:0,x:"The schedule only lists shuttles between hotels and the convention center: nothing goes to the airport directly."}]},
  {id:"p7p82",type:"Triple Passage",text:"--- DOCUMENT 1: Booking Confirmation ---\nNORTHLINE RAIL: BOOKING CONFIRMATION\nPassenger: Daniel Weiss\nReference: NR-48213\nJourney: London King's Cross to Newcastle\nDate: Thursday, 9 October\nDeparture: 07:30 | Arrival: 10:25\nTicket: Standard, fixed time (valid only on the train shown)\nPrice: £84.50\n\n--- DOCUMENT 2: Email ---\nFrom: Northline Rail\nTo: Daniel Weiss\nDate: 9 October\nSubject: Delay to your journey NR-48213\n\nDear Mr. Weiss,\n\nWe are sorry that your 07:30 service to Newcastle arrived 72 minutes late today because of a signal failure near Peterborough. You may be entitled to compensation under our Delay Repay scheme. Claims must be submitted online within 28 days of travel.\n\nNorthline Rail Customer Relations\n\n--- DOCUMENT 3: Web Page ---\nwww.northline.co.uk/delay-repay\n\nDELAY REPAY: HOW MUCH CAN I CLAIM?\n\nDelay | Compensation\n15 to 29 minutes | 25% of the ticket price\n30 to 59 minutes | 50% of the ticket price\n60 to 119 minutes | 100% of the ticket price\n120 minutes or more | 100% of the ticket price plus a £10 voucher\n\nCompensation is paid to the card used for the booking, usually within 10 working days. Season ticket holders should use the separate form on our Season Tickets page.",
    questions:[
      {q:"What is indicated about Mr. Weiss's ticket?",options:["It could be used on any train that day","It was valid only on one specific train","It was a season ticket","It included a seat in first class"],correct:1,x:"'Standard, fixed time (valid only on the train shown).'"},
      {q:"What caused the delay?",options:["A signal failure","Bad weather","A staff shortage","Engineering work"],correct:0,x:"'Because of a signal failure near Peterborough.'"},
      {q:"How much compensation can Mr. Weiss most likely claim?",options:["£21.13","£42.25","£84.50","£84.50 plus a £10 voucher"],correct:2,x:"A 72-minute delay falls in the 60 to 119 minute band: 100% of the £84.50 ticket, without the voucher (reserved for 120 minutes or more)."},
      {q:"By what date must Mr. Weiss submit his claim?",options:["19 October","23 October","6 November","9 November"],correct:2,x:"Within 28 days of travel on 9 October: 6 November at the latest."},
      {q:"How will Mr. Weiss receive his compensation?",options:["As a voucher by post","In cash at the station","On the card he used to book","As a discount on a season ticket"],correct:2,x:"'Compensation is paid to the card used for the booking.'"}]},
];
