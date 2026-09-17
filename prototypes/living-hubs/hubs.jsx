// Proto hubs vivants (2026-09-17, audit visuel lot 3). Listes de hubs recopiées de src/ (Train →
// Grammar & Vocab, GamesHub, ReadingHub) pour pouvoir en changer les tuiles ; A reproduit le rendu
// actuel à l'identique. Données réelles du profil : moduleScores, dailyModSessions, gameScores.
// Les règles viennent du code : coffre de maîtrise à 50 Q et 80 % (App.jsx, MASTERY_BLACKLIST),
// XP du jour par farmMult (src/lib/xp.js).
import { GIcon } from "../../src/components/icons.jsx";
import { TreasureChestSvg } from "../../src/components/avatar.jsx";
import { farmMult } from "../../src/lib/xp.js";
import { today } from "../../src/lib/util.js";

export var MASTERY_Q = 50, MASTERY_ACC = 0.8;

// ── Contenu des hubs (copié de src/, mêmes libellés et icônes) ──
export var HUBS = {
  gv: {
    kind: "train", back: "Training Grounds", title: "Grammar & Vocab", sub: "Build your foundations", gap: 8,
    items: [
      { id: "csess", n: "Flashcard Review", d: "SRS spaced repetition", i: "card-joker", plain: true },
      { id: "gauntlet", n: "Grammar Gauntlet", d: "4 trials · Irregulars, Tenses, Passive, Relatives", i: "gauntlet",
        subs: ["gauntlet_irregular", "gauntlet_tense", "gauntlet_passive", "gauntlet_relative"], subName: "trials" },
      { id: "modals", n: "Modal Council", d: "2 trials · Pair situations, classify verdicts", i: "throne-king",
        subs: ["modals_match", "modals_sort"], subName: "trials" },
      { id: "wordfam", n: "Word Families", d: "Classify: Noun, Verb, Adj, Adv", i: "family-tree" },
      { id: "falsefr", n: "False Friends", d: "FR/EN traps: actually ≠ actuellement", i: "duality-mask" },
      { id: "connsort", n: "Connectors Sorting", d: "Clause, Noun, or New sentence?", i: "knot" },
      { id: "bforge", n: "Linking Bridge", d: "Pick the connector that fits the logic & grammar", i: "stone-bridge" },
      { id: "prepdrill", n: "Preposition Collocations", d: "Study + Drill mode", i: "linked-rings" },
      { id: "gerinf", n: "Gerund vs Infinitive", d: "4 patterns · Study + Context Quiz", i: "scales" },
      { id: "pvdojo", n: "Phrasal Verb Dojo", d: "55 verbs · Study, Match & Speed", i: "shuriken" },
    ],
  },
  games: {
    kind: "games", title: "Arena Games", sub: "Train your reflexes, earn XP", gap: 12,
    items: [
      { id: "tavern", n: "Word Tavern", d: "Prove your vocabulary!", i: "beer-stein", tag: "NEW", best: "Léa · 14/15" },
      { id: "matchE", n: "Speed Match", d: "Match words with definitions!", i: "chained-arrow-heads", game: "matchEasy", best: "Hugo · 18.2s" },
      { id: "wfall", n: "Word Fall", d: "Catch the falling sentences!", i: "meteor-impact", game: "wordFall", best: "Yannou · 112 pts" },
      { id: "sbuild", n: "Sentence Builder", d: "Tap blocks in the right order!", i: "brick-pile", best: "Léa · 15/15" },
      { id: "ablitz", n: "Audio Blitz", d: "Listen once, answer fast!", i: "lyre", best: "Inès · 12/12" },
      { id: "clue", n: "Clue Hunter", d: "Find the clue, fill the blank!", i: "spyglass", best: "Camille · 10/10" },
      { id: "duel", n: "Vocabulary Arena", d: "Real-time 1v1 — challenge a classmate!", i: "swords-emblem", tag: "NEW", game: "duel", best: "Hugo · 7 wins" },
    ],
  },
  reading: {
    kind: "reading", title: "Reading Practice", sub: "Train for the TOEIC Reading section", gap: 12,
    items: [
      { id: "drill", n: "Part 5 — Sentence Completion", d: "10 random questions from 100", i: "quill-ink" },
      { id: "timesim", n: "Part 5 — Exam Simulation", d: "30 Qs in 10 min, real pace", i: "sands-of-time" },
      { id: "p6", n: "Part 6 — Text Completion", d: "Business texts with blanks", i: "stone-tablet" },
      { id: "p7", n: "Part 7 — Reading Comprehension", d: "Passages + questions", i: "bookmark" },
    ],
  },
};

