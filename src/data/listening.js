// ═══════════════════════════════════════════════════════════
// LISTENING DATA — TOEIC Training Hub
// Part 1: 43 items | Part 2: 50 items
// Part 3: 20 items | Part 4: 20 items
// ═══════════════════════════════════════════════════════════

// ─── PART 1 — Photographs (43 questions) ───
// Images: public/images/p1/   Audio: public/audio/p1/{id}_{0-3}.mp3

export var LISTENING_P1 = [
  {id:"p1_01",img:"/images/p1/p1_01.png",c:1,
    opts:["The woman is typing an email on her laptop.","The woman is talking on the phone at her desk.","The woman is reading a document next to her computer.","The woman is turning off her laptop."],
    x:"The woman is holding a phone receiver to her ear and smiling — she's talking on the phone. A laptop is open in front of her but she's not typing on it. A is wrong (not typing). C is wrong (no document visible). D is wrong (laptop is open, not being turned off)."},

  {id:"p1_02",img:"/images/p1/p1_02.jpg",c:1,
    opts:["The passenger is handing a ticket to the agent.","The agent is handing a document to the passenger.","The passenger is picking up his luggage.","The departures board is being updated."],
    x:"The airline agent behind the counter is extending a document toward the passenger. B correctly describes the action. A reverses the direction (agent gives, not passenger). C is wrong (no luggage visible). D cannot be determined from the scene."},

  {id:"p1_03",img:"/images/p1/p1_03.jpg",c:1,
    opts:["The workers are eating lunch at a table.","A safety helmet has been placed on the table.","The men are constructing a building.","The blueprints are being rolled up."],
    x:"A yellow hard hat is sitting on the table next to blueprints. B correctly describes what's visible. A is wrong (they're reviewing plans, not eating). C is wrong (they're at a table, not on a construction site). D is wrong (blueprints are spread open, not rolled up)."},

  {id:"p1_04",img:"/images/p1/p1_04.jpg",c:2,
    opts:["The students are leaving the classroom.","The teacher is writing on the chalkboard.","Several students are raising their hands.","The desks are being arranged in a circle."],
    x:"Multiple children have their hands raised while a teacher stands at the front. C is correct. A is wrong (students are seated). B is wrong (teacher is facing students, not writing). D is wrong (desks are in rows)."},

  {id:"p1_05",img:"/images/p1/p1_05.jpg",c:0,
    opts:["A small boat is passing near a cargo ship.","The containers are being unloaded onto trucks.","The ship is sailing in open water.","Workers are standing on top of the containers."],
    x:"A small boat is visible in the foreground near the large container ship with cranes above it. A is correct. B is wrong (no trucks visible). C is wrong (the ship is docked at a port). D cannot be confirmed from the image."},

  {id:"p1_06",img:"/images/p1/p1_06.jpg",c:2,
    opts:["The patient is standing up from the wheelchair.","The doctor is writing a prescription.","A healthcare worker is speaking with a patient in a wheelchair.","The patient is being examined on a bed."],
    x:"A woman in a white coat with a stethoscope is leaning toward and talking to an elderly person seated in a wheelchair. C is correct. A is wrong (patient is seated). B is wrong (no writing visible). D is wrong (patient is in a wheelchair, not on a bed)."},

  {id:"p1_07",img:"/images/p1/p1_07.jpg",c:1,
    opts:["The man is repairing the vehicle's engine.","The man is seated in the cab of a large vehicle.","The man is loading cargo onto a truck.","The vehicle is parked inside a garage."],
    x:"A man in a green shirt is sitting in the driver's seat of what appears to be heavy machinery or a tractor. B is correct. A is wrong (not repairing). C is wrong (not loading cargo). D is wrong (the vehicle appears to be outdoors)."},

  {id:"p1_08",img:"/images/p1/p1_08.jpg",c:1,
    opts:["Workers are packing ice cream cones into boxes.","Machines are dispensing ice cream into cones on a production line.","The cones are being arranged by hand on a tray.","The factory equipment is being cleaned."],
    x:"Blue mechanical dispensers are placing scoops of ice cream into waffle cones moving along a conveyor belt. B is correct. A is wrong (no boxes or packing). C is wrong (it's automated, not by hand). D is wrong (the equipment is operating, not being cleaned)."},

  {id:"p1_09",img:"/images/p1/p1_09.jpg",c:1,
    opts:["The woman is cleaning laboratory equipment.","A researcher is using a pipette in a laboratory.","The scientists are having a discussion.","The woman is looking through a microscope."],
    x:"A woman in a lab coat is holding and using a pipette, with test tubes and lab equipment around her. B is correct. A is wrong (not cleaning). C is wrong (the man in the background is working separately). D is wrong (no microscope — she's using a pipette)."},

  {id:"p1_10",img:"/images/p1/p1_10.jpg",c:2,
    opts:["The woman is reading a book on a bench.","The woman is having a video call on her laptop.","The woman is typing on a laptop while sitting on a bench.","The laptop screen is turned off."],
    x:"A woman is seated on a wooden bench against a brick wall, with her hands on the laptop keyboard. C is correct. A is wrong (it's a laptop, not a book). B cannot be confirmed (no visible video call). D is wrong (the screen is clearly on)."},

  {id:"p1_11",img:"/images/p1/p1_11.jpg",c:1,
    opts:["The mechanic is washing the car.","A man is using a laptop next to a vehicle with its hood open.","The car is being loaded onto a truck.","The man is closing the hood of the car."],
    x:"A mechanic in blue overalls is holding a laptop while standing in front of a car with its hood raised. B is correct. A is wrong (not washing). C is wrong (no truck). D is wrong (the hood is open, not being closed)."},

  {id:"p1_12",img:"/images/p1/p1_12.jpg",c:1,
    opts:["The workers are climbing down a ladder.","Two workers are assembling a steel structure.","The men are painting a metal beam.","Construction equipment is being unloaded."],
    x:"Two men wearing hard hats and safety harnesses are working on steel beams high up. B is correct. A is wrong (they're on the beams, not a ladder). C is wrong (no painting). D is wrong (no equipment being unloaded)."},

  {id:"p1_13",img:"/images/p1/p1_13.jpg",c:2,
    opts:["A man is playing a guitar on stage.","Several guitars are displayed in a shop window.","A craftsman is building a guitar in his workshop.","The instruments are being packed into cases."],
    x:"A man is working on the body of a guitar surrounded by other guitars in various stages of construction. C is correct. A is wrong (he's building, not playing). B is wrong (it's a workshop, not a shop). D is wrong (no cases visible)."},

  {id:"p1_14",img:"/images/p1/p1_14.jpg",c:0,
    opts:["The colleagues appear exhausted at their desks.","The team is celebrating a successful project.","The workers are arriving at the office.","Documents are being filed into cabinets."],
    x:"Three people at a conference table look very tired — one is pulling his tie, another has her head down. A is correct. B is the opposite (they look exhausted, not celebrating). C is wrong (they're seated, not arriving). D is wrong (papers are on the table, not being filed)."},

  {id:"p1_15",img:"/images/p1/p1_15.jpg",c:2,
    opts:["The woman is boarding an airplane.","A traveler is checking her phone at the gate.","A woman is reading a book in an airport terminal.","The passenger is collecting her luggage."],
    x:"A woman is seated in an airport terminal with a backpack, reading a small book. C is correct. A is wrong (she's seated, not boarding). B is wrong (it's a book, not a phone). D is wrong (no luggage collection area visible)."},

  {id:"p1_16",img:"/images/p1/p1_16.jpg",c:1,
    opts:["The officer is checking the man's passport.","A security officer is screening a passenger.","The man is putting on his jacket.","The officer is handing a boarding pass to the traveler."],
    x:"A TSA security officer in blue uniform is conducting a screening while the man holds his arms out. B is correct. A is wrong (no passport visible). C is wrong (he has his arms extended for screening). D is wrong (no boarding pass exchange)."},

  {id:"p1_17",img:"/images/p1/p1_17.jpg",c:0,
    opts:["A person is signing a document with a pen.","The papers are being placed into an envelope.","A woman is reading a newspaper.","The document is being printed."],
    x:"A hand is holding a pen and writing on a form on a desk. A is correct (signing/filling in a document). B is wrong (no envelope). C is wrong (it's a form, not a newspaper). D is wrong (the document is already printed and being filled in)."},

  {id:"p1_18",img:"/images/p1/p1_18.jpg",c:1,
    opts:["The workers are removing solar panels from a roof.","Two technicians are installing solar panels.","A man is repairing the roof tiles.","The ladder is being carried to the building."],
    x:"Two men wearing hard hats are positioning solar panels on a roof, with a ladder visible behind them. B is correct. A reverses the action (installing, not removing). C is wrong (they're working with panels, not tiles). D is wrong (the ladder is already in place)."},

  {id:"p1_19",img:"/images/p1/p1_19.jpg",c:2,
    opts:["The shelves in the warehouse are empty.","A worker is stacking boxes on a high shelf.","A man is holding a package in a storage area.","The boxes are being loaded onto a delivery truck."],
    x:"A man in a work shirt is standing in a warehouse holding a cardboard box, with shelves of packages behind him. C is correct. A is wrong (shelves are full). B is wrong (he's holding a box at waist level, not stacking high). D is wrong (no truck visible)."},

  {id:"p1_20",img:"/images/p1/p1_20.jpg",c:2,
    opts:["The employee is stocking shelves with fruit.","A customer is selecting produce at a market.","A store worker is carrying a box in the grocery section.","The man is cleaning the floor of the shop."],
    x:"A man wearing a store apron is holding a large cardboard box in the produce section of a grocery store. C is correct. A is wrong (he's carrying a box, not placing items on shelves). B is wrong (he's an employee with an apron, not a customer). D is wrong (not cleaning)."},

  {id:"p1_21",img:"/images/p1/p1_21.jpg",c:1,
    opts:["The group is posing for a photograph.","Several people are gathered around a laptop screen.","The team is having lunch together.","A woman is giving a presentation to her colleagues."],
    x:"A group of people are leaning in and looking attentively at a laptop screen together. B is correct. A is wrong (they're focused on the screen, not posing). C is wrong (no food visible). D is wrong (no one is standing or presenting — they're all looking at the same screen)."},

  {id:"p1_22",img:"/images/p1/p1_22.jpg",c:1,
    opts:["People are swimming in a canal.","Boats are moored along a waterway between buildings.","A bridge is being constructed over the water.","Cars are parked along the street next to the canal."],
    x:"Several boats are tied up along a canal lined with historic buildings. B is correct. A is wrong (no swimmers). C is wrong (no construction). D is wrong (no cars — it's a canal city with water instead of streets)."},

  {id:"p1_23",img:"/images/p1/p1_23.jpg",c:2,
    opts:["People are sitting on the benches in the park.","The snow is being cleared from the pathway.","Benches are covered with snow in a park.","Children are playing in the snow."],
    x:"Wooden benches along a park path are heavily covered in snow, with no people around. C is correct. A is wrong (the benches are empty). B is wrong (no one is clearing snow). D is wrong (no children or people visible)."},

  {id:"p1_24",img:"/images/p1/p1_24.jpg",c:0,
    opts:["A person is writing in a planner next to a mobile phone.","The woman is sending a text message on her phone.","A notebook is being closed and put away.","The person is drawing a picture in a sketchbook."],
    x:"A hand is holding a pen and writing in a weekly planner/calendar, with a smartphone resting on the page. A is correct. B is wrong (the phone is lying flat, not being used). C is wrong (the planner is open). D is wrong (it's a planner with grid lines, not a sketchbook)."},

  {id:"p1_25",img:"/images/p1/p1_25.jpg",c:2,
    opts:["A woman is folding clothes on a table.","A customer is watching the machines operate.","A person is reaching into a washing machine.","Someone is pushing a cart through the laundry."],
    x:"The person's upper body is inside the machine and their legs are visible — they are reaching into a washing machine. (A) is wrong: clothes are in a cart, not being folded. (B) is a similar-sound trap: 'watching' vs 'washing'. (D) is wrong: the cart is next to the machines, not being pushed."},

  {id:"p1_26",img:"/images/p1/p1_26.jpg",c:1,
    opts:["A construction worker is putting on a hard hat.","A worker is welding a piece of metal.","A man is inspecting equipment in a warehouse.","A mechanic is repairing a vehicle."],
    x:"The worker is wearing a welding helmet and sparks are visible — he is welding a piece of metal. (A) is wrong: he's wearing a helmet, not a hard hat. (C) is a trap with 'inspecting'. (D) is wrong: he's working on metal, not repairing a vehicle."},

  {id:"p1_27",img:"/images/p1/p1_27.jpg",c:0,
    opts:["Sandwiches and fries have been arranged on a tray.","A customer is eating a meal at a restaurant.","Beverages are being poured into glasses.","A chef is preparing food in the kitchen."],
    x:"The sandwiches are arranged on a wooden tray with a basket of fries and glasses of water. (B) is wrong: no one is eating. (C) is wrong: the drinks are water glasses, not being poured. (D) is wrong: the food is already served, not being prepared."},

  {id:"p1_28",img:"/images/p1/p1_28.jpg",c:3,
    opts:["A woman is being photographed on a rooftop.","A tourist is sitting at an outdoor café.","A woman is putting on a hat.","A woman is taking a photograph from a balcony."],
    x:"The woman is holding a camera up to her face, actively taking a photograph. (A) is a passive voice trap — she is taking, not being photographed. (B) is wrong: she's standing at a railing. (C) is wrong: the hat is already on."},

  {id:"p1_29",img:"/images/p1/p1_29.jpg",c:1,
    opts:["Some penguins are swimming in the ocean.","A woman is sitting on rocks near some penguins.","A woman is walking along a sandy beach.","A visitor is feeding birds at a wildlife park."],
    x:"The woman is seated on rocks, watching penguins nearby. (A) is wrong: the penguins are on rocks, not swimming. (C) is wrong: she is sitting, not walking. (D) is wrong: she is not feeding them."},

  {id:"p1_30",img:"/images/p1/p1_30.jpg",c:2,
    opts:["A cook is preparing breakfast in a kitchen.","Vegetables are being chopped on a cutting board.","A meal has been laid out on wooden boards.","Eggs are being fried in a pan."],
    x:"Two cutting boards with open-face sandwiches topped with eggs, plus cutlery and vegetables. (A) is wrong: no one is cooking. (B) is a detail trap: vegetables are present but not being chopped. (D) is wrong: eggs are on the sandwiches, not in a pan."},

  {id:"p1_31",img:"/images/p1/p1_31.jpg",c:0,
    opts:["A worker is cleaning the interior of a car.","A mechanic is repairing an engine.","A man is driving a car out of a garage.","Someone is closing a car door."],
    x:"The worker is wearing a mask and spraying the car interior with a cleaning device. (B) is wrong: cleaning, not repairing. (C) is a similar-context trap: no one is driving. (D) is wrong: the door is open, not being closed."},

  {id:"p1_32",img:"/images/p1/p1_32.jpg",c:2,
    opts:["A boy is looking through a car window.","A child is playing with water in a garden.","A boy is washing a car with a sponge.","A man is getting out of a parked car."],
    x:"The child is holding a sponge and washing the car window with soapy water. (A) is wrong: he's washing, not looking. (B) is a subject trap: washing the car, not playing. (D) is wrong: no man getting out."},

  {id:"p1_33",img:"/images/p1/p1_33.jpg",c:3,
    opts:["A small group of people is having a discussion.","An empty auditorium is being prepared for an event.","Students are lining up outside a building.","A lecture is being given in a large auditorium."],
    x:"A large lecture hall full of students with a speaker presenting. (A) is wrong number: many rows, not a small group. (B) is wrong: the room is full. (C) is wrong: students are seated."},

  {id:"p1_34",img:"/images/p1/p1_34.webp",c:0,
    opts:["Workers are climbing on scaffolding at a construction site.","People are standing on a rooftop.","Metal scaffolding is being assembled by workers.","A group of workers is digging at ground level."],
    x:"Several workers in safety vests are climbing and working on metal scaffolding. (B) is wrong: scaffolding, not a rooftop. (C) is a passive voice trap: the scaffolding is already assembled. (D) is wrong: working above ground, not digging."},

  {id:"p1_35",img:"/images/p1/p1_35.webp",c:1,
    opts:["A woman is using a roller to paint a ceiling.","A woman is painting a wall next to a ladder.","A person is climbing a ladder to reach a shelf.","Someone is hanging a picture on a wall."],
    x:"The woman is applying paint to the wall with a brush, standing beside a ladder. (A) is wrong: she's using a brush, not a roller. (C) is a trap: she's next to the ladder, not climbing it. (D) is wrong: painting, not hanging a picture."},

  {id:"p1_36",img:"/images/p1/p1_36.webp",c:2,
    opts:["A woman is working alone at her desk.","Two colleagues are standing near a window.","Two women are having a meeting with their laptops.","A group is writing on a whiteboard."],
    x:"Two women seated in modern chairs, each with a laptop — having a meeting. (A) is wrong number: two people, not one. (B) is wrong: seated, not standing. (D) is wrong: working on laptops, not writing on a whiteboard."},

  {id:"p1_37",img:"/images/p1/p1_37.webp",c:3,
    opts:["Several boats are sailing across the water.","People are fishing from a wooden pier.","A dock is being constructed near the shore.","Boats are tied up along a pier in a marina."],
    x:"Sailboats and motorboats moored along a wooden dock in a marina. (A) is wrong: boats are docked, not sailing. (B) is wrong: no fishing visible. (C) is a tense/state trap: the dock is already built."},

  {id:"p1_38",img:"/images/p1/p1_38.webp",c:0,
    opts:["A cashier is bagging items for a customer.","A shopper is browsing products on a shelf.","A store employee is stocking shelves.","A customer is paying with cash at the register."],
    x:"A cashier in uniform is putting items into a bag at the checkout counter. (B) is wrong: the customer is at the counter, not browsing. (C) is wrong: bagging items, not stocking shelves. (D) is a trap: the visible action is bagging."},

  {id:"p1_39",img:"/images/p1/p1_39.webp",c:1,
    opts:["A woman is waiting for the traffic light to change.","A pedestrian is crossing the street while looking at her phone.","A woman is talking on the phone next to her car.","People are waiting at a bus stop."],
    x:"The woman is walking across a crosswalk while looking at her mobile phone. (A) is wrong: she is not waiting, she is mid-crossing. (C) is a trap: she's looking at her phone, not talking on it. (D) is wrong: she's on a crosswalk, not at a bus stop."},

  {id:"p1_40",img:"/images/p1/p1_40.webp",c:2,
    opts:["Passengers are boarding an aircraft.","People are walking through a jet bridge.","Passengers are getting off a plane using stairs.","Travelers are waiting inside a terminal."],
    x:"Passengers walking down stairs from the aircraft. (A) is the opposite direction trap: getting off, not boarding. (B) is wrong: using stairs, not a jet bridge. (D) is wrong: on the aircraft stairs, not in a terminal."},

  {id:"p1_41",img:"/images/p1/p1_41.webp",c:0,
    opts:["An airplane is parked at the gate.","A plane is taking off from the runway.","An aircraft is taxiing on the runway.","A jet bridge is being connected to the aircraft."],
    x:"A large commercial aircraft parked at the gate with a jet bridge attached. (B) is wrong: stationary, not taking off. (C) is wrong: at the gate, not on a runway. (D) is a tense trap: the jet bridge is already connected."},

  {id:"p1_42",img:"/images/p1/p1_42.webp",c:3,
    opts:["A woman is standing in a queue at the airport.","A traveler is checking in at the counter.","A passenger is reading a book in a waiting area.","A woman is sitting in an airport terminal holding her passport."],
    x:"The woman is seated in an airport terminal, holding a passport and boarding pass. (A) is wrong: sitting, not standing in a queue. (B) is wrong: in the terminal, not at a counter. (C) is wrong: holding documents, not reading a book."},

  {id:"p1_43",img:"/images/p1/p1_43.webp",c:1,
    opts:["A traveler is picking up luggage from the carousel.","A suitcase is moving along a baggage carousel.","Luggage is being loaded onto an airplane.","Rows of suitcases are lined up in a storage area."],
    x:"A single suitcase traveling on the baggage carousel conveyor belt. (A) is wrong: no one is picking it up. (C) is wrong: on the carousel, not being loaded onto a plane. (D) is wrong number: one suitcase, not rows."},
];

