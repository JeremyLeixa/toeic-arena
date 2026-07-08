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
  {id:"p1_44",img:"/images/p1/p1_44.jpg",c:1,
    opts:["A customer is paying at the counter.","A barista is preparing coffee at an espresso machine.","A waiter is wiping down a table.","A woman is drinking from a mug."],
    x:"The woman is operating the espresso machine to make coffee. (A) no customer is paying. (C) no table is being wiped. (D) she is not drinking."},
  {id:"p1_45",img:"/images/p1/p1_45.jpg",c:2,
    opts:["A chef is washing dishes in a sink.","A waiter is carrying plates to a table.","A chef is stirring food in a pan on a stove.","A man is chopping vegetables on a board."],
    x:"The chef is stirring food in a pan over the flame. (A) not washing dishes. (B) not carrying plates. (D) not chopping."},
  {id:"p1_46",img:"/images/p1/p1_46.jpg",c:0,
    opts:["A gardener is watering plants in a greenhouse.","A woman is picking fruit from a tree.","A worker is sweeping the floor.","Plants are being loaded onto a truck."],
    x:"The woman is watering potted plants with a watering can. (B) no fruit picking. (C) no sweeping. (D) nothing is being loaded."},
  {id:"p1_47",img:"/images/p1/p1_47.jpg",c:3,
    opts:["A man is vacuuming a carpet.","A worker is painting a wall.","A cleaner is emptying a trash can.","A worker is mopping the floor of a hallway."],
    x:"The cleaner is mopping the tiled corridor floor. (A) not vacuuming. (B) not painting. (C) not emptying a trash can."},
  {id:"p1_48",img:"/images/p1/p1_48.jpg",c:1,
    opts:["A woman is taking a photograph of the trees.","A woman is painting a picture on an easel outdoors.","A woman is sketching in a notebook.","A woman is hanging a painting on a wall."],
    x:"The woman is painting on an easel in the park. (A) not photographing. (C) not sketching in a notebook. (D) not hanging a painting."},
  {id:"p1_49",img:"/images/p1/p1_49.jpg",c:2,
    opts:["A man is erasing a whiteboard.","The colleagues are leaving the room.","A man is pointing at a chart on a whiteboard during a meeting.","A man is writing on a notepad."],
    x:"The man is pointing at a chart on the whiteboard while colleagues watch. (A) not erasing. (B) nobody is leaving. (D) not writing on a notepad."},
  {id:"p1_50",img:"/images/p1/p1_50.jpg",c:0,
    opts:["Two businesspeople are shaking hands.","Two people are signing a contract.","A man is handing over a document.","Two colleagues are looking at a computer."],
    x:"The two professionals are shaking hands. (B) not signing. (C) not handing a document. (D) not looking at a computer."},
  {id:"p1_51",img:"/images/p1/p1_51.jpg",c:3,
    opts:["The customers are paying the bill.","A waiter is taking an order.","The customers are looking at menus.","A waiter is serving a plate of food to customers."],
    x:"The waiter is placing a plate of food on the table. (A) nobody is paying. (B) not taking an order. (C) not reading menus."},
  {id:"p1_52",img:"/images/p1/p1_52.jpg",c:1,
    opts:["A nurse is giving an injection.","A doctor is examining a patient with a stethoscope.","A doctor is writing a prescription.","A patient is lying on a bed."],
    x:"The doctor is using a stethoscope on the seated patient. (A) no injection. (C) not writing a prescription. (D) the patient is not lying down."},
  {id:"p1_53",img:"/images/p1/p1_53.jpg",c:2,
    opts:["A worker is stacking boxes by hand.","A worker is sweeping the warehouse floor.","A worker is operating a forklift in a warehouse.","Boxes are being loaded onto a truck."],
    x:"The worker is driving a forklift that is lifting a pallet. (A) not stacking by hand. (B) not sweeping. (D) not loading a truck."},
  {id:"p1_54",img:"/images/p1/p1_54.jpg",c:0,
    opts:["Chairs have been arranged around a conference table.","People are seated at the table.","A presentation is being given.","The chairs are stacked against the wall."],
    x:"Chairs are neatly arranged around the empty table. (B) no one is seated. (C) no presentation. (D) the chairs are not stacked."},
  {id:"p1_55",img:"/images/p1/p1_55.jpg",c:3,
    opts:["A vendor is weighing produce.","Customers are shopping at the market.","The stall is being set up.","Fruits and vegetables are displayed at a market stall."],
    x:"Fruits and vegetables are arranged on display at the stall. (A) no vendor weighing. (B) no customers. (C) it is not being set up."},
  {id:"p1_56",img:"/images/p1/p1_56.jpg",c:1,
    opts:["A person is locking a bicycle.","Bicycles are parked in a row along a street.","The bicycles are being repaired.","A cyclist is crossing the street."],
    x:"Several bicycles are parked in a rack in a row. (A) nobody is locking one. (C) not being repaired. (D) no one is riding across the street."},
  {id:"p1_57",img:"/images/p1/p1_57.jpg",c:2,
    opts:["The train is departing the station.","Passengers are boarding a bus.","A train is stopped at a station platform.","A train is being cleaned."],
    x:"The train is stopped at the platform with passengers waiting. (A) it is not departing. (B) it is a train, not a bus. (D) it is not being cleaned."},
  {id:"p1_58",img:"/images/p1/p1_58.jpg",c:0,
    opts:["A bridge crosses over a river in a city.","Boats are sailing under the bridge.","The bridge is under construction.","People are walking across the bridge."],
    x:"A stone bridge spans the river between the city buildings. (B) no boats. (C) no construction. (D) no people are visible on it."}
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

  // ═══════════════════════════════════════════════════════════
  // P2 BATCH 4 — p2_126 → p2_175 (50 items, added 2026-05-04)
  // Voice rotation: 6 voices cycle by id mod 6 (Sarah/Adam/Canadian/British/VoiceA/VoiceB)
  // Generation script: scripts/generate-audio-p2-batch4.mjs (A./B./C. prefix included from start)
  // ═══════════════════════════════════════════════════════════

  {id:"p2_126",q:"When did the new packaging design get approved?",
    opts:["The marketing team designed it.","The packaging looks great in green.","About two weeks ago, I think."],
    c:2,x:"'When' asks for time. C gives a past timeframe. A and B describe the design but not when."},

  {id:"p2_127",q:"Where can I find the latest pricing sheet?",
    opts:["Prices went up last quarter.","It's in the shared folder under Sales.","I haven't sold anything this week."],
    c:1,x:"'Where' asks for a location. B gives the exact path. A and C are about prices/sales but not the file location."},

  {id:"p2_128",q:"Who designed the new website layout?",
    opts:["The website launched last Friday.","About thirty pages in total.","A freelance designer named Amir."],
    c:2,x:"'Who' asks for a person. C names them. A and B describe the website itself."},

  {id:"p2_129",q:"What's the agenda for tomorrow's call?",
    opts:["I'll send it to you this evening.","The call lasted forty minutes.","It's an internal meeting."],
    c:0,x:"Direct request hidden in a question. A commits to action. B is past tense (wrong context). C describes the type but not the agenda."},

  {id:"p2_130",q:"Why did the supplier cancel the shipment?",
    opts:["The shipment was supposed to arrive Tuesday.","They had a production issue at the factory.","I'll find another supplier soon."],
    c:1,x:"'Why' asks for a reason. B gives one. A is the original schedule, C is a future plan."},

  {id:"p2_131",q:"How long will the renovation take?",
    opts:["The renovation cost a lot.","We hired a great contractor.","About six weeks if there are no delays."],
    c:2,x:"'How long' asks for a duration. C gives one with a caveat. A talks cost, B talks contractor."},

  {id:"p2_132",q:"Could you forward me the budget spreadsheet?",
    opts:["Sure, I'll send it right away.","The budget was approved.","Spreadsheets are easy to make."],
    c:0,x:"Polite request. A confirms with action. B is unrelated past info. C is a generic comment."},

  {id:"p2_133",q:"Have you spoken to the legal team about the contract?",
    opts:["The contract is twenty pages long.","Legal is on the third floor.","I'll do it after lunch."],
    c:2,x:"Y/N question. C answers indirectly with a future commitment. A and B describe the contract/location."},

  {id:"p2_134",q:"The training session is on Wednesday, isn't it?",
    opts:["Actually, it was moved to Thursday.","The trainer is excellent.","I attended the last one."],
    c:0,x:"Tag question. A corrects the day (natural indirect answer). B and C are tangential."},

  {id:"p2_135",q:"Haven't you received the updated invoice yet?",
    opts:["The invoice was for fifteen hundred dollars.","No, I'll check my spam folder.","Yes, the invoices are colorful."],
    c:1,x:"Negative Y/N. B gives a natural answer + action. A and C are off-topic."},

  {id:"p2_136",q:"Should we hold the meeting in person or by video call?",
    opts:["The meeting room has a projector.","Video call would save everyone time.","The meeting was very productive."],
    c:1,x:"Choice question. B picks an option with reasoning. A talks equipment, C is past tense."},

  {id:"p2_137",q:"Where is the staff parking located?",
    opts:["Parking is free for employees.","I usually take the bus.","Behind the main building, near gate B."],
    c:2,x:"'Where' asks for a location. C gives precise directions. A talks cost, B talks personal commute."},

  {id:"p2_138",q:"When is your team's deadline for the report?",
    opts:["Friday afternoon at the latest.","The report has fifty pages.","We finished early last time."],
    c:0,x:"'When' asks for time. A gives a deadline. B describes the report, C is past tense."},

  {id:"p2_139",q:"The conference room projector isn't working again.",
    opts:["The projector was new last year.","The conference is on Tuesday.","I'll call IT support right now."],
    c:2,x:"Statement of a problem. C offers a solution (most helpful response). A and B are tangential facts."},

  {id:"p2_140",q:"Who handles invoice approvals at your firm?",
    opts:["The invoices are paid online.","Mr. Lambert in finance signs them.","We process about a hundred a month."],
    c:1,x:"'Who' asks for a person. B names them with role. A and C describe the process volume."},

  {id:"p2_141",q:"Why don't we try the new Italian restaurant for the team lunch?",
    opts:["The team has twelve people now.","I had Italian food yesterday.","That's a great idea, I'll book a table."],
    c:2,x:"Suggestion. C accepts and acts. A and B are tangential."},

  {id:"p2_142",q:"What time does the airport shuttle leave the hotel?",
    opts:["Every thirty minutes from 5 AM to midnight.","The hotel is very comfortable.","I always travel light."],
    c:0,x:"'What time' asks for schedule. A gives frequency + range. B and C are unrelated."},

  {id:"p2_143",q:"Was the parking permit included in your application?",
    opts:["I parked on Level 2 this morning.","Yes, it was attached as a PDF.","The permit costs fifty dollars."],
    c:1,x:"Y/N question. B confirms + adds detail. A talks personal parking, C is the cost."},

  {id:"p2_144",q:"How many candidates passed the technical assessment?",
    opts:["The assessment lasted three hours.","Technology is changing fast these days.","Six out of fifteen made it through."],
    c:2,x:"'How many' asks for a number. C gives the ratio. A talks duration, B is generic."},

  {id:"p2_145",q:"You're presenting at the kickoff next week, aren't you?",
    opts:["Yes, on Monday morning.","The presentation has thirty slides.","Kickoffs are always exciting."],
    c:0,x:"Tag question. A confirms with timing. B and C are tangential."},

  {id:"p2_146",q:"Why is the office so quiet today?",
    opts:["The office has good acoustics.","Quiet helps me focus better.","Most of the team is on a client visit."],
    c:2,x:"'Why' asks for a reason. C explains the absence. A and B are unrelated personal observations."},

  {id:"p2_147",q:"When will the new hire start?",
    opts:["We hired him just last week.","The first Monday of next month.","New hires get a welcome kit."],
    c:1,x:"'When' asks for the start date. B gives a precise date. A is the hiring date, C is a process detail."},

  {id:"p2_148",q:"Did you reserve the conference room for tomorrow?",
    opts:["The conference is in Brussels next year.","I prefer smaller meeting rooms.","Yes, from 9 to 11 AM."],
    c:2,x:"Y/N question. C confirms with the slot. A and B are unrelated."},

  {id:"p2_149",q:"Would you rather work from the office or from home on Mondays?",
    opts:["Home, if it's possible.","Mondays are usually quiet.","I work fifty hours a week."],
    c:0,x:"Choice question. A picks an option. B and C are unrelated."},

  {id:"p2_150",q:"The printer on the second floor keeps running out of toner.",
    opts:["I'll order more cartridges today.","The printer was installed in March.","Second floor has the best view."],
    c:0,x:"Statement of recurring problem. A offers a fix. B and C are tangential."},

  {id:"p2_151",q:"Where should I send the signed agreement?",
    opts:["The agreement covers two years.","I signed it this morning.","Email it to contracts@ourfirm.com."],
    c:2,x:"'Where' asks for a destination. C gives the email. A talks duration, B talks signing."},

  {id:"p2_152",q:"Who's organizing the year-end party this year?",
    opts:["The party was great last year.","The HR committee is in charge.","I'll bring some cookies."],
    c:1,x:"'Who' asks for organizers. B names them. A is past, C is a personal contribution."},

  {id:"p2_153",q:"How did the client feel about the proposal?",
    opts:["The client is based in Lyon.","They were enthusiastic about the timeline.","Proposals always take time to write."],
    c:1,x:"'How' asks about reaction. B reports it. A is location, C is a generic remark."},

  {id:"p2_154",q:"Could you let me know when the package arrives?",
    opts:["The package weighs three kilos.","I love unboxing packages.","Of course, I'll text you straight away."],
    c:2,x:"Polite request. C confirms with the channel. A and B are unrelated."},

  {id:"p2_155",q:"Mr. Okafor leaves the office at six every day, doesn't he?",
    opts:["Usually, but he stayed late yesterday.","He's a senior manager.","Six is a good time to leave."],
    c:0,x:"Tag question. A nuances the assumption. B and C are off-topic."},

  {id:"p2_156",q:"Aren't you going to the workshop next week?",
    opts:["The workshop covers leadership skills.","I have a client meeting that day.","Workshops are usually informative."],
    c:1,x:"Negative Y/N. B explains absence indirectly. A and C are generic facts."},

  {id:"p2_157",q:"What's the best way to reach the IT helpdesk after hours?",
    opts:["IT is on the fourth floor.","They were very helpful yesterday.","There's an emergency phone line on the intranet."],
    c:2,x:"'What's the best way' asks for a method. C gives the channel. A and B are unrelated."},

  {id:"p2_158",q:"When did the office relocate to this building?",
    opts:["About eighteen months ago.","We're now on the seventh floor.","The building has fast elevators."],
    c:0,x:"'When' asks for the move date. A gives an approximate timeframe. B and C describe the building."},

  {id:"p2_159",q:"I'd like to schedule a meeting with the regional director.",
    opts:["The director is from Madrid.","I can check her calendar for Thursday.","Meetings can be tiring sometimes."],
    c:1,x:"Request. B offers a concrete next step. A and C are unrelated."},

  {id:"p2_160",q:"Would you prefer a window seat or an aisle seat for the flight?",
    opts:["The flight is six hours long.","I usually fly economy class.","An aisle seat, so I can stretch."],
    c:2,x:"Choice question. C picks with reasoning. A and B are tangential."},

  {id:"p2_161",q:"How was the supplier audit yesterday?",
    opts:["Better than expected, only minor issues.","The audit took three full hours.","We have several reliable suppliers."],
    c:0,x:"'How was' asks for the outcome. A gives an evaluation. B is duration, C is generic."},

  {id:"p2_162",q:"Why was the launch event postponed again?",
    opts:["The event was held downtown last time.","The keynote speaker had a conflict.","Launches are always exciting moments."],
    c:1,x:"'Why' asks for a reason. B explains. A is past location, C is generic."},

  {id:"p2_163",q:"Has the design team finalized the brand guidelines?",
    opts:["The design team has eight people.","Brands need to evolve over time.","They sent the final version yesterday."],
    c:2,x:"Y/N question. C confirms with timing. A and B are tangential."},

  {id:"p2_164",q:"You completed the compliance training, didn't you?",
    opts:["Yes, last Thursday afternoon.","Compliance training is mandatory.","The training was three hours long."],
    c:0,x:"Tag question. A confirms with timing. B and C are generic facts about training."},

  {id:"p2_165",q:"Where do we keep the company's spare laptops?",
    opts:["We have about ten spare ones.","In the locked cabinet in the IT office.","Laptops should be charged daily."],
    c:1,x:"'Where' asks for a location. B gives it precisely. A is quantity, C is generic advice."},

  {id:"p2_166",q:"What kind of feedback did the survey reveal?",
    opts:["The survey went out last month.","Surveys are useful management tools.","Mostly positive, with concerns about workload."],
    c:2,x:"'What kind' asks for the type/content. C summarizes. A is timing, B is generic."},

  {id:"p2_167",q:"These quarterly numbers look really promising.",
    opts:["Numbers can sometimes be misleading.","I agree, especially the European market.","Quarters move very quickly these days."],
    c:1,x:"Statement of opinion. B agrees + adds specifics. A and C are tangential."},

  {id:"p2_168",q:"How often does the cleaning crew come in?",
    opts:["Twice a week, on Tuesdays and Fridays.","The crew has six members.","Cleaning supplies are in the closet."],
    c:0,x:"'How often' asks for frequency. A gives both frequency and days. B and C are tangential."},

  {id:"p2_169",q:"Wasn't the deadline supposed to be Friday?",
    opts:["Friday is a holiday this week.","I usually meet my deadlines.","It got extended to next Tuesday."],
    c:2,x:"Negative Y/N. C corrects with new info. A is partial info, B is generic."},

  {id:"p2_170",q:"Who's covering the front desk during Mei's vacation?",
    opts:["Mei is going to Japan for ten days.","Sarah will handle it for the two weeks.","The front desk is busy on Mondays."],
    c:1,x:"'Who' asks for a person. B names them with duration. A is about Mei, C is unrelated."},

  {id:"p2_171",q:"Would you mind keeping the volume down a bit?",
    opts:["Sorry, I'll use my headphones.","The volume is at level seven.","The music is really great."],
    c:0,x:"Polite request (mind = is it OK if). A apologizes + acts. B and C are tangential."},

  {id:"p2_172",q:"When can we expect the survey results?",
    opts:["The survey had thirty questions.","Surveys are completely anonymous.","The analysis should be ready by Wednesday."],
    c:2,x:"'When' asks for timing. C gives a deadline. A and B describe the survey itself."},

  {id:"p2_173",q:"Should I bring printed copies or send the slides digitally?",
    opts:["The slides have great visuals.","Digital is better, less paper waste.","I designed them last night."],
    c:1,x:"Choice question. B picks with reasoning. A and C are tangential."},

  {id:"p2_174",q:"The Wi-Fi keeps disconnecting in the back conference room.",
    opts:["IT is upgrading the router this weekend.","Wi-Fi is usually reliable in our building.","The conference room seats twenty people."],
    c:0,x:"Statement of recurring problem. A reports an upcoming fix. B and C are tangential."},

  {id:"p2_175",q:"How about we postpone the staff briefing to next Monday?",
    opts:["The briefing covers Q2 goals.","Mondays are tough days for everyone.","That works, I'll update everyone now."],
    c:2,x:"Suggestion. C agrees + commits to action. A and B are tangential."},
  {id:"p2_176",q:"You've already submitted the quarterly report, haven't you?",
    opts:["Yes, I sent it this morning.","Please report to the manager.","A brand-new tablet."],
    c:0,x:"Tag question expecting confirmation. A confirms. B repeats 'report' as a trap; C is unrelated."},
  {id:"p2_177",q:"The staff meeting starts at ten, doesn't it?",
    opts:["No, it was moved to eleven.","Let's meet in the lobby.","On the tenth floor."],
    c:0,x:"Tag question. A corrects the time. B and C play on 'meet' and 'ten' as sound traps."},
  {id:"p2_178",q:"You aren't leaving already, are you?",
    opts:["I'm afraid I have another appointment.","Leave it on my desk.","Yes, it's a lovely day."],
    c:0,x:"Negative tag question. A explains the early departure. B repeats 'leave'; C is off-topic."},
  {id:"p2_179",q:"This printer isn't working again, is it?",
    opts:["It ran out of toner this morning.","Print two copies, please.","In the supply room."],
    c:0,x:"Negative tag question. A explains the problem. B and C are unrelated instructions/locations."},
  {id:"p2_180",q:"Didn't the client confirm the order yesterday?",
    opts:["Yes, the confirmation arrived last night.","Please order more supplies.","At the front counter."],
    c:0,x:"Negative question. A confirms. B repeats 'order'; C answers 'where'."},
  {id:"p2_181",q:"Isn't the conference room booked for two o'clock?",
    opts:["Actually, it's free until three.","Book a flight to Tokyo.","The room has a projector."],
    c:0,x:"Negative question. A corrects the assumption. B repeats 'book'; C is a tangential detail."},
  {id:"p2_182",q:"Won't you join us for lunch later?",
    opts:["I'd be glad to, thank you.","Lunch was delicious.","Just around the corner."],
    c:0,x:"Negative question used as an invitation. A accepts. B and C misread it as about the food/place."},
  {id:"p2_183",q:"Aren't these figures due today?",
    opts:["No, the deadline is Friday.","Six figures, roughly.","In the finance department."],
    c:0,x:"Negative question. A corrects the deadline. B and C play on 'figures' and department."},
  {id:"p2_184",q:"Would you like the report by email or in print?",
    opts:["Email is fine, thank you.","Yes, please go ahead.","It was very detailed."],
    c:0,x:"Alternative question — pick one option, don't answer yes/no. A chooses email. B/C are invalid responses."},
  {id:"p2_185",q:"Should I call the supplier or send an email?",
    opts:["A phone call would be quicker.","The supplier is very reliable.","No, thank you."],
    c:0,x:"Alternative question. A selects one option. B comments on the supplier; C is a yes/no answer, which doesn't fit."},
  {id:"p2_186",q:"Do you want to meet on Monday or Tuesday?",
    opts:["Tuesday works better for me.","Yes, let's meet soon.","In the main office."],
    c:0,x:"Alternative question. A chooses a day. B answers yes/no (invalid); C answers 'where'."},
  {id:"p2_187",q:"Is the training in the morning or the afternoon?",
    opts:["It's scheduled for the afternoon.","The training went very well.","Yes, it is."],
    c:0,x:"Alternative question. A picks a time. B refers to a past session; C is an invalid yes/no reply."},
  {id:"p2_188",q:"Could you tell me where the orientation is being held?",
    opts:["In conference room B, on the second floor.","The orientation lasted two hours.","She joined the company last week."],
    c:0,x:"Indirect question asking 'where'. A gives a location. B answers 'how long'; C is unrelated."},
  {id:"p2_189",q:"Do you know when the shipment is expected to arrive?",
    opts:["Sometime before noon tomorrow.","By express courier.","About three hundred boxes."],
    c:0,x:"Indirect question asking 'when'. A gives a time. B answers 'how'; C answers 'how many'."},
  {id:"p2_190",q:"I think we should postpone the product launch.",
    opts:["I agree — it isn't quite ready.","Launch it right away.","The park is nearby."],
    c:0,x:"Statement inviting a response. A agrees with a reason. B contradicts the intent; C is off-topic."},
  {id:"p2_191",q:"Could you help me set up the projector for the meeting?",
    opts:["Sure, I'll be right there.","In the conference room.","It was a great presentation."],
    c:0,x:"Request for help. A agrees to come. B answers 'where'; C is an unrelated comment."},
  {id:"p2_192",q:"Would you mind closing the window? It's a bit cold.",
    opts:["A window seat, please.","Not at all.","The weather is nice today."],
    c:1,x:"Polite request. 'Not at all' means 'yes, I'll close it'. A and C are sound/word traps."},
  {id:"p2_193",q:"Can I get you anything from the coffee shop?",
    opts:["The shop closes at six.","I paid by card.","A latte would be great, thanks."],
    c:2,x:"Offer. A accepts and names an item. A and B are unrelated details."},
  {id:"p2_194",q:"Why don't we reschedule the call for tomorrow?",
    opts:["That works for me.","He called twice.","On the phone."],
    c:0,x:"Suggestion. A agrees. B and C are traps on 'call'."},
  {id:"p2_195",q:"Do you mind if I take Friday off?",
    opts:["I took the train.","That should be fine.","Friday's report is ready."],
    c:1,x:"Permission request. B grants it. A and C are word traps on 'took'/'Friday'."},
  {id:"p2_196",q:"Shall I forward you the meeting notes?",
    opts:["The meeting ran late.","In the shared folder.","Yes, please do."],
    c:2,x:"Offer. C accepts. A and B are unrelated."},
  {id:"p2_197",q:"I can't find the file you sent me yesterday.",
    opts:["Let me resend it now.","I filed the report.","Yesterday afternoon."],
    c:0,x:"Statement of a problem. A offers to fix it. B and C trap on 'file'/'yesterday'."},
  {id:"p2_198",q:"This report is due by the end of the day.",
    opts:["It's a very detailed report.","I'll finish it right away.","At the front desk."],
    c:1,x:"Statement of a deadline. B commits to act. A and C are off-topic."},
  {id:"p2_199",q:"The printer on the third floor is out of order again.",
    opts:["Print three copies, please.","On the second floor.","I'll call maintenance."],
    c:2,x:"Problem report. C will act. A and B trap on 'print'/'floor'."},
  {id:"p2_200",q:"We're running low on printer paper.",
    opts:["I'll order some more.","It's a good quality paper.","In the supply closet."],
    c:0,x:"Statement of a shortage. A will reorder. B and C are unrelated."},
  {id:"p2_201",q:"I think the presentation went really well.",
    opts:["Present it tomorrow.","Yes, the client seemed impressed.","In the main hall."],
    c:1,x:"Opinion. B agrees and adds detail. A and C trap on 'present'."},
  {id:"p2_202",q:"It's already five o'clock.",
    opts:["It's on the fifth floor.","A brand-new clock.","We should wrap up for the day."],
    c:2,x:"Comment on the time. C proposes wrapping up. A and B trap on 'five'/'clock'."},
  {id:"p2_203",q:"The new software is much faster than the old one.",
    opts:["I've noticed that too.","It's soft to the touch.","I bought it online."],
    c:0,x:"Comment. A agrees. B and C trap on 'soft'/buying."},
  {id:"p2_204",q:"I'm not sure how to use the new expense system.",
    opts:["The expenses were high.","I can show you after lunch.","In the finance office."],
    c:1,x:"Statement of difficulty. B offers help. A and C trap on 'expense'."},
  {id:"p2_205",q:"Where should I put these boxes?",
    opts:["They're quite heavy.","Yesterday morning.","In the storage room, please."],
    c:2,x:"'Where' question. C gives a location. A comments; B answers 'when'."},
  {id:"p2_206",q:"Who's leading the training session tomorrow?",
    opts:["Ms. Alvarez is.","In room four.","It lasts two hours."],
    c:0,x:"'Who' question. A names a person. B answers 'where'; C answers 'how long'."},
  {id:"p2_207",q:"What time does the store open on Sundays?",
    opts:["On Main Street.","At ten in the morning.","A new store manager."],
    c:1,x:"'What time' question. B gives a time. A answers 'where'; C is unrelated."},
  {id:"p2_208",q:"How long will the repairs take?",
    opts:["By the technician.","It's quite expensive.","About three days."],
    c:2,x:"'How long' question. C gives a duration. A answers 'who'; B comments on cost."},
  {id:"p2_209",q:"Why was the shipment delayed?",
    opts:["Because of a customs issue.","To the warehouse.","Last Tuesday."],
    c:0,x:"'Why' question. A gives a reason. B answers 'where'; C answers 'when'."},
  {id:"p2_210",q:"Which supplier did we choose in the end?",
    opts:["About fifty units.","The one from Osaka.","Sometime next quarter."],
    c:1,x:"'Which' question. B identifies one. A answers 'how many'; C answers 'when'."},
  {id:"p2_211",q:"When is the deadline for the grant application?",
    opts:["In the finance department.","Professor Lee submitted it.","The end of the month."],
    c:2,x:"'When' question. C gives a time. A answers 'where'; B names a person."},
  {id:"p2_212",q:"Whose laptop is this on the desk?",
    opts:["I think it's Mark's.","On the second shelf.","Later this afternoon."],
    c:0,x:"'Whose' question. A names an owner. B answers 'where'; C answers 'when'."},
  {id:"p2_213",q:"How much did the new equipment cost?",
    opts:["It's kept in the lab.","Around two thousand dollars.","It's very reliable."],
    c:1,x:"'How much' question. B gives a cost. A answers 'where'; C comments on quality."},
  {id:"p2_214",q:"Where can I find the annual report?",
    opts:["Once a year, usually.","The finance team wrote it.","It's on the company intranet."],
    c:2,x:"'Where' question. C gives a location. A answers 'how often'; B names who."},
  {id:"p2_215",q:"Have you finished reviewing the contract?",
    opts:["Not yet, I need another hour.","It's a brand-new contract.","With the lawyer."],
    c:0,x:"Yes/No question. A gives a 'not yet' answer. B and C are word traps."},
  {id:"p2_216",q:"Did the client approve the design?",
    opts:["Please design the new logo.","Yes, they loved it.","In the design studio."],
    c:1,x:"Yes/No question. B confirms. A and C trap on 'design'."},
  {id:"p2_217",q:"Is the conference room available at two?",
    opts:["It's quite a large room.","The conference ran long.","Let me check the calendar."],
    c:2,x:"Yes/No availability question. C will verify. A and B trap on 'room'/'conference'."},
  {id:"p2_218",q:"Are we still meeting on Thursday?",
    opts:["As far as I know, yes.","We met just last week.","In the main boardroom."],
    c:0,x:"Yes/No question. A confirms. B and C trap on 'met'/'where'."},
  {id:"p2_219",q:"Has the new intern started yet?",
    opts:["It's a paid internship.","She starts on Monday.","In the marketing team."],
    c:1,x:"Yes/No question. B gives a start date. A and C trap on 'intern'."},
  {id:"p2_220",q:"You've backed up the files, haven't you?",
    opts:["Let's head back to the office.","It's a very large file.","Yes, everything's saved."],
    c:2,x:"Tag question. C confirms the backup. A and B trap on 'back'/'file'."},
  {id:"p2_221",q:"The invoice was sent last week, wasn't it?",
    opts:["Yes, on Wednesday.","There's an unpaid invoice.","To the main client."],
    c:0,x:"Tag question. A confirms with a day. B and C trap on 'invoice'."},
  {id:"p2_222",q:"We don't need approval for this, do we?",
    opts:["Please approve the budget.","Actually, we might.","From the department manager."],
    c:1,x:"Negative tag question. B corrects the assumption. A and C trap on 'approval'."},
  {id:"p2_223",q:"You're joining the team lunch, aren't you?",
    opts:["The lunch menu looks good.","It starts at noon.","I wouldn't miss it."],
    c:2,x:"Tag question used as an invitation. C accepts. A and B trap on 'lunch'/'noon'."},
  {id:"p2_224",q:"Didn't we already order more toner?",
    opts:["Yes, it should arrive tomorrow.","Let's order some coffee.","It's in the cabinet."],
    c:0,x:"Negative question. A confirms with a delivery time. B and C trap on 'order'."},
  {id:"p2_225",q:"Isn't the flight scheduled for nine?",
    opts:["I'd like a window seat.","No, it leaves at ten.","We're at the airport now."],
    c:1,x:"Negative question. B corrects the time. A and C trap on 'flight'."},
  {id:"p2_226",q:"Wasn't the report supposed to be finished today?",
    opts:["It's a very detailed report.","It's on my desk somewhere.","I got an extension until Friday."],
    c:2,x:"Negative question. C explains an extension. A and B trap on 'report'."},
  {id:"p2_227",q:"Won't the store be closed by now?",
    opts:["It stays open until nine.","There's a new store nearby.","It's on the corner."],
    c:0,x:"Negative question. A corrects the assumption. B and C trap on 'store'."},
  {id:"p2_228",q:"Would you prefer to meet in person or online?",
    opts:["Yes, let's meet up.","In person, if possible.","It went really well."],
    c:1,x:"Alternative question. B picks one option. A (yes/no) and C don't fit an 'or' question."},
  {id:"p2_229",q:"Should we take the train or drive?",
    opts:["It's a round trip.","Meet me at the station.","The train is more relaxing."],
    c:2,x:"Alternative question. C chooses the train. A and B are unrelated."},
  {id:"p2_230",q:"Do you want the summary now or after the meeting?",
    opts:["After the meeting is fine.","Yes, please go ahead.","It's a short summary."],
    c:0,x:"Alternative question. A picks one option. B (yes/no) and C don't fit an 'or' question."}
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
    {q:"How are larger meeting rooms reserved?",opts:["At the front desk","First-come-first-served","They aren't available","Via an app"],c:3}]},

