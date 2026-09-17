// Proto « mémoire du Mentor » — la voix d'Aldric. PUR (au câblage : lib/mentorVoice.js, à côté de
// lib/sessionText.js). Chaque fonction rend le texte ÉLÈVE (anglais, politique de langue) et ses
// PREUVES (français, pour Jérémy : les chiffres et la règle qui autorisent la phrase).
// Règle d'or : Aldric ne dit que ce que les données prouvent, et ne parle que quand c'est notable.
import {
  NOW, day, addDays, daysBetween, fmtDay, weekdayName, PART_LABEL, PART_SHORT, PART_ICON, TOEIC_Q, PTS_PER_Q,
  BOX_DAYS, HALF_LIFE, PRIOR_Q, PRIOR_ACC, TURN, HUNT_MIN, WYRM_MISS, catSeries, catState, recentWindow, turnaround,
  slainOn, weekFacts, goalPace, chronicle, bestiary, lookupItem, tierOf, TIERS, trainedSessions, allCats, MODULE_NAME,
  planToday,
} from "./model.js";

function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
// Variante stable par élève et par jour : deux élèves de la même promo ne lisent pas la même phrase.
export function pick(arr, seed) { return arr[hash(seed) % arr.length]; }
function pct(x) { return Math.round(x * 100); }
function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
function listJoin(a) { return a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
function num(x) { return String(Math.round(x)); }
function fr(x) { return String(x).replace(".", ","); }
// « Conditionals are », « Part 7 is » : les noms de catégories au pluriel prennent un verbe pluriel.
function be(name) { return /s$/.test(name) ? "are" : "is"; }
// Une quête dite dans une phrase (lettre, chronique), pas comme un titre de carte.
function aimPhrase(q, x) {
  if (!q) return "";
  if (q.kind === "hunt") return "keep your bestiary in check";
  if (q.kind === "stake") return PART_SHORT[q.part] + (q.part === "p5" && q.cat ? " (" + q.cat.cat + " first)" : "") + ", where you lose the most points" + (x.before.targetToeic ? " toward " + x.before.targetToeic : "") + " (about " + q.pts + ")";
  if (q.kind === "keep") return "keep " + PART_SHORT[q.part] + " sharp";
  if (q.kind === "confirm") return "check your " + (q.macro ? q.macro.label.toLowerCase() : PART_SHORT[q.part]) + " (your scan says " + pct(q.scanAcc) + "%)";
  if (q.kind === "explore") return "try " + PART_SHORT[q.part] + ", which we haven't measured yet";
  return q.kind;
}

// ═══ Home : la ligne d'accueil ═══
export function greeting(x) {
  var u = x.before, d = day(NOW), yd = addDays(d, -1), dayN = daysBetween(u.joinedAt, d) + 1;
  var slainY = slainOn(u, yd).length, seed = u.name + d + "greet";
  if (dayN <= 7) return { text: "Day " + dayN + " in the Arena", ev: ["Arrivée le " + fmtDay(u.joinedAt) + " : J" + dayN + ". Tant qu'on se connaît peu, on le dit plutôt que « Welcome back »."] };
  if (slainY > 0) return {
    text: pick(["Yesterday you slew " + plural(slainY, "old mistake"), plural(slainY, "mistake") + " fell to your blade yesterday"], seed),
    ev: [slainY + " créature(s) vaincue(s) le " + fmtDay(yd) + " (journal du bestiaire). Remplace « Welcome back »."],
  };
  if (u.streak >= 7) return { text: u.streak + " days in a row. The Arena notices.", ev: ["Série de " + u.streak + " jours."] };
  return { text: "Welcome back", ev: ["Rien de notable hier : Aldric ne force pas la conversation."] };
}

// ═══ Le plan du jour ═══
export function questView(q, x) {
  var u = x.before, goal = u.targetToeic;
  if (q.kind === "hunt") return {
    icon: "broadsword", title: "Hunt " + q.n + " old mistakes",
    why: q.due > q.n ? q.due + " are due. The oldest ten first, the rest can wait a day." : "They're due today. Beat them before they settle in.",
    tag: "~" + Math.max(5, q.n) + " min",
    ev: [q.due + " créature(s) à échéance aujourd'hui (intervalles " + BOX_DAYS.join("-") + " j) ; chasse plafonnée à 10.",
      "En tête du plan à partir de " + HUNT_MIN + " échéances (en dessous, elles sont glissées dans la session suivante) : c'est court, et l'espacement ne supporte pas l'attente."],
  };
  if (q.kind === "stake") {
    var t = PART_LABEL[q.part], why, ev = [];
    if (q.part === "p5" && q.cat) t = "Part 5 · " + q.cat.cat;
    why = goal ? "Where you lose the most points toward " + goal + ": about " + q.pts + " on the table." : "Your biggest source of lost points right now: about " + q.pts + ".";
    if (q.part === "p5" && q.cat) {
      var w = recentWindow(q.cat.series, 12);
      why += " " + q.cat.cat + " " + be(q.cat.cat) + " the weakest link: " + w.c + " of your last " + w.t + ".";
      ev.push("Catégorie la plus faible en maîtrise récente : " + q.cat.cat + " " + pct(q.cat.m.acc) + " % (à vie " + pct(q.cat.life.acc) + " % sur " + q.cat.life.t + " Q).");
    }
    ev.unshift("Enjeu " + PART_SHORT[q.part] + " : " + TOEIC_Q[q.part] + " Q au TOEIC × (" + pct(q.tgt) + " % visés − " + pct(q.acc) + " % de maîtrise récente) × " + fr(PTS_PER_Q) + " pts/Q ≈ " + q.pts + " pts.",
      goal ? "Cible par section tirée de l'objectif : (" + goal + " / 2 − 5) / 490 = " + pct(q.tgt) + " %." : "Pas d'objectif : cible par défaut 85 %.",
      "Maîtrise récente : demi-vie " + HALF_LIFE + " j + prior " + PRIOR_Q + " Q à " + pct(PRIOR_ACC) + " %. À vie : " + pct(q.life.acc) + " % sur " + q.life.t + " Q.",
      "Autres enjeux : " + x.plan.stakes.filter(function (s) { return s.part !== q.part && s.pts; }).slice(0, 3).map(function (s) { return PART_SHORT[s.part] + " " + s.pts + " pts (" + (s.source === "scan" ? "scan" : pct(s.acc) + " %") + ")"; }).join(", ") + ".");
    return { icon: PART_ICON[q.part], title: t, why: why, tag: pct(q.acc) + "% now", ev: ev };
  }
  if (q.kind === "keep") return {
    icon: PART_ICON[q.part], title: "Keep " + PART_SHORT[q.part] + " sharp",
    why: "Your strongest part, but " + q.days + " days without practice. Memory fades.", tag: q.days + " days",
    ev: [PART_SHORT[q.part] + " à " + pct(q.acc) + " % (≥ 75 %) sans session depuis " + q.days + " jours (seuil : 7)."],
  };
  if (q.kind === "confirm") {
    var label = q.macro ? "Part 5 · " + q.macro.label : PART_LABEL[q.part];
    return {
      icon: q.macro ? q.macro.icon : PART_ICON[q.part], title: label,
      why: "Your Battle Scan flagged this (" + pct(q.scanAcc) + "%). Let's check it with real questions.", tag: "from your scan",
      ev: ["Élève neuve : " + trainedSessions(u) + " session(s) d'entraînement (< 5), aucune maîtrise fiable. Le plan part du Battle Scan.",
        "Point le plus faible du scan : " + (q.macro ? "macro " + q.macro.label + " (" + q.macro.subcats.join(", ") + ")" : PART_SHORT[q.part]) + " à " + pct(q.scanAcc) + " %."],
    };
  }
  if (q.kind === "explore") return {
    icon: PART_ICON[q.part], title: "Try " + PART_LABEL[q.part],
    why: "Not measured yet. One session and I'll know where you stand.", tag: "new",
    ev: [PART_SHORT[q.part] + " jamais jouée ; la plus lourde au TOEIC (" + TOEIC_Q[q.part] + " Q) parmi les parties non mesurées."],
  };
  return { icon: "info", title: q.kind, why: "", tag: "", ev: [] };
}
export function planWhy(x) {
  if (x.plan.cold) return "I don't know you well yet. First we check what your Battle Scan suspects, then we measure what it couldn't see.";
  return "Old mistakes first: it's short, and spacing only works on time. Then the part that costs you the most points" + (x.before.targetToeic ? " toward " + x.before.targetToeic : "") + ". Then upkeep, so nothing fades.";
}

// ═══ Avant la session : comment elle a été composée ═══
function groupLabel(q) { return q.mod === "drill" ? "grammar" : q.mod === "p7" ? "reading" : "listening"; }
export function briefing(x) {
  var c = x.comp, u = x.before, seed = u.name + day(NOW) + "brief";
  if (c.kind === "hunt") {
    var groups = {};
    c.questions.forEach(function (q) { var g = groupLabel(q); groups[g] = (groups[g] || 0) + 1; });
    var parts = ["grammar", "listening", "reading"].filter(function (g) { return groups[g]; }).map(function (g) { return groups[g] + " " + g; });
    var beaten = c.questions.filter(function (q) { return q.item.box > 0; }).length;
    var strongest = c.questions.slice().sort(function (a, b) { return b.item.fails - a.item.fails; })[0];
    var lines = [plural(c.questions.length, "mistake") + " " + (c.questions.length === 1 ? "is" : "are") + " due today: " + listJoin(parts) + "."];
    if (beaten) lines.push(pick(["You've already beaten " + beaten + " of them once. Finish the job.", beaten + " of them have felt your blade before. Finish them."], seed));
    if (strongest && strongest.item.fails >= 2) lines.push("One " + (strongest.cat || strongest.label) + " question has beaten you " + strongest.item.fails + " times. Read slowly.");
    return {
      title: "Mistake Hunt", lines: lines,
      chips: [{ icon: "broadsword", text: c.questions.length + " due" }].concat(parts.map(function (p) { return { icon: p.indexOf("grammar") >= 0 ? "ink-swirl" : p.indexOf("reading") >= 0 ? "eye-target" : "public-speaker", text: p }; })),
      ev: ["Les " + c.questions.length + " plus anciennes à échéance sur " + x.plan.due.length + " ; grammaire d'abord.",
        beaten + " déjà réussie(s) une fois (box ≥ 1)." + (strongest ? " La plus coriace : ratée " + strongest.item.fails + " fois depuis le " + fmtDay(strongest.item.first) + "." : "")],
    };
  }
  lines = []; var chips = [], ev = [];
  var nFocus = c.questions.filter(function (q) { return q.role === "focus"; }).length;
  var nEased = c.questions.filter(function (q) { return q.role === "eased"; }).length;
  var nDue = c.questions.filter(function (q) { return q.role === "due"; }).length;
  var nMixed = c.questions.filter(function (q) { return q.role === "mixed"; }).length;
  if (c.macro) {
    var sm = u.battleScan.subScores.grammarMacros[c.macro.id];
    lines.push("Your Battle Scan says " + c.macro.label.toLowerCase() + " need work (" + pct(sm) + "%). " + nFocus + " of these 10 test them.");
    lines.push(pick(["Prove the scan wrong.", "Let's see if the scan was right."], seed));
    lines.push("The rest is a mix, so I can learn where else you stand.");
    chips.push({ icon: c.macro.icon, text: nFocus + " " + c.macro.label.toLowerCase() });
    ev.push("Démarrage à froid : focus = macro la plus faible du scan (" + c.macro.label + " " + pct(sm) + " %), catégories " + c.macro.subcats.join(", ") + ".");
  } else if (c.focus) {
    var w = recentWindow(c.focus.series, 12);
    lines.push(c.focus.cat + " " + be(c.focus.cat) + " your weak spot now: " + w.c + " of your last " + w.t + ". I've put " + nFocus + " in this drill.");
    chips.push({ icon: "eye-target", text: nFocus + " " + c.focus.cat });
    ev.push("Focus = catégorie de plus faible maîtrise récente : " + c.focus.cat + " " + pct(c.focus.m.acc) + " % (dernières " + w.t + " Q : " + w.c + ").");
  }
  if (c.eased && nEased) {
    var tr = c.eased.turn;
    lines.push(c.eased.cat + " get" + (/s$/.test(c.eased.cat) ? "" : "s") + " only " + nEased + " today: " + tr.now.c + " of your last " + tr.now.t + ". You've earned it.");
    chips.push({ icon: "laurel-crown", text: nEased + " " + c.eased.cat });
    ev.push(c.eased.cat + " allégée : " + tr.then.c + "/" + tr.then.t + " au début (jusqu'au " + fmtDay(tr.then.end) + "), " + tr.now.c + "/" + tr.now.t + " depuis le " + fmtDay(tr.now.start) + ". Retournement " + (tr.eligible ? "confirmé" : "presque confirmé (écart " + tr.gap + " j < " + TURN.gapDays + ")") + ".");
  }
  if (nDue) {
    lines.push(plural(nDue, "old mistake") + " " + (nDue === 1 ? "is" : "are") + " hidden in the mix.");
    chips.push({ icon: "broadsword", text: nDue + " due" });
    ev.push(nDue + " erreur(s) à échéance glissée(s) dans le Drill (moins de " + HUNT_MIN + " échéances : pas de chasse séparée).");
  }
  if (nMixed) chips.push({ icon: "rolling-dices", text: nMixed + " mixed" });
  ev.push("Au câblage : pickAdaptive reçoit ces quotas au lieu du 60/40 aveugle.");
  return { title: "Grammar Drill", lines: lines, chips: chips, ev: ev };
}

// ═══ Pendant : la question porte sa mémoire ═══
export function questionBadge(q) {
  if (q.role !== "due" || !q.item) return null;
  var it = q.item;
  return { text: "Missed on " + fmtDay(it.first) + (it.fails > 1 ? " · " + it.fails + " times" : ""), tier: tierOf(it) };
}
export function questionFeedback(x, q, ok) {
  var it = q.item;
  if (q.role === "due" && it) {
    if (ok) {
      if (it.box + 1 >= BOX_DAYS.length) return { tone: "win", icon: "broadsword", text: "Revenge! Slain for good.", ev: ["3e réussite espacée : la créature quitte le bestiaire (compteur des vaincues +1)."] };
      return { tone: "win", icon: "crossed-swords", text: "Revenge. It comes back in " + BOX_DAYS[it.box + 1] + " days, weaker.", ev: ["Réussie : box " + it.box + " → " + (it.box + 1) + ", prochaine échéance à J+" + BOX_DAYS[it.box + 1] + "."] };
    }
    if (it.fails + 1 >= WYRM_MISS) return { tone: "bite", icon: "dragon-head", text: "It bites again. Back in 2 days: read the " + (q.cat || "grammar") + " sheet first.", ev: ["Ratée " + (it.fails + 1) + " fois : repos 2 jours et fiche de grammaire proposée (au lieu de la reposer chaque jour)."] };
    return { tone: "bite", icon: "trap-mask", text: "It bites again. Back tomorrow.", ev: ["Ratée : retour en box 0, échéance demain."] };
  }
  if (q.role === "eased" && q.cat) {
    var w = recentWindow(catSeries(x.before, q.cat), 12);
    if (ok) return { tone: "win", icon: "laurel-crown", text: q.cat + ": " + (w.c + 1) + " of your last " + (w.t + 1) + ". It holds.", ev: ["Catégorie retournée : on le rappelle au moment où l'élève le prouve (dernières " + w.t + " Q : " + w.c + ")."] };
    return { tone: "note", icon: "info", text: "A slip. " + q.cat + " still stands at " + w.c + " of your last " + w.t + ".", ev: ["Une erreur ne défait pas un retournement : on relativise avec la fenêtre récente."] };
  }
  if (!ok) return { tone: "note", icon: "spider-web", text: pick(["Noted. This one comes back tomorrow.", "I'll remember this one. See you tomorrow."], x.before.name + (q.k || "")), ev: ["Nouvelle erreur : entre dans le bestiaire (box 0, échéance demain)."] };
  return null;
}

// ═══ Écran de fin : ce qui a changé ═══
function itemName(k) { var q = lookupItem(k); return q ? (q.mod === "drill" ? q.cat : PART_SHORT[q.part]) : k; }
export function remember(x) {
  var o = x.outcome, u0 = x.before, u1 = x.after, lines = [], ev = [];
  if (o.slain.length) {
    var names = {};
    o.slain.forEach(function (k) { var n = itemName(k); names[n] = (names[n] || 0) + 1; });
    lines.push({ icon: "broadsword", tone: "win", text: plural(o.slain.length, "old mistake") + " slain for good", sub: Object.keys(names).map(function (n) { return names[n] > 1 ? n + " ×" + names[n] : n; }).join(" · ") });
    ev.push(o.slain.length + " créature(s) à leur 3e réussite espacée.");
  }
  if (o.hits.length) lines.push({ icon: "crossed-swords", tone: "win", text: plural(o.hits.length, "mistake") + " beaten again", sub: "They'll be back, weaker." });
  if (o.escaped.length) lines.push({ icon: "trap-mask", tone: "note", text: o.escaped.length + " escaped", sub: "Back tomorrow." });
  if (o.fresh.length) {
    lines.push({ icon: "spider-web", tone: "note", text: plural(o.fresh.length, "new mistake") + " for your bestiary", sub: "First return tomorrow." });
    ev.push(o.fresh.length + " erreur(s) de la session entrent dans le bestiaire.");
  }
  // Catégories jouées : le chemin parcouru, seulement s'il est prouvé (fenêtres ≥ 10 et ≥ 12 Q).
  var seen = {};
  o.results.forEach(function (r) { if (r.q.cat && r.q.role !== "due") seen[r.q.cat] = 1; });
  Object.keys(seen).forEach(function (c) {
    var tr = turnaround(catSeries(u1, c));
    if (tr && tr.delta >= 0.2) {
      lines.push({ icon: "star-formation", tone: "win", text: c + ": " + pct(tr.then.acc) + "% at first, " + pct(tr.now.acc) + "% lately", sub: tr.then.c + " of " + tr.then.t + " → " + tr.now.c + " of " + tr.now.t });
      ev.push(c + " : " + tr.then.c + "/" + tr.then.t + " (premières Q, jusqu'au " + fmtDay(tr.then.end) + ") → " + tr.now.c + "/" + tr.now.t + " (depuis le " + fmtDay(tr.now.start) + "). Affiché dès +20 points.");
    }
  });
  if (x.comp.focus && !x.comp.macro) {
    var fc = { c: 0, t: 0 };
    o.results.forEach(function (r) { if (r.q.role === "focus") { fc.t++; if (r.ok) fc.c++; } });
    if (fc.t) {
      lines.push({ icon: "eye-target", tone: "note", text: x.comp.focus.cat + ", today's aim: " + fc.c + " of " + fc.t, sub: "Your weak spot gets the most questions until it holds." });
      ev.push("Rappel de la visée annoncée avant la session : on rend compte de ce qu'on avait dit.");
    }
  }
  if (x.comp.macro) {
    var mc = { c: 0, t: 0 };
    o.results.forEach(function (r) { if (r.q.role === "focus") { mc.t++; if (r.ok) mc.c++; } });
    var sm = u0.battleScan.subScores.grammarMacros[x.comp.macro.id];
    lines.push({ icon: "compass", tone: "note", text: x.comp.macro.label + " today: " + mc.c + " of " + mc.t + ". Your scan said " + pct(sm) + "%.", sub: "Too early to judge. Two more sessions and I'll know." });
    ev.push("Démarrage à froid : on confronte le scan à la session sans conclure (" + mc.t + " Q, seuil de confiance non atteint).");
  }
  if (o.prevRuns >= 3 && o.tot && o.sc / o.tot > o.prevBest) {
    lines.push({ icon: "trophy-cup", tone: "win", text: "Your best " + MODULE_NAME[o.modId] + " yet", sub: o.sc + " / " + o.tot });
    ev.push("Record battu sur " + o.prevRuns + " sessions précédentes (meilleur : " + pct(o.prevBest) + " %).");
  }
  var b0 = bestiary(u0, NOW), b1 = bestiary(u1, NOW);
  ev.push("Bestiaire : " + b0.lurking + " → " + b1.lurking + " créatures, " + b0.slain + " → " + b1.slain + " vaincues.");
  return { lines: lines, bestiary: { from: b0.lurking, to: b1.lurking }, ev: ev };
}

// ═══ Cérémonie : faiblesse devenue force ═══
export function ceremony(x) {
  var cer = x.outcome.ceremony;
  if (!cer) {
    var best = allCats().map(function (c) { return catState(x.after, c, NOW); }).filter(function (s) { return s.turn; })
      .sort(function (a, b) { return b.turn.delta - a.turn.delta; })[0];
    return { none: true, best: best };
  }
  var tr = cer.turn;
  return {
    kicker: "Weakness turned strength", title: cer.cat,
    sub: tr.then.c + " of " + tr.then.t + " at first. " + tr.now.c + " of " + tr.now.t + " lately.",
    line: pick([cer.cat + " no longer cost you points.", "What once cost you points now earns them."], x.before.name + cer.cat),
    ev: ["Au début : " + tr.then.c + "/" + tr.then.t + " (" + pct(tr.then.acc) + " % < " + pct(TURN.thenMax) + " %, jusqu'au " + fmtDay(tr.then.end) + ").",
      "Dernièrement : " + tr.now.c + "/" + tr.now.t + " (" + pct(tr.now.acc) + " % ≥ " + pct(TURN.nowMin) + " %, depuis le " + fmtDay(tr.now.start) + ").",
      "Écart entre les deux fenêtres : " + tr.gap + " jours (≥ " + TURN.gapDays + "). Une seule fois par catégorie (u.celebrated)."],
  };
}

// ═══ La lettre du lundi ═══
export function letter(x) {
  var u = x.before, f = weekFacts(u, NOW, x.snaps), pace = goalPace(u, NOW, x.snaps), ps = [], ev = [];
  var dayN = daysBetween(u.joinedAt, day(NOW)) + 1, q1 = x.plan.quests[0], q2 = x.plan.quests[1];
  var aims = [aimPhrase(q1, x), aimPhrase(q2, x)].filter(Boolean);
  var push;
  if (dayN <= 7) {
    ps.push("You joined on " + weekdayName(u.joinedAt) + ". " + plural(trainedSessions(u), "session") + " so far, " + f.questions + " questions. Too soon to call a trend: your Battle Scan is still my only map.");
    if (f.caught) ps.push("Your first " + plural(f.caught, "mistake") + " are in your bestiary. They come back until you beat them, a few days apart.");
    if (aims.length) ps.push("This week: " + listJoin(aims) + ".");
    ps.push("Next Monday I'll write you a real letter.");
    push = "Your first days in the Arena. Read the letter.";
    ev.push("J" + dayN + " : pas de tendance annoncée (fenêtres < 10 Q), la lettre le dit.");
  } else {
    ps.push("Last week you trained " + f.activeDays + " days out of 7: " + plural(f.sessions, "session") + ", " + f.questions + " questions.");
    ev.push("Semaine du " + fmtDay(f.from) + " au " + fmtDay(f.to) + " : " + f.sessions + " sessions, " + f.questions + " Q, " + f.activeDays + " jours actifs.");
    // Une catégorie en plein retournement a sa propre phrase : pas deux fois la même nouvelle.
    var turningNames = f.turning.filter(function (s) { return s.turn.near; }).map(function (s) { return s.cat; });
    f.up = f.up.filter(function (m) { return turningNames.indexOf(m.label) < 0; });
    if (f.up.length) {
      var up = f.up[0];
      ps.push(up.label + " " + be(up.label) + " moving: " + pct(up.before.acc) + "% the week before, " + pct(up.now.acc) + "% last week.");
      ev.push("Hausse : " + f.up.map(function (m) { return m.label + " " + m.before.c + "/" + m.before.t + " → " + m.now.c + "/" + m.now.t; }).join(" ; ") + " (≥ +10 points, ≥ 10 Q par semaine).");
    }
    if (f.down.length) {
      var dn = f.down[0];
      ps.push(dn.label + " slipped (" + pct(dn.before.acc) + "% → " + pct(dn.now.acc) + "%). Worth a look.");
      ev.push("Baisse : " + dn.label + " " + dn.before.c + "/" + dn.before.t + " → " + dn.now.c + "/" + dn.now.t + ".");
    }
    if (!f.up.length && !f.down.length) ev.push("Aucune partie ni catégorie n'a bougé de 10 points avec ≥ 10 Q sur les deux semaines : on n'invente pas de tendance.");
    f.turning.forEach(function (s) {
      var tr = s.turn;
      if (tr.near) {
        ps.push(s.cat + " " + be(s.cat) + " turning: " + tr.then.c + " of " + tr.then.t + " at first, " + tr.now.c + " of " + tr.now.t + " lately. Hold on a little longer and I'll call it.");
        ev.push(s.cat + " : retournement presque confirmé (écart " + tr.gap + " j < " + TURN.gapDays + "). La lettre l'annonce sans le célébrer.");
      }
    });
    if (f.slain || f.caught) ps.push("You slew " + plural(f.slain, "old mistake") + "; " + f.caught + " new " + (f.caught === 1 ? "one" : "ones") + " joined your bestiary.");
    if (pace && pace.current != null) {
      var est = f.est && f.est.from != null ? "Your estimate went from " + f.est.from + " to " + f.est.to + ". " : "Your estimate stands at " + pace.current + ". ";
      if (pace.last != null) ps.push(est + "To reach " + pace.target + " by " + fmtDay(pace.date) + " you need about " + num(pace.needed) + " points a week; last week you made " + (pace.last >= 0 ? "+" : "") + pace.last + ". " + (pace.onTrack ? "You're on track." : "Not quite enough yet."));
      else ps.push(est + "To reach " + pace.target + " by " + fmtDay(pace.date) + " you need about " + num(pace.needed) + " points a week.");
      ev.push("Allure : (" + pace.target + " − " + pace.current + ") / " + pace.weeksLeft + " semaines ≈ " + num(pace.needed) + " pts/sem ; semaine écoulée " + pace.last + " (instantanés du dimanche soir).");
    } else if (!u.targetToeic) {
      if (f.est && f.est.to != null) ps.push("Your estimate stands at " + f.est.to + ".");
      ps.push("You haven't chosen a destination yet. A target score and a date, and I can plan your weeks.");
      ev.push("Pas d'objectif : la lettre invite à en fixer un (aucune allure calculable).");
    }
    if (aims.length) ps.push("This week, " + (aims.length > 1 ? "two things: " : "") + listJoin(aims) + ".");
    var hook = f.turning.find(function (s) { return s.turn.near; });
    push = hook ? hook.cat + " " + be(hook.cat) + " turning. Read the letter."
      : pace && pace.onTrack ? (f.up.length ? f.up[0].label + " " + be(f.up[0].label) + " moving, and you're on track for " + pace.target + "." : "You're on track for " + pace.target + ".") + " Read the letter."
      : "Your week in the Arena. Read the letter.";
  }
  return { date: weekdayName(day(NOW)) + ", " + fmtDay(day(NOW)), paragraphs: ps, push: { title: "Aldric's Monday letter", body: push }, ev: ev };
}

// ═══ Chronique ═══
var SECTION = { grammar: "grammar", vocab: "vocabulary", reading: "reading", listening: "listening" };
export function chronicleView(x) {
  var u = x.after, entries = chronicle(u, NOW, x.snaps).map(function (e) {
    var f = e.facts || {}, text = "";
    if (e.kind === "scan") text = "Battle Scan: strongest in " + SECTION[f.strong] + " (" + pct(f.strongAcc) + "%), weakest in " + SECTION[f.weak] + " (" + pct(f.weakAcc) + "%).";
    if (e.kind === "part80") text = f.c + " of " + f.t + " answers right so far.";
    if (e.kind === "weak") text = f.c + " of your first " + f.t + ". I marked it.";
    if (e.kind === "turn") text = f.then.c + " of " + f.then.t + " at first, " + f.now.c + " of " + f.now.t + " lately.";
    if (e.kind === "mock") text = f.score + " / " + f.total + ".";
    if (e.kind === "estimate") text = "First estimate: " + f.toeic + ".";
    if (e.kind === "slain") text = f.n === 1 ? "The first to fall: a " + itemName(f.k) + " question." : f.n + " creatures down.";
    if (e.kind === "goal") text = "Destination: " + f.target + " by " + fmtDay(f.date) + ".";
    return { d: e.d, icon: e.icon, title: e.title, text: text, kind: e.kind, now: e.d === day(NOW) };
  });
  // La page suivante : le plan recalculé APRÈS la session, hors chasse (toujours là, jamais un cap).
  var next = planToday(x.after, NOW).quests.find(function (q) { return q.kind !== "hunt"; });
  var aim = aimPhrase(next, x);
  entries.push({ d: day(NOW), icon: "quill-ink", title: "The next page", text: aim ? "Next: " + aim + "." : "Still being written.", kind: "next", now: true });
  return {
    entries: entries,
    ev: ["Jalons reconstruits depuis les données existantes : battleScan, history (catStats de session), mockResults, instantanés, journal du bestiaire.",
      "Retroactif : un élève actuel verrait sa chronique déjà remplie le jour du lancement, sauf les jalons du bestiaire (nouveau).",
      "Au câblage, garder les jalons datés dans le profil (liste courte) : history est bornée à 100 sessions."],
  };
}

// ═══ Bestiaire ═══
export function bestiaryView(x) {
  var b = bestiary(x.after, NOW), d = day(NOW);
  return Object.assign(b, {
    rows: function (g) {
      return g.items.map(function (it) {
        var q = lookupItem(it.k), tier = tierOf(it);
        return { k: it.k, tier: tier, tierName: TIERS[tier].name, icon: TIERS[tier].icon, prompt: q ? q.prompt : it.k, label: q ? q.label : "",
          due: it.due <= d, inDays: daysBetween(d, it.due), box: it.box, fails: it.fails, first: it.first };
      });
    },
    ev: ["Ratée → demain ; réussie → " + BOX_DAYS.slice(1).join(" puis ") + " jours ; 3e réussite espacée = vaincue.",
      "Force (Trickster / Stalker / Wyrm) = 1 + les fois où la créature a fait retomber une réussite. Rater encore une créature jamais touchée ne la renforce pas : l'assiduité n'est pas punie.",
      "Ratée " + WYRM_MISS + " fois : repos 2 jours et fiche de grammaire.",
      "Profil : " + b.lurking + " références (~" + Math.round(b.lurking * 70 / 1024 * 10) / 10 + " Ko), jamais le texte des questions."],
  });
}