// ─── PART 2 — Question-Response (125 questions) ───
// Audio: public/audio/p2/{id}_q.mp3 + {id}_{0-2}.mp3

export var LISTENING_P2 = [
  {id:"p2_01",q:"When is the budget meeting scheduled?",
    opts:["It's on Thursday at 2 PM.","Yes, I like the schedule.","The budget was approved."],
    c:0,x:"'When' asks for a time. Only A gives a time (Thursday at 2 PM)."},

  {id:"p2_02",q:"Who's responsible for the marketing campaign?",
    opts:["It was very successful.","Ms. Rivera is leading it.","We launched it last month."],
    c:1,x:"'Who' asks for a person. Only B names someone (Ms. Rivera)."},

  {id:"p2_03",q:"Where did you put the quarterly report?",
    opts:["It's due next Friday.","About 30 pages long.","On your desk, next to the laptop."],
    c:2,x:"'Where' asks for a place. Only C gives a location (on your desk)."},

  {id:"p2_04",q:"Why was the delivery delayed?",
    opts:["It arrived this morning.","Because of a supplier issue.","Three boxes were missing."],
    c:1,x:"'Why' asks for a reason. Only B gives a cause (because of a supplier issue)."},

  {id:"p2_05",q:"How many copies do we need for the presentation?",
    opts:["The presentation went well.","About twenty-five should be enough.","It starts at 10 AM."],
    c:1,x:"'How many' asks for a quantity. Only B gives a number (twenty-five)."},

  {id:"p2_06",q:"Would you like to join us for lunch?",
    opts:["The restaurant is nearby.","I already ate, but thanks.","Lunch is at noon."],
    c:1,x:"This is an invitation. B is an indirect but natural decline. A and C are factual but don't answer the invitation."},

  {id:"p2_07",q:"Hasn't the new software been installed yet?",
    opts:["Yes, it's a new version.","The IT team is working on it now.","I prefer the old software."],
    c:1,x:"Negative question about status. B addresses the current situation. A repeats 'new' (trap). C is an opinion, not an answer."},

  {id:"p2_08",q:"Do you want the report in PDF or printed?",
    opts:["Yes, the report is ready.","PDF would be easier to share.","I wrote it yesterday."],
    c:1,x:"'Or' question = choose one. B makes a choice (PDF). A says 'Yes' (trap for or-questions). C is unrelated."},

  {id:"p2_09",q:"The conference room is on the third floor, isn't it?",
    opts:["Actually, it was moved to the second floor.","The conference starts at 3.","Yes, I have the room key."],
    c:0,x:"Tag question asking for confirmation. A corrects the information. B uses 'third/3' (number trap). C doesn't address the location."},

  {id:"p2_10",q:"How should I send the contract to the client?",
    opts:["The client signed it already.","Email would be the fastest option.","It's a three-year contract."],
    c:1,x:"'How' asks for a method. B suggests a method (email). A and C give facts about the contract but not how to send it."},

  {id:"p2_11",q:"Could you review this proposal before Friday?",
    opts:["The proposal was rejected.","Sure, I'll look at it tomorrow.","Friday is a holiday."],
    c:1,x:"This is a request. B accepts and gives a timeline. A talks about a past proposal. C mentions Friday but doesn't answer the request."},

  {id:"p2_12",q:"What time does the train to Manchester leave?",
    opts:["The platform number is 7.","Manchester is about two hours away.","The next one departs at 4:15."],
    c:2,x:"'What time' asks for a specific time. Only C gives a departure time (4:15)."},

  {id:"p2_13",q:"Who should I contact about the office renovation?",
    opts:["The renovation will take three weeks.","Try the facilities manager, Mr. Chen.","The office looks much better now."],
    c:1,x:"'Who' asks for a person. B names someone (Mr. Chen). A and C discuss the renovation but don't name a contact."},

  {id:"p2_14",q:"Why don't we postpone the meeting until next week?",
    opts:["That works better for everyone.","The meeting room is available.","We postponed it already."],
    c:0,x:"'Why don't we' is a suggestion. A accepts the suggestion. B and C don't respond to the proposal."},

  {id:"p2_15",q:"Have you finished reviewing the applications?",
    opts:["There were over 50 applicants.","I still have a few more to go through.","The application deadline was Monday."],
    c:1,x:"Yes/No question about task completion. B gives a status update. A and C mention applications but don't answer about progress."},

  {id:"p2_16",q:"Where can I find the employee handbook?",
    opts:["It was updated last year.","Check the HR section of the intranet.","About 200 pages long."],
    c:1,x:"'Where' asks for a location/source. B gives a specific place (HR intranet). A and C are facts but don't answer where."},

  {id:"p2_17",q:"When did the shipment arrive?",
    opts:["By express delivery.","It came in early this morning.","About 500 units."],
    c:1,x:"'When' asks for a time. B gives a time (early this morning). A answers 'how' and C answers 'how many'."},

  {id:"p2_18",q:"How often do you meet with your supervisor?",
    opts:["In the meeting room upstairs.","She's been very helpful.","Every other Wednesday."],
    c:2,x:"'How often' asks for frequency. C gives frequency (every other Wednesday). A answers 'where' and B is an opinion."},

  {id:"p2_19",q:"Don't you think we should hire more staff?",
    opts:["The staff meeting is at 3.","I've been thinking the same thing.","We hired someone last week."],
    c:1,x:"Negative question seeking agreement. B agrees with the suggestion. A uses 'staff' as a trap word. C talks about past hiring."},

  {id:"p2_20",q:"Shall I book the restaurant for the team dinner?",
    opts:["The food was excellent.","That would be great, thanks.","We had dinner last Friday."],
    c:1,x:"'Shall I' is an offer. B accepts the offer. A and C discuss past dinners."},

  {id:"p2_21",q:"How about moving the deadline to next month?",
    opts:["The project is almost done.","I think that's a reasonable idea.","The deadline was yesterday."],
    c:1,x:"'How about' is a suggestion. B responds to the suggestion. A and C don't address whether to move the deadline."},

  {id:"p2_22",q:"Who approved the travel budget?",
    opts:["It was a business trip to Tokyo.","The finance director signed off on it.","The budget is quite generous."],
    c:1,x:"'Who' asks for a person. B names someone (finance director). A gives destination and C gives an opinion."},

  {id:"p2_23",q:"Would you mind closing the window?",
    opts:["The window faces the parking lot.","Not at all, it is quite cold.","The office has six windows."],
    c:1,x:"'Would you mind' is a polite request. B agrees to help. A and C give facts about windows but don't respond to the request."},

  {id:"p2_24",q:"The new printer is much faster, isn't it?",
    opts:["It prints in color too.","Yes, it saves us a lot of time.","The printer is on the second floor."],
    c:1,x:"Tag question about the printer speed. B confirms and adds information. A mentions a different feature. C gives location."},

  {id:"p2_25",q:"Why hasn't the invoice been sent yet?",
    opts:["The invoice is for $3,500.","We're still waiting for final approval.","I'll send you a copy."],
    c:1,x:"'Why hasn't' asks for a reason something hasn't happened. B explains the delay. A gives the amount and C offers future action."},

  {id:"p2_26",q:"Should we take the elevator or the stairs?",
    opts:["Yes, the elevator is fast.","The stairs are good exercise.","It's on the fifth floor."],
    c:1,x:"'Or' question = pick one. B makes a choice (stairs). A says 'Yes' which is the classic or-question trap. C is a fact."},

  {id:"p2_27",q:"What's the best way to get to the airport from here?",
    opts:["My flight leaves at 6 PM.","The express train takes about 30 minutes.","The airport was renovated recently."],
    c:1,x:"'What's the best way' asks for a method/route. B suggests transportation. A and C are about airports/flights but not how to get there."},

  {id:"p2_28",q:"Could you forward me the meeting notes?",
    opts:["The meeting lasted two hours.","I'll email them to you right away.","There were 12 people at the meeting."],
    c:1,x:"This is a request. B agrees and tells how. A and C are facts about the meeting but don't address the request."},

  {id:"p2_29",q:"Has the client confirmed the order yet?",
    opts:["It's a large order.","I'm still waiting to hear back.","The order shipped yesterday."],
    c:1,x:"Yes/No about confirmation status. B gives a status update. A describes the order and C talks about shipping."},

  {id:"p2_30",q:"Why don't we schedule the training for next Tuesday?",
    opts:["The training was very informative.","That works, I'll book the room.","It takes about three hours."],
    c:1,x:"'Why don't we' is a suggestion. B accepts and takes action. A comments on past training. C gives duration."},

  {id:"p2_31",q:"Which department handles customer complaints?",
    opts:["We received five complaints this week.","Customer service on the fourth floor.","The complaint was resolved quickly."],
    c:1,x:"'Which department' asks for a specific team. B gives department + location. A gives complaint count and C discusses resolution."},

  {id:"p2_32",q:"You've already submitted the report, haven't you?",
    opts:["The report is 15 pages.","Actually, I still need to add the charts.","It's due by end of day."],
    c:1,x:"Tag question checking if done. B corrects the assumption (not finished). A gives length and C gives deadline."},

  {id:"p2_33",q:"Where should I park when I visit the main office?",
    opts:["The office opens at 8 AM.","There's a visitor lot behind the building.","It's a 20-minute drive from here."],
    c:1,x:"'Where should I park' asks for a parking location. B gives a specific place. A gives opening hours and C gives travel time."},

  {id:"p2_34",q:"Do you prefer the morning or afternoon session?",
    opts:["Yes, I've already registered.","The morning one fits my schedule better.","Each session is 90 minutes."],
    c:1,x:"'Or' question = choose one. B picks morning. A says 'Yes' (or-question trap). C gives duration."},

  {id:"p2_35",q:"I thought the deadline was extended.",
    opts:["No, it's still due this Friday.","The project is going well.","I'll meet the deadline."],
    c:0,x:"Statement seeking confirmation. A corrects the assumption. B and C don't address whether the deadline changed."},

  {id:"p2_36",q:"What did the director say about the proposal?",
    opts:["She wants us to revise the budget section.","The proposal was submitted online.","The director is traveling this week."],
    c:0,x:"'What did X say' asks for content of communication. A reports what she said. B is about submission and C is about her schedule."},

  {id:"p2_37",q:"Isn't the workshop supposed to start at 9?",
    opts:["It's been pushed back to 10.","The workshop covers project management.","I attended it last year."],
    c:0,x:"Negative question about start time. A corrects with new time. B gives the topic and C talks about past attendance."},

  {id:"p2_38",q:"How long will the renovation take?",
    opts:["The contractor said about six weeks.","The lobby looks much better now.","They're renovating the third floor."],
    c:0,x:"'How long' asks for duration. A gives a timeframe (six weeks). B comments on results and C says what's being renovated."},

  {id:"p2_39",q:"Who's giving the keynote speech at the conference?",
    opts:["The conference is in Berlin this year.","A professor from Oxford University.","The speech was very inspiring."],
    c:1,x:"'Who' asks for a person. B identifies the speaker. A gives location and C comments on a past speech."},

  {id:"p2_40",q:"Can I borrow your laptop charger?",
    opts:["Sure, it's in my bag.","The laptop is brand new.","I charged it this morning."],
    c:0,x:"Request to borrow something. A agrees and says where it is. B describes the laptop and C talks about charging."},

  {id:"p2_41",q:"We're running low on printer paper, aren't we?",
    opts:["I'll order more this afternoon.","The printer is working fine.","We switched to a new brand."],
    c:0,x:"Tag question about supply level. A takes action to fix it. B is about the printer machine and C about paper brand."},

  {id:"p2_42",q:"What's the Wi-Fi password for the guest network?",
    opts:["The network is very fast.","It's 'welcome2025', all lowercase.","We upgraded the system last month."],
    c:1,x:"Asks for specific information (password). B gives the password. A comments on speed and C on upgrades."},

  {id:"p2_43",q:"Should I contact the supplier directly?",
    opts:["The supplier is based in Germany.","It might be faster to go through our procurement team.","We've used them for three years."],
    c:1,x:"Asking for advice. B suggests an alternative approach. A gives supplier location and C gives history."},

  {id:"p2_44",q:"How was your business trip to Singapore?",
    opts:["I'm flying out on Monday.","Very productive — we signed two new contracts.","Singapore is about 12 hours by plane."],
    c:1,x:"'How was' asks for an evaluation. B gives a positive assessment. A is about a future trip and C is a travel fact."},

  {id:"p2_45",q:"The quarterly figures look promising, don't they?",
    opts:["Revenue is up 15% from last quarter.","The report will be published next week.","I haven't had a chance to review them yet."],
    c:2,x:"Tag question seeking agreement. C is an honest indirect answer (hasn't seen them). A gives a detail and B is about publication. C is the most natural conversational response."},

  {id:"p2_46",q:"Where are the samples we ordered for the trade show?",
    opts:["The trade show starts next Thursday.","They should be in the storage room.","We ordered 200 samples."],
    c:1,x:"'Where' asks for a location. B gives a location (storage room). A gives a date and C gives quantity."},

  {id:"p2_47",q:"Would you rather present first or second?",
    opts:["The presentation is ready.","I'd prefer to go second if that's OK.","It will take about 15 minutes."],
    c:1,x:"'Would you rather X or Y' = choose one. B makes a choice (second). A confirms readiness and C gives duration."},

  {id:"p2_48",q:"Didn't the maintenance team fix the air conditioning?",
    opts:["They came yesterday but need a replacement part.","The air conditioning is on the roof.","It's much cooler today."],
    c:0,x:"Negative question about repair status. A explains the situation (partial fix). B gives location and C comments on temperature."},

  {id:"p2_49",q:"What's on the agenda for this afternoon's meeting?",
    opts:["The budget review and the hiring plan.","The meeting room has been changed.","It should last about an hour."],
    c:0,x:"'What's on the agenda' asks for topics. A lists the topics. B is about room change and C about duration."},

  {id:"p2_50",q:"I don't think we have enough chairs for the workshop.",
    opts:["The workshop is about leadership skills.","I can bring a few more from the next room.","It starts at 2 PM."],
    c:1,x:"Statement expressing a problem. B offers a solution. A gives the workshop topic and C gives the time. B is the most helpful response."},
	// ═══════════════════════════════════════════════════════════
// NEW PART 2 ITEMS — p2_51 → p2_75
// Append these items inside the LISTENING_P2 array in listening.js
// (before the closing "];")
// Audio: public/audio/p2/{id}_q.mp3 + {id}_{0-2}.mp3
// ═══════════════════════════════════════════════════════════

  {id:"p2_51",q:"What floor is the human resources department on?",
    opts:["They handle recruitment and benefits.","It's on the seventh floor, next to legal.","The department has fifteen employees."],
    c:1,x:"'What floor' asks for a location. B gives the floor (seventh). A describes what HR does and C gives headcount."},

  {id:"p2_52",q:"I don't think the projector is working properly.",
    opts:["The presentation was very clear.","Have you tried restarting it?","The projector was expensive."],
    c:1,x:"Statement expressing a problem. B offers a practical suggestion. A comments on a past presentation and C mentions cost."},

  {id:"p2_53",q:"How far is the nearest post office from here?",
    opts:["It closes at 5 PM.","About a ten-minute walk down Main Street.","I need to mail a package."],
    c:1,x:"'How far' asks for distance. B gives distance/directions. A gives closing time and C states a need."},

  {id:"p2_54",q:"Weren't we supposed to receive the samples today?",
    opts:["The samples look great.","The supplier said they'll arrive by Thursday.","We ordered fifty samples."],
    c:1,x:"Negative question about expected delivery. B corrects with a new timeline. A comments on quality and C gives quantity."},

  {id:"p2_55",q:"Would you like me to arrange a taxi for you?",
    opts:["The taxi fare is about fifteen dollars.","That would be very helpful, thank you.","I took a taxi yesterday."],
    c:1,x:"Offer of help. B accepts the offer. A gives a fare and C talks about a past taxi ride."},

  {id:"p2_56",q:"What did the technician say about the server?",
    opts:["He said it needs a new hard drive.","The server room is on the basement level.","The technician arrived at noon."],
    c:0,x:"'What did X say' asks for reported speech. A reports the diagnosis. B gives location and C gives arrival time."},

  {id:"p2_57",q:"Should we order lunch for the workshop participants or let them go out?",
    opts:["Yes, the workshop starts at one.","Ordering in would save time.","About twenty people signed up."],
    c:1,x:"'Or' question. B makes a choice (ordering in). A says 'Yes' (or-question trap). C gives attendance numbers."},

  {id:"p2_58",q:"How much did the office furniture cost?",
    opts:["It was delivered on Monday.","Around twelve thousand dollars for everything.","The furniture looks very modern."],
    c:1,x:"'How much' asks for a price. B gives the cost. A gives a delivery date and C gives an opinion on style."},

  {id:"p2_59",q:"You haven't met the new regional manager yet, have you?",
    opts:["No, but I've heard great things about her.","The regional office is in Boston.","We had a manager's meeting last week."],
    c:0,x:"Negative tag question. A confirms (haven't met) with additional info. B gives office location and C talks about a past meeting."},

  {id:"p2_60",q:"Let's take a short break before we continue.",
    opts:["The break room has coffee and snacks.","Good idea — I could use some fresh air.","We started at nine this morning."],
    c:1,x:"'Let's' is a suggestion. B agrees enthusiastically. A gives info about the break room and C gives start time."},

  {id:"p2_61",q:"Whose turn is it to chair the meeting this week?",
    opts:["The meeting was rescheduled.","I believe it's Sarah's turn.","The chair in the conference room is broken."],
    c:1,x:"'Whose turn' asks for a person. B names someone (Sarah). A gives scheduling info and C is a word trap ('chair' = furniture vs role)."},

  {id:"p2_62",q:"How long have you been working on the Henderson account?",
    opts:["Mr. Henderson called this morning.","Since the beginning of March.","It's one of our biggest accounts."],
    c:1,x:"'How long' asks for duration. B gives a timeframe. A mentions a call and C describes the account size."},

  {id:"p2_63",q:"Do you know if the copy machine has been fixed?",
    opts:["I made twenty copies for the meeting.","The repair technician is coming tomorrow.","The copy machine is near the elevator."],
    c:1,x:"Indirect yes/no question. B gives a status update. A mentions copies made and C gives location."},

  {id:"p2_64",q:"I'm not sure how to use this new expense tracking software.",
    opts:["The expenses were approved last month.","There's a tutorial video on the company intranet.","The software costs fifty dollars per license."],
    c:1,x:"Statement expressing difficulty. B offers a helpful resource. A talks about past expenses and C mentions cost."},

  {id:"p2_65",q:"What time should we arrive at the client's office?",
    opts:["The office is on Maple Street.","The client seemed pleased with our work.","The meeting is at 10, so let's get there by 9:45."],
    c:2,x:"'What time' asks for a specific time. C gives an arrival time. A gives location and B gives an opinion about the client."},

  {id:"p2_66",q:"Would it be possible to extend the warranty by one year?",
    opts:["The warranty covers parts and labor.","Yes, for an additional seventy-five dollars.","We bought it two years ago."],
    c:1,x:"Polite request for possibility. B answers yes with a cost. A describes coverage and C gives purchase date."},

  {id:"p2_67",q:"Who else is attending the product launch event?",
    opts:["The product launches next Friday.","Most of the sales and marketing teams.","The event was a big success."],
    c:1,x:"'Who else' asks for other attendees. B names teams. A gives the launch date and C comments on a past event."},

  {id:"p2_68",q:"This isn't the right form for a refund request, is it?",
    opts:["You're right — you need form 7B from the finance office.","The refund was processed yesterday.","I'll fill out the form this afternoon."],
    c:0,x:"Negative tag question seeking correction. A confirms and provides the correct form. B talks about a past refund and C offers future action."},

  {id:"p2_69",q:"Why is the lobby so crowded this morning?",
    opts:["There's a job fair on the ground floor today.","The lobby was redecorated last month.","I arrived early to avoid the traffic."],
    c:0,x:"'Why' asks for a reason. A explains the cause. B mentions renovation and C gives arrival info."},

  {id:"p2_70",q:"Have the clients from Tokyo confirmed their arrival date?",
    opts:["Tokyo is nine hours ahead of London.","They'll be here on the twenty-third.","The clients were very impressed with our facility."],
    c:1,x:"Yes/no about confirmation. B gives the confirmed date. A gives a time zone fact and C gives an opinion."},

  {id:"p2_71",q:"Would you prefer the corner office or the one near the kitchen?",
    opts:["Yes, I'd like an office with a window.","The corner office is quieter, so I'll take that one.","Both offices have been recently painted."],
    c:1,x:"'Or' question. B makes a choice with reasoning. A says 'Yes' (or-question trap). C describes both offices equally."},

  {id:"p2_72",q:"Hasn't anyone responded to the job posting yet?",
    opts:["The posting was put up on the company website.","We've received about forty applications so far.","The position requires five years of experience."],
    c:1,x:"Negative question about response status. B gives a number of responses. A says where it was posted and C describes requirements."},

  {id:"p2_73",q:"I left my umbrella in the meeting room, I think.",
    opts:["It's supposed to rain all afternoon.","Let me check — yes, it's on the table by the window.","The meeting went very well today."],
    c:1,x:"Statement implying a need for help. B confirms and locates the item. A comments on weather and C on the meeting quality."},

  {id:"p2_74",q:"How many people can the conference hall hold?",
    opts:["The conference is about digital marketing.","Up to three hundred, with extra seating available.","We reserved it for next Thursday."],
    c:1,x:"'How many' asks for capacity. B gives a number with detail. A gives the topic and C gives a reservation date."},

  {id:"p2_75",q:"You're going to the industry expo next week, aren't you?",
    opts:["Actually, I've decided to send my assistant instead.","The expo features over two hundred exhibitors.","I went to the expo last year in Chicago."],
    c:0,x:"Tag question expecting confirmation. A gives an unexpected but natural answer (not going personally). B describes the expo and C talks about a past one."},

  // ─── Batch 3 (p2_76 → p2_125) — 2 new accents/voices ───

  {id:"p2_76",q:"How long has the marketing team been preparing this campaign?",
    opts:["The campaign targets young professionals.","For about three months now.","The team has fifteen members."],
    c:1,x:"'How long' asks duration. B gives a time period. A describes the audience and C the team size."},

  {id:"p2_77",q:"You haven't sent the contract to the legal department yet, have you?",
    opts:["The contract is forty pages long.","No, but I'll do it before lunch.","The legal department is on the fourth floor."],
    c:1,x:"Negative tag question about an unfinished task. B confirms 'not yet' and commits to a time. A describes the contract and C gives a location."},

  {id:"p2_78",q:"Would you rather take the morning flight or the afternoon one?",
    opts:["I usually fly with the same airline.","The flight was delayed by an hour.","The afternoon would give me more time to prepare."],
    c:2,x:"Choice question (A or B). C picks one option with a reason. B reports a delay and A talks about airline preference."},

  {id:"p2_79",q:"Did the new intern start this Monday or last Monday?",
    opts:["She started just this past Monday.","The internship lasts six months.","Yes, she's very enthusiastic."],
    c:0,x:"Choice between two times. A specifies which one. B gives the duration and C is a yes/no answer to a non yes/no question."},

  {id:"p2_80",q:"Why was the staff meeting moved to Friday?",
    opts:["Because the director is traveling on Wednesday.","The meeting room has fifty seats.","Yes, it's been confirmed."],
    c:0,x:"'Why' asks for a reason — A gives a 'because' clause. B describes the room and C is a yes/no answer."},

  {id:"p2_81",q:"Where can I find the latest sales figures?",
    opts:["The sales were higher than expected.","I sold the car last week.","They're on the shared drive under Q1 reports."],
    c:2,x:"'Where' asks for a location. C points to a digital location. A comments on results and B plays on 'sales/sold' similarity."},

  {id:"p2_82",q:"When are we expecting the audit team to arrive?",
    opts:["Yes, the team is very experienced.","The audit will cover three departments.","Their plane lands at 8 AM on Tuesday."],
    c:2,x:"'When' asks for a time. C gives a specific arrival time. B describes the audit scope and A is a yes/no answer to a non yes/no question."},

  {id:"p2_83",q:"This printer keeps jamming every time I use it.",
    opts:["I can call IT support for you.","I printed fifty copies yesterday.","The printer was installed last year."],
    c:0,x:"Statement implying a need for help. A offers to call support. B and C give unrelated info about printing."},

  {id:"p2_84",q:"Do you know if the exhibition is still open this Saturday?",
    opts:["I went to the exhibition last week.","Yes, until 6 PM I believe.","The exhibition features modern art."],
    c:1,x:"Indirect yes/no question. B confirms with a closing time. A talks about a past visit and C describes content."},

  {id:"p2_85",q:"Who's responsible for ordering the office supplies?",
    opts:["We need more printer paper.","The supplies arrived this morning.","That would be Marcus in admin."],
    c:2,x:"'Who' asks for a person. C names someone with their role. A and B describe supplies and timing."},

  {id:"p2_86",q:"What kind of training does the new software require?",
    opts:["I trained at the head office.","The software cost ten thousand dollars.","Just a two-hour online tutorial."],
    c:2,x:"'What kind' asks for a type. C describes the training format. B gives a cost and A uses 'trained' but talks about a place."},

  {id:"p2_87",q:"The board approved our proposal, didn't they?",
    opts:["Yes, but with some minor revisions.","The board has twelve members.","I'll prepare another proposal."],
    c:0,x:"Tag question expecting confirmation. A confirms with a nuance. B describes the board and C talks about a future proposal."},

  {id:"p2_88",q:"How often does the cleaning crew come to our floor?",
    opts:["The crew has six people.","Cleaning supplies are in the closet.","Twice a week, on Tuesdays and Fridays."],
    c:2,x:"'How often' asks for frequency. C gives a frequency with days. A describes the crew size and B the supply location."},

  {id:"p2_89",q:"Aren't you supposed to be at the client lunch right now?",
    opts:["The client rescheduled for tomorrow.","I had a sandwich at my desk.","Yes, our biggest client."],
    c:0,x:"Negative question challenging current behavior. A explains why the lunch isn't happening. B and C describe lunch and client."},

  {id:"p2_90",q:"Why don't we discuss this over coffee tomorrow morning?",
    opts:["The coffee shop opens at seven.","I prefer tea, actually.","Sounds good — let's say nine o'clock."],
    c:2,x:"Suggestion ('Why don't we'). C accepts and proposes a time. B is a literal but off-target answer about coffee/tea. A describes the shop."},

  {id:"p2_91",q:"Should I send the invoice by email or by mail?",
    opts:["The invoice was paid yesterday.","Send it to the accounting office.","Email is faster, so let's go with that."],
    c:2,x:"Choice question. C picks one option with a reason. A talks about payment and B gives a destination, not a method."},

  {id:"p2_92",q:"Whose laptop is sitting in the conference room?",
    opts:["I think it belongs to the consultant.","The conference is on innovation.","It's a brand new model."],
    c:0,x:"'Whose' asks for an owner. A names the likely owner. B describes the conference theme and C the laptop itself."},

  {id:"p2_93",q:"How much was the catering bill for the launch event?",
    opts:["The food was excellent.","Just over two thousand dollars.","About sixty guests attended."],
    c:1,x:"'How much' asks for a cost. B gives an amount. A comments on quality and C on attendance."},

  {id:"p2_94",q:"Where did you put the keys to the storage room?",
    opts:["I locked the door before leaving.","The storage room is full.","I left them on your desk this morning."],
    c:2,x:"'Where' asks for a location. C specifies where the keys were placed. B describes the room and A an action with a door."},

  {id:"p2_95",q:"Could you forward me the agenda before the call?",
    opts:["The call lasted forty minutes.","Sure, I'll send it right after this meeting.","I forwarded the email yesterday."],
    c:1,x:"Polite request. B agrees and commits to a time. A describes a past call and C uses 'forwarded' but for an unrelated email."},

  {id:"p2_96",q:"Did anyone follow up with the supplier about the late shipment?",
    opts:["The shipment was supposed to arrive Monday.","Yes, Priya called them this morning.","We have several reliable suppliers."],
    c:1,x:"Yes/no question. B confirms with the person who acted. A describes the original timing and C is a general comment."},

  {id:"p2_97",q:"I thought the office was closing early today for the holiday.",
    opts:["You're right — we close at three this afternoon.","The holiday is on Monday.","The office has been redecorated."],
    c:0,x:"Statement seeking confirmation. A confirms and adds the time. B and C give unrelated info about the holiday and office."},

  {id:"p2_98",q:"How many candidates are we interviewing tomorrow?",
    opts:["Five, all shortlisted from over a hundred applications.","The interviews start at nine.","The position requires a master's degree."],
    c:0,x:"'How many' asks for a number. A gives the count with context. B gives a time and C describes requirements."},

  {id:"p2_99",q:"Could you tell me where the nearest bank branch is located?",
    opts:["The bank charges low fees.","I opened my account last year.","There's one just two blocks east of here."],
    c:2,x:"Indirect 'where' question. C gives a location. A describes fees and B talks about an account."},

  {id:"p2_100",q:"You'll be presenting at the conference, won't you?",
    opts:["The conference is in Singapore.","Yes, on Thursday afternoon.","The presentation went well."],
    c:1,x:"Tag question expecting confirmation. B confirms with a time. A gives a location and C uses past tense (the talk hasn't happened yet)."},

  {id:"p2_101",q:"Why don't you take the company car for your client visit?",
    opts:["The client is thirty miles away.","That's a great idea — I'll book it now.","I drive a Honda."],
    c:1,x:"Suggestion. B accepts. A gives distance and C is unrelated personal info."},

  {id:"p2_102",q:"When is the deadline for the budget submission?",
    opts:["The budget covers next quarter.","Friday at end of business.","The submission was approved."],
    c:1,x:"'When' asks for a time. B gives a deadline. A describes scope and C uses past tense."},

  {id:"p2_103",q:"The catering for tomorrow's lunch hasn't been confirmed yet.",
    opts:["The lunch is for twenty people.","I'll call the restaurant right now.","The food yesterday was great."],
    c:1,x:"Statement implying action needed. B offers to fix it. A gives a number and C uses past tense unrelated."},

  {id:"p2_104",q:"What time does the express train to Boston leave?",
    opts:["The train was crowded.","I bought my ticket online.","Every hour on the half hour."],
    c:2,x:"'What time' asks for a schedule. C gives the frequency. A is past observation and B is about ticket purchase."},

  {id:"p2_105",q:"Wasn't the network supposed to be back online by noon?",
    opts:["The IT team is still working on it.","Yes, the new network is faster.","Online sales increased this quarter."],
    c:0,x:"Negative question implying delay. A explains the delay. B and C use 'network/online' but in unrelated contexts."},

  {id:"p2_106",q:"Do you want to drive separately or carpool with the team?",
    opts:["I'd prefer to carpool to save on gas.","The drive takes about two hours.","The team is meeting at three."],
    c:0,x:"Choice question. A picks one with a reason. B and C describe the trip and meeting time."},

  {id:"p2_107",q:"How is the renovation of the lobby progressing?",
    opts:["The lobby is on the ground floor.","The renovation cost a lot.","It should be finished by next Wednesday."],
    c:2,x:"'How' asks about progress. C gives a completion estimate. A gives location and B cost."},

  {id:"p2_108",q:"Has the maintenance crew finished servicing the elevators?",
    opts:["The elevators are very fast.","Yes, both are running normally now.","Maintenance comes every month."],
    c:1,x:"Yes/no question. B confirms completion. A describes elevators and C frequency."},

  {id:"p2_109",q:"Which department handles employee benefits inquiries?",
    opts:["I joined the company last year.","The benefits package is very generous.","Human Resources — extension 240."],
    c:2,x:"'Which' asks for a specific department. C names it with extension. B describes the benefits and A is personal history."},

  {id:"p2_110",q:"Mr. Tanaka is joining our weekly meetings now, isn't he?",
    opts:["Mr. Tanaka transferred from Tokyo.","Yes, starting from next Monday.","The meetings are held in conference room A."],
    c:1,x:"Tag question. B confirms with a start date. A gives background on Mr. Tanaka and C the location."},

  {id:"p2_111",q:"I can't seem to log into the new accounting system.",
    opts:["Did you receive your reset password yet?","The system is very user-friendly.","Accounting is on the third floor."],
    c:0,x:"Statement implying a problem. A diagnoses with a question. B and C give unrelated info about the system and location."},

  {id:"p2_112",q:"How long will the keynote speech last?",
    opts:["The speaker is from Berlin.","Around forty-five minutes including Q and A.","The keynote was inspiring."],
    c:1,x:"'How long' asks for duration. B gives the length. A describes the speaker and C uses past tense (the speech hasn't happened)."},

  {id:"p2_113",q:"Where should we hold the year-end celebration?",
    opts:["The celebration is on December 18th.","Around eighty people will attend.","Maybe the rooftop venue we used last year."],
    c:2,x:"'Where' asks for a place. C suggests a venue. A gives the date and B the headcount."},

  {id:"p2_114",q:"Why is the parking garage closed today?",
    opts:["I usually park on Level 2.","They're repainting the lines.","The garage has three hundred spaces."],
    c:1,x:"'Why' asks for a reason. B explains the closure. A is personal habit and C is a fact about size."},

  {id:"p2_115",q:"Could you let me know who's covering Anna's shift this week?",
    opts:["Anna is on maternity leave.","Yusuf agreed to cover Tuesday and Thursday.","Her shifts are usually quiet."],
    c:1,x:"Polite request for information about a person. B names the cover and days. A explains the absence and C describes shifts."},

  {id:"p2_116",q:"The translators are coming in at nine, aren't they?",
    opts:["Actually, they arrive at ten now.","The translation was excellent.","We hired three translators."],
    c:0,x:"Tag question for confirmation. A corrects the assumption. B comments on quality and C on hiring."},

  {id:"p2_117",q:"Should we wait for Mei before starting the presentation?",
    opts:["Mei is our project manager.","The presentation has thirty slides.","She just texted that she's two minutes away."],
    c:2,x:"Yes/no suggestion. C justifies waiting (she's almost here). B describes the slides and A states Mei's role."},

  {id:"p2_118",q:"This new procedure seems much more efficient than the old one.",
    opts:["I agree — it's saved us at least two hours per week.","The procedure manual is online.","Efficiency is one of our core values."],
    c:0,x:"Opinion statement seeking agreement. A agrees with quantified support. B and C are tangential facts."},

  {id:"p2_119",q:"What's holding up the approval for the new hire?",
    opts:["Legal is still reviewing the contract.","She has five years of experience.","The approval was unanimous."],
    c:0,x:"'What' asks for a cause of delay. A names the bottleneck. B is candidate background and C uses 'approval' but past tense."},

  {id:"p2_120",q:"Would you prefer the slides in color or in black and white?",
    opts:["The slides are very informative.","There are forty slides total.","Color would look more professional."],
    c:2,x:"Choice question. C picks one with a reason. A and B give general info about the slides."},

  {id:"p2_121",q:"You wouldn't happen to have a spare charger, would you?",
    opts:["The charger broke last week.","Sorry, I left mine at home today.","My phone has a long battery life."],
    c:1,x:"Polite indirect request. B apologizes and explains. A is past info and C is unrelated phone fact."},

  {id:"p2_122",q:"How did the negotiations with the vendor go this morning?",
    opts:["Better than expected — we got a ten percent discount.","The vendor is based in Munich.","I'll meet them at noon."],
    c:0,x:"'How did it go' asks for an outcome. A gives a positive result with detail. B is location and C is future tense."},

  {id:"p2_123",q:"Are we still planning to launch the product next month?",
    opts:["The product has many new features.","Yes, on the fifteenth as scheduled.","The launch event was successful."],
    c:1,x:"Yes/no confirmation. B confirms with the date. A describes the product and C uses past tense."},

  {id:"p2_124",q:"I noticed the order from Tomas Industries hasn't shipped yet.",
    opts:["Their warehouse is having a system issue — it ships tomorrow.","Tomas Industries is a longtime client.","The order was for fifty units."],
    c:0,x:"Statement implying concern. A explains the cause and gives an ETA. B and C give general info about the client and order size."},

  {id:"p2_125",q:"Which conference room has the video equipment set up?",
    opts:["The equipment was upgraded last year.","The video lasted ten minutes.","Room C on the second floor."],
    c:2,x:"'Which' asks for a specific room. C names it with floor. A is past upgrade info and B is unrelated past time."},
];

