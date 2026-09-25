// Nine to Five (hub The Waygates, 2026-09-24) — une journée de bureau composée à partir des banques
// existantes (Parts 3, 4 et 7). PUR : tests/check_office_day.cjs. Proto : prototypes/office-day/.
//
// Rien de neuf dans les questions : texte, options et explications restent ceux du TOEIC. Ce module ne
// fait que HABILLER (qui envoie, pourquoi, pour quand) et PLACER dans la journée. Le grade du joueur
// règle la clémence (vitesse de l'horloge, durée de sonnerie), le nombre de tâches et les formats
// débloqués (Part 7 double puis triple).
//
// Les minutes sont des minutes de JEU depuis 9:00 (0 → 480 = 17:00).
import { LISTENING_P3, LISTENING_P4 } from "../data/listening.js";
import { PART7_PASSAGES } from "../data/part7.js";

import { GRADES, REP_MAX_GAIN, REP_PER_CORRECT, REP_PER_TASK, gradeOf, nextGrade, officeRep } from "./officeGrades.js";
export { GRADES, REP_MAX_GAIN, REP_PER_CORRECT, REP_PER_TASK, gradeOf, nextGrade, officeRep };

export var DAY_START = 9 * 60, DAY_LEN = 8 * 60;
export var REPLAY_COST = 15;         // « Sorry, could you repeat that? » : 15 min de jeu

export var COMPANY = "Meridian Harbor Group";
export var PEOPLE = {
  dana: { name: "Dana Whitfield", role: "Your manager", initials: "DW", hue: 214 },
  marcus: { name: "Marcus Bell", role: "Support desk", initials: "MB", hue: 28 },
  maya: { name: "Maya Ortiz", role: "Travel coordinator", initials: "MO", hue: 170 },
};

// Grades, réputation du profil et bornes : lib/officeGrades.js (sans données, lu aussi par App.jsx).

export function fmtClock(min) {
  var t = DAY_START + Math.max(0, Math.floor(min));
  var h = Math.floor(t / 60), m = t % 60;
  return h + ":" + (m < 10 ? "0" : "") + m;
}

// ── Habillage ────────────────────────────────────────────────────────────────────────────────
// Parts 3 : habillage GÉNÉRIQUE. Jamais de sujet tiré du contenu : « Trade show booth » répondrait à
// « What are the speakers discussing? » avant l'écoute.
var P3_SCENES = [
  { kind: "chat", from: "Two colleagues", subject: "A conversation at the coffee machine", ask: { who: "dana", text: "People are talking at the coffee machine. Worth catching." } },
  { kind: "call", from: "Marcus Bell · Support desk", subject: "A call on speaker", ask: { who: "marcus", text: "Can you listen in on this call with me?" } },
  { kind: "meeting", from: "Meeting room B", subject: "A quick meeting", ask: { who: "dana", text: "Sit in on this one and tell me what was decided." } },
];
// Parts 4 : un message qu'on écoute quand on veut (boîte vocale, avec échéance), ou un direct qui
// commence à heure fixe (annonce, réunion…) et qu'on rate si on n'y va pas.
var P4_RECORDED = { "Voicemail": 1, "Recorded message": 1, "Automated menu": 1 };
var P4_LABEL = {
  "Voicemail": "Voicemail", "Recorded message": "Recorded message", "Automated menu": "Phone menu",
  "Announcement": "Announcement", "Public service announcement": "Announcement", "Company update": "Company update",
  "Meeting excerpt": "Meeting", "Meeting introduction": "Meeting", "Training session": "Training session",
  "Workshop excerpt": "Workshop", "Orientation": "Orientation", "Event introduction": "Event", "Award ceremony": "Award ceremony",
  "Tour guide": "Guided tour", "Tour": "Guided tour", "News report": "Radio news", "Radio broadcast": "Radio",
  "Radio program": "Radio", "Traffic report": "Traffic report", "Weather report": "Weather report",
  "Advertisement": "Radio ad", "Instructions": "Briefing",
};
// Parts 7 : courrier (en-têtes lus), fil de messages, document, ou dossier à plusieurs pièces.
var P7_KIND = {
  "Email": "mail", "Memo": "mail", "Letter": "mail", "Meeting Minutes": "mail", "Report": "mail", "Invoice": "mail",
  "Text Message Chain": "phone", "Online Chat": "phone",
  "Double Passage": "file", "Triple Passage": "file",
};
var ASK_DOC = [
  "Can you go through this and flag what matters?", "Read this before it's due, please.",
  "I need the details from this one.", "Have a look and let me know.",
];
var ASK_PHONE = ["You're in this chat. Catch up on it, please.", "Check this thread, they need an answer."];
var ASK_FILE = ["These documents go together. Cross-check them for me.", "Put these side by side and tell me what fits."];
var ASK_MSG = ["Someone left you a message. What do they need?", "There's a message waiting for you."];
var ASK_LIVE = ["It starts soon. Go and listen.", "Be there, I'll want the key points."];