// ═══════════════════════════════════════════════════════════
// P3 BATCH 4 — p3_51 → p3_70 (20 new conversations, 2026-05-04)
// Voice mix: rotation by id mod 4 across 4 accent combos (US/US, US/UK, CA/US, CA/UK).
// Generation script: scripts/generate-audio-p3-batch4.mjs
// ═══════════════════════════════════════════════════════════

  {id:"p3_51",lines:[
    {s:"W",t:"Hi, I'm calling from Bridgewater Solutions. I understand you're interested in seeing a demo of our project management platform."},
    {s:"M",t:"That's right. We're evaluating three different vendors and would like to set something up for next week if possible."},
    {s:"W",t:"I have openings on Tuesday at ten or Thursday at two. Both demos run about forty-five minutes including questions."},
    {s:"M",t:"Thursday afternoon works better for our team. Could you also send the comparison sheet you mentioned in your email?"}],
  qs:[
    {q:"Why is the woman calling?",opts:["To complain about service","To schedule a product demo","To request a refund","To apply for a job"],c:1},
    {q:"What is the man currently doing?",opts:["Hiring new staff","Comparing multiple vendors","Selling a platform","Cancelling a contract"],c:1},
    {q:"What does the man request at the end?",opts:["A signed contract","A pricing discount","A comparison document","A different time slot"],c:2}]},

  {id:"p3_52",lines:[
    {s:"M",t:"I'd like to discuss the repayment schedule on my small business loan. I've come into some additional funds and want to pay it down faster."},
    {s:"W",t:"That's wonderful news. Let me pull up your account. I see you have about eighteen months remaining on a fifty-thousand-dollar balance."},
    {s:"M",t:"Right. If I make a lump-sum payment of fifteen thousand now, can I keep the same monthly amount and just shorten the term?"},
    {s:"W",t:"Yes, we can structure it that way. There's no early repayment penalty, and you'd save approximately three thousand in interest."}],
  qs:[
    {q:"Why is the man at the bank?",opts:["To open a new account","To pay off his loan early","To request a larger loan","To dispute a charge"],c:1},
    {q:"How much is the remaining loan balance?",opts:["Fifteen thousand","Thirty thousand","Fifty thousand","Eighteen thousand"],c:2},
    {q:"What is the main benefit of the man's plan?",opts:["No monthly payments","Significant interest savings","A new credit card","A higher credit score"],c:1}]},

  {id:"p3_53",lines:[
    {s:"W",t:"Hello, am I speaking with David? My name is Hannah Kim from Talent Bridge, a recruiting firm specializing in software engineering roles."},
    {s:"M",t:"Yes, this is David. How did you get my contact information?"},
    {s:"W",t:"Your professional profile came up in my search for senior backend developers. I have a confidential opening at a fast-growing fintech startup."},
    {s:"M",t:"I'm not actively looking, but I'm always open to interesting conversations. Can you send me more details by email so I can review when I have a moment?"}],
  qs:[
    {q:"What is the woman's profession?",opts:["Software engineer","Banker","Recruiter","HR manager"],c:2},
    {q:"What kind of role is being offered?",opts:["Junior frontend developer","Senior backend developer","Project manager","CFO"],c:1},
    {q:"How does the man respond to the offer?",opts:["He immediately accepts","He refuses outright","He requests written details","He asks for a higher salary"],c:2}]},

  {id:"p3_54",lines:[
    {s:"M",t:"I'd like to check out, please. The name is Carter, room 412."},
    {s:"W",t:"Of course, Mr. Carter. I have your final bill here. The total comes to four hundred and twenty pounds."},
    {s:"M",t:"I'm sorry, that doesn't look right. I was quoted three hundred sixty when I booked, and I haven't used the minibar or any room service."},
    {s:"W",t:"Let me investigate this immediately. It seems a daily resort fee was applied that shouldn't have been included on your corporate rate. I'll remove that now."}],
  qs:[
    {q:"Why is the man disputing the bill?",opts:["He didn't stay all nights","It's higher than the quoted price","He paid in advance","Tax was wrong"],c:1},
    {q:"What did the man NOT use?",opts:["The room safe","The minibar or room service","The pool","The internet"],c:1},
    {q:"What charge was incorrectly added?",opts:["A late checkout fee","A breakfast charge","A daily resort fee","A parking fee"],c:2}]},

  {id:"p3_55",lines:[
    {s:"W",t:"Thanks for joining me, Marcus. Let's go over your annual review. Overall, you've had a very strong year."},
    {s:"M",t:"Thank you. I was particularly proud of leading the redesign project — it came in two weeks ahead of schedule."},
    {s:"W",t:"That stood out in your feedback as well. One area I'd like us to focus on is delegating more so you don't burn out."},
    {s:"M",t:"That's fair. I tend to take on too much. I'd appreciate any guidance on which tasks I should be passing to junior team members."}],
  qs:[
    {q:"What is the purpose of the meeting?",opts:["A salary negotiation","An annual performance review","A project kickoff","A disciplinary meeting"],c:1},
    {q:"What achievement is highlighted?",opts:["Hiring new staff","Closing a major sale","Finishing a project ahead of schedule","Winning an industry award"],c:2},
    {q:"What concern does the woman raise?",opts:["He works too few hours","He takes on too much himself","He misses deadlines","He needs technical training"],c:1}]},

  {id:"p3_56",lines:[
    {s:"M",t:"Hi, I'm calling for a quote on a translation project. We have a forty-page user manual that needs to be translated from English into German and Japanese."},
    {s:"W",t:"I can certainly help with that. For technical documents of that length, our standard turnaround is two weeks per language. Pricing is sixteen pence per word."},
    {s:"M",t:"What if we need it in ten days? We have a product launch deadline we have to hit."},
    {s:"W",t:"Rush jobs add a thirty percent surcharge, but it's absolutely doable. I'll need final source files by tomorrow to start immediately."}],
  qs:[
    {q:"How long is the document?",opts:["Twenty pages","Forty pages","Sixty pages","One hundred pages"],c:1},
    {q:"Into which languages will it be translated?",opts:["French and Spanish","German and Japanese","Mandarin and Korean","Italian and Portuguese"],c:1},
    {q:"What is required to meet the rush deadline?",opts:["A signed contract today","Source files by tomorrow","Payment in advance","A second translator"],c:1}]},

  {id:"p3_57",lines:[
    {s:"W",t:"Customer service, this is Aisha. How can I help you today?"},
    {s:"M",t:"Hi, I received my office chair order this morning, but two of the boxes were crushed and the chairs inside are visibly damaged."},
    {s:"W",t:"I'm so sorry to hear that. I can dispatch replacements with overnight shipping at no charge. Can you send me photos of the damage for our claim records?"},
    {s:"M",t:"Sure, I'll email them right after we hang up. Should I keep the damaged chairs or do you want them returned?"}],
  qs:[
    {q:"What did the man order?",opts:["Office desks","Office chairs","Filing cabinets","Computer monitors"],c:1},
    {q:"What is the problem with the order?",opts:["It arrived late","Two items are damaged","Wrong items shipped","The invoice is incorrect"],c:1},
    {q:"What does the woman ask for?",opts:["The original receipt","Photos of the damage","A signed return form","His credit card details"],c:1}]},

  {id:"p3_58",lines:[
    {s:"M",t:"Riverside Hall, this is Oliver speaking."},
    {s:"W",t:"Hi, I'm planning a charity gala for about two hundred guests in October. Do you still have any Saturday evenings available?"},
    {s:"M",t:"We have two Saturdays open in October — the eleventh and the twenty-fifth. Both fit two hundred people comfortably with a sit-down dinner setup."},
    {s:"W",t:"Could we visit the venue this Friday? I'd also like to discuss catering options and whether we can bring our own decorators."}],
  qs:[
    {q:"What kind of event is being planned?",opts:["A wedding","A charity gala","A product launch","A concert"],c:1},
    {q:"How many guests will attend?",opts:["One hundred","One hundred fifty","Two hundred","Three hundred"],c:2},
    {q:"What does the woman want to do this Friday?",opts:["Sign the contract","Tour the venue","Pay a deposit","Meet the chef"],c:1}]},

  {id:"p3_59",lines:[
    {s:"W",t:"Hi Pedro, I saw your post on the company forum about looking for carpool partners. Are you still interested?"},
    {s:"M",t:"Definitely. I live near the Maple Avenue exit and drive in every day. Where are you coming from?"},
    {s:"W",t:"I'm just two blocks off Maple, on Birchwood. We could split fuel costs and use the high-occupancy lane. It would save me at least twenty minutes each way."},
    {s:"M",t:"Sounds great. The company also gives a fifty-dollar monthly credit for verified carpoolers. We just need to register through HR."}],
  qs:[
    {q:"How did the woman find out about the carpool?",opts:["From a colleague","From a company forum post","From an HR email","From a flyer"],c:1},
    {q:"What is one benefit of carpooling for the woman?",opts:["A higher salary","A faster commute","A new car","Free parking"],c:1},
    {q:"What additional incentive is mentioned?",opts:["A bonus vacation day","A monthly carpool credit","A health insurance discount","A stock option"],c:1}]},

  {id:"p3_60",lines:[
    {s:"M",t:"I need to rent equipment for a three-day conference next month. We'll need projectors, microphones, and a sound system for the main hall."},
    {s:"W",t:"Excellent. The main hall — how large is it, and how many delegates are expected? That helps me size the speaker system properly."},
    {s:"M",t:"It seats four hundred. We're also running breakout rooms with around fifty people each, so we'll need smaller setups for those."},
    {s:"W",t:"I'd recommend our premium package for the main hall and our standard portable kits for the breakouts. I can email a full quote within the hour."}],
  qs:[
    {q:"How long is the conference?",opts:["One day","Two days","Three days","One week"],c:2},
    {q:"How many people will be in the main hall?",opts:["Fifty","Two hundred","Four hundred","One thousand"],c:2},
    {q:"What will the woman do next?",opts:["Visit the venue","Send a written quote","Sign a contract","Refund a deposit"],c:1}]},

  {id:"p3_61",lines:[
    {s:"W",t:"I'm a third-year engineering student and I read about your summer internship program online. Are applications still open?"},
    {s:"M",t:"Yes, we're accepting applications until the end of the month. We typically take eight to ten interns across our research and product teams."},
    {s:"W",t:"What does the application require? I have my résumé and a transcript ready, but I wasn't sure about references."},
    {s:"M",t:"We need two academic references, your transcript, and a one-page essay about a technical problem you've solved. The essay weighs heavily in our selection."}],
  qs:[
    {q:"What is the woman applying for?",opts:["A full-time job","A summer internship","A research grant","A scholarship"],c:1},
    {q:"How many interns are typically hired?",opts:["Two to three","Four to five","Eight to ten","Fifteen to twenty"],c:2},
    {q:"What component is most heavily weighted?",opts:["The transcript","The interview","A one-page essay","The references"],c:2}]},

  {id:"p3_62",lines:[
    {s:"M",t:"Hello, I'm calling to book a session for corporate headshots. We have about fifteen executives who need updated photos for our website."},
    {s:"W",t:"Lovely. We can do the entire team in a single day with our mobile setup, or you can come to our studio across multiple sessions."},
    {s:"M",t:"On-site would be much more convenient. How long do you need per person, and what does the day rate run?"},
    {s:"W",t:"Approximately ten minutes per person plus setup. The full-day on-site fee is one thousand two hundred pounds, including digital delivery and basic retouching."}],
  qs:[
    {q:"What is the man booking?",opts:["Family portraits","Corporate headshot photography","A wedding shoot","Product photos"],c:1},
    {q:"How many people need photos?",opts:["Five","Ten","Fifteen","Twenty"],c:2},
    {q:"Which option does the man prefer?",opts:["Studio sessions","On-site shooting","Outdoor session","Self-portraits"],c:1}]},

  {id:"p3_63",lines:[
    {s:"W",t:"I registered for the marketing summit next week, but I have to cancel due to a family emergency. Is a refund possible?"},
    {s:"M",t:"I'm sorry to hear that. Our standard policy allows full refunds up to ten days before the event. We're inside that window now, so a partial refund of fifty percent applies."},
    {s:"W",t:"I understand. Could you instead apply the full amount as a credit toward your fall conference?"},
    {s:"M",t:"Yes, we can do that. The credit will be valid for twelve months and is fully transferable if you can't attend yourself."}],
  qs:[
    {q:"Why is the woman cancelling?",opts:["A scheduling conflict","A family emergency","A change of employer","Travel restrictions"],c:1},
    {q:"What is the standard refund window?",opts:["Three days before","Seven days before","Ten days before","Thirty days before"],c:2},
    {q:"What alternative does the man offer?",opts:["A future credit, transferable","A free workshop","A paid speaker slot","A dinner voucher"],c:0}]},

  {id:"p3_64",lines:[
    {s:"M",t:"I'd like to place an order for branded notebooks and pens for our trade show booth. We're thinking five hundred of each."},
    {s:"W",t:"Brilliant. Our most popular notebook is the soft-cover A5 with a foiled logo, and we offer a wide range of pen styles to match."},
    {s:"M",t:"Could you send samples? I want to feel the paper quality before we commit. Also, what's the lead time for that quantity?"},
    {s:"W",t:"Samples will go out today. Standard production time is two weeks, but if you need it in ten days, we can prioritize for a small rush fee."}],
  qs:[
    {q:"What is the order for?",opts:["Office supplies","Branded items for a trade show","Promotional t-shirts","Catering"],c:1},
    {q:"What does the man want before placing the order?",opts:["A discount","Physical samples","A bank guarantee","A signed contract"],c:1},
    {q:"What is the standard lead time?",opts:["Three days","One week","Two weeks","One month"],c:2}]},

  {id:"p3_65",lines:[
    {s:"W",t:"Hi, I need to report a workplace injury. One of our warehouse staff sprained an ankle yesterday while loading pallets."},
    {s:"M",t:"I'm sorry to hear that. First, has she received medical attention, and is she currently off work?"},
    {s:"W",t:"Yes, she went to urgent care immediately and was given a one-week leave. The doctor prescribed physical therapy for the next month."},
    {s:"M",t:"I'll send the incident report form to your email. Once it's filled out and the medical reports are attached, the claim is usually processed within five business days."}],
  qs:[
    {q:"What kind of injury occurred?",opts:["A back injury","A sprained ankle","A cut hand","A burn"],c:1},
    {q:"How long is the employee on leave?",opts:["Two days","One week","Two weeks","One month"],c:1},
    {q:"How long does claim processing usually take?",opts:["One business day","Three business days","Five business days","Two weeks"],c:2}]},

  {id:"p3_66",lines:[
    {s:"M",t:"Hi, I wanted to discuss renewing our office cleaning contract. It expires at the end of the month."},
    {s:"W",t:"Of course. We've enjoyed serving you. Would you like the same scope, or are there any adjustments you'd like to make this time?"},
    {s:"M",t:"We've added a second floor since signing the original contract, so we'll need that included. Also, can we increase the deep-clean frequency from quarterly to monthly?"},
    {s:"W",t:"Both are absolutely possible. Adding the second floor and the monthly deep clean will increase your monthly fee by about fifteen percent."}],
  qs:[
    {q:"Why is the man calling?",opts:["To cancel a contract","To file a complaint","To renew a contract","To request a refund"],c:2},
    {q:"What has changed in the man's office?",opts:["A second floor was added","Staff moved out","The address changed","The opening hours changed"],c:0},
    {q:"What is the impact on the price?",opts:["Stays the same","About fifteen percent more","Doubles","Decreases slightly"],c:1}]},

  {id:"p3_67",lines:[
    {s:"W",t:"I wanted to talk about our payment terms. Currently we're at net thirty, but our cash flow has improved and we'd be open to discussing changes."},
    {s:"M",t:"Interesting. If you could move to net fifteen, we'd be willing to offer a two percent volume discount on your monthly orders."},
    {s:"W",t:"Net fifteen is doable. What about an even shorter window — say net seven — for an additional discount?"},
    {s:"M",t:"Net seven is more aggressive than we usually go, but for a long-term partner like yourself, I could push for three and a half percent total."}],
  qs:[
    {q:"What is the current payment term?",opts:["Net seven","Net fifteen","Net thirty","Net sixty"],c:2},
    {q:"What discount is offered for net fifteen?",opts:["One percent","Two percent","Three and a half percent","Five percent"],c:1},
    {q:"What does the man imply at the end?",opts:["He must check internally","He cannot offer more","The deal is final","He needs payment now"],c:0}]},

  {id:"p3_68",lines:[
    {s:"M",t:"Hi Sophia, it's James following up on the candidates we discussed for the operations director role. Any updates from your shortlist?"},
    {s:"W",t:"Two of the three are available for in-person interviews next week. The third unfortunately accepted another offer this morning."},
    {s:"M",t:"That's a shame. Was the third candidate the one with the manufacturing background? She looked particularly strong on paper."},
    {s:"W",t:"Yes, that was her. The good news is we have another strong candidate I just sourced. Would you like me to add her to next week's interview slots?"}],
  qs:[
    {q:"What position is being discussed?",opts:["HR director","Operations director","Marketing manager","Sales lead"],c:1},
    {q:"What happened to one candidate?",opts:["She withdrew her application","She accepted another offer","She failed a test","She is on holiday"],c:1},
    {q:"What does the woman propose?",opts:["Cancelling the search","Lowering the salary","Adding a new candidate","Reposting the role"],c:2}]},

  {id:"p3_69",lines:[
    {s:"W",t:"Hi, I'm enquiring about exhibit floor space for the technology expo in March. We had a corner booth last year and would like the same again."},
    {s:"M",t:"Let me check the floor plan. Yes, your previous corner location is still available, but it's been resized — it's now eighteen square meters instead of twenty."},
    {s:"W",t:"That's a noticeable reduction. Can you offer any compensation, or could we get the larger booth two rows down?"},
    {s:"M",t:"I can offer either a ten percent discount on your previous rate, or upgrade you to the larger booth which is currently unsold but more centrally located."}],
  qs:[
    {q:"When is the trade expo?",opts:["January","March","June","October"],c:1},
    {q:"What has changed about the corner booth?",opts:["It is no longer available","It is more expensive","It is smaller than before","It moved to a different hall"],c:2},
    {q:"What two options does the man offer?",opts:["Refund or cancellation","Discount or a different larger booth","Free advertising or signage","Catering or coffee service"],c:1}]},

  {id:"p3_70",lines:[
    {s:"M",t:"We're planning to refresh our open-plan office and would like your team to handle the design and project management."},
    {s:"W",t:"Wonderful. Could you tell me more about the goals — are you focused on aesthetics, productivity improvements, or expanding capacity?"},
    {s:"M",t:"Mostly productivity. Our staff has grown forty percent and we need better acoustics, more meeting pods, and brighter natural lighting throughout the space."},
    {s:"W",t:"Those are great targets. Our usual approach is a discovery workshop with key staff, then concept designs within three weeks. After approval, the build typically takes two to three months."}],
  qs:[
    {q:"What kind of project is being planned?",opts:["A new office building","A residential redesign","An office redesign","A restaurant renovation"],c:2},
    {q:"What is the main priority?",opts:["A more luxurious look","Better productivity","Higher rent yield","Smaller floor space"],c:1},
    {q:"How long does the build phase typically take?",opts:["Two to three weeks","Two to three months","Six months","One year"],c:1}]},

  // ─── PILOT: "Look at the graphic" conversations (p3_71–p3_73) — added 2026-06-22 ───
  // ⚠️ NOT LIVE UNTIL AUDIO EXISTS. Needs /audio/p3/{id}_line0..3.mp3, {id}.mp3 (stitched),
  //    {id}_q1..3.mp3. Until then the conversation plays silent in training (regression).
  {id:"p3_71",lines:[
    {s:"W",t:"Hi, I'd like to book a meeting room for our client presentation this Thursday at two o'clock. What's available?"},
    {s:"M",t:"Let me see. At two o'clock, both the Oak Room and the Maple Room are free."},
    {s:"W",t:"We'll have around ten people, so I'll need the larger of those two. Let's go with whichever one fits us."},
    {s:"M",t:"No problem. I'll reserve it now and send you a confirmation email this afternoon."}],
    qs:[
      {q:"Why is the woman booking a room?",opts:["For a job interview","For a client presentation","For a training session","For a birthday party"],c:1},
      {q:"What will the man do this afternoon?",opts:["Cancel a booking","Call the client","Send a confirmation email","Rearrange the furniture"],c:2},
      {q:"Look at the graphic. Which room will the woman reserve?",opts:["Oak Room","Maple Room","Birch Room","Cedar Room"],c:0,
        graphic:{type:"table",title:"Meeting Room Capacities",headers:["Room","Capacity"],rows:[["Oak Room","12 people"],["Maple Room","8 people"],["Birch Room","6 people"],["Cedar Room","20 people"]]}}]},
  {id:"p3_72",lines:[
    {s:"M",t:"Our flight to Chicago was supposed to leave at three fifteen. Have you looked at the departures board?"},
    {s:"W",t:"I just did. It's been delayed, and the new time and gate are up on the board now."},
    {s:"M",t:"How bad is the delay? I'm worried we'll miss our connection."},
    {s:"W",t:"We should still make it. Let's grab a coffee near the new gate while we wait."}],
    qs:[
      {q:"Where most likely are the speakers?",opts:["At a train station","At an airport","At a bus terminal","At a hotel"],c:1},
      {q:"What does the woman suggest doing?",opts:["Booking another flight","Getting a coffee while they wait","Calling the airline","Going to a different terminal"],c:1},
      {q:"Look at the graphic. What is the new departure time of their flight?",opts:["3:30 PM","4:00 PM","4:45 PM","5:10 PM"],c:2,
        graphic:{type:"table",title:"Departures",headers:["Destination","Departure","Gate"],rows:[["Boston","3:30 PM","A4"],["Chicago","4:45 PM","B12"],["Denver","5:10 PM","C7"]]}}]},
  {id:"p3_73",lines:[
    {s:"W",t:"I'm trying to pick a membership plan for the gym. I work out about three times a week."},
    {s:"M",t:"The plans are all on the flyer there. The basic one only covers weekday mornings, though."},
    {s:"W",t:"That won't work — I always go in the evenings. I want unlimited access, but I really don't need the personal training add-on."},
    {s:"M",t:"Then the middle option is perfect for you. Full access, and a reasonable monthly price."}],
    qs:[
      {q:"How often does the woman exercise?",opts:["Once a week","Twice a week","Three times a week","Every day"],c:2},
      {q:"Why doesn't the woman want the most expensive plan?",opts:["It is only for mornings","She does not need personal training","It has no evening access","It is sold out"],c:1},
      {q:"Look at the graphic. Which plan will the woman most likely choose?",opts:["Basic","Premium","Elite","Day Pass"],c:1,
        graphic:{type:"list",title:"Gym Membership Plans",items:["Basic — weekday mornings only, $20/month","Premium — unlimited access, $40/month","Elite — unlimited access + personal training, $70/month","Day Pass — single visit, $8"]}}]},
  {id:"p3_74",lines:[
      {s:"W",t:"Everyone, the clients from Meridian are visiting on Thursday, so we need to finalize the agenda today."},
      {s:"M",t:"I can prepare the product demo. How long should it run?"},
      {s:"W",t:"Let's keep it to about twenty minutes. Daniel, could you handle the office tour?"},
      {s:"M2",t:"Sure. I'll show them the new lab and the design studio. Should I include the rooftop terrace?"},
      {s:"W",t:"Good idea, it always impresses visitors. Let's meet again tomorrow to rehearse everything."}],
    qs:[
      {q:"What event are the speakers preparing for?",opts:["A product launch","A client visit","A job interview","A staff party"],c:1},
      {q:"What will the first man do?",opts:["Give the office tour","Order lunch","Prepare a product demo","Book a hotel"],c:2},
      {q:"What does the woman suggest doing tomorrow?",opts:["Rehearsing the agenda","Cancelling the visit","Redesigning the lab","Emailing the clients"],c:0}]},
  {id:"p3_75",lines:[
      {s:"W",t:"We still haven't chosen a venue for the annual conference. Any thoughts?"},
      {s:"W2",t:"The Grand Hotel has a large hall, but it's quite expensive."},
      {s:"M",t:"What about the convention center downtown? It's cheaper and closer to the train station."},
      {s:"W",t:"That's a good point. Accessibility really matters for our out-of-town attendees."},
      {s:"W2",t:"I'll call the convention center this afternoon to check availability."}],
    qs:[
      {q:"What are the speakers trying to decide?",opts:["A meeting time","A guest speaker","A budget","A conference venue"],c:3},
      {q:"What advantage of the convention center is mentioned?",opts:["It is free","It is near the train station","It has better food","It is larger"],c:1},
      {q:"What will the second woman do?",opts:["Book the Grand Hotel","Cancel the conference","Call to check availability","Email the attendees"],c:2}]},
  {id:"p3_76",lines:[
      {s:"M",t:"The new scheduling software goes live next Monday. Are both teams ready?"},
      {s:"W",t:"Sales has been trained, but support still needs a session."},
      {s:"M2",t:"I can run a training session for support on Friday morning. Will that work?"},
      {s:"M",t:"Perfect. Let's also prepare a short guide for anyone who misses it."},
      {s:"W",t:"I'll write the guide and send it out by the end of the day on Thursday."}],
    qs:[
      {q:"What is going live on Monday?",opts:["New scheduling software","A new website","A phone system","A mobile app"],c:0},
      {q:"What does the second man offer to do?",opts:["Write the guide","Delay the launch","Contact sales","Run a training session"],c:3},
      {q:"What will the woman send out by Thursday?",opts:["An invoice","A short guide","A survey","A schedule"],c:1}]},
  {id:"p3_77",lines:[
      {s:"W",t:"We need to arrange catering for the retirement party. About forty people are coming."},
      {s:"M",t:"Should we go with the caterer we used last time?"},
      {s:"W2",t:"Their food was good, but the service was slow. Maybe we should try someone new."},
      {s:"W",t:"Let's get two or three quotes and compare them."},
      {s:"M",t:"I'll email a few caterers this afternoon and ask for menus and prices."}],
    qs:[
      {q:"What are the speakers organizing?",opts:["A product launch","A training day","A retirement party","A sales meeting"],c:2},
      {q:"What was the problem with the previous caterer?",opts:["The service was slow","The food was cold","The prices were high","The menu was small"],c:0},
      {q:"What will the man do this afternoon?",opts:["Book a venue","Order decorations","Send invitations","Email caterers for quotes"],c:3}]},
  {id:"p3_78",lines:[
      {s:"M",t:"The shipment to the Chicago branch is going to be two days late."},
      {s:"W",t:"That's a problem. They need those parts for Monday's production run."},
      {s:"M2",t:"Could we send a partial order by express courier to cover Monday?"},
      {s:"M",t:"That might work. How much would express shipping cost?"},
      {s:"M2",t:"I'll get a quote right now and let you know in about ten minutes."}],
    qs:[
      {q:"What is the problem?",opts:["A machine broke down","A shipment is delayed","An order was cancelled","A price increased"],c:1},
      {q:"What does the second man propose?",opts:["Cancelling the order","Delaying production","Sending a partial order by express","Calling the client"],c:2},
      {q:"What will the second man do next?",opts:["Get a shipping quote","Contact the branch","Reorder the parts","Update the schedule"],c:0}]},
  {id:"p3_79",lines:[
      {s:"W",t:"We have five candidates to interview for the analyst position this week."},
      {s:"W2",t:"Can we fit them all in before Friday? My schedule is very tight on Thursday."},
      {s:"M",t:"I could take two of the interviews if that helps spread the load."},
      {s:"W",t:"That would be great. Let's do three on Wednesday and two on Friday."},
      {s:"W2",t:"I'll send everyone the updated schedule and book the meeting room."}],
    qs:[
      {q:"What position are they hiring for?",opts:["A manager","A receptionist","A designer","An analyst"],c:3},
      {q:"What does the man offer to do?",opts:["Reschedule Friday","Conduct two interviews","Book the room","Review the résumés"],c:1},
      {q:"What will the second woman do?",opts:["Interview the candidates","Call the manager","Send the schedule and book a room","Cancel Thursday"],c:2}]},
  {id:"p3_80",lines:[
      {s:"W",t:"The social media campaign launches next week. Is the content ready?"},
      {s:"M",t:"The videos are done, but we're still waiting on the final graphics."},
      {s:"M2",t:"The designer promised the graphics by tomorrow afternoon."},
      {s:"W",t:"Good. Once they're in, let's schedule everything to post automatically."},
      {s:"M",t:"I'll set up the scheduling tool as soon as the graphics arrive."}],
    qs:[
      {q:"What is launching next week?",opts:["A social media campaign","A new product","A store opening","A website"],c:0},
      {q:"What are they still waiting for?",opts:["The videos","The budget","The approval","The final graphics"],c:3},
      {q:"What will the first man do once the graphics arrive?",opts:["Email the designer","Schedule the posts","Film more videos","Review the campaign"],c:1}]},
  {id:"p3_81",lines:[
      {s:"M",t:"Now that the lease is signed, we need a plan to move to the new office."},
      {s:"W",t:"The movers are already booked for the last weekend of the month."},
      {s:"W2",t:"What about the IT setup? We can't lose network access on Monday morning."},
      {s:"M",t:"Good point. Let's have IT install everything the Friday before."},
      {s:"W",t:"I'll coordinate with the IT team and confirm the timeline."}],
    qs:[
      {q:"What are the speakers planning?",opts:["A renovation","A holiday party","An office move","A hiring drive"],c:2},
      {q:"What is the second woman concerned about?",opts:["Losing network access","The moving cost","The new location","The schedule"],c:0},
      {q:"What will the first woman do?",opts:["Book the movers","Sign the lease","Pack the boxes","Coordinate with IT"],c:3}]},
  {id:"p3_82",lines:[
      {s:"W",t:"Our department is slightly over budget this quarter, so we need to cut about five percent."},
      {s:"M",t:"Most of our spending is on travel. Could we do more meetings online?"},
      {s:"M2",t:"That would save a lot. We could also delay the new equipment purchase."},
      {s:"W",t:"Let's do both, switch to virtual meetings and postpone the equipment."},
      {s:"M",t:"I'll update the budget forecast to reflect those changes."}],
    qs:[
      {q:"What is the problem with the department's budget?",opts:["It is unclear","It is over budget","It was frozen","It was cut"],c:1},
      {q:"What does the first man suggest?",opts:["Reducing staff","Cancelling travel entirely","Holding more meetings online","Buying new equipment"],c:2},
      {q:"What will the first man do?",opts:["Update the budget forecast","Book the flights","Approve the equipment","Schedule a meeting"],c:0}]},
  {id:"p3_83",lines:[
      {s:"W",t:"We've received several complaints about slow delivery times this month."},
      {s:"M",t:"Is it a problem with the warehouse or the courier?"},
      {s:"W2",t:"I checked. The warehouse is fine; the courier has been understaffed."},
      {s:"W",t:"Then maybe we should switch to a different delivery partner."},
      {s:"M",t:"I'll research a few alternatives and present options at next week's meeting."}],
    qs:[
      {q:"What is causing the delivery delays?",opts:["A warehouse error","Bad weather","A system failure","An understaffed courier"],c:3},
      {q:"What does the woman suggest?",opts:["Hiring more staff","Switching delivery partners","Refunding customers","Closing the warehouse"],c:1},
      {q:"What will the man do?",opts:["Contact the courier","Apologize to customers","Research alternatives","Visit the warehouse"],c:2}]},
  {id:"p3_84",lines:[
      {s:"M",t:"Our booth at the tech expo is confirmed for Hall C, space twelve."},
      {s:"W",t:"How big is the space? We had trouble fitting everything in last year."},
      {s:"M2",t:"It's about thirty percent larger this time, so we'll have more room."},
      {s:"M",t:"Great. Let's design a layout that includes a small demo area."},
      {s:"W",t:"I'll sketch a floor plan and share it with the team tomorrow."}],
    qs:[
      {q:"What are the speakers discussing?",opts:["A trade show booth","A store layout","An office design","A product demo"],c:0},
      {q:"What was the problem last year?",opts:["The location was bad","The cost was high","The staff was busy","The space was too small"],c:3},
      {q:"What will the woman do tomorrow?",opts:["Confirm the space","Share a floor plan","Order the demo units","Book the hall"],c:1}]},
  {id:"p3_85",lines:[
      {s:"W",t:"Management wants us to launch a mentorship program for new hires."},
      {s:"W2",t:"That's a great idea. Who would act as the mentors?"},
      {s:"M",t:"We could ask experienced staff to volunteer, and maybe offer them a small incentive."},
      {s:"W",t:"Let's start with a pilot, pairing five mentors with five new employees."},
      {s:"W2",t:"I'll draft an invitation to send to potential mentors."}],
    qs:[
      {q:"What program are they discussing?",opts:["A training course","A recruitment drive","A mentorship program","A bonus scheme"],c:2},
      {q:"What does the man suggest to attract mentors?",opts:["Offering a small incentive","Reducing their hours","Giving them titles","Hiring more staff"],c:0},
      {q:"What will the second woman do?",opts:["Choose the new hires","Run the pilot","Interview mentors","Draft an invitation"],c:3}]},
  {id:"p3_86",lines:[
      {s:"M",t:"We've had a few reports of the new blender overheating."},
      {s:"W",t:"How many units are affected? Is it a safety issue?"},
      {s:"M2",t:"So far it's a small batch, but we should investigate before it spreads."},
      {s:"M",t:"Let's pause shipments of that batch until we know the cause."},
      {s:"W",t:"I'll contact the factory and ask for their inspection report."}],
    qs:[
      {q:"What is the problem with the product?",opts:["It is too expensive","It overheats","It is out of stock","It is the wrong color"],c:1},
      {q:"What does the first man suggest doing?",opts:["Recalling all units","Lowering the price","Pausing shipments of the batch","Redesigning the product"],c:2},
      {q:"What will the woman do?",opts:["Contact the factory","Test the units","Refund customers","Stop production"],c:0}]},
  {id:"p3_87",lines:[
      {s:"W",t:"The company wants to reduce paper use by half this year."},
      {s:"M",t:"We could switch most reports to digital and cut down on printing."},
      {s:"W2",t:"We should also set the default printer settings to double-sided."},
      {s:"W",t:"Those are easy wins. Let's send a memo explaining the new guidelines."},
      {s:"M",t:"I'll write the memo and include some tips for going paperless."}],
    qs:[
      {q:"What is the company's goal?",opts:["To increase sales","To hire more staff","To open a branch","To reduce paper use"],c:3},
      {q:"What does the second woman suggest?",opts:["Buying new printers","Setting printers to double-sided","Removing all printers","Printing in color"],c:1},
      {q:"What will the man do?",opts:["Buy tablets","Survey the staff","Write a memo","Recycle the paper"],c:2}]},
  {id:"p3_88",lines:[
      {s:"W",t:"The board wants to move the product launch up by two weeks."},
      {s:"M",t:"That's tight. Marketing needs at least a month to prepare the campaign."},
      {s:"M2",t:"Engineering can be ready, but only if we skip the second round of testing."},
      {s:"W",t:"Skipping testing is too risky. Let's ask the board to keep the original date."},
      {s:"M",t:"Agreed. I'll prepare a short report explaining why we need more time."}],
    qs:[
      {q:"What does the board want to do?",opts:["Move up the launch","Delay the launch","Cancel the launch","Expand the campaign"],c:0},
      {q:"Why is the second man hesitant?",opts:["The budget is too small","Marketing is ready","The product is finished","Testing would have to be skipped"],c:3},
      {q:"What will the first man do?",opts:["Contact the board directly","Prepare a report","Start the campaign","Skip the testing"],c:1}]}
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
    {q:"What is the current promotion?",opts:["A free gift","Free delivery","A free design consultation and a discount","Lifetime warranty"],c:2}]},

  // ═══════════════════════════════════════════════════════════
  // P4 BATCH 4 — p4_46 → p4_60 (15 new talks, added 2026-05-04)
  // Voice rotation 4 voices by id mod 4: Sarah(W) / Adam(M) / Canadian(W) / British(M)
  // VOICE_A/B excluded — sex unconfirmed.
  // Generation script: scripts/generate-audio-p4-batch4.mjs
  // ═══════════════════════════════════════════════════════════

  {id:"p4_46",type:"Voicemail",voice:"W",
    text:"Hello, this is Greenfield Pharmacy calling for Mr. Lecomte. I wanted to let you know that your prescription refill is ready for pickup. Our hours today are nine to seven. If you can't make it before closing, the prescription will be held for forty-eight hours before being returned to inventory. If you'd like home delivery, we offer that service for a small fee — just call us back. Have a great day.",
    qs:[
      {q:"Why is the speaker calling?",opts:["To confirm a doctor's appointment","To inform that a prescription is ready","To request payment","To reschedule a delivery"],c:1},
      {q:"How long will the prescription be held?",opts:["Twelve hours","Twenty-four hours","Forty-eight hours","One week"],c:2},
      {q:"What additional service is mentioned?",opts:["Home delivery","Free consultation","Insurance billing","A loyalty program"],c:0}]},

  {id:"p4_47",type:"Announcement",voice:"M",
    text:"Attention passengers on platform seven. The 4:25 express service to Brussels has been canceled this evening due to a signaling issue on the line. Passengers holding tickets for this train can use them on the next available service at 5:10, which will make all stops. Refunds for this evening's cancellation are available at the customer service desk on the main concourse. We apologize for the inconvenience.",
    qs:[
      {q:"Where is the announcement most likely being made?",opts:["At an airport","In a shopping mall","At a train station","On a city bus"],c:2},
      {q:"Why was the service canceled?",opts:["Bad weather","A signaling problem","Staff shortage","A scheduling change"],c:1},
      {q:"What can passengers do with their original tickets?",opts:["Use them on the 5:10 service","Exchange them at any station","Get a full refund automatically","Nothing — they are invalid"],c:0}]},

  {id:"p4_48",type:"Voicemail",voice:"W",
    text:"Hi Marcus, this is Aisha from Bridgewater HR. I'm following up on your application for the senior analyst position. We'd like to invite you to an in-person interview next Thursday. The interview is scheduled to last about ninety minutes and will include a short technical exercise. Please confirm your availability by replying to my email or calling me back at extension 437. Looking forward to meeting you.",
    qs:[
      {q:"What is the speaker's profession?",opts:["A recruiter or HR representative","An IT manager","A senior analyst","A business consultant"],c:0},
      {q:"How long will the interview last?",opts:["Thirty minutes","Sixty minutes","Ninety minutes","Two hours"],c:2},
      {q:"What is one component of the interview?",opts:["A panel discussion","A technical exercise","A lunch with the team","A written essay"],c:1}]},

  {id:"p4_49",type:"Advertisement",voice:"M",
    text:"Are you tired of crowded gyms with broken equipment? At Pulse Cycling Studio, we offer indoor cycling classes designed for every fitness level. Our brand-new facility on Camden Road features forty bikes, full shower facilities, and certified instructors who tailor each session to your goals. Sign up online by the end of this month and your first two weeks are completely free. Visit pulsecycling.co.uk to claim your trial.",
    qs:[
      {q:"What kind of business is being advertised?",opts:["A sports equipment store","A personal training app","An indoor cycling studio","A weight loss clinic"],c:2},
      {q:"How many bikes does the facility offer?",opts:["Twenty","Thirty","Forty","Fifty"],c:2},
      {q:"What promotion is mentioned?",opts:["Two free weeks for new sign-ups","A discount for couples","A free fitness consultation","A monthly membership at half price"],c:0}]},

  {id:"p4_50",type:"Recorded message",voice:"W",
    text:"Thank you for calling Sterling Community Bank. Our offices are currently closed for the weekend. Our normal business hours are Monday through Friday, eight thirty to five. To report a lost or stolen card, please press one and you will be connected to our 24-hour security team. To check your account balance, press two and have your card number ready. For all other inquiries, please call back during business hours or visit sterlingcb.com.",
    qs:[
      {q:"What kind of business is the caller reaching?",opts:["A credit card issuer","A bank","An insurance company","A government office"],c:1},
      {q:"What should callers do to report a lost card?",opts:["Press one","Press two","Visit the website","Call back later"],c:0},
      {q:"When are the offices open?",opts:["24 hours every day","Weekends only","Monday to Friday, 8:30 to 5","Monday to Saturday morning"],c:2}]},

  {id:"p4_51",type:"Training session",voice:"M",
    text:"Good morning everyone. Today we're going to walk through our updated fire evacuation procedure. When the alarm sounds, leave your workstation immediately, take only essentials, and proceed to the nearest stairwell — never use the elevators. Floor wardens, identifiable by their orange vests, will guide you to the assembly point in the parking lot at section B. Once there, your team leader will perform a roll call. Do not return to the building until cleared by the safety officer.",
    qs:[
      {q:"What is the topic of this training?",opts:["First aid response","Fire evacuation procedure","Active shooter drill","Building security"],c:1},
      {q:"How can floor wardens be identified?",opts:["By a special badge","By a clipboard","By their orange vests","By their position at the door"],c:2},
      {q:"When can people return to the building?",opts:["When the safety officer clears it","After fifteen minutes","When the alarm stops","When the team leader signals"],c:0}]},

  {id:"p4_52",type:"Tour guide",voice:"W",
    text:"Welcome to the Westbrook Botanical Gardens. Today's guided tour will take about an hour and a quarter and will cover three of our seven themed sections — the tropical greenhouse, the Japanese garden, and the medicinal herb collection. Photography is welcome throughout, except inside the orchid pavilion where flash damages the petals. Restrooms and a small café are available near the main entrance. Please stay together, and don't hesitate to ask questions.",
    qs:[
      {q:"How long will the tour last?",opts:["Forty-five minutes","One hour","About seventy-five minutes","Two hours"],c:2},
      {q:"How many sections will the tour cover?",opts:["Three","Five","Seven","All sections"],c:0},
      {q:"Where is photography restricted?",opts:["In the Japanese garden","In the orchid pavilion","Near the main entrance","Throughout the gardens"],c:1}]},

  {id:"p4_53",type:"News report",voice:"M",
    text:"In economic news, the Office for National Statistics released figures today showing that retail sales in the city centre rose by four point two percent over the past quarter. Analysts attribute the growth to two factors: increased footfall from the new tram extension that opened in March, and a strong tourist season. Independent shops report the largest gains, with food and beverage outlets leading at nearly seven percent growth.",
    qs:[
      {q:"What is the main subject of the report?",opts:["Tourism statistics","Quarterly retail sales growth","A new tram line","Independent shop closures"],c:1},
      {q:"What is one cited reason for the growth?",opts:["Lower taxes","Increased advertising","A new tram extension","Government subsidies"],c:2},
      {q:"Which sector grew the most?",opts:["Food and beverage","Clothing and accessories","Electronics","Home goods"],c:0}]},

  {id:"p4_54",type:"Voicemail",voice:"W",
    text:"Hi, this is Daniel from QuickShip Couriers. I have a package addressed to your office, but the building is locked and there's no answer at the main entrance. I'll wait for another fifteen minutes before returning the package to our depot. If you'd like me to leave it with a neighboring business, please call me back at this number within that window. Otherwise, you can reschedule delivery for tomorrow through our website.",
    qs:[
      {q:"Why can't the courier complete the delivery?",opts:["The address is wrong","The package is damaged","The building is locked","The recipient refused it"],c:2},
      {q:"How long will the courier wait?",opts:["Fifteen minutes","Thirty minutes","One hour","Until the end of the day"],c:0},
      {q:"What is the alternative if no one calls back?",opts:["The package will be destroyed","Reschedule delivery online","The courier will leave it on the doorstep","Pay an additional fee"],c:1}]},

  {id:"p4_55",type:"Meeting introduction",voice:"M",
    text:"Good morning everyone, and thank you for joining today's quarterly review. Before we start, I want to acknowledge two things. First, congratulations to the customer success team — your retention numbers this quarter were the highest we've seen in three years. Second, our new VP of Engineering, Rosa Diaz, joined us last Monday from her previous role at Hexagram Tech. Please welcome her warmly. Now let's get into the agenda.",
    qs:[
      {q:"What kind of meeting is this?",opts:["A quarterly review","A product launch","A customer event","A training session"],c:0},
      {q:"What achievement is highlighted?",opts:["Record-breaking sales","Highest customer retention in 3 years","A successful product launch","A new partnership"],c:1},
      {q:"Who is being introduced?",opts:["A new customer","A guest speaker","A new VP of Engineering","A consultant"],c:2}]},

  {id:"p4_56",type:"Announcement",voice:"W",
    text:"Attention shoppers. Westwood Department Store will be closing two hours earlier than usual tonight, at six PM, for our annual inventory count. We apologize for any inconvenience this may cause. The full store will reopen tomorrow at our normal time of nine AM. As a thank you for your understanding, all customers shopping today will receive a fifteen percent discount voucher valid on their next visit. Please proceed to checkout by five forty-five.",
    qs:[
      {q:"What time will the store close tonight?",opts:["Five PM","Five forty-five","Six PM","Eight PM"],c:2},
      {q:"Why is the store closing early?",opts:["For an inventory count","For staff training","Due to a power outage","For a holiday"],c:0},
      {q:"What is offered to customers today?",opts:["A free gift","A 15% discount voucher for next visit","Free shipping","A loyalty card upgrade"],c:1}]},

  {id:"p4_57",type:"Advertisement",voice:"M",
    text:"Struggling to find time for your language learning? With LinguaFlow, fifteen minutes a day is all you need. Our adaptive lessons adjust to your pace, focusing on the words and grammar you actually need. Choose from twenty-three languages, including business English, Mandarin, and French. New users receive a fourteen-day free trial — no credit card required. Try LinguaFlow today at linguaflow.com and join over two million learners worldwide.",
    qs:[
      {q:"What is being advertised?",opts:["A bookstore","A language learning platform","A translation agency","A study-abroad program"],c:1},
      {q:"How many languages are offered?",opts:["Twenty-three","Thirty","Fourteen","Two million"],c:0},
      {q:"What is required for the free trial?",opts:["A subscription fee","A referral code","Nothing — no credit card needed","An email confirmation only"],c:2}]},

  {id:"p4_58",type:"Instructions",voice:"W",
    text:"Welcome to today's professional development workshop. Please make sure you've signed in at the front desk and collected your name badge before we begin. The workbook materials are on the table to your left — feel free to grab them now. We'll have a fifteen-minute coffee break at ten thirty and a one-hour lunch at noon. Lunch is provided in the cafeteria upstairs. If you have any dietary restrictions you haven't shared, please let me know in the next five minutes.",
    qs:[
      {q:"What is the speaker explaining?",opts:["Workshop logistics and schedule","The training content","Emergency procedures","Networking opportunities"],c:0},
      {q:"When is the coffee break?",opts:["At nine thirty","At noon","At ten thirty","After lunch"],c:2},
      {q:"What should attendees do about dietary restrictions?",opts:["Email HR","Inform the speaker within five minutes","Skip the lunch","Bring their own food"],c:1}]},

  {id:"p4_59",type:"Tour guide",voice:"M",
    text:"Welcome to the Greenwood Textile Mill, one of the best-preserved Victorian factories in the region. Built in 1847, this site employed over two thousand workers at its peak in the 1890s. Today's guided tour lasts approximately ninety minutes and covers the original spinning floor, the steam engine room, and a special exhibit on workers' daily lives. Please be aware that some sections involve narrow staircases, which may be challenging for visitors with mobility needs.",
    qs:[
      {q:"What kind of site is being toured?",opts:["A modern factory","An art museum","A historic textile factory","A train station"],c:2},
      {q:"When was the factory built?",opts:["In 1747","In 1847","In 1947","Date unspecified"],c:1},
      {q:"What might be challenging for some visitors?",opts:["Narrow staircases","Loud machinery","Outdoor terrain","Long walking distances"],c:0}]},

  {id:"p4_60",type:"Company update",voice:"W",
    text:"I'm pleased to announce the launch of our new employee wellness program, starting on the first of next month. All full-time staff will be eligible for a monthly fitness allowance of fifty dollars, free access to mental health counseling sessions, and one paid wellness day per quarter. To enroll, log in to the HR portal and complete the short questionnaire by next Friday. Don't hesitate to reach out to HR if you have questions about the program details.",
    qs:[
      {q:"What is being announced?",opts:["A bonus program","A wellness program","A new health insurance plan","A staff retreat"],c:1},
      {q:"How much is the monthly fitness allowance?",opts:["Twenty-five dollars","Forty dollars","Fifty dollars","One hundred dollars"],c:2},
      {q:"What is the deadline to enroll?",opts:["Next Friday","End of the month","First of next month","No deadline mentioned"],c:0}]},

  // ─── PILOT: "Look at the graphic" talks (p4_61–p4_63) — added 2026-06-22 ───
  // ⚠️ NOT LIVE UNTIL AUDIO EXISTS. Needs /audio/p4/{id}.mp3 and {id}_q1..3.mp3.
  //    Until then the talk plays silent in training (regression).
  {id:"p4_61",type:"Announcement",voice:"M",
    text:"Good morning, everyone, and welcome to the annual Marketing Innovation Summit. Before we begin, a few quick notes. The full session schedule is displayed on the screens around the hall. Our opening keynote will start shortly in the Main Auditorium. Please note that the data analytics workshop has been moved to a later time slot because of a speaker's travel delay, so be sure to check the updated schedule for its new time. Lunch will be served in the foyer at noon. Enjoy the summit.",
    qs:[
      {q:"What type of event is taking place?",opts:["A product launch","A marketing summit","A job fair","A shareholder meeting"],c:1},
      {q:"Where will lunch be served?",opts:["In the Main Auditorium","In the foyer","At a nearby restaurant","On the rooftop terrace"],c:1},
      {q:"Look at the graphic. When does the data analytics workshop now begin?",opts:["9:00 AM","11:00 AM","2:00 PM","4:00 PM"],c:2,
        graphic:{type:"table",title:"Summit Schedule",headers:["Session","Time"],rows:[["Opening Keynote","9:00 AM"],["Branding Panel","11:00 AM"],["Data Analytics Workshop","2:00 PM"],["Closing Remarks","4:00 PM"]]}}]},
  {id:"p4_62",type:"Announcement",voice:"W",
    text:"Attention shoppers, and thank you for visiting Brightway Department Store. We're holding our biggest seasonal sale of the year, this weekend only. Discounts vary by department, so please check the signs posted at each section. Our customer service desk on the second floor can help you with returns, gift wrapping, and loyalty card sign-ups. And remember, members with a loyalty card receive an extra ten percent off all marked-down items. Happy shopping.",
    qs:[
      {q:"How long will the sale last?",opts:["One day only","This weekend only","All month","Until supplies run out"],c:1},
      {q:"What extra benefit do loyalty card members receive?",opts:["Free gift wrapping","An extra ten percent off","Free parking","A free tote bag"],c:1},
      {q:"Look at the graphic. Which department offers the largest discount?",opts:["Clothing","Footwear","Home & Kitchen","Electronics"],c:1,
        graphic:{type:"list",title:"Weekend Sale — Discounts by Department",items:["Clothing — 30% off","Footwear — 50% off","Home & Kitchen — 25% off","Electronics — 15% off"]}}]},
  {id:"p4_63",type:"Voicemail",voice:"M",
    text:"Hi, it's Marcus. I'm calling about our trip to the regional office tomorrow. I've looked at the train timetable, and I think we should take an express service so we arrive before the nine-thirty meeting. The local trains stop too many times and would get us there too late. I've forwarded you the timetable. I'd suggest the earliest express so we have a bit of a buffer. Let me know which one works for you, and call me back when you can.",
    qs:[
      {q:"Why is Marcus calling?",opts:["To cancel a meeting","To arrange travel to the regional office","To book a hotel","To reschedule the nine-thirty meeting"],c:1},
      {q:"Why does Marcus prefer an express train?",opts:["It is cheaper","The local trains stop too often and arrive too late","It has more seats","It departs from a closer station"],c:1},
      {q:"Look at the graphic. Which train does Marcus suggest taking?",opts:["The 7:10 local","The 7:45 express","The 8:30 express","The 8:00 local"],c:1,
        graphic:{type:"table",title:"Train Timetable",headers:["Train","Departs","Arrives"],rows:[["Local","7:10 AM","9:50 AM"],["Express","7:45 AM","9:00 AM"],["Express","8:30 AM","9:45 AM"],["Local","8:00 AM","10:20 AM"]]}}]},
  // ── bar-chart graphic pilot (p4_64) — added 2026-06-22 ──
  {id:"p4_64",type:"Meeting excerpt",voice:"M",
    text:"Good afternoon, everyone. Let's take a look at this year's regional sales performance, shown in the chart on the screen. As you can see, the North region was our strongest performer by a wide margin, which is excellent news. Today, though, I want to focus on our weakest region, the one with the lowest sales this year. Starting next quarter, we'll be directing additional marketing resources there to turn things around. Take a moment to review the figures, and then we'll discuss the strategy.",
    qs:[
      {q:"What is the speaker mainly discussing?",opts:["A new product launch","Regional sales performance","A hiring plan","An office relocation"],c:1},
      {q:"According to the speaker, which region performed best?",opts:["North","South","East","West"],c:0},
      {q:"Look at the graphic. Which region will receive additional marketing resources?",opts:["North","South","East","West"],c:2,
        graphic:{type:"bar",title:"Regional Sales This Year",data:[{label:"North",value:480,display:"$480K"},{label:"South",value:310,display:"$310K"},{label:"East",value:190,display:"$190K"},{label:"West",value:350,display:"$350K"}]}}]},
  {id:"p4_65",type:"Automated menu",voice:"M",
    text:"Thank you for calling Brightline Insurance. Your call is important to us. For new policy inquiries, press one. To report a claim, press two. For billing and payment questions, press three. To speak with a representative, please stay on the line, and the next available agent will assist you. Please note that our offices are closed on public holidays. You can also manage your account anytime on our website.",
    qs:[
      {q:"What kind of business is being called?",opts:["A travel agency","An insurance company","A software firm","A bank"],c:1},
      {q:"What should a caller do to report a claim?",opts:["Press one","Press two","Press three","Stay on the line"],c:1},
      {q:"What can callers do on the website?",opts:["Buy a policy in person","Manage their account","Book a repair","Watch a tutorial"],c:1}]},
  {id:"p4_66",type:"Traffic report",voice:"W",
    text:"And now for your afternoon traffic update. Drivers heading downtown should expect major delays on Highway 9, where a lane closure near the Fifth Street exit is causing congestion in both directions. Emergency crews are on the scene, and the lane is expected to reopen by four o'clock. As an alternative, we recommend taking Riverside Drive. Traffic on all other major routes is currently flowing smoothly. Stay tuned for updates on the hour.",
    qs:[
      {q:"Where is the congestion?",opts:["On Riverside Drive","On Highway 9","Near the airport","In the tunnel"],c:1},
      {q:"When is the lane expected to reopen?",opts:["By two o'clock","By three o'clock","By four o'clock","By five o'clock"],c:2},
      {q:"What alternative route is recommended?",opts:["Highway 9","Fifth Street","Riverside Drive","The downtown loop"],c:2}]},
  {id:"p4_67",type:"Weather report",voice:"M",
    text:"Here's your weekend weather forecast. Saturday will start out cloudy, with a chance of light rain in the morning, clearing up by early afternoon. Temperatures will reach a mild eighteen degrees. Sunday looks much brighter, with plenty of sunshine and highs of around twenty-two degrees, perfect for outdoor activities. However, strong winds are expected to move in Sunday evening, so secure any loose items in your garden. Have a great weekend.",
    qs:[
      {q:"What will Saturday morning be like?",opts:["Sunny and warm","Cloudy with light rain","Windy and cold","Foggy"],c:1},
      {q:"What is expected Sunday evening?",opts:["Heavy snow","Strong winds","Thick fog","A heat wave"],c:1},
      {q:"What does the speaker suggest listeners do?",opts:["Carry an umbrella","Secure loose items in the garden","Avoid the roads","Wear a heavy coat"],c:1}]},
  {id:"p4_68",type:"Award ceremony",voice:"W",
    text:"Ladies and gentlemen, it's my great pleasure to introduce tonight's keynote speaker. Dr. Elena Ross has spent over twenty years researching renewable energy and has published more than fifty articles on sustainable technology. She currently leads the clean-energy division at Vantage Labs, where her team recently developed a breakthrough in solar storage. Please join me in giving a warm welcome to Dr. Ross, who will share her vision for the future of green power.",
    qs:[
      {q:"What is the purpose of the talk?",opts:["To open a conference","To introduce a speaker","To present a prize","To thank sponsors"],c:1},
      {q:"What field does Dr. Ross work in?",opts:["Medicine","Renewable energy","Finance","Education"],c:1},
      {q:"What will Dr. Ross talk about?",opts:["Her research methods","The future of green power","Her career path","The company's history"],c:1}]},
  {id:"p4_69",type:"Public service announcement",voice:"M",
    text:"This is a public service announcement from the City Health Department. As flu season approaches, we encourage all residents to get their annual flu vaccination. Free vaccines are available at community clinics throughout the city until the end of November. No appointment is necessary, and walk-ins are welcome during regular business hours. Protecting yourself also helps protect the more vulnerable members of our community. For a list of clinic locations, visit our website.",
    qs:[
      {q:"Who is the announcement from?",opts:["A hospital","The City Health Department","A pharmacy chain","A university"],c:1},
      {q:"What is being offered for free?",opts:["Health checkups","Flu vaccinations","Medicine samples","Fitness classes"],c:1},
      {q:"Until when are the vaccines available?",opts:["The end of October","The end of November","The end of December","The end of the year"],c:1}]},
  {id:"p4_70",type:"Meeting excerpt",voice:"W",
    text:"So that brings us to the third item on the agenda: the office relocation. As you know, our lease expires at the end of the year, and we've been evaluating three possible sites. The committee has narrowed it down to the Harbor District location, which offers more space and better parking. Before we finalize anything, I'd like each department head to submit their space requirements by Friday. We'll review them at next week's meeting.",
    qs:[
      {q:"What is the main topic being discussed?",opts:["A budget cut","An office relocation","A new hire","A product recall"],c:1},
      {q:"Why is the company moving?",opts:["It needs less space","Its lease is expiring","Rent has increased","Staff requested it"],c:1},
      {q:"What are department heads asked to do?",opts:["Approve the budget","Submit their space requirements","Vote on the location","Pack their offices"],c:1}]},
  {id:"p4_71",type:"Event introduction",voice:"M",
    text:"Good evening, and welcome to the fifteenth annual Riverside Food Festival. Over the next three days, more than forty local vendors will be serving dishes from around the world right here in the town square. Live music begins each evening at seven on the main stage. We're also excited to host a cooking competition on Sunday afternoon, judged by several well-known chefs. Admission is free, though donations to the community kitchen are gratefully accepted. Enjoy the festival.",
    qs:[
      {q:"What kind of event is being introduced?",opts:["A music concert","A food festival","A trade show","A sports event"],c:1},
      {q:"How long will the event last?",opts:["One day","Two days","Three days","A week"],c:2},
      {q:"What will happen on Sunday afternoon?",opts:["A live concert","A cooking competition","An award ceremony","A parade"],c:1}]},
  {id:"p4_72",type:"Automated menu",voice:"W",
    text:"You've reached the customer support line for Nova Electronics. To check the status of an existing order, press one. For technical support with a product, press two. To request a return or refund, press three. If you know your representative's extension, you may dial it at any time. Our support team is available Monday through Friday, from eight in the morning until six in the evening. Thank you for choosing Nova Electronics.",
    qs:[
      {q:"What number should a caller press for technical support?",opts:["One","Two","Three","Zero"],c:1},
      {q:"What can callers do if they know an extension?",opts:["Leave a message","Dial it at any time","Press the star key","Wait for an operator"],c:1},
      {q:"When is the support team available?",opts:["Every day","Weekdays from 8 to 6","Weekends only","At all hours"],c:1}]},
  {id:"p4_73",type:"Radio broadcast",voice:"M",
    text:"In local business news, the tech startup Pinegrove announced today that it will open a new regional office in the city center, creating an estimated two hundred jobs over the next two years. The company, which specializes in mobile payment software, cited the area's skilled workforce as a key factor in its decision. Hiring is expected to begin next month, with positions ranging from software engineering to customer support. More details are available on the company's website.",
    qs:[
      {q:"What did Pinegrove announce?",opts:["A merger","The opening of a new office","A new product","Job cuts"],c:1},
      {q:"How many jobs will be created?",opts:["About fifty","About one hundred","About two hundred","About five hundred"],c:2},
      {q:"What does the company specialize in?",opts:["Mobile payment software","Online retail","Video games","Web design"],c:0}]},
  {id:"p4_74",type:"Weather report",voice:"W",
    text:"Good morning. Commuters should prepare for a wet start to the week. A band of heavy rain is moving across the region and will continue through the morning rush hour, so allow extra time for your journey. The rain should ease by midday, giving way to scattered showers in the afternoon. Temperatures will remain cool, around twelve degrees. Drier and warmer conditions are expected to return by midweek. Drive safely out there.",
    qs:[
      {q:"When will the heavy rain continue until?",opts:["Through the afternoon","Through the morning rush hour","Until midweek","All day"],c:1},
      {q:"What is the speaker's advice to commuters?",opts:["Work from home","Allow extra time for the journey","Take the train","Avoid the highway"],c:1},
      {q:"When are drier conditions expected?",opts:["Tomorrow","This evening","By midweek","Next weekend"],c:2}]},
  {id:"p4_75",type:"Award ceremony",voice:"M",
    text:"Before we present tonight's top honor, I'd like to say a few words about our Employee of the Year. Marcus Bell joined the sales team just three years ago and has since become one of our most valued members. This past year, he not only exceeded his own sales targets but also mentored five new hires and led the launch of our regional expansion. His dedication is truly inspiring. Marcus, please come up to accept your award.",
    qs:[
      {q:"What is the purpose of this talk?",opts:["To open a store","To present an award","To introduce a product","To announce results"],c:1},
      {q:"How long has Marcus worked at the company?",opts:["One year","Three years","Five years","Ten years"],c:1},
      {q:"What did Marcus do besides meeting his targets?",opts:["Opened a branch","Mentored new employees","Redesigned the website","Cut costs"],c:1}]},
  {id:"p4_76",type:"Public service announcement",voice:"W",
    text:"Attention residents: the city's water department will be conducting scheduled maintenance on the main pipeline this Thursday. As a result, households in the north district may experience low water pressure or brief interruptions in service between nine a.m. and three p.m. We recommend storing a small supply of water for essential needs during this period. Service will return to normal by the evening. We appreciate your patience and apologize for any inconvenience.",
    qs:[
      {q:"What will happen on Thursday?",opts:["A power outage","Pipeline maintenance","Road closures","A public meeting"],c:1},
      {q:"Which area will be affected?",opts:["The south district","The north district","The city center","The whole city"],c:1},
      {q:"What does the announcement recommend?",opts:["Boiling tap water","Storing water for essential needs","Staying indoors","Reporting leaks"],c:1}]},
  {id:"p4_77",type:"Meeting excerpt",voice:"M",
    text:"Moving on, I want to address the results of last month's customer survey. Overall satisfaction is up by eight percent, which is excellent news. However, one area still needs attention: response times to support tickets. Several customers noted that they waited too long for a reply. I'd like the support team to propose a plan for reducing wait times by our next meeting. Everything else in the survey was very positive, so well done, everyone.",
    qs:[
      {q:"What is the speaker discussing?",opts:["A marketing plan","Customer survey results","A staff party","New software"],c:1},
      {q:"What area needs improvement?",opts:["Product quality","Support response times","Pricing","Delivery speed"],c:1},
      {q:"What does the speaker ask the support team to do?",opts:["Hire more staff","Propose a plan to reduce wait times","Rewrite the survey","Call every customer"],c:1}]},
  {id:"p4_78",type:"Event introduction",voice:"W",
    text:"Welcome, everyone, to this year's Career Development Conference. Over the course of today, you'll have the chance to attend workshops on leadership, networking, and digital skills. Sessions run every hour in the rooms on the second floor, and a full schedule is included in your welcome pack. Lunch will be served in the main hall at noon. Our first keynote begins in fifteen minutes in the auditorium, so please make your way there shortly. We hope you find today valuable.",
    qs:[
      {q:"What type of event is this?",opts:["A job fair","A career development conference","A product launch","A charity gala"],c:1},
      {q:"Where can attendees find the full schedule?",opts:["On the website","In their welcome pack","At the front desk","On the second floor"],c:1},
      {q:"Where should attendees go for the keynote?",opts:["The main hall","The auditorium","The second floor","The lobby"],c:1}]},
  {id:"p4_79",type:"Automated menu",voice:"M",
    text:"Thank you for calling the Grandview Medical Center. If this is a medical emergency, please hang up and dial your local emergency number immediately. To schedule or change an appointment, press one. To reach the pharmacy, press two. For billing inquiries, press three. To repeat this menu, press the star key. Our regular hours are Monday through Saturday, eight to five. Your call may be recorded for quality purposes. Please hold for the next available operator.",
    qs:[
      {q:"What should a caller do in a medical emergency?",opts:["Press one","Hang up and dial emergency services","Press the star key","Hold the line"],c:1},
      {q:"What number reaches the pharmacy?",opts:["One","Two","Three","The star key"],c:1},
      {q:"Why might the call be recorded?",opts:["For legal reasons","For quality purposes","For billing","To train new staff"],c:1}]},
  {id:"p4_80",type:"Traffic report",voice:"W",
    text:"Time now for the morning traffic. Roadworks on the Northern Bridge are down to a single lane, and drivers are facing delays of up to twenty minutes heading into the city. If you can, consider using the tunnel as an alternative this morning. Elsewhere, an earlier breakdown on Route 12 has now been cleared, and traffic is returning to normal. Public transport is running on schedule. We'll have another update in thirty minutes.",
    qs:[
      {q:"What is causing delays on the Northern Bridge?",opts:["An accident","Roadworks","Bad weather","A protest"],c:1},
      {q:"What alternative does the reporter suggest?",opts:["Route 12","The tunnel","The train","The bridge"],c:1},
      {q:"What is the status of public transport?",opts:["Delayed","Running on schedule","Cancelled","Overcrowded"],c:1}]},
  {id:"p4_81",type:"Workshop excerpt",voice:"M",
    text:"Alright, let's begin the second part of today's workshop on effective presentations. In this section, we'll focus on engaging your audience. The key principle to remember is simple: tell a story, don't just list facts. People remember narratives far better than statistics. In a moment, I'll ask each of you to take a dry topic and turn it into a two-minute story. Don't worry about being perfect; this is a space to practice and get feedback.",
    qs:[
      {q:"What is the workshop about?",opts:["Time management","Giving effective presentations","Team building","Writing reports"],c:1},
      {q:"What key principle does the speaker mention?",opts:["Keep slides simple","Tell a story rather than list facts","Speak slowly","Always use humor"],c:1},
      {q:"What will participants do next?",opts:["Watch a video","Turn a topic into a short story","Take a quiz","Grade the speaker"],c:1}]},
  {id:"p4_82",type:"Award ceremony",voice:"W",
    text:"It's now my honor to introduce the recipient of this year's Community Leadership Award. For over a decade, Ms. Grace Okafor has volunteered with local youth programs, helping hundreds of young people find training and employment. Last year, she founded a mentorship network that has already paired more than three hundred students with working professionals. Her tireless commitment has made a real difference in this city. Please welcome Ms. Okafor to the stage.",
    qs:[
      {q:"What award is being presented?",opts:["Employee of the Year","A community leadership award","A sales award","A safety award"],c:1},
      {q:"What did Ms. Okafor found last year?",opts:["A youth program","A mentorship network","A training school","A charity shop"],c:1},
      {q:"Who does her work mainly help?",opts:["Senior citizens","Young people","New businesses","Local artists"],c:1}]},
  {id:"p4_83",type:"Public service announcement",voice:"M",
    text:"This message is brought to you by the Regional Fire Service. With the dry summer months ahead, we're reminding everyone to take simple steps to prevent fires. Never leave cooking unattended, keep matches and lighters away from children, and make sure your smoke alarms are working. Test your alarms once a month and replace the batteries at least once a year. A working smoke alarm can save lives. For more safety tips, visit our website. Stay safe.",
    qs:[
      {q:"Who is the message from?",opts:["The police","The Regional Fire Service","The weather bureau","A power company"],c:1},
      {q:"How often should smoke alarms be tested?",opts:["Once a week","Once a month","Once a year","Every day"],c:1},
      {q:"What is the main goal of the message?",opts:["To sell alarms","To promote fire safety","To report a fire","To recruit firefighters"],c:1}]},
  {id:"p4_84",type:"Weather report",voice:"W",
    text:"And here's a look at today's conditions for the coast. Expect bright sunshine throughout the morning, with temperatures climbing to a warm twenty-six degrees by midday. It will be an excellent day for the beach, though we advise applying sunscreen and staying hydrated. Later this afternoon, a light sea breeze will bring some welcome relief from the heat. There's no rain in the forecast until at least the weekend. Enjoy the sunshine.",
    qs:[
      {q:"What will the weather be like today?",opts:["Rainy and cool","Sunny and warm","Cloudy and windy","Cold and foggy"],c:1},
      {q:"What does the speaker advise listeners to do?",opts:["Carry an umbrella","Apply sunscreen and stay hydrated","Stay indoors","Wear warm clothes"],c:1},
      {q:"When is rain expected?",opts:["This afternoon","This evening","Not until at least the weekend","Tomorrow morning"],c:2}]},
  {id:"p4_85",type:"Automated menu",voice:"M",
    text:"You have reached the reservations line for the Lakeside Hotel and Spa. To make a new booking, press one. To modify or cancel an existing reservation, press two. For information about our spa and dining services, press three. For all other inquiries, please remain on the line. Please have your reservation number ready if you are calling about an existing booking. Thank you for choosing Lakeside, where your comfort is our priority.",
    qs:[
      {q:"What business is being called?",opts:["A restaurant","A hotel","A spa supplier","A travel agency"],c:1},
      {q:"What number is for modifying a reservation?",opts:["One","Two","Three","Zero"],c:1},
      {q:"What should callers with an existing booking have ready?",opts:["A credit card","Their reservation number","A photo ID","A loyalty card"],c:1}]},
  {id:"p4_86",type:"Radio broadcast",voice:"W",
    text:"You're listening to City Sounds, and coming up after the break, we'll be talking to local author Daniel Frost about his new novel, which hits bookstores this Friday. He'll be reading a short passage and answering your questions live, so have them ready. Later in the hour, we'll announce the winners of our concert ticket giveaway. But first, here's the latest single from a band that's been climbing the charts all month. Don't go anywhere.",
    qs:[
      {q:"Who will be interviewed after the break?",opts:["A musician","A local author","A film director","A chef"],c:1},
      {q:"What will the guest do during the interview?",opts:["Perform a song","Read a passage and answer questions","Show a film clip","Cook a dish"],c:1},
      {q:"What will be announced later in the hour?",opts:["The weather","The winners of a ticket giveaway","A new song","A traffic update"],c:1}]},
  {id:"p4_87",type:"Meeting excerpt",voice:"M",
    text:"Before we wrap up, I want to briefly cover the new expense policy, which takes effect next Monday. From now on, all expense claims must be submitted through the online portal rather than on paper. Receipts should be scanned and attached to each claim. Any claim over five hundred dollars will require approval from a manager before processing. If you have trouble accessing the portal, contact the finance team. That's all for today; thank you all for coming.",
    qs:[
      {q:"What is the speaker mainly discussing?",opts:["A hiring freeze","A new expense policy","A holiday schedule","A software update"],c:1},
      {q:"How must expense claims now be submitted?",opts:["On paper","Through the online portal","By email","In person"],c:1},
      {q:"What requires manager approval?",opts:["All claims","Claims over five hundred dollars","Travel claims only","Late claims"],c:1}]},
  {id:"p4_88",type:"Event introduction",voice:"W",
    text:"Welcome to the grand opening of our newest branch here in the Westfield shopping center. To celebrate, we're offering twenty percent off all purchases this weekend only. Our staff will be on hand to demonstrate our latest products, and there will be free samples and refreshments throughout the day. Be sure to enter our prize draw at the front desk for a chance to win a gift card. Thank you for helping us celebrate; enjoy your visit.",
    qs:[
      {q:"What is being celebrated?",opts:["A company anniversary","The opening of a new store","A product launch","A holiday sale"],c:1},
      {q:"What discount is offered this weekend?",opts:["Ten percent","Twenty percent","Thirty percent","Fifty percent"],c:1},
      {q:"How can visitors enter the prize draw?",opts:["Online","At the front desk","By making a purchase","By subscribing"],c:1}]},
  {id:"p4_89",type:"Public service announcement",voice:"M",
    text:"The Department of Transport would like to remind all cyclists and drivers to share the road safely. Cyclists should always wear a helmet, use lights after dark, and signal clearly when turning. Drivers, please allow at least one and a half meters when overtaking a bicycle. A few moments of patience can prevent a serious accident. Together, we can make our streets safer for everyone. This has been a message from the Department of Transport.",
    qs:[
      {q:"Who is this message aimed at?",opts:["Pedestrians only","Cyclists and drivers","Bus passengers","Delivery workers"],c:1},
      {q:"What should cyclists do after dark?",opts:["Avoid main roads","Use lights","Wear bright colors","Ride slowly"],c:1},
      {q:"How much space should drivers allow when overtaking?",opts:["Half a meter","One meter","At least one and a half meters","Three meters"],c:2}]},
  {id:"p4_90",type:"Award ceremony",voice:"W",
    text:"Good afternoon. It gives me great pleasure to introduce our guest lecturer for today's seminar. Professor James Ndiaye is an economist whose work on small-business growth has influenced policy in several countries. He has advised governments, written two best-selling books, and taught at universities across three continents. Today, he'll be discussing practical strategies that entrepreneurs can use to grow in uncertain times. I'm sure you'll find his talk both insightful and useful. Please welcome Professor Ndiaye.",
    qs:[
      {q:"What is Professor Ndiaye's profession?",opts:["A lawyer","An economist","A journalist","An engineer"],c:1},
      {q:"What will he discuss today?",opts:["His new book","Strategies for business growth","Government policy","University life"],c:1},
      {q:"What have his two books become?",opts:["Textbooks","Best-sellers","Award winners","Films"],c:1}]},
  {id:"p4_91",type:"Traffic report",voice:"M",
    text:"Here's your evening commute update. An accident on the eastbound expressway near Junction 6 has closed two lanes, and traffic is backed up for nearly five kilometers. Recovery vehicles are on their way, but delays are likely to continue for at least the next hour. If your route allows, the coastal road is currently a faster option. Meanwhile, the city center remains busy as usual, so patience is key. We'll keep you posted as the situation clears.",
    qs:[
      {q:"What has closed two lanes?",opts:["Roadworks","An accident","Flooding","A parade"],c:1},
      {q:"How long are delays expected to last?",opts:["A few minutes","At least the next hour","Until morning","All evening"],c:1},
      {q:"What alternative route is suggested?",opts:["The expressway","The coastal road","The city center","Junction 6"],c:1}]},
  {id:"p4_92",type:"Workshop excerpt",voice:"W",
    text:"Welcome back from the break. In this final session, we're going to talk about time management. One technique I highly recommend is grouping similar tasks together and handling them in a single block, rather than switching between different types of work all day. Constant switching wastes energy and reduces focus. For the next activity, I'd like you to look at your typical week and identify tasks you could group. We'll share our ideas in about ten minutes.",
    qs:[
      {q:"What is the session about?",opts:["Public speaking","Time management","Customer service","Budgeting"],c:1},
      {q:"What technique does the speaker recommend?",opts:["Taking frequent breaks","Grouping similar tasks together","Making to-do lists","Delegating work"],c:1},
      {q:"What will participants do next?",opts:["Watch a demonstration","Identify tasks they could group","Take a short test","Present their week"],c:1}]},
  {id:"p4_93",type:"Automated menu",voice:"M",
    text:"Thank you for calling City Central Library. The library is currently closed. Our opening hours are Monday to Friday, nine to eight, and Saturday, ten to five. To renew a book, please press one and enter your membership number. To hear information about upcoming events, press two. To leave a message for a staff member, press three after the tone. You can also access our full catalogue and renew items online at any time. Goodbye.",
    qs:[
      {q:"Why can't the caller reach a staff member right now?",opts:["The lines are busy","The library is closed","It is a public holiday","The system is down"],c:1},
      {q:"What should a caller do to renew a book?",opts:["Press two","Press one and enter a membership number","Visit in person","Press three"],c:1},
      {q:"What can be done online at any time?",opts:["Pay a fine","Access the catalogue and renew items","Book a room","Contact a librarian"],c:1}]},
  {id:"p4_94",type:"Workshop excerpt",voice:"W",
    text:"Alright, let's start our session on customer service. Today's focus is handling difficult conversations. When a customer is upset, the most important first step is to listen, really listen, without interrupting. Acknowledge their frustration before you offer a solution. People want to feel heard. In a few minutes, we'll do some role-play exercises in pairs, where one of you plays an unhappy customer and the other practices these techniques. Let's make this as realistic as we can.",
    qs:[
      {q:"What is today's session about?",opts:["Sales techniques","Handling difficult conversations","Writing emails","Managing a team"],c:1},
      {q:"What is the most important first step with an upset customer?",opts:["Offer a refund","Listen without interrupting","Apologize immediately","Call a manager"],c:1},
      {q:"What will participants do in a few minutes?",opts:["Watch a video","Do role-play exercises in pairs","Write a report","Take a break"],c:1}]}
];