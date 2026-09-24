// Nine to Five (The Waygates, 2026-09-24) : grades et bornes de réputation. PUR et SANS DONNÉES, à part de
// lib/officeDay.js exprès : App.jsx (officeDone) et la tuile du hub Games en ont besoin, et officeDay.js
// importe les banques P3, P4 et P7, qui doivent rester dans le chunk chargé à la demande de l'écran.
// Testé par tests/check_office_day.cjs (via la réexportation de officeDay.js).

export var REP_PER_CORRECT = 4, REP_PER_TASK = 6, REP_MAX_GAIN = 200;

// Grades : la réputation ne baisse JAMAIS (leçon de Mimic Hunt : un compteur qui recule fait lâcher le
// module) ; une tâche manquée ne rapporte simplement rien. Horloge clémente en bas (choix de Jérémy) :
// à 0,6 min de jeu par seconde, la journée d'un Intern dure 13 min réelles au plus.
//   speed   minutes de jeu par seconde réelle      ringFor  minutes avant qu'un direct soit manqué
//   tasks   tâches dans la journée                  multi    0 simples, 2 + doubles, 3 + triples
export var GRADES = [
  { id: "intern", name: "Intern", rep: 0, speed: 0.6, ringFor: 45, tasks: 4, multi: 0 },
  { id: "junior", name: "Junior Associate", rep: 100, speed: 0.7, ringFor: 40, tasks: 4, multi: 0 },
  { id: "associate", name: "Associate", rep: 250, speed: 0.8, ringFor: 30, tasks: 5, multi: 2, unlock: "Double-document files" },
  { id: "senior", name: "Senior Associate", rep: 500, speed: 0.9, ringFor: 25, tasks: 5, multi: 2, unlock: "A faster clock" },
  { id: "lead", name: "Team Lead", rep: 900, speed: 1, ringFor: 20, tasks: 5, multi: 3, unlock: "Triple-document files" },
  { id: "manager", name: "Manager", rep: 1400, speed: 1, ringFor: 20, tasks: 6, multi: 3, unlock: "A sixth task every day" },
  { id: "director", name: "Director", rep: 2200, speed: 1, ringFor: 20, tasks: 6, multi: 3, unlock: "The corner office" },
];
export function gradeOf(rep) {
  var g = GRADES[0];
  GRADES.forEach(function (x) { if ((rep || 0) >= x.rep) g = x; });
  return g;
}
export function nextGrade(rep) { return GRADES.find(function (x) { return x.rep > (rep || 0); }) || null; }
// Réputation du profil (gameScores.officeDay.rep, écrit par officeDone dans App.jsx).
export function officeRep(u) { return (u && u.gameScores && u.gameScores.officeDay && +u.gameScores.officeDay.rep) || 0; }