function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length) % arr.length]; }
function shuffled(arr, rnd) {
  var b = arr.slice();
  for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
  return b;
}
function headerOf(text, key) {
  var m = new RegExp("^" + key + ":\\s*(.+)$", "m").exec(text || "");
  return m ? m[1].trim() : null;
}
function firstLine(text) {
  var lines = String(text || "").split("\n").map(function (l) { return l.trim(); })
    .filter(function (l) { return l && !/^---.*---$/.test(l) && !/^(From|To|Date|Cc|Subject|Re):/i.test(l); });
  return lines[0] || "";
}
// Titres d'affiche (« BUSINESS TRIP ITINERARY ») : ramenés en casse de titre pour la boîte de réception.
function calm(s) {
  if (!/[a-z]/.test(s) && /[A-Z]{3}/.test(s)) return s.toLowerCase().replace(/(^|[\s\-—(/])([a-z])/g, function (m, p, c) { return p + c.toUpperCase(); });
  return s;
}
function clip(s, n) { s = calm(String(s || "")); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; }

export function p7Kind(type) { return P7_KIND[type] || "doc"; }
export function p7Level(type) { return type === "Triple Passage" ? 3 : type === "Double Passage" ? 2 : 1; }

function dressP7(ps, rnd) {
  var kind = p7Kind(ps.type);
  var from = headerOf(ps.text, "From"), subject = headerOf(ps.text, "Subject");
  if (kind === "file") {
    return { kind: kind, from: "Case file · " + (p7Level(ps.type) === 3 ? "3" : "2") + " documents", subject: clip(subject || firstLine(ps.text), 60),
      ask: { who: "dana", text: pick(ASK_FILE, rnd) } };
  }
  if (kind === "phone") return { kind: kind, from: "Group chat", subject: ps.type === "Online Chat" ? "Online chat" : "Text messages", ask: { who: "dana", text: pick(ASK_PHONE, rnd) } };
  return { kind: kind, from: from ? clip(from, 48) : ps.type, subject: clip(subject || firstLine(ps.text), 60), ask: { who: "dana", text: pick(ASK_DOC, rnd) } };
}
function dressP4(it, rnd) {
  var label = P4_LABEL[it.type] || it.type;
  if (P4_RECORDED[it.type]) return { kind: "voicemail", from: label, subject: "A new message", ask: { who: "dana", text: pick(ASK_MSG, rnd) } };
  return { kind: "live", from: label, subject: label + " starting", ask: { who: "dana", text: pick(ASK_LIVE, rnd) } };
}

// ── Composition d'une journée ───────────────────────────────────────────────────────────────
// Répartition des tâches par nombre : les Parts 3 pèsent le plus au Listening (39 Q à l'examen),
// la Part 7 le plus au Reading (54 Q). 4 → 2 P7 + 1 P3 + 1 P4 ; 5 → 2 + 2 + 1 ; 6 → 3 + 2 + 1.
var MIX = { 4: [2, 1, 1], 5: [2, 2, 1], 6: [3, 2, 1] };

// rep : réputation actuelle. rnd : générateur [0,1) (injecté par les tests). world : "office" (défaut) | "travel".
// Rend {grade, brief, tasks:[{id, mod, itemId, kind, from, subject, ask, at, due, ringFor, live}]}
//   mod    "p7" | "lisP3" | "lisP4" (le module où la réponse compte : refs et moduleScores)
//   live   true : direct à heure fixe (sonne `ringFor` minutes puis est manqué) ; false : boîte, `due`
export function composeDay(rep, rnd, world) {
  rnd = rnd || Math.random;
  if (world === "travel") return composeTravel(rep, rnd);
  var g = gradeOf(rep), mix = MIX[g.tasks] || MIX[4];
  var p7pool = PART7_PASSAGES.filter(function (x) { return x.questions && x.questions.length && p7Level(x.type) <= Math.max(1, g.multi); });
  // Au grade qui débloque un format, en garantir un par journée : le déblocage doit se voir.
  var multi = g.multi >= 2 ? shuffled(p7pool.filter(function (x) { return p7Level(x.type) === g.multi; }), rnd).slice(0, 1) : [];
  var singles = shuffled(p7pool.filter(function (x) { return multi.indexOf(x) < 0 && p7Level(x.type) === 1; }), rnd);
  var p7s = multi.concat(singles).slice(0, mix[0]);
  var p3s = shuffled(LISTENING_P3.filter(function (x) { return x.lines && x.qs && x.qs.length; }), rnd).slice(0, mix[1]);
  var p4s = shuffled(LISTENING_P4.filter(function (x) { return x.text && x.qs && x.qs.length; }), rnd).slice(0, mix[2]);

  var tasks = [];
  p7s.forEach(function (ps) { tasks.push(Object.assign({ mod: "p7", itemId: ps.id, live: false }, dressP7(ps, rnd))); });
  var scenes = shuffled(P3_SCENES, rnd);
  p3s.forEach(function (it, i) { tasks.push(Object.assign({ mod: "lisP3", itemId: it.id, live: true }, scenes[i % scenes.length])); });
  p4s.forEach(function (it) { var d = dressP4(it, rnd); tasks.push(Object.assign({ mod: "lisP4", itemId: it.id, live: d.kind === "live" }, d)); });

  // Horaires. Deux premiers documents sur le bureau à 9:00 ; le reste arrive par créneaux répartis sur
  // toute la journée à partir de 10:00 (un créneau par tâche, position tirée dans la première moitié du
  // créneau : jamais deux arrivées collées). Les directs finissent de sonner avant 17:00 ; « Grab a
  // coffee » saute les temps morts, une journée aérée ne s'allonge donc pas.
  var docs = tasks.filter(function (t) { return t.mod === "p7"; });
  var rest = shuffled(tasks.filter(function (t) { return t.mod !== "p7"; }).concat(docs.slice(2)), rnd);
  docs.slice(0, 2).forEach(function (t, i) { t.at = 0; t.due = i === 0 ? 180 : null; });
  var from = 60, to = DAY_LEN - (g.ringFor + 15), step = rest.length ? (to - from) / rest.length : 0;
  rest.forEach(function (t, i) {
    t.at = Math.floor(from + i * step + rnd() * step * 0.5);
    if (t.live) { t.ringFor = g.ringFor; t.due = null; }
    else { var due = t.at + 150; t.due = due <= DAY_LEN - 30 ? due : null; }
  });
  tasks.sort(function (a, b) { return a.at - b.at; });
  tasks.forEach(function (t, i) { t.id = "t" + (i + 1); if (t.ringFor == null) t.ringFor = null; if (t.due === undefined) t.due = null; });
  return { grade: g, brief: briefFor(tasks), tasks: tasks };
}

// Le brief du matin ANNONCE la journée : c'est de l'anticipation, sans le dire.
function briefFor(tasks) {
  var parts = ["Morning!"];
  var first = tasks.find(function (t) { return t.mod === "p7" && t.due != null; });
  if (first) {
    var what = first.kind === "file" ? "a case file" : first.kind === "phone" ? "a message thread"
      : first.kind === "mail" && first.from.indexOf(",") > 0 ? "an email from " + first.from.split(",")[0]
      : "a " + first.from.toLowerCase();
    parts.push("There's " + what.replace(/^a ([aeiou])/, "an $1") + " on your desk: I need it before " + fmtClock(first.due) + ".");
  }
  var live = tasks.filter(function (t) { return t.live; });
  if (live.length) parts.push(live.length === 1 ? "One thing to catch live today, around " + fmtClock(live[0].at) + "." : live.length + " things to catch live today, the first around " + fmtClock(live[0].at) + ". They won't wait.");
  if (tasks.some(function (t) { return t.kind === "voicemail"; })) parts.push("And keep an ear on your voicemail.");
  return parts.join(" ");
}

// ── Jet Lag : le monde voyage (2026-09-25) ────────────────────────────────────────────────────
// Vivier relu et validé par Jérémy (prototypes/travel-day/review.html) : SEULS ces items entrent dans une journée.
// Un item ajouté ici doit être vraiment « voyage » (ou un bulletin météo) : le test le vérifie dans les banques.
export var TRAVEL_POOL = {
  p3: ["p3_92", "p3_72", "p3_08", "p3_34", "p3_40", "p3_29"],
  // Bulletins : l'étiquette que la barre du haut affiche une fois le bulletin entendu (lue dans chaque texte).
  forecast: { p4_17: "Rain this afternoon", p4_67: "Light rain, then sun", p4_84: "Sunny, 26°", p4_74: "Heavy rain" },
  // Perturbations annoncées en aérogare ou en gare. Seule p4_02 est due à la météo : la règle « prévu = paré » parle
  // donc d'ANTICIPATION (tu avais prévu de la marge), jamais d'orage.
  disruption: ["p4_02", "p4_47", "p4_97", "p4_32"],
  p7: ["p7p66", "p7p63", "p7p14", "p7p75", "p7p59", "p7p46"],
};
// Habillage GÉNÉRIQUE, comme au bureau : les Parts 3 et 4 demandent souvent « Where does the conversation take place? »
// ou « Where is the announcement being made? ». « At the airport » ou « Station announcement » donneraient la réponse.
var TRAVEL_P3_SCENES = [
  { kind: "chat", from: "Two travellers", subject: "A conversation nearby", ask: { who: "maya", text: "People are talking about their trip. Listen in." } },
  { kind: "call", from: "On speaker", subject: "A phone call", ask: { who: "maya", text: "A call on speaker. Catch the details." } },
];
var ASK_TRIP_DOC = ["Check this before you head out.", "Have a look before you land.", "Read this one carefully, it's about your trip."];
// 4 tâches : bulletin + perturbation + 1 P3 + 1 P7 ; 5 : + 1 P7 ; 6 : + 1 P3.
var TRAVEL_MIX = { 4: [1, 1], 5: [1, 2], 6: [2, 2] };

function byIds(bank, ids) { return ids.map(function (id) { return bank.find(function (x) { return x.id === id; }); }).filter(Boolean); }

function composeTravel(rep, rnd) {
  var g = gradeOf(rep), mix = TRAVEL_MIX[g.tasks] || TRAVEL_MIX[4];
  var p7pool = byIds(PART7_PASSAGES, TRAVEL_POOL.p7).filter(function (x) { return p7Level(x.type) <= Math.max(1, g.multi); });
  // Au grade qui débloque un format, en garantir un par journée… quand le vivier en a un (Jet Lag n'a pas de double).
  var multi = g.multi >= 2 ? shuffled(p7pool.filter(function (x) { return p7Level(x.type) === g.multi; }), rnd).slice(0, 1) : [];
  var p7s = multi.concat(shuffled(p7pool.filter(function (x) { return multi.indexOf(x) < 0; }), rnd)).slice(0, mix[1]);
  var p3s = shuffled(byIds(LISTENING_P3, TRAVEL_POOL.p3), rnd).slice(0, mix[0]);
  var fc = pick(byIds(LISTENING_P4, Object.keys(TRAVEL_POOL.forecast)), rnd);
  var dis = pick(byIds(LISTENING_P4, TRAVEL_POOL.disruption), rnd);

  var tasks = [];
  // Le bulletin, à 9:00 : la première chose de la journée (la règle « prévu = paré » en dépend).
  tasks.push({ mod: "lisP4", itemId: fc.id, live: true, kind: "forecast", forecast: true, forecastLabel: TRAVEL_POOL.forecast[fc.id],
    from: "Radio · Weather forecast", subject: "Today's weather", ask: { who: "maya", text: "Catch the forecast before you leave." }, at: 0 });
  p7s.forEach(function (ps, i) {
    var d = dressP7(ps, rnd);
    d.ask = { who: "maya", text: pick(ASK_TRIP_DOC, rnd) };
    tasks.push(Object.assign({ mod: "p7", itemId: ps.id, live: false, at: 0, due: i === 0 ? 180 : null }, d));
  });
  var scenes = shuffled(TRAVEL_P3_SCENES, rnd);
  var rest = p3s.map(function (it, i) { return Object.assign({ mod: "lisP3", itemId: it.id, live: true }, scenes[i % scenes.length]); });
  var disTask = { mod: "lisP4", itemId: dis.id, live: true, kind: "announce", weatherHit: true, from: "Public announcement",
    subject: "An announcement for passengers", ask: { who: "maya", text: "An announcement for passengers. Listen!" } };
  // La perturbation n'arrive jamais la première : l'élève doit avoir eu le temps d'écouter le bulletin.
  rest.splice(Math.min(1, rest.length), 0, disTask);
  var from = 60, to = DAY_LEN - (g.ringFor + 15), step = (to - from) / rest.length;
  rest.forEach(function (t, i) { t.at = Math.floor(from + i * step + rnd() * step * 0.5); });
  tasks = tasks.concat(rest);
  tasks.forEach(function (t) { if (t.live) { t.ringFor = g.ringFor; t.due = null; } else t.ringFor = null; });
  tasks.sort(function (a, b) { return a.at - b.at; });
  tasks.forEach(function (t, i) { t.id = "t" + (i + 1); });
  return { grade: g, brief: briefTravel(tasks), tasks: tasks };
}
function briefTravel(tasks) {
  var parts = ["Morning! Big travel day."];
  var first = tasks.find(function (t) { return t.mod === "p7" && t.due != null; });
  if (first) parts.push("There's a document about your trip in your inbox: check it before " + fmtClock(first.due) + ".");
  parts.push("Listen to the weather on the radio before you leave. And keep your ears open: announcements won't wait.");
  return parts.join(" ");
}

// ── Bilan ───────────────────────────────────────────────────────────────────────────────────
// results : [{correct, total, done, onTime}] par tâche. Réputation : 4 par bonne réponse, 6 par
// tâche rendue à l'heure. Bornée : jamais négative, jamais plus de REP_MAX_GAIN en une journée.
export function repGain(results) {
  var g = 0;
  (results || []).forEach(function (r) {
    g += (r.correct || 0) * REP_PER_CORRECT;
    if (r.done && r.onTime) g += REP_PER_TASK;
  });
  return Math.max(0, Math.min(REP_MAX_GAIN, g));
}
// XP de base (avant les portes de lib/xp.js) : palier des modules à 15 Q. +25 seulement pour une
// journée sans faute ET sans rien laisser filer.
export function dayXp(sc, answered, clean) {
  if (!answered) return 0;
  return 15 + 5 * sc + (clean && sc === answered ? 25 : 0);
}
export function dayStars(sc, totalQ) {
  var acc = totalQ ? sc / totalQ : 0;
  return acc >= 0.85 ? 3 : acc >= 0.7 ? 2 : acc >= 0.5 ? 1 : 0;
}