// ── Profil fictif : chaque tuile montre un état différent ──
export function fixture(u, kind) {
  if (kind === "new") return u;
  var t = today(), y = today(new Date(Date.now() - 864e5)), d3 = today(new Date(Date.now() - 3 * 864e5));
  function ms(total, correct, last) {
    return { total: total, correct: correct, sessions: Math.ceil(total / 12), lastDate: last ? last[0] : y, catStats: {},
      history: last ? [{ date: last[0], total: last[1], correct: last[2] }] : [] };
  }
  u.moduleScores = {
    wordfam: ms(34, 29, [y, 15, 12]),              // en route, précision OK
    falsefr: ms(58, 41, [d3, 10, 7]),              // volume atteint, précision 71 % < 80
    connsort: ms(62, 55, [t, 15, 13]),             // maîtrisé
    prepdrill: ms(20, 12, [t, 10, 6]),
    gerinf: ms(45, 37, [t, 10, 9]),
    pvdojo: ms(15, 14, [t, 15, 14]),
    gauntlet_irregular: ms(60, 52, [y, 15, 13]),
    gauntlet_tense: ms(75, 59, [t, 15, 11]),
    gauntlet_passive: ms(15, 12, [d3, 15, 12]),
    modals_match: ms(15, 13, [t, 15, 13]),
    modals_sort: ms(15, 13, [t, 15, 13]),
    tavern: ms(45, 37, [t, 15, 12]),
    sbuild: ms(60, 54, [y, 15, 13]),
    ablitz: ms(24, 20, [t, 12, 10]),
    clue: ms(100, 93, [t, 10, 10]),
    drill: ms(160, 118, [t, 10, 8]),
    timesim: ms(90, 79, [y, 30, 25]),
    p7: ms(12, 9, [d3, 12, 9]),
  };
  u.gameScores = { matchEasy: { time: 23.4, moves: 13 }, wordFall: { score: 85, maxCombo: 26, questions: 36 }, duel: { wins: 2, played: 3, wagerWon: 100 } };
  var runs = { connsort: 1, prepdrill: 1, gerinf: 2, pvdojo: 3, gauntlet_tense: 1, modals_match: 1, modals_sort: 1,
    tavern: 1, ablitz: 1, clue: 1, drill: 1, game_wordFall: 2 };
  u.dailyModSessions = {};
  Object.keys(runs).forEach(function (k) { u.dailyModSessions[k + "_" + t] = runs[k]; });
  return u;
}

// ── État d'un module / d'un hub ──
function one(u, modId, farmKey) {
  var m = (u.moduleScores || {})[modId];
  var total = m ? m.total || 0 : 0, correct = m ? m.correct || 0 : 0;
  var acc = total ? correct / total : 0;
  var runs = (u.dailyModSessions || {})[(farmKey || modId) + "_" + today()] || 0;
  var last = m && m.history && m.history.length ? m.history[m.history.length - 1] : null;
  return { total: total, correct: correct, acc: acc, mastered: total >= MASTERY_Q && acc >= MASTERY_ACC,
    vol: Math.min(1, total / MASTERY_Q), accLow: total >= 10 && acc < MASTERY_ACC, last: last, runs: runs, mult: farmMult(modId, runs) };
}
export function statusOf(u, it) {
  if (it.plain) return { plain: true };
  if (it.subs) {
    var parts = it.subs.map(function (s) { return one(u, s); });
    var mastered = parts.filter(function (x) { return x.mastered; }).length;
    var fresh = parts.filter(function (x) { return x.runs === 0; }).length;
    var played = parts.filter(function (x) { return x.total > 0; });
    var last = null;
    played.forEach(function (x) { if (x.last && (!last || x.last.date > last.date)) last = x.last; });
    return { hub: true, n: parts.length, mastered: mastered, fresh: fresh, subName: it.subName,
      vol: parts.reduce(function (a, x) { return a + (x.mastered ? 1 : x.vol * 0.95); }, 0) / parts.length,
      allMastered: mastered === parts.length, started: played.length > 0, last: last,
      // Un hub a un compteur par épreuve : on affiche le meilleur tarif encore disponible (une épreuve
      // pas encore jouée aujourd'hui = plein tarif), avec le nombre d'épreuves concernées.
      xp: (function () {
        var best = Math.max.apply(null, parts.map(function (x) { return x.mult; }));
        var st = Object.assign({}, xpState(best));
        var at = parts.filter(function (x) { return x.mult === best; }).length;
        if (best > 0 && at < parts.length) st.label += " · " + at + "/" + parts.length + " " + it.subName;
        return st;
      })() };
  }
  if (it.game) {
    var g = (u.gameScores || {})[it.game];
    var r = one(u, "game_" + it.game);
    var rec = !g ? null : it.game === "matchEasy" ? g.time + "s" : it.game === "wordFall" ? g.score + " pts" : g.wins + " win" + (g.wins > 1 ? "s" : "");
    return { game: true, record: rec, runs: r.runs, xp: xpState(r.mult) };
  }
  var o = one(u, it.id);
  o.xp = xpState(o.mult);
  return o;
}

