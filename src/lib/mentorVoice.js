// La voix d'Aldric (2026-09-17, proto prototypes/mentor-memory/). PUR, à côté de lib/sessionText.js.
// Testé par tests/check_mentor_voice.cjs (lot 4). Textes en ANGLAIS (politique de langue : l'appli principale).
//
// RÈGLE D'OR : Aldric ne dit que ce que les données prouvent, et ne parle que quand c'est notable.
// Chaque phrase d'ici n'est produite que si son seuil (lib/learnerModel.js, lib/planner.js) est
// atteint — pas de « tu progresses ! » sur quatre questions. Les variantes sont tirées par une graine
// stable (nom + jour) : deux élèves de la même promo ne lisent pas la même phrase le même jour.
import { today } from "./util.js";
import { PART_LABEL, PART_SHORT, PART_ICON, addDays, daysBetween, fmtDay, weekdayName, recentWindow, stakes, weakestCat, weakestLifetimeCat, mondayOf } from "./learnerModel.js";
import { BOX_DAYS, WYRM_MISS, TIERS, tierOf, slainOn, huntReward, bestiary, dueItems } from "./review.js";
import { todayMission, questDone, thawQuest, weekFacts, goalPace } from "./planner.js";

function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function pickLine(arr, seed) { return arr[hash(String(seed)) % arr.length]; }
function toPct(x) { return Math.round(x * 100); }
function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
function listJoin(a) { return a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
// « Conditionals are », « Part 7 is » : un nom de catégorie au pluriel prend un verbe pluriel.
function be(name) { return /s$/.test(name) ? "are" : "is"; }

// ═══ Home : le bandeau d'une ligne (Home ne gagne rien d'autre, décision du 2026-09-17) ═══
// Lu sur la journée FIGÉE (u.mission, lib/planner.js) : il compte les quêtes qui restent, pas un plan
// recalculé. null tant que la mission du jour n'est pas posée (App() la pose au chargement).
export function homeStrip(u, now) {
  var m = todayMission(u, now);
  if (!m) return null;
  var due = dueItems(u, now).length, n = m.quests.length, parts = [];
  var left = m.quests.filter(function (q, i) { return !questDone(u, m, i, now); }).length;
  if (due) parts.push(plural(due, "mistake") + " due");
  if (!n) parts.push("All steady today");
  else if (!left) parts.push("Today's path complete");
  else parts.push(plural(left, "quest") + (left < n ? " left" : due ? "" : " today"));
  return { text: parts.join(" · ") + (m.cold && left ? " · from your scan" : ""), tone: due ? "due" : "plain", pending: !!n && !m.done };
}
// Les repères de la carte du Mentor (Peak, Path, Lair, Camp). `est` : l'estimation TOEIC (App/Mentor la
// calculent déjà, lib/toeic.js), null si non estimable.
export function mapBadges(u, now, est) {
  var d = today(now), m = todayMission(u, now), b = bestiary(u, now), n = m ? m.quests.length : 0;
  var left = m ? m.quests.filter(function (q, i) { return !questDone(u, m, i, now); }).length : 0;
  var daysLeft = u.targetToeic && u.targetDate ? daysBetween(d, u.targetDate) : null;
  return {
    goal: { label: u.targetToeic ? "The Distant Peak" : "Set destination", value: u.targetToeic ? u.targetToeic + " · " + (daysLeft >= 0 ? daysLeft + "d" : "past") : "?", tone: u.targetToeic ? "active" : "muted" },
    // « Complete » seulement quand tout le chemin est fait ; la mission seule faite, on le dit tel quel.
    path: { label: "Today's Path", value: !m ? "…" : !n ? "All steady" : !left ? "Complete ✓" : m.done ? "Mission done ✓" : plural(n, "quest") + " · +15 XP", tone: !n ? "muted" : m.done ? "done" : "active" },
    lair: { label: "The Lair", value: b.due > 0 ? b.due + " due" : b.lurking > 0 ? b.lurking + " lurking" : "Empty", tone: b.due > 0 ? "active" : "muted" },
    camp: { label: "Your Camp", value: (est == null ? "—" : est) + " TOEIC", tone: "active" },
  };
}
// Tête de la feuille « Today's Path » : c'est là que la mémoire de la veille est dite (au-dessus du
// pseudo sur Home, elle ne convainquait pas).
export function planIntro(u, plan, now) {
  var d = today(now), dayN = daysBetween(u.joinedAt || d, d) + 1;
  var slainY = slainOn(u, addDays(d, -1)).length, seed = (u.name || "") + d;
  var head;
  if (dayN <= 7) head = "Day " + dayN + " in the Arena";
  else if (slainY > 0) head = pickLine(["Yesterday you slew " + plural(slainY, "old mistake"), plural(slainY, "mistake") + " fell to your blade yesterday"], seed + "greet");
  else if (u.streak >= 7) head = u.streak + " days in a row";
  else head = "Welcome back";
  return head + ". Here's today.";
}

// ═══ Les quêtes ═══
// L'étiquette porte la récompense : la quête qui porte la mission du jour (la 1re, sauf re-tirage)
// dit « +15 XP », la quête « enjeu » porte le +25 % de l'ancien Today's Focus.
function questTag(q, mission, info) {
  var r = [];
  if (mission) r.push("+15 XP");
  if (q.kind === "stake") r.push(mission ? "+25%" : "+25% XP");
  return r.length ? r.join(" · ") : info;
}
// `mission` : true pour la quête qui porte la mission du jour (u.mission.pick).
export function questView(q, u, mission) {
  var goal = u && u.targetToeic;
  if (q.kind === "hunt") return {
    icon: "broadsword", title: "Hunt " + q.n + " old mistakes",
    why: (q.due > q.n ? q.due + " are due. The oldest " + q.n + " first, the rest can wait a day." : "They're due today. Beat them before they settle in.")
      + " About " + Math.max(5, q.n) + " minutes.",
    tag: questTag(q, mission, "~" + Math.max(5, q.n) + " min"),
  };
  if (q.kind === "stake") {
    var t = q.part === "p5" && q.cat ? "Part 5 · " + q.cat.cat : PART_LABEL[q.part];
    var why = (goal ? "Where you lose the most points toward " + goal + ": about " + q.pts + " on the table."
      : "Your biggest source of lost points right now: about " + q.pts + ".") + " You're at " + toPct(q.acc) + "% there.";
    if (q.part === "p5" && q.cat) {
      var w = recentWindow(q.cat.series, 12);
      why += " " + q.cat.cat + " " + be(q.cat.cat) + " the weakest link: " + w.c + " of your last " + w.t + ".";
    }
    return { icon: PART_ICON[q.part], title: t, why: why, tag: questTag(q, mission, toPct(q.acc) + "% now") };
  }
  if (q.kind === "keep") return {
    icon: PART_ICON[q.part], title: "Keep " + PART_SHORT[q.part] + " sharp",
    why: "Your strongest part, but " + q.days + " days without practice. Memory fades.",
    tag: questTag(q, mission, q.days + " days"),
  };
  if (q.kind === "confirm") return {
    icon: q.macro ? q.macro.icon : PART_ICON[q.part], title: q.macro ? "Part 5 · " + q.macro.label : PART_LABEL[q.part],
    why: "Your Battle Scan flagged this (" + toPct(q.scanAcc) + "%). Let's check it with real questions.",
    tag: questTag(q, mission, "from your scan"),
  };
  if (q.kind === "explore") return {
    icon: PART_ICON[q.part], title: "Try " + PART_LABEL[q.part],
    why: "Not measured yet. One session and I'll know where you stand.", tag: questTag(q, mission, "new"),
  };
  return { icon: "info", title: q.kind, why: "", tag: "" };
}
export function planWhy(plan, u) {
  if (plan.cold) return "I don't know you well yet. First we check what your Battle Scan suspects, then we measure what it couldn't see.";
  return "Old mistakes first: it's short, and spacing only works on time. Then the part that costs you the most points"
    + (u && u.targetToeic ? " toward " + u.targetToeic : "") + ". Then upkeep, so nothing fades.";
}
// Une quête dite dans une phrase (lettre, Chronique), pas comme un titre de carte.
export function aimPhrase(q, u) {
  if (!q) return "";
  if (q.kind === "hunt") return "keep your bestiary in check";
  if (q.kind === "stake") return PART_SHORT[q.part] + (q.part === "p5" && q.cat ? " (" + q.cat.cat + " first)" : "")
    + ", where you lose the most points" + (u && u.targetToeic ? " toward " + u.targetToeic : "") + " (about " + q.pts + ")";
  if (q.kind === "keep") return "keep " + PART_SHORT[q.part] + " sharp";
  if (q.kind === "confirm") return "check your " + (q.macro ? q.macro.label.toLowerCase() : PART_SHORT[q.part]) + " (your scan says " + toPct(q.scanAcc) + "%)";
  if (q.kind === "explore") return "try " + PART_SHORT[q.part] + ", which we haven't measured yet";
  return "";
}

// Le côté du test d'une créature, d'après le préfixe de sa référence (lib/reviewRefs.js), pour le
// briefing de la chasse. Le reste (Drill, Gauntlet, Clue, modaux, mini-modules de grammaire) : grammar.
var HUNT_SIDE = { p6: "reading", p7: "reading", mimic: "reading", ablitz: "listening", tavern: "vocabulary", falsefr: "vocabulary", pvdojo: "vocabulary", traps: "strategy", stratquiz: "strategy" };
var HUNT_SIDES = ["grammar", "vocabulary", "listening", "reading", "strategy"];
export function huntSide(k) {
  var mod = String(k).split(":")[0];
  return HUNT_SIDE[mod] || (/^lis/.test(mod) ? "listening" : "grammar");
}

// ═══ Avant la session : comment elle a été composée ═══
export function briefing(comp, u, now) {
  var seed = (u.name || "") + today(now), lines = [], chips = [];
  if (comp.kind === "hunt") {
    var groups = {};
    comp.items.forEach(function (it) { var s = huntSide(it.k); groups[s] = (groups[s] || 0) + 1; });
    var parts = HUNT_SIDES.filter(function (g) { return groups[g]; }).map(function (g) { return groups[g] + " " + g; });
    var beaten = comp.items.filter(function (it) { return it.box > 0; }).length;
    var worst = comp.items.slice().sort(function (a, b) { return b.fails - a.fails; })[0];
    lines.push(plural(comp.items.length, "mistake") + " " + (comp.items.length === 1 ? "is" : "are") + " due today: " + listJoin(parts) + ".");
    if (beaten) lines.push(pickLine(["You've already beaten " + beaten + " of them once. Finish the job.", beaten + " of them have felt your blade before. Finish them."], seed));
    if (worst && worst.fails >= 2) lines.push("One " + (worst.cat || PART_SHORT[worst.part] ? (worst.cat || PART_SHORT[worst.part]) + " question" : "question") + " has beaten you " + worst.fails + " times. Read slowly.");
    chips.push({ icon: "broadsword", text: comp.items.length + " due" });
    parts.forEach(function (p) { chips.push({ icon: /grammar/.test(p) ? "ink-swirl" : /reading/.test(p) ? "eye-target" : "public-speaker", text: p }); });
    return { title: "Mistake Hunt", lines: lines, chips: chips };
  }
  var n = function (role) { return comp.items.filter(function (x) { return x.role === role; }).length; };
  if (comp.macro) {
    var sm = u.battleScan.subScores.grammarMacros[comp.macro.id];
    lines.push("Your Battle Scan says " + comp.macro.label.toLowerCase() + " need work (" + toPct(sm) + "%). " + n("focus") + " of these 10 test them.");
    lines.push(pickLine(["Prove the scan wrong.", "Let's see if the scan was right."], seed));
    lines.push("The rest is a mix, so I can learn where else you stand.");
    chips.push({ icon: comp.macro.icon, text: n("focus") + " " + comp.macro.label.toLowerCase() });
  } else if (comp.focus && n("focus")) {
    // Série récente trop mince (elle n'existe que depuis le 2026-09-17) : on cite le cumul, et on le dit.
    var life = comp.focus.source === "lifetime", w = life ? comp.focus.life : recentWindow(comp.focus.series, 12);
    lines.push(comp.focus.cat + " " + be(comp.focus.cat) + " your weak spot" + (life ? ": " + w.c + " of " + w.t + " so far." : " now: " + w.c + " of your last " + w.t + ".")
      + " I've put " + n("focus") + " in this drill.");
    chips.push({ icon: "eye-target", text: n("focus") + " " + comp.focus.cat });
  }
  if (comp.eased && n("eased")) {
    var tr = comp.eased.turn;
    lines.push(comp.eased.cat + " get" + (/s$/.test(comp.eased.cat) ? "" : "s") + " only " + n("eased") + " today: " + tr.now.c + " of your last " + tr.now.t + ". You've earned it.");
    chips.push({ icon: "laurel-crown", text: n("eased") + " " + comp.eased.cat });
  }
  if (n("due")) {
    lines.push(plural(n("due"), "old mistake") + " " + (n("due") === 1 ? "is" : "are") + " hidden in the mix.");
    chips.push({ icon: "broadsword", text: n("due") + " due" });
  }
  if (n("mixed")) chips.push({ icon: "rolling-dices", text: n("mixed") + " mixed" });
  return { title: "Grammar Drill", lines: lines, chips: chips };
}

// ═══ Pendant : la question porte sa mémoire ═══
export function questionBadge(item) {
  if (!item) return null;
  return { text: "Missed on " + fmtDay(item.first) + (item.fails > 1 ? " · " + item.fails + " times" : ""), tier: tierOf(item), icon: TIERS[tierOf(item)].icon };
}
// `item` : la créature (si la question en est une), `cat` : sa catégorie, `role` : focus|eased|mixed|due.
export function questionFeedback(o) {
  var item = o.item, ok = o.ok;
  if (o.role === "due" && item) {
    if (ok) {
      if (item.box + 1 >= BOX_DAYS.length) return { tone: "win", icon: "broadsword", text: "Revenge! Slain for good." };
      return { tone: "win", icon: "crossed-swords", text: "Revenge. It comes back in " + BOX_DAYS[item.box + 1] + " days, weaker." };
    }
    // `hasSheet` : une fiche de grammaire existe pour la catégorie (data/grammarSheets.js CAT_SHEET) ; sinon
    // Aldric ne promet pas une fiche qui n'existe pas.
    if (item.fails + 1 >= WYRM_MISS) return o.hasSheet
      ? { tone: "bite", icon: "dragon-head", sheet: true, text: "It bites again. Back in 2 days: read the " + o.cat + " sheet first." }
      : { tone: "bite", icon: "dragon-head", text: "It bites again. It rests 2 days: read the explanation twice." };
    return { tone: "bite", icon: "trap-mask", text: "It bites again. Back tomorrow." };
  }
  if (o.role === "eased" && o.cat && o.series) {
    var w = recentWindow(o.series, 12);
    if (ok) return { tone: "win", icon: "laurel-crown", text: o.cat + ": " + (w.c + 1) + " of your last " + (w.t + 1) + ". It holds." };
    return { tone: "note", icon: "info", text: "A slip. " + o.cat + " still stands at " + w.c + " of your last " + w.t + "." };
  }
  if (!ok) return { tone: "note", icon: "spider-web", text: pickLine(["Noted. This one comes back tomorrow.", "I'll remember this one. See you tomorrow."], (o.seed || "") + (o.k || "")) };
  return null;
}

// ═══ Écran de fin : ce qui a changé ═══
// `o` : {slain:[{k,label}], hits, escaped, fresh, focusCat, focusC, focusT, macro, macroC, macroT,
//        scanAcc, best:{name,sc,tot}, turns:[{cat,turn}], bestiary:{from,to}}
export function rememberLines(o) {
  var lines = [];
  if (o.slain && o.slain.length) {
    var names = {};
    o.slain.forEach(function (s) { var n = s.label || "a question"; names[n] = (names[n] || 0) + 1; });
    lines.push({ icon: "broadsword", tone: "win", text: plural(o.slain.length, "old mistake") + " slain for good",
      sub: Object.keys(names).map(function (n) { return names[n] > 1 ? n + " ×" + names[n] : n; }).join(" · ") });
  }
  if (o.hits && o.hits.length) lines.push({ icon: "crossed-swords", tone: "win", text: plural(o.hits.length, "mistake") + " beaten again", sub: "They'll be back, weaker." });
  if (o.escaped && o.escaped.length) {
    // Une question ratée 3 fois se repose 2 jours (lib/review.js WYRM_MISS) : « demain » serait faux.
    var rest = o.escaped.filter(function (e) { return e.rest; }).length, soon = o.escaped.length - rest;
    lines.push({ icon: "trap-mask", tone: "note", text: o.escaped.length + " escaped",
      sub: !rest ? "Back tomorrow." : !soon ? "Back in 2 days: they need a rest." : soon + " back tomorrow, " + rest + " in 2 days." });
  }
  if (o.fresh && o.fresh.length) lines.push({ icon: "spider-web", tone: "note", text: plural(o.fresh.length, "new mistake") + " for your bestiary", sub: "First return tomorrow." });
  (o.turns || []).forEach(function (t) {
    lines.push({ icon: "star-formation", tone: "win", text: t.cat + ": " + toPct(t.turn.then.acc) + "% at first, " + toPct(t.turn.now.acc) + "% lately",
      sub: t.turn.then.c + " of " + t.turn.then.t + " → " + t.turn.now.c + " of " + t.turn.now.t });
  });
  if (o.focusCat && o.focusT) {
    lines.push({ icon: "eye-target", tone: "note", text: o.focusCat + ", today's aim: " + o.focusC + " of " + o.focusT,
      sub: "Your weak spot gets the most questions until it holds." });
  }
  if (o.macro && o.macroT) {
    lines.push({ icon: "compass", tone: "note", text: o.macro + " today: " + o.macroC + " of " + o.macroT + "." + (o.scanAcc != null ? " Your scan said " + toPct(o.scanAcc) + "%." : ""),
      sub: "Too early to judge. Two more sessions and I'll know." });
  }
  if (o.best) lines.push({ icon: "trophy-cup", tone: "win", text: "Your best " + o.best.name + " yet", sub: o.best.sc + " / " + o.best.tot });
  return lines;
}
// Fin d'un Drill composé (lot 5) : ce qui a changé dans le bestiaire et sur la cible du jour, depuis la
// composition (`comp`, lib/planner.js drillComposition) et les réponses ([{role, ok, q, item?}]).
// Une échéance réussie à sa dernière boîte tombe (« slain »), ratée 3 fois elle se repose 2 jours.
export function drillRemember(comp, results) {
  var o = { slain: [], hits: [], escaped: [], fresh: [] };
  results.forEach(function (r) {
    if (r.role === "due" && r.item) {
      if (r.ok) (r.item.box + 1 >= BOX_DAYS.length ? o.slain : o.hits).push({ k: r.item.k, label: r.q.cat });
      else o.escaped.push({ k: r.item.k, label: r.q.cat, rest: r.item.fails + 1 >= WYRM_MISS });
    } else if (!r.ok) o.fresh.push({ k: "drill:" + r.q.id });
  });
  var foc = results.filter(function (r) { return r.role === "focus"; }), fc = foc.filter(function (r) { return r.ok; }).length;
  if (foc.length && comp.macro) { o.macro = comp.macro.label; o.macroC = fc; o.macroT = foc.length; o.scanAcc = comp.quest && comp.quest.scanAcc; }
  else if (foc.length && comp.focus) { o.focusCat = comp.focus.cat; o.focusC = fc; o.focusT = foc.length; }
  return rememberLines(o);
}
export function huntTotals(slain) {
  var r = huntReward(slain);
  return { xp: r.xp, darics: r.darics, label: slain ? plural(slain, "creature") + " slain" : "No creature slain" };
}

// ═══ Cérémonie : faiblesse devenue force ═══
export function ceremonyText(cat, turn, seed) {
  return {
    kicker: "Weakness turned strength", title: cat,
    sub: turn.then.c + " of " + turn.then.t + " at first. " + turn.now.c + " of " + turn.now.t + " lately.",
    line: pickLine([cat + " no longer cost you points.", "What once cost you points now earns them."], String(seed) + cat),
  };
}

// ═══ La lettre du lundi ═══
export function letter(u, now, facts, pace, plan) {
  var d = today(now), dayN = daysBetween(u.joinedAt || d, d) + 1, ps = [];
  var aims = [aimPhrase(plan.quests[0], u), aimPhrase(plan.quests[1], u)].filter(Boolean);
  var push;
  if (dayN <= 7) {
    ps.push("You joined on " + weekdayName(u.joinedAt || d) + ". " + plural(facts.sessions, "session") + " so far, " + facts.questions
      + " questions. Too soon to call a trend: your Battle Scan is still my only map.");
    if (facts.caught) ps.push("Your first " + plural(facts.caught, "mistake") + " are in your bestiary. They come back until you beat them, a few days apart.");
    if (aims.length) ps.push("This week: " + listJoin(aims) + ".");
    ps.push("Next Monday I'll write you a real letter.");
    push = "Your first days in the Arena. Read the letter.";
  } else {
    // Semaine sans entraînement : Aldric ne fait pas les comptes d'une absence (« 0 days out of 7 »).
    if (!facts.sessions) ps.push("Last week the Arena was quiet. It happens: what counts is the next session.");
    else ps.push("Last week you trained " + facts.activeDays + " day" + (facts.activeDays > 1 ? "s" : "") + " out of 7: " + plural(facts.sessions, "session") + ", " + facts.questions + " questions.");
    var turningNames = (facts.turning || []).filter(function (s) { return s.turn.near; }).map(function (s) { return s.cat; });
    var up = (facts.up || []).filter(function (m) { return turningNames.indexOf(m.label) < 0; });
    if (up.length) ps.push(up[0].label + " " + be(up[0].label) + " moving: " + toPct(up[0].before.acc) + "% the week before, " + toPct(up[0].now.acc) + "% last week.");
    if (facts.down && facts.down.length) ps.push(facts.down[0].label + " slipped (" + toPct(facts.down[0].before.acc) + "% → " + toPct(facts.down[0].now.acc) + "%). Worth a look.");
    (facts.turning || []).forEach(function (s) {
      if (!s.turn.near) return;
      ps.push(s.cat + " " + be(s.cat) + " turning: " + s.turn.then.c + " of " + s.turn.then.t + " at first, " + s.turn.now.c + " of " + s.turn.now.t
        + " lately. Hold on a little longer and I'll call it.");
    });
    if (facts.slain || facts.caught) ps.push("You slew " + plural(facts.slain, "old mistake") + "; " + facts.caught + " new " + (facts.caught === 1 ? "one" : "ones") + " joined your bestiary.");
    if (pace && pace.current != null) {
      var est = facts.est && facts.est.from != null ? "Your estimate went from " + facts.est.from + " to " + facts.est.to + ". " : "Your estimate stands at " + pace.current + ". ";
      ps.push(est + "To reach " + pace.target + " by " + fmtDay(pace.date) + " you need about " + Math.round(pace.needed) + " points a week"
        + (pace.last != null ? "; last week you made " + (pace.last >= 0 ? "+" : "") + pace.last + ". " + (pace.onTrack ? "You're on track." : "Not quite enough yet.") : "."));
    } else if (!u.targetToeic) {
      if (facts.est && facts.est.to != null) ps.push("Your estimate stands at " + facts.est.to + ".");
      ps.push("You haven't chosen a destination yet. A target score and a date, and I can plan your weeks.");
    }
    if (aims.length) ps.push("This week, " + (aims.length > 1 ? "two things: " : "") + listJoin(aims) + ".");
    var hook = (facts.turning || []).find(function (s) { return s.turn.near; });
    push = hook ? hook.cat + " " + be(hook.cat) + " turning. Read the letter."
      : pace && pace.onTrack ? (up.length ? up[0].label + " " + be(up[0].label) + " moving, and you're on track for " + pace.target + "." : "You're on track for " + pace.target + ".") + " Read the letter."
      : "Your week in the Arena. Read the letter.";
  }
  return { date: weekdayName(d) + ", " + fmtDay(d), paragraphs: ps, push: { title: "Aldric's Monday letter", body: push } };
}

// La lettre de la semaine en cours, prête à afficher (lot 6). Datée du LUNDI même si l'élève ouvre
// l'appli un mercredi : la semaine racontée est toujours celle d'avant (lundi → dimanche). Les buts de la
// semaine viennent du plan figé du jour (u.mission), réhydraté.
export function mondayLetter(u, now, snaps) {
  var mon = new Date(mondayOf(today(now)) + "T12:00:00Z");
  var m = todayMission(u, now), quests = m ? m.quests.map(function (q) { return thawQuest(q, u, now); }) : [];
  return letter(u, mon, weekFacts(u, mon, snaps), goalPace(u, now, snaps), { quests: quests });
}

// ═══ Chronique ═══
var SECTION_NAME = { grammar: "grammar", vocab: "vocabulary", reading: "reading", listening: "listening" };
var MOCK_NAME = { mock1: "Mock Test 1", mock2: "Mock Test 2", mock3: "Mock Test 3", boss: "The Final Arena", endless: "Endless Arena" };
export function chronicleEntry(e) {
  var f = e.facts || {}, title = "", text = "";
  if (e.kind === "scan") {
    title = "You entered the Arena";
    text = f.strong ? "Battle Scan: strongest in " + SECTION_NAME[f.strong] + " (" + toPct(f.strongAcc) + "%), weakest in " + SECTION_NAME[f.weak] + " (" + toPct(f.weakAcc) + "%)." : "Battle Scan completed.";
  } else if (e.kind === "part80") { title = PART_SHORT[f.part] + " crossed 80%"; text = f.c + " of " + f.t + " answers right so far."; }
  else if (e.kind === "weak") { title = f.cat + " marked as a weak spot"; text = f.c + " of your first " + f.t + ". I marked it."; }
  else if (e.kind === "turn") { title = f.cat + ": weakness turned strength"; text = f.then.c + " of " + f.then.t + " at first, " + f.now.c + " of " + f.now.t + " lately."; }
  else if (e.kind === "mock") { title = (MOCK_NAME[f.id] || f.id) + " completed"; text = f.score + " / " + f.total + "."; }
  else if (e.kind === "estimate") { title = "Your TOEIC estimate appeared"; text = "First estimate: " + f.toeic + "."; }
  else if (e.kind === "slain") { title = f.n === 1 ? "First mistake slain" : f.n + " mistakes slain"; text = f.n === 1 ? "The first creature to fall." : f.n + " creatures down."; }
  else if (e.kind === "goal") { title = "On the road to " + f.target; text = "Destination: " + f.target + " by " + fmtDay(f.date) + "."; }
  else if (e.kind === "insight") { title = "Aldric's insight"; text = f.text; }
  return { d: e.d, icon: e.icon, kind: e.kind, title: title, text: text };
}
// ═══ Jeton Insight (lot 6) : le même modèle que le plan ═══
// Avant : le module à la précision CUMULÉE la plus basse (≥ 20 Q), un 4e avis qui pouvait contredire le
// Mentor, et un texte perdu au rechargement (u.insights n'allait dans aucune colonne). Désormais : la
// partie où l'élève perd le plus de points, la catégorie de grammaire la plus faible, l'état du bestiaire,
// et le texte est rangé dans review.insights (relu dans la Chronique).
export function insightText(u, now) {
  var st = stakes(u, now), top = st.find(function (s) { return s.source === "trained" && s.pts > 0; });
  var trained = st.some(function (s) { return s.source === "trained"; });
  var wc = weakestCat(u, now) || weakestLifetimeCat(u, now), b = bestiary(u, now), ps = [];
  if (!trained) return "I don't know you well enough yet. Train a few sessions in different parts of the test, then spend this token: I'll have something real to tell you.";
  if (top) {
    ps.push("Where you lose the most points: " + PART_LABEL[top.part] + ", about " + top.pts + " points" + (u.targetToeic ? " toward " + u.targetToeic : "") + ". You're at "
      + toPct(top.acc) + "% there; " + (u.targetToeic ? "your goal needs about " : "a strong score needs about ") + toPct(top.tgt) + "%.");
  } else ps.push("Every part you've trained is on target" + (u.targetToeic ? " for " + u.targetToeic : "") + ". Time to test yourself on a full Mock.");
  if (wc) {
    var w = wc.source === "lifetime" ? wc.life : recentWindow(wc.series, 12);
    ps.push("Your weakest grammar category: " + wc.cat + " (" + w.c + " of " + (wc.source === "lifetime" ? w.t + " so far" : "your last " + w.t) + ").");
  }
  if (b.lurking) ps.push("Your bestiary holds " + plural(b.lurking, "creature") + (b.wyrms ? ", " + b.wyrms + " of them Wyrms (missed 3 times or more)" : "") + "." + (b.due ? " " + b.due + " due today." : ""));
  if (top) ps.push("Two focused sessions of " + PART_SHORT[top.part] + " this week will move your score more than anything else.");
  return ps.join(" ");
}
export function nextPageLine(quest, u) {
  var aim = aimPhrase(quest, u);
  return aim ? "Next: " + aim + "." : "Still being written.";
}

// ═══ Bestiaire ═══
export var BESTIARY_INTRO = "Every mistake becomes a creature. Beat it three times, a few days apart, and it falls for good.";
export var BESTIARY_RULES = [
  "Miss a question: it comes back tomorrow.",
  "Beat it: it sleeps " + BOX_DAYS[1] + " days, then " + BOX_DAYS[2] + ".",
  "Beat it a third time: slain for good.",
];
export function creatureMeta(it, now) {
  var d = today(now), due = it.due <= d, days = daysBetween(d, it.due);
  return TIERS[tierOf(it)].name + " · " + (it.fails > 1 ? "missed " + it.fails + "× since " : "missed on ") + fmtDay(it.first)
    + " · " + (due ? "due today" : "back in " + days + " day" + (days > 1 ? "s" : ""));
}