// ─── PART 3 — Conversations (20 conversations, 60 questions) ───
// Audio: public/audio/p3/{id}.mp3

export var LISTENING_P3 = [
  {id:"p3_01",lines:[
      {s:"W",t:"Have you seen the updated schedule for the trade show next month?"},
      {s:"M",t:"Yes, our booth has been moved to Hall B. It's actually a better location than last year."},
      {s:"W",t:"That's great. Should I order new banners for the booth?"},
      {s:"M",t:"Let's check the budget with finance first. The old ones might still work."}],
    qs:[
      {q:"What are the speakers discussing?",opts:["A budget meeting","A trade show","A product launch","An office move"],c:1},
      {q:"What has changed about their booth?",opts:["It was cancelled","The price went up","It was relocated","It became smaller"],c:2},
      {q:"What does the man suggest?",opts:["Ordering new banners immediately","Checking the budget first","Cancelling the booth","Moving to a different hall"],c:1}]},

  {id:"p3_02",lines:[
      {s:"M",t:"Excuse me, I have a reservation for two under the name Patterson."},
      {s:"W",t:"Yes, Mr. Patterson. Your table is ready. Would you prefer the terrace or inside?"},
      {s:"M",t:"The terrace sounds nice, but it looks like it might rain."},
      {s:"W",t:"In that case, I can seat you by the window. You'll still have a lovely view."}],
    qs:[
      {q:"Where does this conversation take place?",opts:["At a hotel","At a restaurant","At an airport","At a theater"],c:1},
      {q:"Why doesn't the man choose the terrace?",opts:["It's too expensive","It's fully booked","The weather looks bad","It's too noisy"],c:2},
      {q:"Where will the man be seated?",opts:["On the terrace","In a private room","By the window","At the bar"],c:2}]},

  {id:"p3_03",lines:[
      {s:"W",t:"The quarterly sales figures just came in, and they're above our target by 12 percent."},
      {s:"M",t:"That's excellent news. Which region performed the best?"},
      {s:"W",t:"The Asian market, especially Japan and South Korea. Europe was slightly below target."},
      {s:"M",t:"We should present these results at Friday's board meeting."}],
    qs:[
      {q:"What is the main topic of the conversation?",opts:["Hiring plans","Sales performance","Product development","Office relocation"],c:1},
      {q:"Which region exceeded expectations?",opts:["Europe","North America","Asia","South America"],c:2},
      {q:"What does the man want to do?",opts:["Hire more staff in Asia","Present the results to the board","Close the European office","Increase the sales target"],c:1}]},

  {id:"p3_04",lines:[
      {s:"M",t:"I'm calling about the laptop I ordered two weeks ago. It still hasn't arrived."},
      {s:"W",t:"I'm sorry to hear that. Can I have your order number, please?"},
      {s:"M",t:"It's TK-4578. I was told it would arrive within five business days."},
      {s:"W",t:"Let me check that for you. I see there was a delay at our warehouse. I can offer you express shipping at no extra cost."}],
    qs:[
      {q:"Why is the man calling?",opts:["To cancel an order","To return a product","To complain about a late delivery","To ask about pricing"],c:2},
      {q:"When was the order expected to arrive?",opts:["Within two days","Within five business days","Within two weeks","By the end of the month"],c:1},
      {q:"What does the woman offer?",opts:["A full refund","A replacement product","Free express shipping","A discount on the next order"],c:2}]},

  {id:"p3_05",lines:[
      {s:"W",t:"I just got an email from the building manager. The elevators will be out of service this weekend."},
      {s:"M",t:"Both of them? That's going to be a problem for anyone working on the upper floors."},
      {s:"W",t:"I know. They're doing maintenance that was postponed from last month."},
      {s:"M",t:"I'll send a notice to all departments so people can plan ahead."}],
    qs:[
      {q:"What is the problem?",opts:["The offices are closing","The heating is broken","The elevators will be shut down","The parking lot is full"],c:2},
      {q:"When will this happen?",opts:["Today","Tomorrow","This weekend","Next month"],c:2},
      {q:"What will the man do?",opts:["Contact the building manager","Notify the departments","Cancel the maintenance","Work from home"],c:1}]},

  {id:"p3_06",lines:[
      {s:"M",t:"Have you had a chance to interview any candidates for the marketing position?"},
      {s:"W",t:"I've seen three so far. Two had strong experience, but one really stood out."},
      {s:"M",t:"What made them special?"},
      {s:"W",t:"She has ten years in digital marketing and previously managed a team of fifteen."}],
    qs:[
      {q:"What are the speakers discussing?",opts:["A training program","A marketing campaign","A job vacancy","A promotion"],c:2},
      {q:"How many candidates has the woman interviewed?",opts:["One","Two","Three","Fifteen"],c:2},
      {q:"What impressed the woman about one candidate?",opts:["Her salary expectations","Her language skills","Her experience and management background","Her educational qualifications"],c:2}]},

  {id:"p3_07",lines:[
      {s:"W",t:"The client wants the website redesign completed by March first."},
      {s:"M",t:"That's only six weeks away. We haven't even finalized the design concept."},
      {s:"W",t:"I know it's tight. Can we bring in a freelance designer to help?"},
      {s:"M",t:"Good idea. I'll reach out to the agency we used last time."}],
    qs:[
      {q:"What is the deadline for the project?",opts:["Next week","End of January","March first","June first"],c:2},
      {q:"What is the problem?",opts:["The client cancelled the project","The budget is too low","The timeline is very tight","The designer quit"],c:2},
      {q:"What solution does the woman suggest?",opts:["Asking for more time","Hiring a freelancer","Reducing the project scope","Using a template"],c:1}]},

  {id:"p3_08",lines:[
      {s:"M",t:"I'm heading to the airport now. My flight to Chicago leaves at 3:30."},
      {s:"W",t:"Don't forget you have a dinner with the client at seven. The restaurant is near your hotel."},
      {s:"M",t:"Right. And the meeting with their team is tomorrow morning at nine?"},
      {s:"W",t:"Yes, in their downtown office. I've emailed you the address and parking details."}],
    qs:[
      {q:"Where is the man going?",opts:["To a restaurant","To Chicago","To a meeting","To his hotel"],c:1},
      {q:"What time is the client dinner?",opts:["At 3:30","At 5:00","At 7:00","At 9:00"],c:2},
      {q:"What has the woman sent the man?",opts:["Flight tickets","The meeting agenda","The office address and parking info","The restaurant menu"],c:2}]},

  {id:"p3_09",lines:[
      {s:"W",t:"The new employee orientation is scheduled for Monday. Are the training materials ready?"},
      {s:"M",t:"Almost. I still need to update the section on company policies. There were some changes last quarter."},
      {s:"W",t:"Make sure you include the updated remote work guidelines. That's what new hires always ask about."},
      {s:"M",t:"Good point. I'll have everything printed by Friday afternoon."}],
    qs:[
      {q:"What is happening on Monday?",opts:["A board meeting","An employee orientation","A product launch","A company holiday"],c:1},
      {q:"What still needs to be updated?",opts:["The welcome video","The company policies section","The lunch menu","The office map"],c:1},
      {q:"What does the woman recommend including?",opts:["Salary information","Remote work guidelines","Health insurance details","Parking instructions"],c:1}]},

  {id:"p3_10",lines:[
      {s:"M",t:"I noticed the supply room is almost empty. We're low on paper, toner, and pens."},
      {s:"W",t:"I placed an order last Tuesday, but the supplier said there's a two-week backlog."},
      {s:"M",t:"Two weeks? That's too long. Can we find another supplier?"},
      {s:"W",t:"I'll look into it this afternoon and get quotes from at least two other companies."}],
    qs:[
      {q:"What is the problem?",opts:["Equipment is broken","Office supplies are running low","The supplier went bankrupt","The budget was cut"],c:1},
      {q:"Why hasn't the order arrived?",opts:["It was cancelled","The supplier has a backlog","The payment was declined","The address was wrong"],c:1},
      {q:"What will the woman do?",opts:["Wait for the current order","Cancel the order","Contact alternative suppliers","Buy supplies at a local store"],c:2}]},

  {id:"p3_11",lines:[
      {s:"W",t:"I see you applied for the project manager position in the Singapore office."},
      {s:"M",t:"Yes, I've always wanted to work abroad. And I have experience with the Asian market."},
      {s:"W",t:"The position requires fluency in Mandarin. Do you speak it?"},
      {s:"M",t:"I've been taking classes for the past year. I'd say I'm at an intermediate level now."}],
    qs:[
      {q:"What position has the man applied for?",opts:["Sales director","Financial analyst","Project manager","Marketing coordinator"],c:2},
      {q:"Where is the job located?",opts:["Tokyo","Hong Kong","Shanghai","Singapore"],c:3},
      {q:"What is the man's level of Mandarin?",opts:["Beginner","Intermediate","Fluent","He doesn't speak it"],c:1}]},

  {id:"p3_12",lines:[
      {s:"M",t:"The parking garage will be closed for repairs starting next Monday."},
      {s:"W",t:"For how long? I drive to work every day."},
      {s:"M",t:"About three weeks. But the company has arranged a temporary lot two blocks away."},
      {s:"W",t:"That's not ideal, but at least there's an alternative. Is there a shuttle?"},
      {s:"M",t:"Yes, it runs every ten minutes from the temporary lot to the main entrance."}],
    qs:[
      {q:"What will happen on Monday?",opts:["A new garage will open","The parking garage will close for repairs","Parking fees will increase","The shuttle service will end"],c:1},
      {q:"How long will the repairs take?",opts:["One week","Two weeks","Three weeks","A month"],c:2},
      {q:"How can employees get from the temporary lot to the office?",opts:["They can walk","A shuttle runs every ten minutes","Taxis are provided","A bus stops nearby"],c:1}]},

  {id:"p3_13",lines:[
      {s:"W",t:"Our customer satisfaction scores dropped five percent this quarter."},
      {s:"M",t:"That's concerning. Do we know which area was affected the most?"},
      {s:"W",t:"Response time. Customers are waiting too long for support."},
      {s:"M",t:"We should consider hiring additional support staff or implementing a chatbot."}],
    qs:[
      {q:"What happened to customer satisfaction?",opts:["It improved","It stayed the same","It decreased","It was not measured"],c:2},
      {q:"What is the main complaint?",opts:["Product quality","High prices","Slow response times","Complicated website"],c:2},
      {q:"What does the man suggest?",opts:["Raising prices","Adding support staff or a chatbot","Closing the support department","Sending a survey"],c:1}]},

  {id:"p3_14",lines:[
      {s:"M",t:"Excuse me, I'd like to return this printer. It stopped working after two days."},
      {s:"W",t:"I'm sorry about that. Do you have your receipt?"},
      {s:"M",t:"Yes, here it is. I bought it last Thursday."},
      {s:"W",t:"Since it's within our 30-day return policy, I can offer you a full refund or an exchange."}],
    qs:[
      {q:"Why is the man returning the printer?",opts:["It's the wrong model","It's too expensive","It stopped working","He doesn't need it anymore"],c:2},
      {q:"When did the man buy the printer?",opts:["Two days ago","Last Thursday","Last month","30 days ago"],c:1},
      {q:"What options does the woman offer?",opts:["A repair or a discount","A refund or an exchange","Store credit only","Free technical support"],c:1}]},

  {id:"p3_15",lines:[
      {s:"W",t:"The conference call with the London team is in 15 minutes. Is the equipment set up?"},
      {s:"M",t:"The video is working, but I'm having trouble with the audio. There's an echo."},
      {s:"W",t:"Try using the external microphone instead. It usually works better."},
      {s:"M",t:"Good idea. I'll switch it now."}],
    qs:[
      {q:"What is about to happen?",opts:["A staff lunch","A video conference","An office tour","A training session"],c:1},
      {q:"What is the technical problem?",opts:["The video is not working","The internet is down","There is an audio echo","The screen is too small"],c:2},
      {q:"What does the woman recommend?",opts:["Cancelling the call","Using a different microphone","Calling IT support","Moving to another room"],c:1}]},

  {id:"p3_16",lines:[
      {s:"M",t:"The architect sent over the revised floor plans for the new office."},
      {s:"W",t:"Did they include the extra meeting rooms we requested?"},
      {s:"M",t:"Yes, two small ones and one large conference room. But they removed the break room on the second floor."},
      {s:"W",t:"That's a dealbreaker. Everyone uses that break room. Ask them to revise it again."}],
    qs:[
      {q:"What did the architect send?",opts:["An invoice","Updated floor plans","A construction timeline","Photos of the building"],c:1},
      {q:"How many extra meeting rooms were added?",opts:["One","Two","Three","Four"],c:2},
      {q:"Why is the woman unhappy?",opts:["The cost is too high","The project is delayed","The break room was removed","The rooms are too small"],c:2}]},

  {id:"p3_17",lines:[
      {s:"W",t:"Our flight has been delayed by two hours. We won't land until 9 PM."},
      {s:"M",t:"That means we'll miss the welcome reception at the conference."},
      {s:"W",t:"I know. But at least we'll make it in time for tomorrow's keynote at 8 AM."},
      {s:"M",t:"I'll text the organizer and let them know we're arriving late."}],
    qs:[
      {q:"What is the problem?",opts:["The conference was cancelled","Their hotel lost the reservation","Their flight is delayed","They missed the keynote"],c:2},
      {q:"What will they miss?",opts:["The keynote speech","The welcome reception","The morning workshop","The closing ceremony"],c:1},
      {q:"What will the man do?",opts:["Book a different flight","Cancel the trip","Contact the organizer","Call the airline"],c:2}]},

  {id:"p3_18",lines:[
      {s:"M",t:"I think we should switch to a new accounting software. The current one is too slow."},
      {s:"W",t:"I agree, but migration is risky. What about the data from the last five years?"},
      {s:"M",t:"The new system can import our existing data automatically. I've already tested it."},
      {s:"W",t:"That's reassuring. Let's schedule a demo for the whole finance team next week."}],
    qs:[
      {q:"What does the man propose?",opts:["Hiring an accountant","Changing the accounting software","Reducing the IT budget","Outsourcing the finance department"],c:1},
      {q:"What is the woman concerned about?",opts:["The cost","The timeline","Data migration","Staff training"],c:2},
      {q:"What is the next step?",opts:["A team demo next week","An immediate switch","A meeting with IT","A cost analysis"],c:0}]},

  {id:"p3_19",lines:[
      {s:"W",t:"The health inspector is coming next Tuesday for our annual review."},
      {s:"M",t:"Already? I need to make sure the kitchen passes the cleanliness check."},
      {s:"W",t:"Last year we got a warning about the storage area. Let's not repeat that."},
      {s:"M",t:"I'll have the team do a deep clean this weekend."}],
    qs:[
      {q:"Where do the speakers most likely work?",opts:["In a hospital","In a restaurant","In a school","In a factory"],c:1},
      {q:"When is the inspection?",opts:["This weekend","Next Monday","Next Tuesday","Next month"],c:2},
      {q:"What happened last year?",opts:["They failed the inspection","They received a warning about storage","The kitchen was renovated","The inspector didn't show up"],c:1}]},

  {id:"p3_20",lines:[
      {s:"M",t:"I'd like to open a business checking account, please."},
      {s:"W",t:"Of course. Do you have your company registration documents with you?"},
      {s:"M",t:"Yes, I have everything here. I also need to set up online banking."},
      {s:"W",t:"We can do both today. The online access will be active within 24 hours."}],
    qs:[
      {q:"Where does this conversation take place?",opts:["At a law firm","At a bank","At a government office","At an accounting firm"],c:1},
      {q:"What does the man want to open?",opts:["A savings account","A personal account","A business checking account","A credit card"],c:2},
      {q:"When will online banking be available?",opts:["Immediately","Within 24 hours","In one week","After approval"],c:1}]},
	  // ═══════════════════════════════════════════════════════════
// NEW PART 3 CONVERSATIONS — p3_21 → p3_30
// Append these items inside the LISTENING_P3 array in listening.js
// (before the closing "];")
// Audio: public/audio/p3/{id}_line{i}.mp3
// ═══════════════════════════════════════════════════════════

  {id:"p3_21",lines:[
      {s:"M",t:"I just got the email — we're officially moving to the new office on the fifteenth."},
      {s:"W",t:"That's only two weeks away. Have the movers been booked?"},
      {s:"M",t:"Yes, but we need everyone to label their boxes by next Wednesday at the latest."},
      {s:"W",t:"I'll send a reminder to all departments this afternoon."}],
    qs:[
      {q:"When is the office move?",opts:["Next week","On the 15th","At the end of the month","On Wednesday"],c:1},
      {q:"What must employees do before the move?",opts:["Pack the furniture","Label their boxes","Choose their new desks","Cancel their meetings"],c:1},
      {q:"What will the woman do?",opts:["Book the movers","Label the boxes","Send a reminder","Postpone the move"],c:2}]},

  {id:"p3_22",lines:[
      {s:"W",t:"I've received a complaint from a client about the quality of the latest shipment."},
      {s:"M",t:"What exactly was the issue?"},
      {s:"W",t:"Several items arrived damaged. The packaging didn't have enough protective material."},
      {s:"M",t:"We should send replacements immediately and review our packaging process with the warehouse team."}],
    qs:[
      {q:"What is the problem?",opts:["A late delivery","Damaged items","Missing items","Wrong products"],c:1},
      {q:"What caused the damage?",opts:["A factory defect","Insufficient packaging","Rough handling by the courier","Extreme temperatures"],c:1},
      {q:"What does the man suggest doing first?",opts:["Contacting the courier","Offering a discount","Sending replacements","Changing the supplier"],c:2}]},

  {id:"p3_23",lines:[
      {s:"M",t:"I heard the company is introducing a new transport allowance for employees who use public transit."},
      {s:"W",t:"That's right. It's seventy-five dollars a month, starting in January."},
      {s:"M",t:"Does it apply to everyone, or just full-time staff?"},
      {s:"W",t:"Full-time employees only, but part-time staff can apply for a partial subsidy."}],
    qs:[
      {q:"What is the new benefit?",opts:["Free parking","A company car","A transport allowance","Flexible working hours"],c:2},
      {q:"How much is the allowance?",opts:["$57 a month","$75 a month","$175 a month","$70 a month"],c:1},
      {q:"Who is fully eligible?",opts:["All employees","Part-time staff only","Full-time employees","Managers only"],c:2}]},

  {id:"p3_24",lines:[
      {s:"W",t:"The IT department has scheduled a system upgrade for this Saturday from 6 AM to noon."},
      {s:"M",t:"So the network will be down for six hours? That's going to affect anyone working over the weekend."},
      {s:"W",t:"They've set up a temporary Wi-Fi network for basic email and browsing during the downtime."},
      {s:"M",t:"Good. I'll make sure my team saves everything to their local drives on Friday before they leave."}],
    qs:[
      {q:"When will the system upgrade take place?",opts:["Friday evening","Saturday morning","Sunday afternoon","Monday morning"],c:1},
      {q:"How long will the network be unavailable?",opts:["Two hours","Four hours","Six hours","Eight hours"],c:2},
      {q:"What alternative has been provided?",opts:["A backup server","A temporary Wi-Fi network","Printed copies of files","Remote desktop access"],c:1}]},

  {id:"p3_25",lines:[
      {s:"M",t:"Have you signed up for the leadership development program yet? Registration closes tomorrow."},
      {s:"W",t:"I was thinking about it, but isn't it only for senior managers?"},
      {s:"M",t:"No, they opened it up this year. Anyone with at least two years at the company can apply."},
      {s:"W",t:"Oh, that's great. I've been here for three years, so I'll register today."}],
    qs:[
      {q:"When does registration close?",opts:["Today","Tomorrow","Next week","Next month"],c:1},
      {q:"Who can participate in the program?",opts:["Only senior managers","New employees","Anyone with 2+ years at the company","All department heads"],c:2},
      {q:"How long has the woman worked at the company?",opts:["One year","Two years","Three years","Five years"],c:2}]},

  {id:"p3_26",lines:[
      {s:"W",t:"We need to finalize the catering for the annual company picnic next Saturday."},
      {s:"M",t:"How many people have confirmed so far?"},
      {s:"W",t:"About a hundred and forty, including employees and their families."},
      {s:"M",t:"Let's order for a hundred and sixty, just to be safe. We always get last-minute sign-ups."}],
    qs:[
      {q:"What event are they planning?",opts:["A board meeting","A product launch","A company picnic","A holiday party"],c:2},
      {q:"How many people have confirmed?",opts:["40","114","140","160"],c:2},
      {q:"How many servings does the man want to order?",opts:["140","150","160","200"],c:2}]},

  {id:"p3_27",lines:[
      {s:"M",t:"Welcome aboard! I'm James from HR. I'll be showing you around the office today."},
      {s:"W",t:"Thank you. I'm really excited to start. Where should I set up my workstation?"},
      {s:"M",t:"Your desk is on the third floor, near the marketing team. Your laptop and badge are already there."},
      {s:"W",t:"Perfect. Is there anything I need to complete before the team meeting at eleven?"}],
    qs:[
      {q:"What is happening in this conversation?",opts:["A job interview","A first day at work","A farewell party","A performance review"],c:1},
      {q:"Where is the woman's desk?",opts:["On the first floor","On the second floor","On the third floor","In the HR office"],c:2},
      {q:"What time is the team meeting?",opts:["At 9:00","At 10:00","At 11:00","At noon"],c:2}]},

  {id:"p3_28",lines:[
      {s:"W",t:"I've just finished the inventory count, and we're short two hundred units of the XT-500 model."},
      {s:"M",t:"Two hundred? That doesn't match the delivery records. The supplier confirmed the full order was shipped."},
      {s:"W",t:"I double-checked. It's possible some boxes were delivered to the wrong warehouse."},
      {s:"M",t:"I'll contact the logistics team right away and ask them to trace the shipment."}],
    qs:[
      {q:"What problem did the woman discover?",opts:["Damaged products","A billing error","Missing inventory","An expired shipment"],c:2},
      {q:"How many units are missing?",opts:["20","120","200","250"],c:2},
      {q:"What will the man do next?",opts:["Recount the inventory","Order new stock","Contact the logistics team","Return the shipment"],c:2}]},

  {id:"p3_29",lines:[
      {s:"M",t:"I submitted my travel expenses for the Tokyo trip two weeks ago, but I haven't been reimbursed yet."},
      {s:"W",t:"Let me check the system. It looks like your receipts for the hotel were flagged because the amount exceeded the daily limit."},
      {s:"M",t:"The hotel was more expensive because it was close to the conference venue. My manager approved the exception."},
      {s:"W",t:"In that case, I just need your manager's written approval. Once I have that, I can process it within three business days."}],
    qs:[
      {q:"What is the man's problem?",opts:["His flight was cancelled","His expenses haven't been reimbursed","He lost his receipts","His trip was denied"],c:1},
      {q:"Why were the hotel expenses flagged?",opts:["The receipts were missing","The hotel was not on the approved list","The amount was over the daily limit","The currency was wrong"],c:2},
      {q:"What does the woman need to process the claim?",opts:["New receipts","A different hotel booking","Written approval from the manager","A revised expense report"],c:2}]},

  {id:"p3_30",lines:[
      {s:"W",t:"Our office lease expires in September, and the landlord has offered us a renewal at a ten percent increase."},
      {s:"M",t:"Ten percent is quite steep. Have we looked at other locations?"},
      {s:"W",t:"I've visited two other buildings. One is cheaper but farther from the metro, and the other is similar in price."},
      {s:"M",t:"Let's negotiate with the current landlord first. We've been reliable tenants for five years — that should give us some leverage."}],
    qs:[
      {q:"When does the lease expire?",opts:["In June","In July","In September","In December"],c:2},
      {q:"How much would the rent increase?",opts:["5%","8%","10%","15%"],c:2},
      {q:"What does the man want to do first?",opts:["Move to a new building","Negotiate with the current landlord","Hire a real estate agent","Reduce office space"],c:1}]},
	  
{id:"p3_31",lines:[
    {s:"W",t:"Hi Marcus, I wanted to check in about the Henderson proposal. Are we still on track for the Friday deadline?"},
    {s:"M",t:"Honestly, I'm a bit worried. The finance team hasn't sent me their numbers yet, and I can't finalize the budget section without them."},
    {s:"W",t:"That's frustrating. Do you want me to escalate it to Diane? She can usually get things moving."},
    {s:"M",t:"Yes, please. If we don't have the figures by tomorrow morning, we'll have to push the submission to Monday."}],
  qs:[
    {q:"What is the main problem the man is facing?",opts:["He is waiting for data from another department","He missed a meeting with Diane","The proposal was rejected","He has too many projects"],c:0},
    {q:"What does the woman offer to do?",opts:["Write the budget section","Contact a manager for help","Extend the deadline","Reassign the project"],c:1},
    {q:"What will likely happen if the numbers don't arrive on time?",opts:["The proposal will be cancelled","Marcus will be replaced","The deadline will be delayed","Diane will take over"],c:2}]},
{id:"p3_32",lines:[
    {s:"M",t:"Good evening, I have a reservation for Petersen, party of four at seven thirty."},
    {s:"W",t:"Let me check... I'm sorry sir, I see your reservation but unfortunately we're running about twenty minutes behind schedule tonight."},
    {s:"M",t:"Oh, that's unfortunate. We actually have theater tickets for nine o'clock."},
    {s:"W",t:"In that case, let me speak to the manager. We may be able to seat you at the bar area immediately and send over complimentary appetizers while you wait."}],
  qs:[
    {q:"Why is there a delay at the restaurant?",opts:["A staff shortage","A kitchen problem","A reservation error","The restaurant is behind schedule"],c:3},
    {q:"What is the man concerned about?",opts:["The quality of the food","Making it to another event on time","The cost of the meal","Finding parking"],c:1},
    {q:"What does the woman propose?",opts:["Cancelling the reservation","Offering a free meal","Seating them elsewhere with a complimentary offer","Calling the theater"],c:2}]},
{id:"p3_33",lines:[
    {s:"W",t:"Welcome to the Grand Meridian. I have you down for a standard king room for three nights, is that correct?"},
    {s:"M",t:"Yes, but I was wondering if there's any chance of an upgrade. I'm here for our company's annual conference."},
    {s:"W",t:"Let me see what I can do. As a loyalty program member, I can actually offer you a junior suite for an additional thirty dollars per night."},
    {s:"M",t:"That sounds reasonable. I'll take it. Can you also add breakfast to the package?"}],
  qs:[
    {q:"What is the purpose of the man's visit?",opts:["A vacation","A family event","A business conference","A job interview"],c:2},
    {q:"Why is the man eligible for a discounted upgrade?",opts:["He booked early","He is paying in cash","He complained about the room","He is a loyalty member"],c:3},
    {q:"What does the man request at the end?",opts:["Breakfast included","A late checkout","A room change","Airport transport"],c:0}]},
{id:"p3_34",lines:[
    {s:"M",t:"Excuse me, I'm trying to find out what's happening with flight 447 to Frankfurt. The board still shows 'delayed' but no new time."},
    {s:"W",t:"I apologize for the confusion. We just received an update. Unfortunately, the aircraft has a mechanical issue and we're waiting for a replacement plane from Munich."},
    {s:"M",t:"How long are we talking about? I have a connection in Frankfurt at six."},
    {s:"W",t:"Realistically, at least four hours. I'd recommend visiting the rebooking desk at gate B12 to protect your connection."}],
  qs:[
    {q:"Why is the flight delayed?",opts:["Bad weather","A mechanical problem","Crew availability","Security issues"],c:1},
    {q:"What is the man worried about?",opts:["Missing a connecting flight","Getting a refund","Losing his luggage","Paying extra fees"],c:0},
    {q:"What does the woman suggest?",opts:["Waiting at the gate","Going to another airport","Cancelling the trip","Speaking to rebooking staff"],c:3}]},
{id:"p3_35",lines:[
    {s:"W",t:"Hi, I bought this jacket online last week, but the size doesn't fit. I'd like to exchange it for a medium."},
    {s:"M",t:"Of course. Do you have the original packaging and the receipt with you?"},
    {s:"W",t:"I have the receipt on my phone, but I threw out the box. Is that a problem?"},
    {s:"M",t:"Not at all, as long as the tags are still attached and the item is unworn. Let me just scan your digital receipt and we'll process the exchange."}],
  qs:[
    {q:"Why is the woman returning the jacket?",opts:["It's damaged","It's the wrong color","It doesn't fit","She changed her mind"],c:2},
    {q:"What does the woman not have with her?",opts:["The original box","The receipt","The jacket","Her ID"],c:0},
    {q:"What does the man need to check?",opts:["That she has a loyalty card","That the tags are attached","That the item is on sale","That she paid by card"],c:1}]},
{id:"p3_36",lines:[
    {s:"M",t:"Hello, I'd like to schedule a follow-up appointment with Dr. Chen, please. She asked me to come back in two weeks."},
    {s:"W",t:"Certainly. Dr. Chen's next available slot is actually on the twenty-second at ten fifteen. Does that work?"},
    {s:"M",t:"The twenty-second is a Thursday, right? I can't make mornings on Thursdays because of my work schedule."},
    {s:"W",t:"In that case, I can offer you Tuesday the twentieth at four thirty in the afternoon, or Friday the twenty-third at nine."}],
  qs:[
    {q:"Why does the man need an appointment?",opts:["For a new problem","For a follow-up visit","For a vaccination","For a prescription"],c:1},
    {q:"Why does the man reject the first option?",opts:["It's too expensive","It's too late","Dr. Chen isn't available","It conflicts with his work"],c:3},
    {q:"What does the woman do next?",opts:["Cancel the appointment","Transfer the call","Propose alternative times","Ask for insurance"],c:2}]},
{id:"p3_37",lines:[
    {s:"W",t:"Good morning. I'm interested in learning more about your small business loan options. I'm opening a bakery."},
    {s:"M",t:"Congratulations. We have several products designed for new businesses. The key factors will be your credit history, your business plan, and the amount you're looking to borrow."},
    {s:"W",t:"I'm estimating I'll need around sixty thousand dollars for equipment and initial inventory."},
    {s:"M",t:"That's well within our range. I'd suggest scheduling a longer consultation with one of our business advisors. I can book you in for Thursday afternoon if that works."}],
  qs:[
    {q:"What is the woman planning to do?",opts:["Expand an existing business","Refinance a loan","Invest in stocks","Open a new bakery"],c:3},
    {q:"How much money does the woman need?",opts:["Thirty thousand","Ninety thousand","Sixty thousand","One hundred thousand"],c:2},
    {q:"What does the man recommend?",opts:["Meeting with an advisor","Applying online","Waiting six months","Using a different bank"],c:0}]},
{id:"p3_38",lines:[
    {s:"M",t:"Before we start the line, I need everyone to review the updated safety protocols. There have been three near-misses this month."},
    {s:"W",t:"I noticed the new signage near station four. Is that related?"},
    {s:"M",t:"Exactly. Management decided we need clearer visual warnings around the conveyor belt. Also, hard hats are now mandatory in that zone, not just recommended."},
    {s:"W",t:"Got it. Should I brief the temp workers starting today, or will HR handle that?"}],
  qs:[
    {q:"Why are the safety protocols being updated?",opts:["Recent near-miss incidents","A government inspection","A workers' complaint","A new machine"],c:0},
    {q:"What has changed about hard hats?",opts:["They are now optional","They must be a new color","They will be provided for free","They are now required in a specific area"],c:3},
    {q:"What does the woman ask about?",opts:["Her own safety gear","Training responsibilities","The inspection date","Overtime pay"],c:1}]},
{id:"p3_39",lines:[
    {s:"W",t:"The booth setup is almost done, but we have a problem. The banners we ordered arrived with the wrong logo."},
    {s:"M",t:"You're kidding. The conference opens in less than eighteen hours. Can the printer redo them in time?"},
    {s:"W",t:"I already called. They can rush a new set for an additional four hundred dollars, delivered by seven tomorrow morning."},
    {s:"M",t:"Approve it. We cannot represent the company with the wrong branding. I'll explain the extra cost to finance later."}],
  qs:[
    {q:"What is the problem with the banners?",opts:["They are damaged","They have the wrong logo","They are too small","They arrived late"],c:1},
    {q:"How much will the rush order cost?",opts:["One hundred dollars","Eighteen hundred dollars","Four hundred dollars","Seven hundred dollars"],c:2},
    {q:"What does the man decide?",opts:["To approve the extra expense","To use the wrong banners anyway","To cancel the booth","To contact a different printer"],c:0}]},
{id:"p3_40",lines:[
    {s:"M",t:"Central Cab, how can I help you?"},
    {s:"W",t:"Hi, I need to book a pickup from 442 Oak Street to the airport for tomorrow morning. My flight is at nine fifteen."},
    {s:"M",t:"For a nine fifteen departure, I'd recommend a six thirty pickup. Traffic on the expressway can be unpredictable, especially on weekdays."},
    {s:"W",t:"That's earlier than I thought, but I'll trust your advice. Can I pay by card when the driver arrives?"}],
  qs:[
    {q:"Where does the woman need to go?",opts:["A hotel","The train station","The airport","A meeting"],c:2},
    {q:"Why does the man recommend an early pickup?",opts:["The driver is busy","The airport is far","It's cheaper","Traffic may cause delays"],c:3},
    {q:"What does the woman ask about?",opts:["The price","Payment methods","Luggage limits","The driver's name"],c:1}]},
{id:"p3_41",lines:[
    {s:"W",t:"This is the two-bedroom unit I mentioned. As you can see, the living room gets excellent natural light in the afternoon."},
    {s:"M",t:"It's lovely. What about the neighborhood? I work downtown and I'd prefer not to spend an hour commuting each way."},
    {s:"W",t:"The metro station is just a seven-minute walk, and it's about twenty minutes to the business district. There's also a supermarket on the corner."},
    {s:"M",t:"Perfect. And is the rent negotiable, or is the listing price firm?"}],
  qs:[
    {q:"What type of property is being shown?",opts:["A two-bedroom apartment","A studio","A three-bedroom house","An office space"],c:0},
    {q:"What is the man concerned about?",opts:["The size","The price","The commute","The noise"],c:2},
    {q:"What does the man ask at the end?",opts:["About parking","About utilities","About the lease length","About the rent price"],c:3}]},
{id:"p3_42",lines:[
    {s:"M",t:"IT Helpdesk, this is Raj. What seems to be the problem?"},
    {s:"W",t:"Hi Raj, it's Linda from accounting. The new expense software keeps freezing every time I try to upload a receipt."},
    {s:"M",t:"That's a known issue with the latest version. Have you tried clearing your browser cache?"},
    {s:"W",t:"I haven't. Honestly, I'm not entirely sure how to do that. Could you walk me through it, or should I bring my laptop to your office?"}],
  qs:[
    {q:"What problem is the woman having?",opts:["She lost her password","Her computer won't start","She can't print","Software keeps freezing"],c:3},
    {q:"What does the man suggest?",opts:["Restarting the computer","Clearing the browser cache","Buying new software","Calling the vendor"],c:1},
    {q:"What does the woman imply about herself?",opts:["She is not tech-savvy","She is an expert","She is in a hurry","She is working from home"],c:0}]},
{id:"p3_43",lines:[
    {s:"W",t:"Welcome to Apex Consulting. I'll be walking you through your first-day onboarding this morning."},
    {s:"M",t:"Thanks, I'm really excited to be here. Should I have brought anything specific with me today?"},
    {s:"W",t:"Your HR email mentioned a passport or ID card for the employment verification. Everything else, including your laptop and access badge, we'll provide."},
    {s:"M",t:"Great, I have my passport. What does the rest of the day look like?"}],
  qs:[
    {q:"What is the woman's role?",opts:["An onboarding representative","A new employee","A manager","A visitor"],c:0},
    {q:"What does the man need to provide?",opts:["A resume","An ID document","A laptop","References"],c:1},
    {q:"What will the company provide?",opts:["Training videos only","A parking space","Equipment and access","Meals"],c:2}]},
{id:"p3_44",lines:[
    {s:"M",t:"Let's review the Q3 campaign numbers. Overall engagement was up fifteen percent compared to Q2."},
    {s:"W",t:"That's great news, but I noticed the conversion rate on the email campaigns actually dropped slightly."},
    {s:"M",t:"You're right. The subject line testing we did mid-quarter may have been too aggressive. We lost some subscribers."},
    {s:"W",t:"For Q4, I'd suggest going back to a more conservative approach and focusing on personalization instead."}],
  qs:[
    {q:"What is the overall trend in Q3?",opts:["Engagement went down","No change","Not mentioned","Engagement went up"],c:3},
    {q:"What was the problem with the email campaigns?",opts:["They were too expensive","They weren't sent","Conversion rate decreased","Too few were sent"],c:2},
    {q:"What does the woman recommend for Q4?",opts:["More aggressive testing","A personalized approach","Cancelling email campaigns","Hiring a new agency"],c:1}]},
{id:"p3_45",lines:[
    {s:"W",t:"Hi, I'd like to place a catering order for a corporate meeting next Wednesday. We'll need coffee and pastries for about twenty people."},
    {s:"M",t:"No problem. Our corporate package includes two large carafes of coffee, plus a selection of pastries and fresh fruit. That runs about one hundred twenty dollars."},
    {s:"W",t:"Could we add some tea options as well? Not everyone drinks coffee."},
    {s:"M",t:"Absolutely. I'll add a selection of black, green, and herbal teas for an extra fifteen dollars. Should I deliver it around eight thirty?"}],
  qs:[
    {q:"How many people will attend the meeting?",opts:["Ten","Fifteen","Twenty","Twenty-five"],c:2},
    {q:"What does the woman want to add to the order?",opts:["Tea options","More pastries","Sandwiches","Juice"],c:0},
    {q:"What will the total likely include?",opts:["Only coffee","A full lunch","Just beverages","Coffee, pastries, fruit, and tea"],c:3}]},
{id:"p3_46",lines:[
    {s:"M",t:"I'm interested in signing up for a gym membership, but I wanted to ask about the different plans first."},
    {s:"W",t:"Of course. We have three tiers. The basic plan gives you gym access only, the standard adds group classes, and the premium includes personal training sessions."},
    {s:"M",t:"I'm mostly interested in the yoga and spin classes. Would the standard plan cover those?"},
    {s:"W",t:"Yes, all group classes including yoga and spin are included in the standard tier. It's currently fifty-five dollars a month."}],
  qs:[
    {q:"How many membership tiers are there?",opts:["Two","Three","Four","Five"],c:1},
    {q:"What classes is the man interested in?",opts:["Boxing and weights","Swimming","Personal training","Yoga and spin"],c:3},
    {q:"What plan will the man likely choose?",opts:["Standard","Basic","Premium","None"],c:0}]},
{id:"p3_47",lines:[
    {s:"W",t:"I need five hundred tri-fold brochures printed for a trade show next Friday. What are my options?"},
    {s:"M",t:"For that quantity, we can do either standard matte paper or a glossy premium finish. Standard is ninety cents per brochure, glossy is one dollar twenty."},
    {s:"W",t:"How long does each option take to produce?"},
    {s:"M",t:"Standard would be ready in two business days, glossy takes three. For a trade show, I'd honestly recommend the glossy. It looks far more professional under booth lighting."}],
  qs:[
    {q:"How many brochures does the woman need?",opts:["One hundred","Three hundred","Five hundred","One thousand"],c:2},
    {q:"What is the price of the glossy option per brochure?",opts:["Ninety cents","One dollar twenty","Two dollars","Fifty cents"],c:1},
    {q:"What does the man recommend?",opts:["The glossy finish","The standard finish","Cancelling the order","A faster delivery method"],c:0}]},
{id:"p3_48",lines:[
    {s:"M",t:"Hi, I reserved a compact car under the name Walker for a three-day rental."},
    {s:"W",t:"I see your reservation, Mr. Walker. Unfortunately, we're out of compact cars today. I can offer you a free upgrade to a mid-size sedan at no extra cost."},
    {s:"M",t:"That works for me. One question though: does the mid-size have better fuel economy? I'm driving to the coast and back."},
    {s:"W",t:"It's slightly less efficient, but we'll give you a full tank of gas included to compensate. It should be more than enough for a round trip."}],
  qs:[
    {q:"What was originally reserved?",opts:["A mid-size sedan","An SUV","A luxury car","A compact car"],c:3},
    {q:"Why is the man being offered an upgrade?",opts:["He is a loyal customer","His original car isn't available","He complained","It's a promotion"],c:1},
    {q:"What is the man concerned about?",opts:["The rental cost","Insurance","Fuel efficiency","Driving distance"],c:2}]},
{id:"p3_49",lines:[
    {s:"W",t:"Hi, I'm picking up a prescription for Martinez. I also wanted to ask about a flu shot while I'm here."},
    {s:"M",t:"Let me grab your prescription. For the flu shot, do you have a few minutes to wait? Our pharmacist can do it right now if you're free."},
    {s:"W",t:"Really? I thought I'd need an appointment. How much does it cost?"},
    {s:"M",t:"No appointment needed. With most insurance plans, it's fully covered. If you don't have coverage, it's twenty-five dollars."}],
  qs:[
    {q:"What is the woman picking up?",opts:["Medical supplies","Lab results","Vitamins","A prescription"],c:3},
    {q:"What additional service does she ask about?",opts:["A flu vaccination","A blood test","A consultation","A mask"],c:0},
    {q:"What does the man say about insurance?",opts:["It's not accepted","It needs to be verified","It usually covers the cost","It requires paperwork"],c:2}]},
{id:"p3_50",lines:[
    {s:"M",t:"Hi, I'm interested in the day pass for the coworking space. What does it include?"},
    {s:"W",t:"The day pass gives you access to any open desk, unlimited coffee, printing up to twenty pages, and one of our phone booths for private calls."},
    {s:"M",t:"Do I need to reserve a meeting room separately if I have a video call?"},
    {s:"W",t:"Phone booths are first-come-first-served and included. For larger meeting rooms, yes, you'd book those through our app for an additional fee."}],
  qs:[
    {q:"What is included in the day pass?",opts:["Only desk access","Desk, coffee, limited printing, and a phone booth","Meals and drinks","Overnight stays"],c:1},
    {q:"What does the man need for his video call?",opts:["Privacy","A laptop","A meeting room","Headphones"],c:0},
    {q:"How are larger meeting rooms reserved?",opts:["At the front desk","First-come-first-served","They aren't available","Via an app"],c:3}]}
];

