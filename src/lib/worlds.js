// The Waygates : les mondes (2026-09-25). PUR et SANS DONNÉES, comme officeGrades.js : lu par App.jsx (worldDone), le
// hub Waygates et la tuile Games. Tout ce qui tire les banques P3 / P4 / P7 vit dans lib/officeDay.js (chunk lazy).
//
// Un monde = le MÊME moteur (horloge, grades, réputation, réponses versées dans lisP3 / lisP4 / p7), avec un autre
// décor et un autre vivier (choix de Jérémy : ne pas complexifier chaque monde). Ce qu'un monde déclare :
//   modId      module moduleScores de la journée (XP, anti-farming, historique)
//   repKey     clé de gameScores où vit sa réputation {rep, days, bestStars, …} (jsonb déjà synchronisé)
//   name       nom affiché ; company : ligne sous l'heure ; person : l'interlocuteur (PEOPLE de officeDay.js)
//   desk / wait : libellés de la liste des tâches et du bouton qui saute les temps morts
//   weather    true : bulletin à 9:00 et règle « prévu = paré » (Jet Lag)
export var WORLD_META = {
  office: { id: "office", modId: "office", repKey: "officeDay", name: "Nine to Five", company: "Meridian Harbor Group", person: "dana",
    desk: "On your desk", wait: "Grab a coffee · wait for the next task", weather: false },
  travel: { id: "travel", modId: "travel", repKey: "travelDay", name: "Jet Lag", company: "Business trip", person: "maya",
    desk: "Your trip", wait: "Wait in the lounge · skip to the next event", weather: true },
};
export function worldMeta(id) { return WORLD_META[id] || WORLD_META.office; }
// Réputation du profil dans un monde.
export function worldRep(u, id) {
  var k = worldMeta(id).repKey;
  return (u && u.gameScores && u.gameScores[k] && +u.gameScores[k].rep) || 0;
}
// Règle « prévu = paré » (Jet Lag, variante W2) : bulletin compris en entier → bonus à la perturbation ; sinon, retard.
export var WEATHER_BONUS = 15, WEATHER_DELAY = 45;
