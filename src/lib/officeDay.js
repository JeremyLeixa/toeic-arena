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

// rep : réputation actuelle. rnd : générateur [0,1) (injecté par les tests).
// Rend {grade, brief, tasks:[{id, mod, itemId, kind, from, subject, ask, at, due, ringFor, live}]}
//   mod    "p7" | "lisP3" | "lisP4" (le module où la réponse compte : refs et moduleScores)
//   live   true : direct à heure fixe (sonne `ringFor` minutes puis est manqué) ; false : boîte, `due`
export function composeDay(rep, rnd) {
  rnd = rnd || Math.random;
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