// ─── PART 4 — Talks (20 talks, 60 questions) ───
// Audio: public/audio/p4/{id}.mp3

export var LISTENING_P4 = [
  {id:"p4_01",type:"Voicemail",voice:"W",
    text:"Hi, this is Karen from Summit Consulting. I'm calling to confirm our meeting on Wednesday at 10 AM. I've reserved conference room B at your office. Could you let me know if you need us to bring any presentation materials? Also, I'd like to add one more item to the agenda — we need to discuss the revised timeline. Please call me back at 555-0172. Thank you.",
    qs:[
      {q:"Who is the speaker?",opts:["A job applicant","A consultant","A delivery driver","A hotel receptionist"],c:1},
      {q:"When is the meeting?",opts:["Monday at 10","Tuesday at 2","Wednesday at 10","Friday at 3"],c:2},
      {q:"What does the speaker want to add to the agenda?",opts:["A budget review","The revised timeline","Staff introductions","A product demo"],c:1}]},

  {id:"p4_02",type:"Announcement",voice:"M",
    text:"Attention all passengers. Flight BA-247 to London Heathrow, originally scheduled for departure at 3:15 PM, has been delayed due to severe weather conditions. The new estimated departure time is 5:45 PM. We apologize for the inconvenience. Passengers are invited to visit the airline lounge on the second floor, where complimentary refreshments will be available. Please listen for further announcements.",
    qs:[
      {q:"What is the purpose of this announcement?",opts:["To announce a gate change","To inform about a flight delay","To welcome passengers on board","To advertise the airline lounge"],c:1},
      {q:"What caused the delay?",opts:["Mechanical issues","A security check","Severe weather","Staff shortage"],c:2},
      {q:"What is offered to passengers?",opts:["Seat upgrades","Free refreshments in the lounge","Full refunds","Hotel accommodation"],c:1}]},

  {id:"p4_03",type:"Meeting introduction",voice:"W",
    text:"Good morning, everyone. Thank you for coming to this month's all-hands meeting. Before we begin, I'd like to welcome two new team members who joined us last week: David Chen in engineering and Priya Sharma in product design. Please make them feel welcome. Now, the main topic today is our Q2 goals. As you know, we exceeded our Q1 targets, and I'd like to keep that momentum going.",
    qs:[
      {q:"What type of event is this?",opts:["A job interview","A training session","A company-wide meeting","A press conference"],c:2},
      {q:"How many new employees are introduced?",opts:["One","Two","Three","Four"],c:1},
      {q:"What happened in Q1?",opts:["Targets were missed","Targets were exceeded","The company downsized","New products launched"],c:1}]},

  {id:"p4_04",type:"Tour guide",voice:"M",
    text:"Welcome to the National Museum of Modern Art. Today's guided tour will last approximately 90 minutes and will cover the three main galleries on this floor. Photography is permitted, but please do not use flash, as it can damage the artwork. The gift shop and café are located on the ground floor and will remain open until 6 PM. Please stay with the group, and feel free to ask questions at any time.",
    qs:[
      {q:"Where is this announcement being made?",opts:["At a library","At a museum","At a university","At a theater"],c:1},
      {q:"How long will the tour last?",opts:["45 minutes","60 minutes","90 minutes","120 minutes"],c:2},
      {q:"What rule about photography is mentioned?",opts:["No photography allowed","Flash is not permitted","Only the gift shop may be photographed","Photos require a fee"],c:1}]},

  {id:"p4_05",type:"Training session",voice:"W",
    text:"Alright, let's get started with today's safety training. As warehouse employees, it's critical that you follow proper lifting techniques to avoid injury. Always bend at the knees, not at the waist. For items over 25 kilograms, use the mechanical lift or ask a colleague for help. I'll demonstrate the correct technique now, and then each of you will practice. Hard hats must be worn at all times in zones C and D.",
    qs:[
      {q:"What is the topic of this training?",opts:["Fire evacuation","Computer skills","Warehouse safety","Customer service"],c:2},
      {q:"What should workers do for items over 25 kg?",opts:["Carry them alone carefully","Use a mechanical lift or get help","Leave them for the next shift","Report them to the manager"],c:1},
      {q:"Where must hard hats be worn?",opts:["In all areas","Only outside","In zones C and D","In the break room"],c:2}]},

  {id:"p4_06",type:"Voicemail",voice:"M",
    text:"Hello, this is James Walker from Greenfield Property Management. I'm calling about the office space you inquired about on Park Avenue. The unit is 200 square meters with an open floor plan, and it's available from the first of next month. The monthly rent is $4,500, which includes utilities and one parking space. I'd love to schedule a viewing at your convenience. My number is 555-0398.",
    qs:[
      {q:"Why is the man calling?",opts:["To report a maintenance issue","To discuss an office rental","To confirm a meeting","To apply for a job"],c:1},
      {q:"What is included in the rent?",opts:["Furniture and internet","Cleaning and security","Utilities and one parking space","Reception and phone service"],c:2},
      {q:"When is the office available?",opts:["Immediately","Next week","First of next month","In three months"],c:2}]},

  {id:"p4_07",type:"News report",voice:"W",
    text:"In business news, TechVision Inc. announced today that it will open a new research center in Austin, Texas. The facility, which will employ over 300 engineers and scientists, is expected to be operational by next spring. The company's CEO stated that the Austin location was chosen for its strong talent pool and proximity to major universities. The investment is estimated at 150 million dollars.",
    qs:[
      {q:"What is TechVision Inc. planning to do?",opts:["Merge with another company","Close its headquarters","Open a research center","Launch a new product"],c:2},
      {q:"Why was Austin chosen?",opts:["Low taxes","Available talent and nearby universities","A new airport","Government incentives"],c:1},
      {q:"How much will the investment be?",opts:["15 million","50 million","150 million","300 million"],c:2}]},

  {id:"p4_08",type:"Advertisement",voice:"M",
    text:"Are you looking for a reliable delivery service for your business? FastTrack Logistics offers same-day delivery in the metropolitan area and next-day delivery nationwide. With real-time tracking and a 99.5 percent on-time rate, you can trust us with your most important shipments. New customers get 20 percent off their first month. Visit fasttracklogistics.com or call 1-800-555-FAST to get started today.",
    qs:[
      {q:"What service is being advertised?",opts:["Office cleaning","IT support","Delivery and logistics","Accounting services"],c:2},
      {q:"What is the company's on-time rate?",opts:["95%","97.5%","99%","99.5%"],c:3},
      {q:"What offer is available for new customers?",opts:["Free first delivery","20% off the first month","A free tracking device","No minimum order"],c:1}]},

  {id:"p4_09",type:"Announcement",voice:"W",
    text:"Attention shoppers. Riverside Mall will be closing in 30 minutes, at 9 PM. Please make your final purchases and proceed to the exits. The parking garage will remain accessible for one hour after closing. We'd like to remind you that our annual summer sale starts this Saturday, with discounts of up to 50 percent at participating stores. Thank you for visiting Riverside Mall.",
    qs:[
      {q:"What time does the mall close?",opts:["8:00 PM","8:30 PM","9:00 PM","9:30 PM"],c:2},
      {q:"How long will the parking garage stay open?",opts:["30 minutes after closing","One hour after closing","Until midnight","All night"],c:1},
      {q:"What is happening this Saturday?",opts:["A food festival","Extended hours","A summer sale","A grand reopening"],c:2}]},

  {id:"p4_10",type:"Recorded message",voice:"M",
    text:"Thank you for calling Greenwood Medical Center. Our office hours are Monday through Friday, 8 AM to 6 PM, and Saturday from 9 AM to 1 PM. If this is a medical emergency, please hang up and dial 911. To schedule an appointment, press 1. For billing inquiries, press 2. For prescription refills, press 3. To speak with a receptionist, please hold and your call will be answered in the order it was received.",
    qs:[
      {q:"What type of business is this?",opts:["A pharmacy","A medical center","An insurance company","A fitness center"],c:1},
      {q:"When is the office open on Saturday?",opts:["8 AM to 6 PM","9 AM to 1 PM","9 AM to 5 PM","It's closed"],c:1},
      {q:"What should callers press for an appointment?",opts:["1","2","3","0"],c:0}]},

  {id:"p4_11",type:"Company update",voice:"W",
    text:"I'm pleased to announce that starting next month, all full-time employees will be eligible for our new professional development program. The company will cover up to $2,000 per year for approved courses, certifications, or conferences. To apply, submit a request through the HR portal at least two weeks before the start date. Managers must approve all requests. This is a great opportunity to invest in your career growth.",
    qs:[
      {q:"What is being announced?",opts:["New health insurance","A professional development program","A salary increase","An office relocation"],c:1},
      {q:"How much funding is available per employee?",opts:["$500","$1,000","$1,500","$2,000"],c:3},
      {q:"How far in advance must requests be submitted?",opts:["One week","Two weeks","One month","Two months"],c:1}]},

  {id:"p4_12",type:"Tour guide",voice:"M",
    text:"We're now approaching the financial district, which is the heart of the city's business community. The tall glass building on your left is the headquarters of National Bank, one of the oldest financial institutions in the country, founded in 1852. Directly ahead is City Hall, built in the neoclassical style. We'll stop here for 15 minutes so you can take photos. Please be back on the bus by 2:30.",
    qs:[
      {q:"What kind of tour is this?",opts:["A museum tour","A factory tour","A city bus tour","A walking nature tour"],c:2},
      {q:"What is the tall glass building?",opts:["City Hall","A museum","A hotel","A bank headquarters"],c:3},
      {q:"How long is the photo stop?",opts:["5 minutes","10 minutes","15 minutes","30 minutes"],c:2}]},

  {id:"p4_13",type:"Voicemail",voice:"W",
    text:"Hi Mark, it's Lisa from the marketing team. I wanted to let you know that the print shop called about our brochures. They found a color mismatch on page three, so they've paused the job until we approve the correction. Could you take a look at the proof they emailed and give them the go-ahead? We need 5,000 copies by Thursday for the expo. Thanks.",
    qs:[
      {q:"Why is Lisa calling?",opts:["To request time off","To approve a budget","To ask about a printing issue","To invite Mark to a meeting"],c:2},
      {q:"What problem did the print shop find?",opts:["Wrong paper size","A spelling error","A color mismatch","Missing pages"],c:2},
      {q:"How many copies are needed?",opts:["500","1,000","2,500","5,000"],c:3}]},

  {id:"p4_14",type:"Instructions",voice:"M",
    text:"Before we begin today's workshop, let me go over a few logistics. Restrooms are down the hall to the left. We'll take a 15-minute break at 10:30 and a one-hour lunch break at noon. The cafeteria on the second floor serves hot meals until 1:30. All workshop materials are in the folders on your desks. Please make sure you have a name tag — if not, see me after this introduction.",
    qs:[
      {q:"What is the speaker doing?",opts:["Giving a keynote speech","Explaining workshop logistics","Conducting a job interview","Leading a fire drill"],c:1},
      {q:"When is the lunch break?",opts:["At 10:30","At 11:00","At noon","At 1:30"],c:2},
      {q:"What should attendees do if they don't have a name tag?",opts:["Go to the front desk","See the speaker after the introduction","Check their folder","Visit the cafeteria"],c:1}]},

  {id:"p4_15",type:"Advertisement",voice:"W",
    text:"Introducing CloudDesk Pro, the all-in-one workspace solution for modern teams. With CloudDesk, your team can collaborate on documents, manage projects, and hold video meetings — all from a single platform. No more switching between five different apps. Start your free 30-day trial today at clouddesk.com. Plans start at just $8 per user per month. CloudDesk Pro — work smarter, together.",
    qs:[
      {q:"What is being advertised?",opts:["A laptop","Office furniture","A workspace software platform","A coworking space"],c:2},
      {q:"How long is the free trial?",opts:["7 days","14 days","30 days","60 days"],c:2},
      {q:"What is the starting price?",opts:["$5 per user","$8 per user","$12 per user","$15 per user"],c:1}]},

  {id:"p4_16",type:"Announcement",voice:"M",
    text:"Good afternoon, everyone. I'd like to update you on the office renovation project. Phase one, which includes the reception area and the ground floor meeting rooms, has been completed ahead of schedule. Phase two — the open-plan workspace on the third floor — will begin next Monday and should take approximately four weeks. During this time, third-floor employees will be temporarily relocated to the fifth floor.",
    qs:[
      {q:"What has been completed?",opts:["The entire renovation","Phase one","Phase two","The parking garage"],c:1},
      {q:"Where is phase two taking place?",opts:["Ground floor","Second floor","Third floor","Fifth floor"],c:2},
      {q:"Where will affected employees work temporarily?",opts:["At home","On the ground floor","On the third floor","On the fifth floor"],c:3}]},

  {id:"p4_17",type:"Weather report",voice:"W",
    text:"Good morning. Here's your Tuesday weather forecast. We're looking at cloudy skies this morning with temperatures around 12 degrees Celsius. Rain is expected to move in by early afternoon, with heavier showers between 3 and 6 PM. Winds will pick up to 40 kilometers per hour by evening. Wednesday should be drier, with partly sunny skies returning. Don't forget your umbrella today!",
    qs:[
      {q:"What day is the forecast for?",opts:["Monday","Tuesday","Wednesday","Thursday"],c:1},
      {q:"When will the heaviest rain occur?",opts:["Early morning","Late morning","Between 3 and 6 PM","After midnight"],c:2},
      {q:"What is expected on Wednesday?",opts:["More rain","Snow","Partly sunny skies","Strong winds"],c:2}]},

  {id:"p4_18",type:"Recorded message",voice:"M",
    text:"Welcome to the Springfield Public Library automated system. The library is currently open. Today's hours are 9 AM to 8 PM. The book return drop box is available 24 hours a day at the main entrance. Please note that all overdue items must be returned by the end of this week to avoid additional fines. To renew a book, press 1 and enter your library card number. For event information, press 2.",
    qs:[
      {q:"What time does the library close today?",opts:["6 PM","7 PM","8 PM","9 PM"],c:2},
      {q:"When is the book drop box accessible?",opts:["During library hours only","Until 10 PM","24 hours a day","On weekdays only"],c:2},
      {q:"What must be done by the end of this week?",opts:["Library cards must be renewed","Overdue items must be returned","New members must register","Event tickets must be purchased"],c:1}]},

  {id:"p4_19",type:"Company update",voice:"W",
    text:"As many of you are aware, we've been reviewing our environmental policy over the past few months. I'm happy to announce three new initiatives starting in January. First, we're eliminating single-use plastics from all office kitchens. Second, we'll be installing electric vehicle charging stations in the parking garage. And third, employees who cycle to work will receive a monthly wellness bonus of $50. More details will follow by email.",
    qs:[
      {q:"What is the main topic?",opts:["New hiring plans","Environmental initiatives","Budget reductions","Office safety"],c:1},
      {q:"What is being removed from kitchens?",opts:["Microwaves","Coffee machines","Single-use plastics","Vending machines"],c:2},
      {q:"What benefit will cyclists receive?",opts:["Free bike repairs","A $50 monthly bonus","Priority parking","Extra vacation days"],c:1}]},

  {id:"p4_20",type:"Event introduction",voice:"M",
    text:"Ladies and gentlemen, thank you for joining us for the tenth annual Innovation Awards ceremony. Tonight we celebrate the most creative ideas and solutions from teams across the company. We received over 120 nominations this year, which is a new record. Before we announce the winners, I'd like to thank our sponsors, Meridian Technologies and GlobalBank, for making this event possible. Now, let's begin with the award for Best New Product.",
    qs:[
      {q:"What event is taking place?",opts:["A product launch","A shareholders' meeting","An awards ceremony","A retirement party"],c:2},
      {q:"How many nominations were received?",opts:["Over 50","Over 80","Over 100","Over 120"],c:3},
      {q:"What award is presented first?",opts:["Best Team","Employee of the Year","Best New Product","Innovation Leader"],c:2}]},
	  // ═══════════════════════════════════════════════════════════
// NEW PART 4 TALKS — p4_21 → p4_30
// Append these items inside the LISTENING_P4 array in listening.js
// (before the closing "];")
// Audio: public/audio/p4/{id}.mp3
// ═══════════════════════════════════════════════════════════

  {id:"p4_21",type:"Voicemail",voice:"W",
    text:"Hi, this is Angela from Westfield Insurance. I'm calling regarding your claim for the water damage in your office. I've reviewed the assessment report, and we can cover the repairs up to eighteen thousand dollars. However, the replacement of electronic equipment will require separate authorization. Could you send me a list of the damaged devices along with their purchase receipts? You can email them to claims@westfieldinsurance.com or fax them to 555-0241. I'll need those by next Friday to process the claim before the end of the quarter.",
    qs:[
      {q:"Why is Angela calling?",opts:["To sell insurance","About a damage claim","To schedule an inspection","To cancel a policy"],c:1},
      {q:"How much can be covered for repairs?",opts:["$8,000","$18,000","$80,000","$1,800"],c:1},
      {q:"What must the listener send?",opts:["A signed contract","Photos of the office","A list of damaged devices with receipts","An insurance application"],c:2}]},

  {id:"p4_22",type:"News report",voice:"M",
    text:"In local business news, the city council has approved a twenty-five-million-dollar plan to redevelop the waterfront district. The project, which is expected to take three years to complete, will include a new conference center, a public park, and a mixed-use commercial space with shops and restaurants. Construction is set to begin in September. Mayor Reeves said the redevelopment will create an estimated 800 permanent jobs and attract over a million visitors per year to the area.",
    qs:[
      {q:"What has the city council approved?",opts:["A new hospital","A waterfront redevelopment","A highway extension","A school renovation"],c:1},
      {q:"How long will the project take?",opts:["One year","Two years","Three years","Five years"],c:2},
      {q:"How many permanent jobs are expected?",opts:["80","180","800","8,000"],c:2}]},

  {id:"p4_23",type:"Training session",voice:"W",
    text:"Now that everyone has logged in to the new customer management system, let me walk you through the main features. On the left side of your screen, you'll see the client directory. You can search by name, company, or account number. When you open a client profile, their entire history — including calls, emails, and past orders — appears in the center panel. To add a note after a phone call, click the blue plus icon at the top right. It's important that every interaction is logged within 24 hours. Any questions so far?",
    qs:[
      {q:"What is being demonstrated?",opts:["An email program","A customer management system","A billing tool","A scheduling app"],c:1},
      {q:"Where is the client directory located on screen?",opts:["At the top","On the right side","On the left side","At the bottom"],c:2},
      {q:"When must interactions be logged?",opts:["Immediately","Within 24 hours","By the end of the week","Before the next meeting"],c:1}]},

  {id:"p4_24",type:"Announcement",voice:"M",
    text:"Attention all employees. Due to essential maintenance work on the building's electrical system, there will be a planned power outage this Sunday from 8 AM to 2 PM. All computers and sensitive equipment should be shut down and unplugged before leaving on Friday evening. The backup generators will provide emergency lighting during the outage, but elevators will not be operational. If you need to access the building on Sunday, please use the stairwells and bring a flashlight. Normal operations will resume on Monday morning.",
    qs:[
      {q:"When will the power outage occur?",opts:["Friday evening","Saturday morning","Sunday morning","Monday morning"],c:2},
      {q:"What should employees do before leaving Friday?",opts:["Lock their desks","Back up their files online","Shut down and unplug equipment","Notify their managers"],c:2},
      {q:"What will NOT work during the outage?",opts:["Emergency lights","Stairwells","Elevators","The main entrance"],c:2}]},

  {id:"p4_25",type:"Tour guide",voice:"W",
    text:"As we enter the east wing, you'll notice this gallery is devoted entirely to Impressionist paintings from the late nineteenth century. The collection was donated by the Harrison family in 1987 and includes works by several well-known French artists. The highlight of this room is the large landscape on the far wall, which was painted in 1893. Please note that this wing will close thirty minutes before the rest of the museum. Audio guides are available for rent at the information desk near the entrance for five dollars each.",
    qs:[
      {q:"What type of art is displayed in this gallery?",opts:["Modern sculpture","Renaissance art","Impressionist paintings","Abstract photography"],c:2},
      {q:"When was the collection donated?",opts:["1893","1978","1987","1997"],c:2},
      {q:"How much does an audio guide cost?",opts:["Free","$3","$5","$15"],c:2}]},

  {id:"p4_26",type:"Advertisement",voice:"M",
    text:"Tired of spending hours on payroll every month? Let SmartPay handle it for you. SmartPay is an automated payroll service designed for small and medium-sized businesses. We calculate taxes, process direct deposits, and generate year-end reports — all for a flat fee of $99 per month for up to fifty employees. Setup takes less than ten minutes, and our support team is available seven days a week. Visit smartpay.com and use the code SAVE20 to get your first three months at half price.",
    qs:[
      {q:"What service does SmartPay provide?",opts:["Office cleaning","Legal advice","Automated payroll","Employee recruitment"],c:2},
      {q:"What is the monthly fee for up to 50 employees?",opts:["$49","$59","$99","$199"],c:2},
      {q:"What does the discount code offer?",opts:["A free month","20% off for a year","Three months at half price","A full refund"],c:2}]},

  {id:"p4_27",type:"Recorded message",voice:"W",
    text:"Thank you for calling Clearview Medical Center. Our office hours are Monday through Friday, 8 AM to 6 PM, and Saturday from 9 AM to 1 PM. We are closed on Sundays and public holidays. If this is a medical emergency, please hang up and dial 911. To make or change an appointment, press 1. To request a prescription refill, press 2. To speak to the billing department, press 3. To hear these options again, press the star key. Please note that wait times may be longer than usual due to high call volume.",
    qs:[
      {q:"What are the Saturday hours?",opts:["8 AM to 6 PM","9 AM to 1 PM","9 AM to 5 PM","Closed"],c:1},
      {q:"What should callers do in an emergency?",opts:["Press 1","Stay on the line","Hang up and call 911","Visit the center"],c:2},
      {q:"Which button is for prescription refills?",opts:["1","2","3","Star key"],c:1}]},

  {id:"p4_28",type:"Company update",voice:"M",
    text:"I'm pleased to report that our customer retention rate has risen to 92 percent this year, up from 87 percent last year. This is largely thanks to the new loyalty program we launched in March, which now has over ten thousand active members. Our survey data shows that response time and product quality are the two factors customers value most. Looking ahead, we plan to introduce a premium membership tier in January that will include priority support and exclusive discounts. I'd like to thank the entire customer service team for their outstanding work this year.",
    qs:[
      {q:"What is the current customer retention rate?",opts:["78%","87%","92%","97%"],c:2},
      {q:"How many members does the loyalty program have?",opts:["Over 1,000","Over 5,000","Over 10,000","Over 100,000"],c:2},
      {q:"What is planned for January?",opts:["A price increase","A new loyalty program","A premium membership tier","A company restructuring"],c:2}]},

  {id:"p4_29",type:"Instructions",voice:"W",
    text:"Before we start the test, let me go over the examination rules. You have exactly 90 minutes to complete all sections. Please write your answers on the answer sheet using a number 2 pencil only. Pens and mechanical pencils are not accepted. Electronic devices, including phones and smartwatches, must be turned off and placed in the bag at the front of the room. You may not leave the room during the first 30 minutes. If you finish early, you may review your answers but please remain seated until the proctor collects your materials.",
    qs:[
      {q:"How long is the test?",opts:["60 minutes","75 minutes","90 minutes","120 minutes"],c:2},
      {q:"What must be used to mark the answer sheet?",opts:["A pen","A mechanical pencil","A number 2 pencil","A marker"],c:2},
      {q:"When may test-takers leave the room?",opts:["At any time","After 15 minutes","After 30 minutes","Only when the test ends"],c:2}]},

  {id:"p4_30",type:"Event introduction",voice:"M",
    text:"Good evening, and welcome to the twenty-third annual Hospitality Excellence Awards. We have over 400 guests here tonight, representing the finest hotels, restaurants, and travel companies in the region. This year, we received a record-breaking 250 nominations across 12 categories. I'd like to begin by recognizing our platinum sponsor, Pacific Coast Hotels, for their generous support. Before we present the awards, please enjoy a short video highlighting the achievements of this year's finalists. The first award tonight is for Outstanding Customer Experience.",
    qs:[
      {q:"What industry is this event for?",opts:["Technology","Hospitality","Healthcare","Finance"],c:1},
      {q:"How many nominations were received?",opts:["25","120","205","250"],c:3},
      {q:"What will happen before the awards are presented?",opts:["A keynote speech","Dinner is served","A video will be shown","A dance performance"],c:2}]},
	  
	{id:"p4_31",type:"Voicemail",voice:"W",
  text:"Hi David, it's Monica from Riverside Construction. I'm calling about the proposal you submitted last week for the Lakewood project. Our team reviewed it on Tuesday and we're very interested in moving forward, but we have a few questions about the timeline. Specifically, the six-week framing phase seems a bit optimistic given the current lumber supply situation. Could you give me a call back when you get a chance? I'll be in meetings most of tomorrow morning, but I'm free after two in the afternoon. My number is 555-0142. Thanks.",
  qs:[
    {q:"What is the purpose of the call?",opts:["To decline a proposal","To discuss a submitted proposal","To request a new bid","To cancel a project"],c:1},
    {q:"What concern does the speaker raise?",opts:["The budget is too high","A deadline seems unrealistic","The materials are wrong","The team is too small"],c:1},
    {q:"When does the speaker ask David to call back?",opts:["Tomorrow afternoon","Tomorrow morning","Tuesday","In two days"],c:0}]},
{id:"p4_32",type:"Announcement",voice:"M",
  text:"Attention all passengers on platform four. The eight forty-seven express service to Manchester Piccadilly has been delayed by approximately twenty minutes due to a signalling issue near Milton Keynes. Customers with onward connections from Manchester are advised to speak to a member of our customer service team, located near the main entrance, who can assist with rebooking. We apologize for the inconvenience and thank you for your patience. A further announcement will be made once we have an updated departure time.",
  qs:[
    {q:"Where is this announcement being made?",opts:["At an airport","At a bus station","At a train station","On a ferry"],c:2},
    {q:"Why is the service delayed?",opts:["Bad weather","A signalling problem","Driver shortage","A security alert"],c:1},
    {q:"What should passengers with connections do?",opts:["Wait on the platform","Return home","Buy new tickets online","Speak to customer service staff"],c:3}]},
{id:"p4_33",type:"Meeting introduction",voice:"W",
  text:"Good morning everyone, and thank you for joining today's quarterly review. Before we dive into the financial results, I want to acknowledge the marketing team for their outstanding work on the product launch last month. Sales exceeded our projections by eighteen percent. Today's agenda has three main items: we'll start with the Q3 financial overview, then move on to the new customer retention strategy, and finally we'll discuss the budget allocation for next quarter. I've asked Thomas to present the financial section, so I'll hand it over to him in just a moment.",
  qs:[
    {q:"What event is taking place?",opts:["A product launch","A training session","A quarterly review meeting","A job interview"],c:2},
    {q:"Why is the marketing team praised?",opts:["They exceeded sales projections","They saved money","They hired new staff","They won an award"],c:0},
    {q:"What will happen next?",opts:["The meeting will end","A break will be taken","The budget will be announced","Thomas will speak"],c:3}]},
{id:"p4_34",type:"Tour guide",voice:"M",
  text:"Welcome everyone to the Riverside Historic Brewery, one of the oldest operating breweries in the region. My name is James and I'll be your guide for the next forty-five minutes. Before we begin, a few safety notes: please stay with the group at all times, the floors can be slippery in the production areas, and flash photography is prohibited inside the fermentation hall. At the end of the tour, you'll have the opportunity to sample four of our seasonal beers in the tasting room. If anyone needs to use the restrooms, now would be a good time, as we won't have another break for about thirty minutes.",
  qs:[
    {q:"How long will the tour last?",opts:["Thirty minutes","Forty-five minutes","Sixty minutes","Two hours"],c:1},
    {q:"What is NOT allowed during the tour?",opts:["Flash photography","Talking","Taking notes","Wearing hats"],c:0},
    {q:"What will happen at the end?",opts:["A beer tasting","A lunch break","A gift shop visit","A question session"],c:0}]},
{id:"p4_35",type:"Training session",voice:"W",
  text:"Alright team, let's get started with today's customer service refresher. The main topic is handling difficult conversations, specifically complaint calls. Research shows that most escalated complaints could have been resolved in the first sixty seconds if the agent had used three key techniques: active listening, acknowledgment, and offering a clear next step. We'll be doing role-play exercises in pairs this afternoon, so please pay attention during the theory portion. There's a handout being passed around right now with the script templates we'll reference. Any questions before we start?",
  qs:[
    {q:"What is the main topic?",opts:["Sales techniques","Handling complaint calls","New product features","Team building"],c:1},
    {q:"How many key techniques are mentioned?",opts:["Two","Four","Three","Five"],c:2},
    {q:"What will participants do in the afternoon?",opts:["Watch a video","Take a test","Meet customers","Practice role-plays"],c:3}]},
{id:"p4_36",type:"News report",voice:"M",
  text:"In local business news, tech startup Brightwave Solutions announced yesterday that it will be opening a second office in downtown Austin, creating an estimated two hundred new jobs over the next eighteen months. The expansion comes after the company secured forty million dollars in Series B funding last quarter. CEO Rachel Kim stated that the Austin location will focus primarily on their enterprise software division. Hiring is expected to begin in early November, with positions available in engineering, sales, and customer support. Interested candidates can apply through the company website.",
  qs:[
    {q:"What is the news about?",opts:["A company expansion","A company closure","A merger","A lawsuit"],c:0},
    {q:"How many jobs will be created?",opts:["One hundred","Two hundred","Four hundred","Eighteen hundred"],c:1},
    {q:"When will hiring begin?",opts:["Immediately","In early November","Next year","After the new CEO starts"],c:1}]},
{id:"p4_37",type:"Advertisement",voice:"W",
  text:"Tired of losing track of your business expenses? Say hello to Ledgerly, the expense management app designed for freelancers and small business owners. With Ledgerly, you can snap a photo of any receipt and our smart technology automatically categorizes it for tax season. No more shoeboxes full of crumpled papers. Our users save an average of six hours per month on bookkeeping. Sign up today and get your first three months completely free, with no credit card required. Visit ledgerly dot com slash free to start. Offer ends this Sunday.",
  qs:[
    {q:"Who is the target audience?",opts:["Freelancers and small business owners","Large corporations","Accountants only","Students"],c:0},
    {q:"What does the app do automatically?",opts:["Files taxes","Categorizes receipts","Pays bills","Creates invoices"],c:1},
    {q:"What is the promotional offer?",opts:["A discount","A free gift","Free access for three months","A lifetime subscription"],c:2}]},
{id:"p4_38",type:"Instructions",voice:"M",
  text:"Okay everyone, gather around. Before we start the hands-on portion of the safety workshop, I need to walk you through the proper use of the harness system. First, always inspect the harness for any visible damage before putting it on. Second, the leg straps should be snug but not tight. Third, and most importantly, the chest strap must sit at sternum level, not on the stomach or on the neck. Finally, before climbing, always clip your lanyard to the designated anchor point and give it a firm tug to make sure it's locked. If you're unsure about any step, raise your hand and I'll come check.",
  qs:[
    {q:"What is being demonstrated?",opts:["How to use a harness","How to climb a ladder","How to repair equipment","How to lift heavy objects"],c:0},
    {q:"Where should the chest strap sit?",opts:["On the stomach","On the neck","At the sternum","At the waist"],c:2},
    {q:"What should participants do if unsure?",opts:["Keep trying","Ask a colleague","Read the manual","Raise their hand for help"],c:3}]},
{id:"p4_39",type:"Recorded message",voice:"W",
  text:"Thank you for calling Brighton Bank customer service. Please listen carefully as our menu options have recently changed. For account balances and recent transactions, press one. For transferring funds or making a payment, press two. To report a lost or stolen card, press three, or stay on the line and you will be connected to the next available representative. For online banking support, please visit our website at Brighton Bank dot com slash help. Our current estimated wait time is approximately fifteen minutes. Please note that for faster service, most common requests can be handled through our mobile app.",
  qs:[
    {q:"Why should callers listen carefully?",opts:["The menu has changed","The bank is closing","There is a promotion","The line is busy"],c:0},
    {q:"Which option reports a lost card?",opts:["One","Two","Three","Four"],c:2},
    {q:"What is the estimated wait time?",opts:["Five minutes","Fifteen minutes","Thirty minutes","One hour"],c:1}]},
{id:"p4_40",type:"Voicemail",voice:"M",
  text:"Hi Sarah, this is Michael from the design agency. I'm calling about the logo revisions we discussed on Monday. The team has finalized three new concepts based on your feedback, and I've just emailed them over to you. I'd really appreciate it if you could take a look before our Thursday meeting, since we want to lock in the direction before moving to the branding guide phase. Oh, and one more thing: we found a small typo in the tagline on the original version. It's already been fixed in the new concepts. Talk to you Thursday.",
  qs:[
    {q:"Why is Michael calling?",opts:["To cancel a meeting","To apologize","To provide an update on revisions","To request payment"],c:2},
    {q:"What does he ask Sarah to do?",opts:["Call him back","Review the concepts before Thursday","Come to his office","Send new feedback"],c:1},
    {q:"What mistake did the team find?",opts:["A wrong color","A typo in the tagline","A missing element","A wrong file format"],c:1}]},
{id:"p4_41",type:"Announcement",voice:"W",
  text:"Good afternoon shoppers, and welcome to Greenwood Market. As a friendly reminder, our store will be closing thirty minutes earlier than usual this evening, at eight o'clock, due to staff training. Please make your way to the checkout counters by seven forty-five to allow our team enough time to process your purchases. Additionally, our bakery section is currently offering all items at fifty percent off to reduce end-of-day waste. Take advantage of this offer before it's gone. Thank you for shopping with us, and we hope to see you again soon.",
  qs:[
    {q:"Why is the store closing early?",opts:["A holiday","Staff training","A power outage","Inventory check"],c:1},
    {q:"By what time should shoppers be at checkout?",opts:["Seven thirty","Seven forty-five","Eight o'clock","Eight fifteen"],c:1},
    {q:"What is on special offer?",opts:["Fresh produce","Dairy products","Bakery items","Frozen foods"],c:2}]},
{id:"p4_42",type:"News report",voice:"M",
  text:"In transportation news, the city council voted last night to approve funding for the long-awaited metro line extension. The new line will add six stations and connect the western suburbs to downtown, reducing average commute times by an estimated twenty minutes. Construction is scheduled to begin next spring and is expected to take approximately four years to complete. The total project cost is estimated at one point two billion dollars, funded through a combination of federal grants and a modest increase in local property taxes. Commuter advocacy groups have welcomed the decision.",
  qs:[
    {q:"What did the city council approve?",opts:["A new tax","A metro line extension","A bus route","A highway project"],c:1},
    {q:"How long will construction take?",opts:["One year","Two years","Four years","Six years"],c:2},
    {q:"How is the project being funded?",opts:["Grants and taxes","Private investment only","Donations","A lottery"],c:0}]},
{id:"p4_43",type:"Tour guide",voice:"W",
  text:"As we enter the main gallery, please take a moment to look up at the ceiling. Those frescoes were painted between 1612 and 1618 by the Italian master Giovanni Albertelli, and they depict scenes from classical mythology. The gallery itself houses over four hundred paintings from the Baroque period, and we're standing in front of one of the most famous pieces in the entire collection. Notice the dramatic use of light and shadow, a technique known as chiaroscuro. I'll give you a few minutes to explore on your own before we move to the sculpture wing.",
  qs:[
    {q:"Where is the tour taking place?",opts:["A church","An art museum","A palace","A library"],c:1},
    {q:"When were the ceiling frescoes painted?",opts:["In the early 1600s","In the 1700s","In the 1800s","In modern times"],c:0},
    {q:"What will the group do next?",opts:["Leave the building","Explore the gallery independently","Watch a film","Have lunch"],c:1}]},
{id:"p4_44",type:"Training session",voice:"M",
  text:"Welcome to the second module of our new hire orientation. This session focuses on our company's data security policies, which all employees must follow regardless of role. The three core principles are: never share your login credentials with anyone including colleagues, always lock your computer when you step away from your desk, and report any suspicious emails to the IT department immediately. Violations of these policies can result in disciplinary action, and in serious cases, termination. At the end of this session, you'll need to complete a short quiz to confirm your understanding.",
  qs:[
    {q:"Who is this session for?",opts:["IT specialists","Managers","New hires","External vendors"],c:2},
    {q:"What should employees do with suspicious emails?",opts:["Delete them","Forward them to a colleague","Reply to the sender","Report them to IT"],c:3},
    {q:"What will happen at the end?",opts:["A break","A quiz","A group discussion","A certificate ceremony"],c:1}]},
{id:"p4_45",type:"Advertisement",voice:"M",
  text:"Looking to transform your backyard into the entertaining space of your dreams? GreenScape Landscaping has been designing and building custom outdoor environments for over twenty-five years. From simple patio installations to full outdoor kitchens with pergolas and lighting, our award-winning team handles every project from concept to completion. Right now, we're offering free design consultations for all new customers, plus ten percent off any project booked before the end of October. Call us today at 555-0178 or visit greenscape landscaping dot com to schedule your consultation.",
  qs:[
    {q:"What service does the company offer?",opts:["Interior design","Roofing","Landscaping and outdoor construction","House cleaning"],c:2},
    {q:"How long has the company been in business?",opts:["Over twenty-five years","Over ten years","Over fifty years","Five years"],c:0},
    {q:"What is the current promotion?",opts:["A free gift","Free delivery","A free design consultation and a discount","Lifetime warranty"],c:2}]}  
];