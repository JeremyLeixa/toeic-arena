// The Waygates : les mondes (2026-09-25). PUR et SANS DONNÉES, comme officeGrades.js : lu par App.jsx (worldDone), le
// hub Waygates et la tuile Games. Tout ce qui tire les banques P3 / P4 / P7 vit dans lib/officeDay.js (chunk lazy).
//
// Un monde = le MÊME moteur (horloge, grades, réputation, réponses versées dans lisP3 / lisP4 / p7), avec un autre
// décor et un autre vivier (choix de Jérémy : ne pas complexifier chaque monde). Ce qu'un monde déclare :
//   modId      module moduleScores de la journée (XP, anti-farming, historique)
//   repKey     clé de gameScores où vit sa réputation {rep, days, bestStars, …} (jsonb déjà synchronisé)
//   name       nom affiché ; company : ligne sous l'heure ; person : l'interlocuteur (PEOPLE de officeDay.js)
//   desk / wait : libellés de la liste des tâches et du bouton qui saute les temps morts
//   announce   ce que dit le toast quand une annonce (P4 kind "announce") commence
//   rules      les trois règles de l'accueil : [texte, gras, texte] par ligne
//   quit       la feuille « Leave this round? » ; empty : la phrase du bilan d'une journée sans une réponse
//   prep       null, ou la règle « prévu = paré » du monde (Jet Lag : bulletin → perturbation ; Front Desk : point du
//              matin → client mécontent). Tâche `prep` comprise en entier → +PREP_BONUS rep quand la tâche `prepHit`
//              arrive ; sinon l'horloge saute de PREP_DELAY min. Les textes vivent ici, le moteur est le même.
export var WORLD_META = {
  office: { id: "office", modId: "office", repKey: "officeDay", name: "Nine to Five", company: "Meridian Harbor Group", person: "dana",
    desk: "On your desk", wait: "Grab a coffee · wait for the next task", announce: "Announcement",
    rules: [["Your day runs from ", "9:00 to 17:00", ". Work comes in all day."],
      ["", "Calls and meetings don't wait.", " Read the questions while you listen."],
      ["Whatever is still on your desk at 17:00 stays undone.", "", ""]],
    quit: { title: "Leave the office?", body: "Today's answers won't be saved.", stay: "Back to work", leave: "Leave" },
    empty: "Nothing got filed today. Tomorrow, start with the desk: the first email is right there at 9:00.",
    prep: null },
  travel: { id: "travel", modId: "travel", repKey: "travelDay", name: "Jet Lag", company: "Business trip", person: "maya",
    desk: "Your trip", wait: "Wait in the lounge · skip to the next event", announce: "Announcement for passengers",
    rules: [["Your day runs from ", "9:00 to 17:00", ". Your trip can change at any time."],
      ["", "Announcements don't wait.", " Read the questions while you listen."],
      ["Listen to the forecast carefully: ", "travellers who plan ahead don't get stuck.", ""]],
    quit: { title: "Cancel the trip?", body: "Today's answers won't be saved.", stay: "Keep travelling", leave: "Leave" },
    empty: "Nothing got handled today. Tomorrow, start with the forecast at 9:00: the rest of the trip follows.",
    // Messages d'ANTICIPATION, jamais d'orage : une seule des perturbations du vivier est due à la météo (p4_02).
    prep: { hud: "Weather", arrive: "Weather forecast on the radio", doneLead: "", doneOk: "you're ready for it", doneKo: "some details slipped past you",
      okWord: "", koWord: "",
      ready: "You planned ahead: the delay doesn't catch you out", caught: "Caught out at the gate",
      reviewReady: "You planned ahead: the delay didn't catch you out", reviewCaught: "The delay caught you out at the gate",
      reviewCaughtTail: "Travellers who check the forecast leave themselves a margin." } },
  service: { id: "service", modId: "service", repKey: "serviceDay", name: "Front Desk", company: "Halden & Co. · Customer care", person: "priya",
    desk: "Your counter", wait: "Tidy the shelves · skip to the next customer", announce: "Announcement to shoppers",
    rules: [["Your day runs from ", "9:00 to 17:00", ". Customers come in all day."],
      ["", "Customers don't wait.", " Neither does the phone. Read the questions while you listen."],
      ["Listen to the morning huddle carefully: ", "a difficult customer is coming.", ""]],
    quit: { title: "Close the counter?", body: "Today's answers won't be saved.", stay: "Back to the counter", leave: "Leave" },
    empty: "Nobody got served today. Tomorrow, start with the huddle at 9:00: the rest of the day follows.",
    prep: { hud: "Huddle", arrive: "The morning huddle is starting", doneLead: "Huddle over", doneOk: "you know what to do", doneKo: "some advice slipped past you",
      okWord: "briefed", koWord: "half-briefed",
      ready: "An upset customer. You know what to do", caught: "An upset customer asks for the manager",
      reviewReady: "The upset customer left calm: you did what the huddle said", reviewCaught: "The upset customer asked for the manager",
      reviewCaughtTail: "The huddle had the answer." } },
};
export function worldMeta(id) { return WORLD_META[id] || WORLD_META.office; }
// Réputation du profil dans un monde.
export function worldRep(u, id) {
  var k = worldMeta(id).repKey;
  return (u && u.gameScores && u.gameScores[k] && +u.gameScores[k].rep) || 0;
}
// Règle « prévu = paré » (Jet Lag W2, Front Desk S2) : tâche de préparation comprise en entier → bonus à l'arrivée de la
// tâche qui en dépend ; sinon, retard.
export var PREP_BONUS = 15, PREP_DELAY = 45;