export function ago(date) {
  if (!date) return "";
  var days = Math.round((Date.parse(today()) - Date.parse(date)) / 864e5);
  return days <= 0 ? "today" : days === 1 ? "yesterday" : days + " days ago";
}
export function xpState(mult) {
  if (mult >= 1) return { k: "full", label: "Full XP", short: "Full" };
  if (mult >= 0.5) return { k: "half", label: "Half XP", short: "½" };
  if (mult > 0) return { k: "low", label: "Low XP", short: "Low" };
  return { k: "none", label: "No XP today", short: "0" };
}
function pct(x) { return Math.round(x * 100) + "%"; }

// ── Résumé du hub (B, C, D) ──
export function hubSummary(u, hub) {
  var mastery = [], fresh = 0, countable = 0;
  hub.items.forEach(function (it) {
    var s = statusOf(u, it);
    if (s.plain) return;
    countable++;
    if (s.xp.k === "full") fresh++;
    if (s.game) return;
    mastery.push(s.hub ? s.allMastered : s.mastered);
  });
  return { mastery: mastery, won: mastery.filter(Boolean).length, fresh: fresh, countable: countable };
}

// ═══ Tuiles ═══
function Icon(p) {
  var big = p.kind === "games";
  return <div className="lh-ic" style={{ width: big ? 48 : 42, height: big ? 48 : 42, borderRadius: big ? 14 : 12 }}>
    <GIcon name={p.it.i} size={big ? 26 : 22} color="var(--cyan)" />
  </div>;
}
function Name(p) {
  var big = p.kind === "games";
  return <div className="out" style={{ fontWeight: 700, fontSize: big ? 15 : 14, marginBottom: big ? 0 : 1 }}>{p.it.n}</div>;
}
function Best(p) {
  if (p.kind !== "games" || !p.it.best) return null;
  return <div className="lh-best">{p.v === "A" ? "🏆 " : <GIcon name="trophy-cup" size={11} color="currentColor" />}{p.it.best}</div>;
}
function Arrow() { return <span style={{ fontSize: 16, color: "var(--cyan)" }}>{"→"}</span>; }
function pad(kind) { return kind === "games" ? "16px" : "14px 16px"; }

// A · Actuel : rendu d'aujourd'hui.
function TileA(p) {
  var it = p.it;
  return <div className="crd" style={{ display: "flex", alignItems: "center", gap: 14, padding: pad(p.kind), cursor: "pointer" }}>
    <Icon it={it} kind={p.kind} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Name it={it} kind={p.kind} />
      <div style={{ fontSize: 11, color: "var(--t3)" }}>{it.d}</div>
      <Best it={it} kind={p.kind} v="A" />
      {p.kind === "games" && it.tag && <div style={{ fontSize: 10, color: "var(--gold)", marginTop: 2 }}>{it.tag}</div>}
    </div>
    <Arrow />
  </div>;
}

// Ligne « ce qui s'est passé » : dernier score, sinon description.
function lastLine(s, it) {
  if (s.game) return s.record ? "Record " + s.record : it.d;
  if (s.last) return "Last " + s.last.correct + "/" + s.last.total + " · " + ago(s.last.date);
  return it.d;
}
// Ligne « vers le coffre ».
function masteryLine(s) {
  if (s.plain || s.game) return null;
  if (s.hub) return s.allMastered ? "All " + s.subName + " mastered" : s.mastered + "/" + s.n + " " + s.subName + " mastered";
  if (s.mastered) return "Mastered";
  if (!s.total) return "Not started";
  return <>{s.total + "/" + MASTERY_Q + " Q · "}<span className={s.accLow ? "lh-warn" : ""}>{pct(s.acc)}</span>{s.accLow ? " (80% needed)" : ""}</>;
}

// Pastilles d'XP du jour : 3 crans (plein, moitié, faible), éteints au fil des parties.
function Pips(p) {
  var st = p.st;
  var on = st.k === "full" ? 3 : st.k === "half" ? 2 : st.k === "low" ? 1 : 0;
  return <div className={"lh-pips " + st.k} title={st.label}>
    <span className="lh-pipset">{[0, 1, 2].map(function (i) { return <i key={i} className={i < on ? "on" : ""} />; })}</span>
    <small>{st.short}</small>
  </div>;
}

// B · Anneau : l'anneau autour de l'icône se remplit vers le coffre (volume), vire à l'orange si
// la précision est sous 80 %, à l'or une fois maîtrisé ; dernier score à la place de la description ;
// crans d'XP du jour à droite.
function TileB(p) {
  var it = p.it, s = statusOf(p.u, it);
  var big = p.kind === "games", box = big ? 48 : 42, ring = box + 10;
  var cls = s.plain || s.game ? "" : (s.hub ? (s.allMastered ? " won" : "") : (s.mastered ? " won" : s.accLow ? " low" : ""));
  var fill = s.plain || s.game ? 0 : s.vol * 100;
  return <div className="crd lh-tile" style={{ padding: pad(p.kind) }}>
    <div className={"lh-ringbox" + cls} style={{ width: ring, height: ring }}>
      {!s.plain && !s.game && <svg className="lh-ring" viewBox={"0 0 " + ring + " " + ring}>
        <rect className="trk" x="1.5" y="1.5" width={ring - 3} height={ring - 3} rx={big ? 17 : 15} pathLength="100" />
        {fill > 0 && <rect className="fill" x="1.5" y="1.5" width={ring - 3} height={ring - 3} rx={big ? 17 : 15} pathLength="100" strokeDasharray={cls === " low" ? undefined : fill + " 100"} />}
      </svg>}
      <Icon it={it} kind={p.kind} />
      {((s.hub && s.allMastered) || (!s.hub && s.mastered)) && <span className="lh-badge"><TreasureChestSvg size={20} tier={2} idSuffix={"b" + it.id} /></span>}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Name it={it} kind={p.kind} />
      <div className="lh-sub">{s.plain ? it.d : lastLine(s, it)}</div>
      {masteryLine(s) && <div className={"lh-meta" + ((s.mastered || s.allMastered) ? " gold" : "")}>{masteryLine(s)}</div>}
      <Best it={it} kind={p.kind} v="B" />
    </div>
    {s.plain ? <Arrow /> : <Pips st={s.xp} />}
  </div>;
}

// C · Coffre : le coffre Champion est l'objectif, à droite, avec sa jauge ; il brille une fois
// gagné. Barre fine sous le texte. L'XP réduite apparaît en étiquette, seulement quand elle l'est.
function TileC(p) {
  var it = p.it, s = statusOf(p.u, it);
  var won = s.hub ? s.allMastered : s.mastered;
  var st = s.plain ? null : s.xp;
  return <div className="crd lh-tile" style={{ padding: pad(p.kind) }}>
    <Icon it={it} kind={p.kind} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="lh-namerow"><Name it={it} kind={p.kind} />{st && st.k !== "full" && <span className={"lh-chip " + st.k}>{st.short === "0" ? "No XP" : st.k === "half" ? "½ XP" : "Low XP"}</span>}</div>
      <div className="lh-sub">{s.plain ? it.d : lastLine(s, it)}</div>
      {!s.plain && !s.game && <div className={"lh-bar" + (won ? " won" : s.accLow ? " low" : "")}><i style={{ width: (s.vol * 100) + "%" }} /></div>}
      {masteryLine(s) && <div className={"lh-meta" + (won ? " gold" : "")}>{masteryLine(s)}</div>}
      <Best it={it} kind={p.kind} v="C" />
    </div>
    {s.plain ? <Arrow /> : s.game ? <Arrow /> :
      <div className={"lh-chest" + (won ? " won" : s.total || s.started ? "" : " idle")}>
        <TreasureChestSvg size={won ? 38 : 34} tier={2} idSuffix={"c" + it.id} />
        <small className={!won && s.accLow && s.vol >= 1 ? "lh-warn" : ""}>{won ? "Won" : s.accLow && s.vol >= 1 ? pct(s.acc) + " acc" : Math.round(s.vol * 100) + "%"}</small>
      </div>}
  </div>;
}

// D · Registre : tuile d'aujourd'hui intacte, une ligne de registre en dessous (dernier score,
// progression, XP du jour) et un liseré de progression au pied de la carte.
function TileD(p) {
  var it = p.it, s = statusOf(p.u, it);
  var won = s.hub ? s.allMastered : s.mastered;
  var st = s.plain ? null : s.xp;
  var bits = [];
  if (!s.plain) {
    if (s.game) { if (s.record) bits.push("Record " + s.record); }
    else if (s.last) bits.push("Last " + s.last.correct + "/" + s.last.total);
    var ml = masteryLine(s);
    if (ml && !s.game) bits.push(s.hub ? s.mastered + "/" + s.n + " mastered" : ml);
  }
  return <div className="crd lh-tile lh-d" style={{ padding: pad(p.kind), paddingBottom: s.plain ? undefined : 12 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Icon it={it} kind={p.kind} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Name it={it} kind={p.kind} />
        <div style={{ fontSize: 11, color: "var(--t3)" }}>{it.d}</div>
        <Best it={it} kind={p.kind} v="D" />
      </div>
      <Arrow />
    </div>
    {!s.plain && <div className="lh-ledger">
      {bits.map(function (b, i) { return <span key={i} className={i === bits.length - 1 && won ? "gold" : ""}>{b}</span>; })}
      <span className={"lh-dot " + st.k}>{{ full: "Full XP", half: "Half XP", low: "Low XP", none: "No XP today" }[st.k]}</span>
    </div>}
    {!s.plain && !s.game && <div className={"lh-edge" + (won ? " won" : s.accLow ? " low" : "")}><i style={{ width: (s.vol * 100) + "%" }} /></div>}
  </div>;
}

export var TILES = { A: TileA, B: TileB, C: TileC, D: TileD };

// Résumé en tête de hub.
export function Summary(p) {
  if (p.v === "A") return null;
  var sm = hubSummary(p.u, p.hub);
  if (!sm.mastery.length) return null;
  if (p.v === "C") return <div className="crd lh-shelf">
    <div className="lh-shelf-row">{sm.mastery.map(function (w, i) {
      return <span key={i} className={w ? "won" : ""}><TreasureChestSvg size={26} tier={2} idSuffix={"s" + i} /></span>;
    })}</div>
    <div className="lh-shelf-txt"><b className="out">{sm.won + " of " + sm.mastery.length}</b>{" mastery chests won"}<em>{sm.fresh + " at full XP today"}</em></div>
    {sm.won === 0 && <div className="lh-hint">{"50 questions at 80% or more win a module's Champion chest."}</div>}
  </div>;
  if (p.v === "B") return <div className="lh-sum">
    <span><GIcon name="laurel-crown" size={14} color="var(--gold)" />{sm.won + "/" + sm.mastery.length + " mastered"}{sm.won === 0 ? " · 50 Q at 80% = chest" : ""}</span>
    <span className="lh-dot full">{sm.fresh + " at full XP today"}</span>
  </div>;
  return <div className="lh-sum d">
    <span>{"Mastery " + sm.won + "/" + sm.mastery.length}{sm.won === 0 ? " (50 Q at 80%)" : ""}</span>
    <span className="lh-seg">{sm.mastery.map(function (w, i) { return <i key={i} className={w ? "won" : ""} />; })}</span>
    <span>{sm.fresh + " fresh today"}</span>
  </div>;
}
